const config = require('../config');
const utils = require('../utils');
const neo4j = require('../neo4j-request');
const fork = require('child_process').fork;
const fs = require('fs-extra-promise');
const Promise = require('bluebird');
const util = require('util');
const JSZip = require('jszip');
const mime = require('mime-types');

module.exports = function (req, res) {
		
	utils.log.fileupload(req.files);
	var file = req.files[0];

	// check for essential data
	// if missing then delete file and abort
	if (!req.body.tid || !req.body.sourceType || !req.body.date) {
		utils.abort.missingData(res, '#upload.model tid|sourceType|date');
		unlinkFile(req.file.path);
		return;
	}

	var params = {
		prj: req.params.id,
		subprj: req.params.subprj,
		tid: req.body.tid,
		path: config.path.data + '/' + req.params.id + '/' + req.body.sourceType + 's/'
	};

	switch (mime.lookup(file.orginalname)) {

		case 'model/vnd.collada+xml':
			processDae(file, params)
				.then(function (result) {
					return writeToDB(result, params);
				})
				.then(function (response) {
					res.json(response);
				})
				.catch(function (err) {
					switch (err.code) {
						case 'DAE-PROCESS':
							utils.error.general(res, err);
							break;
						case 'NEO4J':
							utils.error.neo4j(res, err, '#upload.model');
							break;
						default:
							utils.error.general(res, err);
					}
				});
			break;

		case 'application/zip':
			processZip(file, params)
				.then(function (result) {
					return writeToDB(result, params);
				})
				.then(function (response) {
					res.json(response);
				})
				.catch(function (err) {
					switch (err.code) {
						case 'DAE-PROCESS':
							utils.error.general(res, err);
							break;
						case 'NEO4J':
							utils.error.neo4j(res, err, '#upload.model');
							break;
						case 'IMAGE-EXTRACT':
							utils.error.general(res, err);
							break;
						default:
							utils.error.general(res, err);
					}
				});
			break;

		default:
			utils.abort.unsupportedFile(res, '#upload.model ' + mimetype);

	}
	
};

function processDae(file, params) {
	return new Promise(function (resolve, reject) {

		var forkDae = fork('process/dae-file', [ file.path, params.tid, params.path ]);

		forkDae.on('message', function (response) {
			console.debug('PARENT got message');
			if(response.error)
				reject({
					code: 'DAE-PROCESS',
					data: response
				});
			else
				resolve(response);
		});

		forkDae.on('close', function (code) {
			if(code)
				reject({
					code: 'DAE-PROCESS',
					message: 'child process exited with code ' + code
				});
		});

	});
}

function processZip(file, params) {
	var daeFile = file.destination + '/' + params.tid + '_model.dae';
	var zipObj;

	return fs.readFileAsync(file.path)
		.then(function (data) {
			return JSZip.loadAsync(data);
		})
		.then(function (zip) {
			// extract dae file
			zipObj = zip;
			var daeResults = zip.file(/.+\.dae$/i);
			if(daeResults[0])
				return daeResults[0].async('nodebuffer');
			else
				return Promise.reject({
					code: 'DAE-PROCESS',
					message: 'No dae file found in zip file!'
				});
		})
		.then(function (buffer) {
			return fs.writeFileAsync(daeFile, buffer);
		})
		.then(function () {
			// process dae
			return new Promise(function (resolve, reject) {

				var forkDae = fork('process/dae-file', [daeFile, params.tid, params.path]);

				forkDae.on('message', function (response) {
					console.debug('PARENT got message');
					if (response.error)
						reject({
							code: 'DAE-PROCESS',
							data: response
						});
					else
						resolve(response);
				});

				forkDae.on('close', function (code) {
					if (code)
						reject({
							code: 'DAE-PROCESS',
							message: 'child process exited with code ' + code
						});
				});

			});
		})
		.then(function (result) {
			// extract and process images/textures
			return new Promise(function (resolve, reject) {

				var imgUrls = [];
				for (var key in result.images) {
					imgUrls.push(result.images[key]);
				}

				Promise.each(imgUrls, function (value) {
					return extractImage(zipObj, value, file, params)
						.then(function (fnames) {
							updateMapValues(response.nodes, fnames.oldName, fnames.newName);
							return fs.renameAsync(file.destination + '/' + fnames.newName, path + 'maps/' + fnames.newName);
						});
				}).then(function () {
					return fs.renameAsync(file.path, path + file.filename);
				}).then(function () {
					resolve(result);
				}).catch(function (err) {
					reject(err);
				});

			});
		});
}

function extractImage(zipObj, imageUrl, file, params) {
	var imgFile = file.destination + '/' + params.tid + '_' + imageUrl;
	var imgResults = zipObj.file(new RegExp("^(.*\\/)?" + imageUrl + "$"));

	if(!imgResults[0])
		return Promise.reject({
			code: 'IMAGE-EXTRACT',
			message: imageUrl + ' not found in zip file!'
		});
	else {
		return imgResults[0].async('nodebuffer')
			.then(function (buffer) {
				return fs.writeFileAsync(imgFile, buffer);
			})
			.then(function () {
				return utils.resizeToNearestPowerOf2(file.destination + '/', params.tid + '_' + imageUrl);
			})
			.then(function (resizeFilename) {
				fs.unlink(imgFile);
				return Promise.resolve({
					oldName: imageUrl,
					newName: resizeFilename
				});
			});
	}
}

function updateMapValues(objs, oldName, newName) {
	for(var i=0; i<objs.length; i++) {
		var o = objs[i];
		if(o.material) {
			if(o.material.map === oldName) o.material.map = newName;
			if(o.material.alphaMap === oldName) o.material.alphaMap = newName;
		}
		if(o.children)
			updateMapValues(o.children, oldName, newName);
	}
}

function writeToDB(data, p) {
	var statements = [];

	function prepareStatements(nodes) {
		for(var i=0; i<nodes.length; i++) {
			var n = nodes[i];

			var q = 'MATCH (tmodel:E55:' + p.prj + ' {content: "model"})';
			if (!n.parentid)
				q += ', (parent:E22:' + p.prj + ' {content: "e22_root_"+{subprj}})';
			else
				q += ' MERGE (parent:E22:' + p.prj + ' {content: {parentid}})';

			q += ' MERGE (e22:E22:' + p.prj + ' {content: "e22_"+{contentid}}) \
						MERGE (parent)-[:P46]->(e22) \
						\
						CREATE (e22)<-[:P138]-(e36:E36:' + p.prj + ' {content: "e36_"+{contentid}})-[:P2]->(tmodel) \
						MERGE (e75:E75:' + p.prj + ' {content:{e75content}.content}) \
						ON CREATE SET e75 = {e75content} \
						CREATE (e73:E73:' + p.prj + ' {e73content})-[:P1]->(e75) \
						CREATE (e36)-[:P106]->(e73)';

			if(n.material)
				q += ' MERGE (e57:E57:' + p.prj + ' {content:{e57content}.content}) \
							ON CREATE SET e57 = {e57content} \
							CREATE (e73)-[:P2]->(e57)';

			q += ' RETURN e22.content';

			var params = {
				subprj: subprj,
				contentid: p.tid + '_' + utils.replace(n.id),
				parentid: n.parentid ? 'e22_' + p.tid + '_' + utils.replace(n.parentid) : '',
				e73content: {
					content: 'e73_' + p.tid + '_' + utils.replace(n.id),
					id: n.id,
					name: n.name,
					type: n.type,
					layer: n.layer,
					// materialId: n.material ? n.material.id : '',
					// materialName: n.material ? n.material.name : '',
					// materialColor: n.material ? n.material.color : '',
					unit: n.unit,
					upAxis: n.upAxis,
					matrix: n.matrix
				},
				e75content: {
					content: n.files ? n.files.ctm : file.filename,
					path: p.prj + '/' + req.body.sourceType + 's/',
					edges: n.files ? n.files.edges : undefined,
					type: file.filename.split('.').pop(),
					original: file.filename,
					geometryId: n.geometryUrl
				}
			};

			if(n.material)
				params.e57content = {
					content: 'e57_' + p.tid + '_' + utils.replace(n.material.id),
					id: n.material.id,
					name: n.material.name,
					path: p.prj + '/' + req.body.sourceType + 's/maps/',
					diffuse: n.material.map || n.material.color,
					alpha: n.material.alphaMap || null
				};

			statements.push({ statement: q, parameters: params });

			prepareStatements(n.children);
		}
	}
	prepareStatements(data.nodes);

	return neo4j.transactionArray(statements)
		.then(function (response) {
			if(response.errors.length) return Promise.reject(response);
			return Promise.resolve(neo4j.extractTransactionArrayData(response.results));
		})
		.catch(function (err) {
			return Promise.reject({
				code: 'NEO4J',
				data: err
			});
		});
}

function unlinkFile(filepath) {
	fs.unlinkAsync(filepath)
		.then(function () {
			console.warn('File unlink:', filepath);
		})
		.catch(function () {
			console.error('File unlink failed:', filepath);
		});
}
