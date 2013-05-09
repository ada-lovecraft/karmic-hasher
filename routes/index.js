
/*
 * GET home page.
 */
var jsdom = require('jsdom')
	, sys = require('sys')
	, fs = require('fs')
	, http = require('http')
	, EventEmitter = require('events').EventEmitter
	, radium = new EventEmitter();

exports.index = function(req, res){	
	  res.render('index', { title: 'album grabber' , albumName: null, message: null });
}

