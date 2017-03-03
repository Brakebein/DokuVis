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

		console.debug(file);

		// check for essential data
		// if missing then delete file and abort
		if(!req.body.tid || !req.body.sourceType || !req.body.date) {
			utils.abort.missingData(res, '#source.create tid|sourceType|date|title');
			fs.unlinkAsync(req.file.path)
				.then(function () {
					console.warn('File unlink:', req.file.path);
				})
				.catch(function () {
					console.error('File unlink failed:', req.file.path);
				});
			return;
		}

		var prj = req.params.id;
		var tid = req.body.tid;
		var path = config.path.data + '/'  + prj + '/' + req.body.sourceType + 's/';
		
		var upath = config.path.data + '/' + path;

		var processDAE = fork('process/dae-file2', [ file.path, tid, upath ]);

		processDAE.on('message', function (m) {
			console.debug('PARENT got message');
			res.json(m);
		});

		processDAE.on('close', function (code) {
			console.debug('child process exited', code);
			if(code) {
				res.status(500);
				res.json({
					message: 'Error occurred!'
				});
			}
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
