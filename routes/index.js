
/*
 * GET home page.
 */

exports.index = function(req, res){	
	  res.render('index', { title: 'karmic hash' , subreddit: null, images: null, message: 'try this <a href="/r/cats">/r/cats</a>' });
}

