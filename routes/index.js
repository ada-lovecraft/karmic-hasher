
/*
 * GET home page.
 */

exports.index = function(req, res){	
	  res.render('index', { title: 'album grabber' , subreddit: null, images: null, message: null });
}

