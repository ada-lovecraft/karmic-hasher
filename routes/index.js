
/*
 * GET home page.
 */

exports.index = function(req, res){	
	  res.render('index', { title: 'album grabber' , albumName: null, message: null });
}

