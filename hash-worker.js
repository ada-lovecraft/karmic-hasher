var phash = require('../node-phash')
	, events = require('events')
	, radium = new events.EventEmitter();


process.on('message', function(m) {
	var hashes = new Array();
	var images = m.images;
	var imagesHashed = 0;
	var percent = 0;
	radium.on('hashDone', function() {
		//check for another document
		if (++imagesHashed == images.length) {
			process.send({status: 'complete', hashes: hashes });
		} else {
			var currentPercent = Math.floor((imagesHashed/images.length) * 100);
			if ( currentPercent > percent) {
				percent = currentPercent;
				process.send({status: 'hashing', percent:percent});
			}
			radium.emit('doHash', images[imagesHashed]);
		}
	});

	radium.on('doHash', function(image) {
		image.hash = phash.getImageHash('public/images/' + m.subreddit + '/' + image.link);
		hashes.push(image);
		radium.emit('hashDone');
	});

	radium.emit('doHash', images[0]);
});
