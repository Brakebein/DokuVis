const config = require('../config');
const utils = require('../utils');
const neo4j = require('../neo4j-request');
const fork = require('child_process').fork;
const fs = require('fs-extra-promise');
const shortid = require('shortid');
const uuid = require('uuid/v4');
const Promise = require('bluebird');
const JSZip = require('jszip');
const mime = require('mime-types');

module.exports = function (req, res) {
		
	utils.log.fileupload(req.file);
	var file = req.file;

	// check for essential data
	// if missing then delete file and abort
	if (!req.body.date || !req.body.title) {
		utils.abort.missingData(res, '#upload.model date|title');
		fs.unlinkAsync(req.file.path)
			.then(function () {
				console.warn('File unlink:', req.file.path);
			})
			.catch(function () {
				console.error('File unlink failed:', req.file.path);
			});
		return;
	}

	var tid = shortid.generate();
	var shortPath = req.params.prj + '/models/' + uuid() + '/';
	var path = config.path.data + '/' + shortPath;
	var filename = tid + '_' + utils.replace(req.file.originalname);

	var params = {
		prj: req.params.prj,
		subprj: req.params.subprj,
		tid: tid,
		filename: filename,
		shortPath: shortPath,
		path: path,
		user: req.headers['x-key'],
		body: req.body
	};

	// create folder
	fs.ensureDirAsync(path + 'maps/')
		.then(function () {
			// move uploaded file into folder
			return fs.renameAsync(file.path, path + filename);
		})
		.catch(function (err) {
			utils.error.server(res, err, '#source.create fs/exec @ ' + path + filename);
			return Promise.reject();
		})
		.then(function () {
			// lookup mime type and start processing
			switch (mime.lookup(file.originalname)) {

				case 'model/vnd.collada+xml':
					return processDae(params)
						.then(function (result) {
							return writeToDB(result, params);
						});
					break;

				case 'application/zip':
					return processZip(params)
						.then(function (result) {
							// return Promise.reject();
							return writeToDB(result, params);
						});
					break;

				default:
					utils.abort.unsupportedFile(res, '#upload.model ' + file.originalname);
					return Promise.reject();

			}
		})
		.then(function (response) {
			// everything went well
			res.json(response);
		})
		.catch(function (err) {
			// error notification
			if (err) {
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
			}

			// remove files/directory
			return fs.existsAsync(path);
		})
		.then(function (exists) {
			if (exists) {
				console.warn('Unlink directory:', path);
				return fs.removeAsync(path);
			}
		})
		.catch(function (err) {
			console.error('Unlink directory failed:', path, err);
		})
		.then(function () {
			return fs.existsAsync(file.path);
		})
		.then(function (exists) {
			if (exists) {
				console.warn('Unlink temp file:', file.path);
				return fs.unlinkAsync(file.path);
			}
		})
		.catch(function (err) {
			console.error('Unlink temp file failed:', file.path, err);
		});
	
};

function processDae(params) {
	return new Promise(function (resolve, reject) {
		// initialize process to handle dae file
		var forkDae = fork('process/dae-file', [ params.path + params.filename, params.tid, params.path ]);

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

function processZip(params) {
	var daeTmpFile = params.path + params.tid + '_tmp.dae';
	var zipObj;

	return fs.readFileAsync(params.path + params.filename)
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
					message: 'No DAE file found in zip file!'
				});
		})
		.then(function (buffer) {
			return fs.writeFileAsync(daeTmpFile, buffer);
		})
		.then(function () {
			// process dae
			return new Promise(function (resolve, reject) {

				var forkDae = fork('process/dae-file', [daeTmpFile, params.tid, params.path]);

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
			var imgUrls = [];
			for (var key in result.images) {
				console.debug(result.images[key]);
				imgUrls.push(result.images[key]);
			}

			return Promise.each(imgUrls, function (url) {
				return extractImage(zipObj, url, params)
					.then(function (fnames) {
						updateMapValues(result.nodes, fnames.oldName, fnames.newName);
						return Promise.resolve();
					})
			})
				.then(function () {
					return Promise.resolve(result);
				})
				.catch(function (err) {
					return Promise.reject(err);
				});

			// return new Promise(function (resolve, reject) {
			//
			// 	var imgUrls = [];
			// 	for (var key in result.images) {
			// 		imgUrls.push(result.images[key]);
			// 	}
			//
			// 	Promise.each(imgUrls, function (value) {
			// 		return extractImage(zipObj, value, params)
			// 			.then(function (fnames) {
			// 				updateMapValues(result.nodes, fnames.oldName, fnames.newName);
			// 				// return fs.renameAsync(file.destination + '/' + fnames.newName, params.path + 'maps/' + fnames.newName);
			// 				return Promise.resolve();
			// 			});
			//
			// 	}).then(function () {
			// 		// return fs.renameAsync(file.path, params.path + file.filename);
			// 	}).then(function () {
			// 		resolve(result);
			// 	}).catch(function (err) {
			// 		reject(err);
			// 	});
			//
			// });
		});
}

// extract image from zip and resize
function extractImage(zipObj, imageUrl, params) {
	var imgFile = params.path + 'maps/' + params.tid + '_' + imageUrl;
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
				return utils.resizeToNearestPowerOf2(params.path + 'maps/', params.tid + '_' + imageUrl);
			})
			.then(function (resizeOutput) {
				fs.unlink(imgFile);
				return Promise.resolve({
					oldName: imageUrl,
					newName: resizeOutput.name
				});
			});
	}
}

// set map properties to new image url
function updateMapValues(objs, oldName, newName) {
	objs.forEach(function (o) {
		if (o.material) {
			if (o.material.map === oldName) o.material.map = newName;
			if (o.material.alphaMap === oldName) o.material.alphaMap = newName;
		}
		if (o.children)
			updateMapValues(o.children, oldName, newName);
	});
}

function writeToDB(data, p) {
	var prj = p.prj;
	var statements = [];

	statements.push(createEventStatement(p));

	function prepareStatements(nodes) {
		for (var i = 0; i < nodes.length; i++) {
			var n = nodes[i];

			// TODO: look for previous objects only within previous/not parallel events
			// create digital object
			var q = 'MATCH (tmodel:E55:'+prj+' {content: "model"}),\
				(subprj:E7:'+prj+' {content: $subprj}),\
				(devent:D7:'+prj+' {content: $deventId})\
			OPTIONAL MATCH (subprj)-[:P15]->(deventOld:D7)-[:L11]->(dobjOld:D1 {id: $obj.id})<-[:P106]-(dglobOld:D1)-[:P2]->(tmodel)\
			WHERE NOT (dobjOld)<-[:L10]-(:D7)\
			\
			MERGE (dobj:D1:'+prj+' {content: $obj.content})\
				ON CREATE SET dobj = $obj\
			CREATE (devent)-[:L11]->(dobj),\
				(dobj)-[:P1]->(file:E75:'+prj+' $file)\
			\
			FOREACH (parentId IN $parentId |\
				MERGE (parent:D1:'+prj+' {content: parentId})\
				CREATE (parent)-[:P106]->(dobj)\
			)\
			FOREACH (ignoreMe IN CASE WHEN dobjOld IS NOT NULL THEN [1] ELSE [] END |\
				CREATE (devent)-[:L10]->(dobjOld),\
				(dobj)<-[:P106]-(dglobOld)\
			)\
			FOREACH (ignoreMe IN CASE WHEN dobjOld IS NULL THEN [1] ELSE [] END |\
				CREATE (dobj)<-[:P106]-(dglob:D1:'+prj+' {content: $dglobid})-[:P2]->(tmodel),\
					(dglob)-[:P67]->(e22:E22:'+prj+' {content: $e22id})\
			)\
			\
			WITH dobj\
			UNWIND range(0, size($materials) - 1) AS i\
			MERGE (e57:E57:'+prj+' {content: $materials[i].content})\
				ON CREATE SET e57 = $materials[i]\
			CREATE (dobj)-[:P2 {order: i}]->(e57)\
			\
			RETURN DISTINCT dobj';

			var ctm = p.filename;
			var edges = undefined;
			if (n.files) {
				if (Array.isArray(n.files)) {
					ctm = n.files.map(function (f) { return f.ctm; });
					edges = n.files.map(function (f) { return f.edges; });
				}
				else {
					ctm = n.files.ctm;
					edges = n.files.edges;
				}
			}

			var params = {
				subprj: p.subprj,
				deventId: 'd7_' + p.tid,
				parentId: n.parentid ? ['d1_' + p.tid + '_' + utils.replace(n.parentid)] : [],
				dglobid: 'd1_glob_' + p.tid + '_' + utils.replace(n.id),
				e22id: 'e22_' + p.tid + utils.replace(n.id),
				obj: {
					content: 'd1_' + p.tid + '_' + utils.replace(n.id),
					id: n.id,
					name: n.name,
					type: n.type,
					layer: n.layer,
					unit: n.unit,
					up: n.up,
					matrix: n.matrix
				},
				file: {
					content: ctm,
					path: p.shortPath,
					edges: edges,
					type: p.filename.split('.').pop(),
					original: p.filename,
					geometryId: n.geometryUrl
				},
				materials: []
			};

			if (n.material) {
				var mats = Array.isArray(n.material) ? n.material : [n.material];
				params.materials = mats.map(function (m) {
					return {
						content: 'e57_' + p.tid + '_' + utils.replace(m.id),
						id: m.id,
						name: m.name,
						path: p.shortPath,
						diffuse: m.map || m.color,
						alpha: m.alphaMap || null
						// ambient: m.ambientMap || null,
						// specular: m.alphaMap || null,
						// shininess: m.shininess || null
					};
				});
			}

			statements.push({ statement: q, parameters: params });

			prepareStatements(n.children);
		}
	}
	prepareStatements(data.nodes);

	return neo4j.multipleStatements(statements)
		.then(function (results) {
			return Promise.resolve(results);
		})
		.catch(function (err) {
			return Promise.reject({
				code: 'NEO4J',
				data: err
			});
		});
}

function createEventStatement(p) {
	var prj = p.prj;

	// create event
	var q = 'MATCH (user:E21:'+prj+' {content: $user}),\
			(subprj:E7:'+prj+' {content: $subprj})\
		OPTIONAL MATCH (pre:D7:'+prj+' {content: $predecessor})\
		CREATE (devent:D7:'+prj+' {content: $deventId})-[:P14]->(user),\
			(devent)-[:P4]->(:E52:'+prj+' {content: $e52id})-[:P82]->(:E61:'+prj+' {value: $date}),\
			(devent)<-[:P15]-(subprj),\
			(devent)-[:P102]->(:E35:'+prj+' $title),\
			(devent)-[:P3]->(:E62:'+prj+' $note)\
		FOREACH (sw IN $software |\
			MERGE (software:D14:'+prj+' {value: sw.value})\
				ON CREATE SET software.content = sw.content\
			CREATE (devent)-[:L23]->(software)\
		)\
		FOREACH (ignoreMe IN CASE WHEN pre IS NOT NULL THEN [1] ELSE [] END |\
			CREATE (devent)-[:P134]->(pre)\
		)\
		RETURN devent';

	var params = {
		user: p.user,
		subprj: p.subprj,
		predecessor: p.body.predecessor || '_',// ? p.body.predecessor : null,
		deventId: 'd7_' + p.tid,
		e52id: 'e52_d7_' + p.tid,
		date: p.body.date,
		title: {
			content: 'e35_d7_' + p.tid,
			value: p.body.title
		},
		note: {
			content: 'e62_d7_' + p.tid,
			value: p.body.note
		},
		software: p.body.software ? [{
			content: p.tid + '_' + utils.replace(p.body.software),
			value: p.body.software
		}] : []
	};

	return { statement: q, parameters: params };
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
