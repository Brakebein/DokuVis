const config = require('../config');
const utils = require('../utils');
const fs = require('fs-extra-promise');
const neo4j = require('../neo4j-request');
const exec = require('child-process-promise').execFile;
const Promise = require('bluebird');
const uuid = require('uuid/v4');
const shortid = require('shortid');
const THREE = require('../modules/three');

module.exports = {
	
	query: function (req, res) {
		var prj = req.params.id;
		var subprj = req.params.subprj;

		var q = 'MATCH (e31:E31:'+prj+')-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"}), \
			(e31)<-[:P15]-(:E7 {content:{subprj}}), \
			(e31)-[:P102]->(title:E35), \
			(e31)-[:P1]->(file:E75), \
			(e31)<-[:P94]-(e65:E65), \
			(e31)<-[:P128]-(e84:E84) \
			OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG) \
			WITH e31, type, title, file, e65, e84, collect(tag.content) AS tags \
			OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"}) \
			OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82) \
			OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48) \
			OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61) \
			OPTIONAL MATCH (e84)-[:P48]->(archivenr:E42) \
			OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36) \
			OPTIONAL MATCH (e31)-[:P70]->(:E36)-[:P106]->(spatial:E73)\
			OPTIONAL MATCH (e31)-[:P3]->(note:E62)-[:P3_1]->({content: "sourceComment"}) \
			OPTIONAL MATCH (e31)-[:P3]->(repros:E62)-[:P3_1]->({content: "sourceRepros"}) \
			OPTIONAL MATCH (e84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41), \
				(e78)-[:P52]->(:E40)-[:P131]->(inst:E82) \
			OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}) \
			OPTIONAL MATCH (e31)<-[:P15]-(up:E7)-[:P2]->(:E55 {content: "sourceUpload"}), \
				(up)-[:P14]->(user:E21)-[:P131]->(userName:E82), \
				(up)-[:P4]->(:E52)-[:P82]->(upDate:E61) \
			RETURN e31.content AS eid, \
				type.content AS type, \
				title.value AS title, \
				primary.content AS primary, \
				aname.value AS author, \
				pname.value AS place, \
				date.value AS date, \
				{identifier: archivenr.value, collection: coll.value, institution: inst.value, institutionAbbr: inst.abbr} AS archive, \
				{name: file.content, path: file.path, display: file.preview, thumb: file.thumb} AS file, \
				plan3d.content AS plan3d, \
				spatial.content AS spatial, \
				note.value AS note, \
				repros.value AS repros, \
				tags, \
				count(ce33) AS commentLength, \
				{id: user.content, name: userName.value, date: upDate.value} AS user';

		var params = {
			subprj: subprj === 'master' ? prj : subprj
		};

		neo4j.readTransaction(q, params)
			.then(function (result) {
				res.json(result);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#source.query');
			});
	},

	get: function (req, res) {
		var prj = req.params.id;
		var subprj = req.params.subprj;

		var q = 'MATCH (e31:E31:'+prj+' {content: {sourceId}})-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"}), \
			(e31)-[:P102]->(title:E35), \
			(e31)-[:P1]->(file:E75), \
			(e31)<-[:P94]-(e65:E65), \
			(e31)<-[:P128]-(e84:E84) \
			OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG) \
			WITH e31, type, title, file, e65, e84, collect(tag.content) AS tags \
			OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"}) \
			OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82) \
			OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48) \
			OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61) \
			OPTIONAL MATCH (e84)-[:P48]->(archivenr:E42) \
			OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36) \
			OPTIONAL MATCH (e31)-[:P3]->(note:E62)-[:P3_1]->({content: "sourceComment"}) \
			OPTIONAL MATCH (e31)-[:P3]->(repros:E62)-[:P3_1]->({content: "sourceRepros"}) \
			OPTIONAL MATCH (e84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41), \
				(e78)-[:P52]->(:E40)-[:P131]->(inst:E82) \
			OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}) \
			OPTIONAL MATCH (e31)<-[:P15]-(up:E7)-[:P2]->(:E55 {content: "sourceUpload"}), \
				(up)-[:P14]->(user:E21)-[:P131]->(userName:E82), \
				(up)-[:P4]->(:E52)-[:P82]->(upDate:E61) \
			RETURN e31.content AS eid, \
				id(e31) AS nId, \
				type.content AS type, \
				title.value AS title, \
				primary.content AS primary, \
				aname.value AS author, \
				pname.value AS place, \
				date.value AS date, \
				{identifier: archivenr.value, collection: coll.value, institution: inst.value, institutionAbbr: inst.abbr} AS archive, \
				file AS file, \
				plan3d.content AS plan3d, \
				note.value AS note, \
				repros.value AS repros, \
				tags, \
				count(ce33) AS commentLength, \
				{id: user.content, name: userName.value, date: upDate.value} AS user';

		var params = {
			subprj: subprj === 'master' ? prj : subprj,
			sourceId: req.params.sourceId
		};

		neo4j.readTransaction(q, params)
			.then(function (result) {
				if (result.length)
					res.json(result[0]);
				else
					res.json(null);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#source.get')
			});
	},

	create: function (req, res) {

		utils.log.fileupload(req.file);

		var prj = req.params.id;
		var id = shortid.generate();

		// check for essential data
		// if missing then delete file and abort
		if (!req.body.tid || !req.body.sourceType || !req.body.date || !req.body.title) {
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
		
		// path + filenames
		var shortPath = prj + '/sources/' + uuid() + '/';
		var path = config.path.data + '/' + shortPath;
		var filename = id + '_' + utils.replace(req.file.originalname);
		var filenameThumb = filename.slice(0, filename.lastIndexOf(".")) + '_thumb.jpg';
		var filenamePreview = filename.slice(0, filename.lastIndexOf(".")) + '_preview.jpg';
		var filenameTexture = filename.slice(0, filename.lastIndexOf(".")) + '_tex.jpg';
		var filenameTexturePreview = filename.slice(0, filename.lastIndexOf(".")) + '_tex_preview.jpg';

		var imgWidth, imgHeight;

		// create folder
		fs.ensureDirAsync(path)
			.then(function () {
				// move uploaded file into folder
				return fs.renameAsync(req.file.path, path + filename);
			})
			.then(function () {
				// create thumbnail
				return exec(config.exec.ImagickConvert, [path + filename, '-resize', '160x90^', '-gravity', 'center', '-extent', '160x90', path + filenameThumb]);
			})
			.then(function () {
				// downsample preview image
				return exec(config.exec.ImagickConvert, [path + filename, '-resize', '1024x1024>', path + filenamePreview]);
			})
			.then(function () {
				// sample image to texture with resolution power of 2
				return utils.resizeToNearestPowerOf2(path, filename, filenameTexture);
			})
			.then(function (output) {
				imgWidth = output.originalWidth;
				imgHeight = output.originalHeight;

				// downsample image to preview texture
				return exec(config.exec.ImagickConvert, [path + filename, '-resize', '128x128!', path + filenameTexturePreview]);
			})
			.catch(function (err) {
				utils.error.server(res, err, '#source.create fs/exec @ ' + path + filename);
				return Promise.reject();
			})
			.then(function () {
				// neo4j query

				var q = 'MATCH (e55:E55:'+prj+' {content: {sourceType}}), \
						(esub:E7:'+prj+' {content: {subprj}}), \
						(user:E21:'+prj+' {content: {user}}), \
						(su:E55:'+prj+' {content: "sourceUpload"}), \
						(sc:E55:'+prj+' {content: "sourceComment"}), \
						(sr:E55:'+prj+' {content: "sourceRepros"}), \
						(tprime:E55:'+prj+' {content: "primarySource"})';
				if(req.body.archive.length)
					q += ', (e78:E78:'+prj+' {content: {archive}})';

				q += ' CREATE (e31:E31:'+prj+' {content: {e31id}}), \
						(e31)-[:P1]->(e75:E75:'+prj+' {e75file}), \
						(e31)-[:P2]->(e55), \
						(e31)<-[:P15]-(esub), \
						(e31)-[:P102]->(e35:E35:'+prj+' {e35title}), \
						(e31)<-[:P94]-(e65:E65:'+prj+' {content: {e65id}}), \
						(e31)<-[:P128]-(e84:E84:'+prj+' {content: {e84id}})';

				if(req.body.sourceType === 'plan' || req.body.sourceType === 'picture') {
					q += ' CREATE (e31)-[:P70]->(e36:E36:'+prj+' {content: {e36id}})';
				}
				if(req.body.sourceType === 'text') {
					q += ' CREATE (e31)-[:P70]->(e33:E33:'+prj+' {content: {e33id}}) \
						MERGE (e56:E56:'+prj+' {content: {language}}) \
						CREATE (e33)-[:P72]->(e56)';
				}
				if(req.body.primary === 'true')
					q += ' CREATE (e31)-[:P2]->(tprime)';
				if(req.body.author.length) {
					q += 'MERGE (e82:E82:'+prj+' {value: {author}})<-[:P131]-(e21:E21:'+prj+') \
						ON CREATE SET e21.content = {e21id}, e82.content = {e82id} \
						CREATE (e65)-[:P14]->(e21)';
				}
				if(req.body.creationPlace.length) {
					q += ' MERGE (e48:E48:' + prj + ' {value: {place}})<-[:P87]-(e53:E53:' + prj + ') \
						ON CREATE SET e53.content = {e53id}, e48.content = {e48id} \
						CREATE (e65)-[:P7]->(e53)';
				}
				if(req.body.creationDate.length) {
					q += ' MERGE (e61:E61:'+prj+' {value: {e61value}}) \
						CREATE (e61)<-[:P82]-(e52:E52:'+prj+' {content: {e52id}})<-[:P4]-(e65)';
				}
				if(req.body.note.length) {
					q += ' CREATE (e31)-[:P3]->(:E62:'+prj+' {e62note})-[:P3_1]->(sc)';
				}
				if(req.body.repros.length) {
					q += ' CREATE (e31)-[:P3]->(:E62:'+prj+' {e62repros})-[:P3_1]->(sr)';
				}
				if(req.body.archive.length) {
					q += ' CREATE (e78)-[:P46]->(e84)';
				}
				if(req.body.archiveNr.length) {
					q += ' MERGE (e42:E42:'+prj+' {value: {archiveNr}}) \
						ON CREATE SET e42.content = {e42id} \
						CREATE (e84)-[:P48]->(e42)';
				}

				// user/timestamp
				q += ' CREATE (e31)<-[:P15]-(si7:E7:'+prj+' {content: {upload7}})-[:P2]->(su), \
						(si7)-[:P14]->(user), \
						(si7)-[:P4]->(:E52:'+prj+' {content: {upload52}})-[:P82]->(:E61:'+prj+' {value: {date}})';
				// tags
				q += ' FOREACH (tag in {tags} | \
							MERGE (t:TAG:'+prj+' {content: tag}) \
							MERGE (e31)-[:has_tag]->(t) )';

				q += ' RETURN e31';

				var params = {
					subprj: req.params.subprj === 'master' ? prj : req.params.subprj,
					user: req.headers['x-key'],
					e31id: 'e31_' + filename,
					sourceType: req.body.sourceType,
					e75file: {
						content: filename,
						type: filename.split(".").pop().toLowerCase(),
						path: shortPath,
						thumb: filenameThumb,
						preview: filenamePreview,
						texture: filenameTexture,
						texturePreview: filenameTexturePreview,
						orginal: req.file.originalname,
						width: imgWidth,
						height: imgHeight
					},
					e35title: {
						content: 'e35_' + filename,
						value: req.body.title
					},
					e65id: 'e65_e31_' + filename,
					e84id: 'e84_e31_' + filename,
					e33id: 'e33_e31_' + filename,
					e36id: 'e36_e31_' + filename,
					author: req.body.author,
					e21id: 'e21_' + id + '_' + utils.replace(req.body.author),
					e82id: 'e82_' + id + '_' + utils.replace(req.body.author),
					place: req.body.creationPlace,
					e53id: 'e53_' + id + '_' + utils.replace(req.body.creationPlace),
					e48id: 'e48_' + id + '_' + utils.replace(req.body.creationPlace),
					e61value: req.body.creationDate,
					e52id: 'e52_e65_e31_' + filename,
					archive: req.body.archive,
					archiveNr: req.body.archiveNr,
					e42id: 'e42_e84_e31_' + filename,
					e62note: {
						content: 'e31_note_' + filename,
						value: req.body.note
					},
					e62repros: {
						content: 'e31_repros_' + filename,
						value: req.body.repros
					},
					language: req.body.language,
					date: req.body.date,
					upload7: 'e7_upload_' + filename,
					upload52: 'e52_e7_upload_' + filename,
					tags: req.body.tags ? req.body.tags.split(',') : []
				};

				return neo4j.writeTransaction(q, params);
			})
			.then(function (result) {
				if (result.length)
					res.json(result[0]);
				else {
					console.warn('#source.create: no nodes created');
					res.json(null);
					return Promise.reject();
				}
			})
			.catch(function (err) {
				if (err) utils.error.neo4j(res, err, '#source.create');

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
				return fs.existsAsync(req.file.path);
			})
			.then(function (exists) {
				if (exists) {
					console.warn('Unlink temp file:', req.file.path);
					return fs.unlinkAsync(req.file.path);
				}
			})
			.catch(function (err) {
				console.error('Unlink temp file failed:', req.file.path, err);
			});
	},

	link: function (req, res) {
		var prj = req.params.id;

		var targets = req.body.targets || [];
		if(!Array.isArray(targets)) targets = [targets];
		if(!targets.length) { utils.abort.missingData(res, 'body.targets'); return; }
		
		var q = 'MATCH (e31:E31:'+prj+' {content: {sourceId}})-[:P70]->(e36:E36), \
			(e73:E73:'+prj+')<-[:P106]-(:E36)-[:P138]->(e22:E22) \
			WHERE e73.content IN {targets} \
			MERGE (e36)-[r:P138]->(e22) \
			RETURN count(r) AS count';
		var params = {
			sourceId: req.params.sourceId,
			targets: targets
		};

		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#source.createConnections'); return; }
				res.json(neo4j.extractTransactionData(response.results[0])[0]);
			})
			.catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},

	getLinks: function (req, res) {
		var prj = req.params.id;
		var q = 'MATCH (e31:E31:'+prj+' {content: {sourceId}})-[:P70]->(:E36)-[:P138]->(:E22)<-[:P138]-(e36:E36)-[:P2]->(:E55 {content: "model"}), \
			(e36)-[:P106]->(e73:E73) \
			RETURN e73.content AS meshId';
		var params = {
			sourceId: req.params.sourceId
		};

		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#source.getLinks'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			})
			.catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	setSpatial: function (req, res) {
		var prj = req.params.id;
		var promise;
		// TODO: convert image to 1024x1024 map

		if (req.query.method === 'DLT') {
			console.debug('DLT method');

			console.debug(req.body.file.name);
			var tmpFile = config.path.tmp + '/' + req.body.file.name + '_coords.txt';

			promise = fs.writeFileAsync(tmpFile, req.body.dlt)
				.then(function () {
					return exec(config.exec.DLT, [tmpFile]);
				})
				.catch(function (err) {
					utils.error.server(res, err, '#source.setSpatial fs/exec ' + tmpFile);
					fs.unlinkSync(tmpFile);
				})
				.then(function (result) {
					console.debug(result.stdout);
					fs.unlinkSync(tmpFile);

					var lines = result.stdout.split("\n");

					var ck = parseFloat(lines[1]) / 1000;
					var offset = new THREE.Vector2(parseFloat(lines[3]) / 1000, parseFloat(lines[4]) / 1000);

					var position = new THREE.Vector3(parseFloat(lines[6]), parseFloat(lines[7]), parseFloat(lines[8]));
					var r1 = lines[10].trim().split(/\s+/),
						r2 = lines[11].trim().split(/\s+/),
						r3 = lines[12].trim().split(/\s+/);

					var matrix = new THREE.Matrix4();
					matrix.set(parseFloat(r1[0]), parseFloat(r1[1]), parseFloat(r1[2]), position.x,
						parseFloat(r2[0]), parseFloat(r2[1]), parseFloat(r2[2]), position.y,
						parseFloat(r3[0]), parseFloat(r3[1]), parseFloat(r3[2]), position.z,
						0, 0, 0, 1);

					return Promise.resolve({
						sourceId: req.params.sourceId,
						e73id: 'spatial_' + req.params.sourceId,
						e73value: {
							path: req.body.file.path,
							map: req.body.file.display,
							matrix: matrix.toArray(),
							offset: offset.toArray(),
							ck: ck
						}
					});
				});
		}
		else if (req.query.method === 'manual') {
			console.debug('manual method');

			promise = Promise.resolve({
				sourceId: req.params.sourceId,
				e73id: 'spatial_' + req.params.sourceId,
				e73value: {
					path: req.body.file.path,
					map: req.body.file.display,
					matrix: req.body.matrix,
					offset: req.body.offset,
					ck: req.body.ck
				}
			});
		}
		else {
			promise = Promise.reject('No method selected');
		}

		promise
			.then(function (params) {
				var q = 'MATCH (e31:E31:' + prj + ' {content: {sourceId}})-[:P70]->(e36:E36) \
					MERGE (e36)-[:P106]->(e73:E73:' + prj + ' {content: {e73id}}) \
					SET e73 += {e73value} \
					RETURN e73 AS spatial';

				return neo4j.transaction(q, params);
			})
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#source.setSpatial'); return; }
				res.json(neo4j.extractTransactionData(response.results[0])[0]);
				//res.send();
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	getSpatial: function (req, res) {
		var prj = req.params.id;
		
		if(req.params.type === 'picture') {
			var q = 'MATCH (e31:E31:' + prj + ' {content: {sourceId}})-[:P70]->(e36:E36)-[:P106]->(e73:E73) \
				RETURN e73 AS spatial';
				// RETURN e73.content AS id, e73.path AS path, e73.map AS map, e73.matrix AS matrix, e73.fov AS fov';
		}
		else if(req.params.type === 'plan') {
			q = 'MATCH (:E31:'+prj+' {content: {sourceId}})<-[:P138]-(:E36)-[:P106]->(e73:E73)-[:P1]->(e75:E75) \
				RETURN e73 AS info, e75 AS file';
		}
		
		var params = {
			sourceId: req.params.sourceId
		};

		neo4j.transaction(q, params)
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#source.getSpatial'); return; }
				res.json(neo4j.extractTransactionData(response.results[0])[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};
