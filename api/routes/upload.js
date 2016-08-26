const config = require('../config');
var utils = require('../utils');
var neo4j = require('../neo4j-request');
const fork = require('child_process').fork;
var fs = require('fs-extra-promise');
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

		var processDAE = fork('process/dae-file', [ file.path, tid, upath ]);

		processDAE.on('message', function (m) {
			console.log('PARENT got message');
			res.json(m);
		});

		processDAE.on('close', function (code) {
			console.log('child process exited', code);
		});

		// processDAE.send({
		// 	file: {
		// 		path: path,
		// 		tid: tid,
		// 		filename: newFileName
		// 	}
		// });

		//res.send();
	}
	
};
