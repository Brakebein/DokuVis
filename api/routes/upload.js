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

		// check for essential data
		// if missing then delete file and abort
		if(!req.body.tid || !req.body.sourceType || !req.body.date) {
			utils.abort.missingData(res, '#upload.model tid|sourceType|date');
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
		var subprj = req.params.subprj;
		var tid = req.body.tid;
		var path = config.path.data + '/'  + prj + '/' + req.body.sourceType + 's/';

		var processDAE = fork('process/dae-file', [ file.path, tid, path ]);

		processDAE.on('message', function (response) {
			console.debug('PARENT got message');
			if(response.error) {
				res.status(500);
				res.json(response);
			}
			else
				writeToDB(response);
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

		function writeToDB(data) {
			var statements = [];
			
			function prepareStatements(nodes) {
				for(var i=0; i<nodes.length; i++) {
					var n = nodes[i];

					var q = 'MATCH (tmodel:E55:' + prj + ' {content: "model"})';
					if (!n.parentid)
						q += ', (parent:E22:' + prj + ' {content: "e22_root_"+{subprj}})';
					else
						q += ' MERGE (parent:E22:' + prj + ' {content: {parentid}})';

					q += ' MERGE (e22:E22:' + prj + ' {content: "e22_"+{contentid}}) \
						MERGE (parent)-[:P46]->(e22) \
						\
						CREATE (e22)<-[:P138]-(e36:E36:' + prj + ' {content: "e36_"+{contentid}})-[:P2]->(tmodel) \
						MERGE (e75:E75:' + prj + ' {content:{e75content}.content}) \
						ON CREATE SET e75 = {e75content} \
						CREATE (e73:E73:' + prj + ' {e73content})-[:P1]->(e75) \
						CREATE (e36)-[:P106]->(e73) \
						\
						RETURN e22.content';

					var params = {
						subprj: subprj,
						contentid: tid + '_' + utils.replace(n.id),
						parentid: n.parentid ? 'e22_' + tid + '_' + utils.replace(n.parentid) : '',
						e73content: {
							content: 'e73_' + tid + '_' + utils.replace(n.id),
							id: n.id,
							name: n.name,
							type: n.type,
							layer: n.layer,
							materialId: n.material ? n.material.id : '',
							materialName: n.material ? n.material.name : '',
							materialColor: n.material ? n.material.color : '',
							unit: n.unit,
							upAxis: n.upAxis,
							matrix: n.matrix
						},
						e75content: {
							content: n.files ? n.files.ctm : file.filename,
							path: prj + '/' + req.body.sourceType + 's/',
							edges: n.files ? n.files.edges : undefined,
							type: file.filename.split('.').pop(),
							original: file.filename,
							geometryId: n.geometryUrl
						}
					};

					statements.push({ statement: q, parameters: params });

					prepareStatements(n.children);
				}
			}
			prepareStatements(data.nodes);

			neo4j.transactionArray(statements)
				.then(function (response) {
					if(response.errors.length) { utils.error.neo4j(res, response, '#upload.model'); return; }
					res.json(neo4j.extractTransactionArrayData(response.results));
				}, function (err) {
					utils.error.neo4j(res, err, '#cypher');
				});
		}
	}
	
};
