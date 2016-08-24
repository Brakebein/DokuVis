var config = require('../config');
var utils = require('../utils');
var neo4j = require('../neo4j-request');
var fork = require('child_process').fork;
var fs = require('fs-extra-promise');
var sax = require('sax');
var util = require('util');

module.exports = {
	
	model: function (req, res) {
		
		utils.log.fileupload(req.files);
		var file = req.files[0];
		
		var newFileName = req.body.newFileName,
			path = req.body.path,
			tid = req.body.tid;
		
		if(!newFileName || !path || !tid) {
			utils.error.general(res, 'POST parameter not complete')
		}
		
		var upath = config.path.data + '/' + path;

		var processDAE = fork('process/dae-file');

		processDAE.on('close', function (code) {
			console.log('child process exited');
		});

		var saxStream = sax.createStream();
		saxStream.on('error', function (e) {
			console.error('error', e);
		});
		saxStream.on('opentag', function (node) {
			console.log(util.inspect(node));
		});

		fs.createReadStream(file.path)
			.pipe(saxStream);

		res.send();
	}
	
};
