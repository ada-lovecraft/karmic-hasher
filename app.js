
/**
 * Module dependencies.
 */

var express = require('express.io')
  , cp = require('child_process')
  , routes = require('./routes')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , sys = require('sys')
  , fs = require('fs')
  , couchbase = require('couchbase')
  , phash = require('../node-phash')
  , thumb = require('node-thumbnail').thumb
  , async = require('async');

var app = express().http().io();
var queue = new Array();
var hashQueue = new Array();
var thumbQueue = new Array();

var subredditName = '';
var couch = null;
var couchConfig = {
    "debug" : false,
    "user" : process.env.COUCHBASE_USER,
    "password" : process.env.COUCHBASE_PASS,
    "hosts" : [ "localhost:8091" ],
    "bucket" : "default"
}


couchbase.connect(couchConfig, function (err, bucket) {
	if(err)  {
		console.log('connection error');
		throw err;
	}
	else {
		app.set('bucket', bucket);
		couch = bucket;

	}
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('queue', new Array());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.io.configure('development', function(){
  app.io.set('transports', ['xhr-polling']);
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/r/:subreddit', getSubreddit);
app.get('/matches/:subreddit/:hash/:threashold', matchHash);

app.listen(3000);

function getSubreddit(req,res) {
	//page load for a given /r/subreddit
	var subreddit  = req.params.subreddit;
	couch.get(subreddit, function(err,doc,meta) {
		//if the subreddit doesn't exist... start the image acquisition process
		if (err) {
			var pos = queue.indexOf(subreddit);
			if (pos == -1) {
				queue.push(subreddit);
				app.io.broadcast("global:broadcast", { message: subreddit + ' added to load queue at position:' + queue.length })
				res.render('subreddit', { title: 'karmic hash' ,subreddit: subreddit,  images: null, message:'Added ' + subreddit + ' to queue at position: ' + queue.length });
				if (queue.length == 1)  
					processQueue();
			}
			res.render('subreddit', { title: 'karmic hash' , subreddit: subreddit, images: null,message:"Already in queue at position: " + pos});
			
		} else {
				var hashPos = hashQueue.indexOf(subreddit);
				var thumbPos = thumbQueue.indexOf(subreddit);
				if (hashPos == -1 && thumbPos == -1) 
					res.render('subreddit', {title:'karmic hash ' + subreddit, subreddit: subreddit, images: doc, message: subreddit});	
		}
	});
}


function processQueue() {

	var subredditName = queue[0];
	console.log('processsing: ' + subredditName);
	//app.io.broadcast('global:function', {message: 'Processing Queue: ' + subredditName});
	var pages = process.env.IMGUR_PAGES;
	console.log('pages: ' + pages);
	var startPage = 0;
	var pageURL = '';
	var pagesDone = 0;

	//the imgur API Path
	var apiYear = '/3/gallery/r/' + subredditName +'/top/year/';
	var apiMonth = '/3/gallery/r/' + subredditName +'/top/month/';
	var apiWeek = '/3/gallery/r/' + subredditName +'/top/week/';
	var apiDay =  '/3/gallery/r/' + subredditName +'/top/day/'
	var apiLatest = '/3/gallery/r/' + subredditName +'/time/'
	var urls = new Array();

	var options = null;
	var data = new Array();
	var idList = new Array();

	//get each page of imgur results from the imgur api
	for(var i = startPage; i < startPage + pages; i++) {
		urls.push(apiYear + i); 
		urls.push(apiMonth + i); 
		urls.push(apiWeek + i); 
		urls.push(apiDay + i); 
		urls.push(apiLatest + i);
	}

	console.log("urls created: " + urls);
	urls.forEach(function(pageURL) {
		options = {
			hostname: 'api.imgur.com',
			path: pageURL,
			headers: {
				'Authorization' : 'Client-ID ' + process.env.IMGUR_KEY
			},
			method: 'GET'
		};
		https.get(options,function(res) {

			var doc = '';

			res.on('data', function (chunk) {
    			doc += chunk
  			});

  			res.on('end', function() {
  				var json = JSON.parse(doc);
  				var spliceCount = 0;
  				//spin through each image object
  				var imageArray = new Array();
  				json.data.forEach(function(image,index,array) {

  					//we don't want gifs
  					if (!image.link.match(/\.gif$/ && idList.indexOf(image.id) == -1) ) {
  						//console.log(image.id);
  						idList.push(image.id);
  						console.log('images found: ' + idList.length);
  						//get the image extension
  						var ext = image.link.match(/\.\w+$/);
  						//change the link to give us the (l)arge version so we don't kill ourselves on bandwidth
  						//also remove the http://i.imgur.com/ text from the link
  						image.link = image.link.replace(/\.\w+$/,'l' + ext).replace(/http:\/\/i.imgur.com\//g,'');
  						
  						imageArray.push(image); 

  						app.io.broadcast('global:status', { message: subredditName + " -- Found: " + image.link});
  					} 
  				});

  				//concatenate our data array with the array we just receieved.
  				data.push.apply(data,imageArray);
  				console.log('data length: ' + data.length);
  				//check to see if we're done spinning through the pages
  				if (++pagesDone == pages * 5) {
  					//set the document in couch
  					if (data.length > 0) {
  						console.log('***** PRE INSERT LENGTH: ' + data.length);
  						couch.set(subredditName,data,function(err) {
  							if (err)
  								throw err;
  							//and begin actually loading the images
  							getImagesFromSubreddit(subredditName);
  							
  						});
  					} else {
  						app.io.broadcast('global:status', { message: subredditName + " not a viable reddit "});
  						queue.shift();
  						if (queue.length > 0)
        					processQueue();
  					}
  				}

  			});
		}).on('error', function(e) {
		  console.log("HTTPS Load Error: " + e.message);
		});
	});
	
}



function getImagesFromSubreddit(subreddit) {
	//fudge the numbers a bit
	var imagesComplete = 1;
	var totalImages = 0;
	var percent = 0;

	app.io.broadcast('global:function', { message: "Getting images from subreddit: " + subreddit });
	
	var checkQueue = function() {
		 if (++imagesComplete == totalImages) {
		 	//if we've loaded all the images for this subreddit
		 	//hydrate our hashQueue
		 	hashQueue.push(subreddit);
			
			//if the hashqueue is wet and isn't running, start it
			if(hashQueue.length == 1) 
				processHashQueue();
        	
        	//shift the completed subreddit off of our image load queue
        	// and run it again if there's another subreddit to grab
        	queue.shift();
        	if (queue.length > 0)
        		processQueue();
        	else 
        		console.log('queue finished');
        } 

        //calculate percent done
        var currentPercent = Math.floor((imagesComplete/totalImages) * 100);
        if (currentPercent > percent) {
        	percent = currentPercent;
        	app.io.broadcast('global:status', { message: subreddit + " loaded:  " + percent + "%"});

        }
	}

	//check for file existance
    fs.exists(__dirname+ '/public/images/' + subreddit, function(dirExists) {
		
		if (!dirExists) {
			//check for directory existance and create it if it doesn't
			fs.mkdirSync( __dirname+'/public/images/' + subreddit);
		}

		//grab the subreddit imagelist from couch
		couch.get(subreddit,function(err,images,meta) {

			totalImages = images.length;
			console.log('totalImages: ' + totalImages);
			images.forEach(function(image,index,array) {
				//doubhle check for gifs..
				if (!image.link.match(/\.gif/)) {
					//grab the file name for local saving
					var filename = image.link;
					
					//check to see if the file exists locally, so that we don't just absolutely hammer imgur
				    fs.exists(__dirname+'/public/images/' + subreddit + '/' + filename, function(exists) {	
				    	if (!exists) {
				    		try {
				    			//grab the image from imgur

					        	var imageRequest = http.get('http://i.imgur.com/' + image.link, function(imageResults) {
					                var imagedata ='';
					                imageResults.setEncoding('binary');
					                
					                imageResults.on('data', function(chunk) {
					                    imagedata += chunk;
					                }); // end imageResults data

					                imageResults.on('end', function() {
					                    fs.writeFile(__dirname + '/public/images/' + subreddit + '/'+filename, imagedata,'binary', function(err) {
					                            if (err) {
					                            	console.log('ERROR WRITING FILE: ' + err)
					                            	console.log(imagesComplete + " / " + totalImages);
					                            	throw(err);
					                            }
					                            //call checkqueueu after writing a file
						                        checkQueue();
					                    });
					                }); 
					            }); 
								
						
					        } catch (e) {
					        	console.log('ERROR GETTING IMAGE: ' + e);
					        	checkQueue();

					        }
					        
				        } else {
				        	console.log(filename + " already exists");
				        	checkQueue();
				        	
				        }	       
				        
				    }); 
				}
			});
		});
	});
}

function processHashQueue() {

	var subreddit = hashQueue[0];
	var percent = 0;
	var imagesHashed = 0;
	var currentIndex = 0;
	

	app.io.broadcast('global:function', { message: subreddit + " hashing  " });


	couch.get(subreddit,function(err,doc,meta) {
		if (err)
			console.log('hashing couch read error: ' + err);
		else {
			//here's where I'm having issues... 
			//PROBLEM: This block is... well.. blocking the server.
			var p = cp.fork(__dirname+'/hash-worker.js');
			
			p.on('message', function(m) {
				
				if (m.status == 'hashing')
				{
					app.io.broadcast('global:status',{message: subreddit + " -- hashing: " + m.percent + '%'});
				} else {
					//write the document back to couch
					couch.set(subreddit, m.hashes,function(err) {
						if(err)
							console.log(err);
						thumbQueue.push(subreddit);
						if (thumbQueue.length == 1)
							processThumbQueue();
						hashQueue.shift();
						if(hashQueue.length >0)
							processHashQueue();
						else 
							console.log('hashQueue finished');
					});
				}

			});

			p.send({images: doc, subreddit:subreddit});
			
			
		}
	});
}

function processThumbQueue() {
	var subreddit = thumbQueue[0];

	app.io.broadcast('global:function', { message: subreddit + ": creating thmbnails  "});
	if (!fs.existsSync('public/thumbs/' + subreddit)) {
		fs.mkdirSync('public/thumbs/'+subreddit);
	}
	try {
		thumb({
			source: 'public/images/' + subreddit,
	 		destination: 'public/thumbs/' + subreddit,
	 		suffix: '',
	 		width: 100,
	 		height: 100,
	 		quiet: true,
	 		gravity: 'NORTH'
		}, function() {
			//when done with thumbnails, send a socket broadcast to anyone
			//waiting on the subreddit to complete with an image list
			couch.get(subreddit,function(err,doc,meta) {
				if (!err)
					app.io.broadcast(subreddit+":done", {images: doc});

			});

	  		thumbQueue.shift();
	  		
	  		if (thumbQueue.length > 0) 
	  			processThumbQueue();	
		});
	} catch (e) {
		console.log('ERROR CREATING THUMBS: ' + e);
	}
}

//calls the phash backend
function compare(hash,threashold,list) {
	var matches = new Array();
	list.forEach(function(imageObj,index,array) {
			var otherHash = imageObj.hash;
			var hamming = phash.hammingDistance(hash,otherHash);
			if (hamming <= threashold) {
				matches.push(imageObj);
			}
	});
	return matches;
}
	
//compares the image hashes	
function matchHash(req,res) {
	var hash = req.params.hash;
	var subreddit = req.params.subreddit;
	var threashold = req.params.threashold;
	var matches = new Array();
	console.log(hash, threashold)
	var bucket = app.get('bucket');

	bucket.get(subreddit, function(err,doc,meta) {
		var images = doc;
		console.time('comparing-images');
		matches = compare(hash,threashold,images);
		console.timeEnd('comparing-images');
		console.log('matches found: ' + matches.length);
		res.send(matches);
	});
}





