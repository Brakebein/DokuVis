const config = require('../config');
const utils = require('../utils');
const fs = require('fs-extra-promise');
const neo4j = require('../neo4j-request');
const exec = require('child-process-promise').exec;
const Promise = require('bluebird');

var source = {
	
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
				note.value AS note, \
				repros.value AS repros, \
				tags, \
				count(ce33) AS commentLength, \
				{id: user.content, name: userName.value, date: upDate.value} AS user';
		var params = {
			subprj: subprj === 'master' ? prj : subprj
		};
		
		//neo4j.cypher(q, params)
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#source.getAll'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
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
				{name: file.content, path: file.path, display: file.preview, thumb: file.thumb, link: file.link} AS file, \
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

		//neo4j.cypher(q, params)
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#source.get'); return; }
				var rows = neo4j.extractTransactionData(response.results[0]);
				if(rows.length)
					res.json(rows[0]);
				else
					res.json(null);
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},
	
	// TODO: #source create/insert
	create: function (req, res) {

		utils.log.fileupload(req.file);

		var prj = req.params.id;
		var tid = req.body.tid;

		// check for essential data
		// if missing then delete file and abort
		if(!req.body.tid || !req.body.sourceType || !req.body.date || !req.body.title) {
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
		
		// process image
		var path = config.path.data + '/'  + prj + '/' + req.body.sourceType + 's/';
		var filename = req.file.filename;
		var filenameThumb = '_thumbs/t_' + filename.slice(0, filename.lastIndexOf(".")) + '.jpg';
		var filenamePreview = filename.slice(0, filename.lastIndexOf(".")) + '_1024.jpg';

		// move/rename file
		fs.renameAsync(req.file.path, path + filename)
			.then(function () {
				// thumbnail
				return exec(config.exec.ImagickConvert + ' ' + path + filename + ' -resize "160x90^" -gravity center -extent 160x90 ' + path + filenameThumb);
			})
			.then(function () {
				// downsample preview image
				return exec(config.exec.ImagickConvert + ' ' + path + filename + ' -resize "1024x1024>" ' + path + filenamePreview);
			})
			.catch(function (err) {
				utils.error.server(res, err, '#source.create fs/exec ' + path + filename);
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

				if(req.body.sourceType == 'plan' || req.body.sourceType == 'picture') {
					q += ' CREATE (e31)-[:P70]->(e36:E36:'+prj+' {content: {e36id}})';
				}
				if(req.body.sourceType == 'text') {
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
					user: 'e21_' + req.headers['x-key'],
					e31id: 'e31_' + filename,
					sourceType: req.body.sourceType,
					e75file: {
						content: filename,
						type: filename.split(".").pop().toLowerCase(),
						path: prj + '/' + req.body.sourceType + 's/',
						thumb: filenameThumb,
						preview: filenamePreview,
						orginal: req.file.originalname
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
					e21id: 'e21_' + tid + '_' + utils.replace(req.body.author),
					e82id: 'e82_' + tid + '_' + utils.replace(req.body.author),
					place: req.body.creationPlace,
					e53id: 'e53_' + tid + '_' + utils.replace(req.body.creationPlace),
					e48id: 'e48_' + tid + '_' + utils.replace(req.body.creationPlace),
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
				
				return neo4j.transaction(q, params);
			})
			.then(function (response) {
				if(response.errors.length) {
					utils.error.neo4j(res, response, '#source.create');
					return Promise.reject();
				}
				var rows = neo4j.extractTransactionData(response.results[0]);
				if(rows.length)
					res.json(rows[0]);
				else {
					console.warn('#source.create: no nodes created');
					res.json(null);
					return Promise.reject();
				}
			})
			.catch(function (err) {
				if(err) utils.error.neo4j(res, err, '#cypher');
				fs.unlinkSync(path + filename);
				fs.unlinkSync(path + filenameThumb);
				fs.unlinkSync(path + filenamePreview);
				console.warn('File unlink:', path, filename, filenameThumb, filenamePreview);
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
			}).catch(function(err) {
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
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}
	
};

module.exports = source; 
