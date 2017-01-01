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
			(e31)<-[:P94]-(e65:E65) \
			OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG) \
			WITH e31, type, title, file, e65, collect(tag.content) AS tags \
			OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"}) \
			OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82) \
			OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48) \
			OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61) \
			OPTIONAL MATCH (e31)-[:P48]->(archivenr:E42) \
			OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36) \
			OPTIONAL MATCH (e31)-[:P3]->(note:E62)-[:P3_1]->({content: "sourceComment"}) \
			OPTIONAL MATCH (e31)-[:P3]->(repros:E62)-[:P3_1]->({content: "sourceRepros"}) \
			OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41), \
				(e78)-[:P52]->(:E40)-[:P131]->(inst:E82) \
			OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}) \
			RETURN e31.content AS eid, \
				type.content AS type, \
				title.content AS title, \
				primary.content AS primary, \
				aname.content AS author, \
				pname.content AS place, \
				date.content AS date, \
				{identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive, \
				{name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb} AS file, \
				plan3d.content AS plan3d, \
				note.value AS note, \
				repros.value AS repros, \
				tags, \
				count(ce33) AS commentLength';
		var params = {
			subprj: subprj === 'master' ? prj : subprj
		};
		
		//neo4j.cypher(q, params)
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#source.getAll'); return; }
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
			(e31)<-[:P94]-(e65:E65) \
			OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG) \
			WITH e31, type, title, file, e65, collect(tag.content) AS tags \
			OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"}) \
			OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82) \
			OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48) \
			OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61) \
			OPTIONAL MATCH (e31)-[:P48]->(archivenr:E42) \
			OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36) \
			OPTIONAL MATCH (e31)-[:P3]->(note:E62)-[:P3_1]->({content: "sourceComment"}) \
			OPTIONAL MATCH (e31)-[:P3]->(repros:E62)-[:P3_1]->({content: "sourceRepros"}) \
			OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41), \
				(e78)-[:P52]->(:E40)-[:P131]->(inst:E82) \
			OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}) \
			RETURN e31.content AS eid, \
				id(e31) AS nId, \
				type.content AS type, \
				title.content AS title, \
				primary.content AS primary, \
				aname.content AS author, \
				pname.content AS place, \
				date.content AS date, \
				{identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive, \
				{name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb, link: file.link} AS file, \
				plan3d.content AS plan3d, \
				note.value AS note, \
				repros.value AS repros, \
				tags, \
				count(ce33) AS commentLength';
		var params = {
			subprj: subprj === 'master' ? prj : subprj,
			sourceId: req.params.sourceId
		};

		//neo4j.cypher(q, params)
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#source.get'); return; }
				var results = neo4j.extractTransactionData(response.results[0]);
				if(results.length)
					res.json(results[0]);
				else
					res.json(null);
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},
	
	// TODO: #source create/insert
	create: function (req, res) {
		var prj = req.params.id;
		var tid = req.body.tid;

		console.log(req.body);
		console.log(req.file);

		// check for essential data
		// if missing then delete file and abort

		
		// process image
		var path = config.path.data + '/'  + prj + '/' + req.body.sourceType + 's/';
		var filename = req.file.filename;
		var filenameThumb = '_thumbs/t_' + filename.slice(0, filename.lastIndexOf(".")) + '.jpg';
		var filenamePreview = filename.slice(0, filename.lastIndexOf(".")) + '_1024.jpg';

		// move/rename file
		fs.renameAsync(req.file.destination + '/' + req.file.filename, path + req.file.filename)
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
				Promise.reject();
			})
			.then(function () {
				// neo4j query

				var q = 'MATCH (e55:E55:'+prj+' {content: {sourceType}}), \
						(esub:E7:'+prj+' {content: {subprj}}), \
						(sc:E55:'+prj+' {content: "sourceComment"}), \
						(sr:E55:'+prj+' {content: "sourceRepros"}), \
						(tprime:E55:'+prj+' {content: "primarySource"})';
				if(req.body.archive.length)
					q += ', (e78:E78:'+prj+' {content: {archive}})';

				q += 'CREATE (e31:E31:'+prj+' {content: {e31id}}), \
						(e31)-[:P1]->(e75:E75:'+prj+' {e75content}), \
						(e31)-[:P2]->(e55), \
						(e31)<-[:P15]-(esub), \
						(e31)-[:P102]->(e35:E35:'+prj+' {e35content}), \
						(e31)<-[:P94]-(e65:E65:'+prj+' {content: {e65id}}), \
						(e31)<-[:P128]-(e84:E84:'+prj+' {content: {e84id}})';

				if(req.body.sourceType == 'plan' || req.body.sourceType == 'picture') {
					q += ' CREATE (e31)-[:P70]->(e36:E36:'+prj+' {content: "e36_e31_"+{newFileName}})';
				}
				if(req.body.primary)
					q += ' CREATE (e31)-[:P2]->(tprime)';
				// if(req.body.author) {
				// 	q += 'MERGE (e82:E82:'+prj+' {content: {author}})<-[:P131]-(e21:E21:'+prj+') \
				// 		ON CREATE SET e21.content = "e21_'+ts+'_'+formData.author.replace(/ /g, "_")+'" \
				// 		CREATE (e65)-[:P14]->(e21)';
				// }

				q += ' FOREACH (tag in {tags} | \
							MERGE (t:TAG:'+prj+' {content: tag.text} )\
							MERGE (e31)-[:has_tag]->(t) )';

				var params = {
					subprj: req.params.subprj === 'master' ? prj : req.params.subprj,
					e31id: 'e31_' + filename,
					sourceType: req.body.sourceType,
					e75content: {
						content: filename,
						type: filename.split(".").pop(),
						path: prj + '/' + req.body.sourceType + 's/',
						thumb: filenameThumb,
						preview: filenamePreview,
						orginal: req.file.originalname
					},
					e35content: {
						content: 'e35_' + filename,
						value: req.body.title
					},
					e65id: 'e65_e31_' + filename,
					e84id: 'e84_e31_' + filename,
					e36id: 'e36_e31_' + filename,
					archive: req.body.archive,
					tags: req.body.tags || []
				};

				res.json(res.body);
			});
		
		
		
		return;
		
		var q = '';
		// q += 'MATCH (e55:E55:'+prj+' {content: {sourceType}})';
		// q += ', (esub:E7:'+prj+' {content: {subprj}})';
		// q += ', (sc:E55:'+prj+' {content: "sourceComment"})';
		// q += ', (sr:E55:'+prj+' {content: "sourceRepros"})';
		// if(formData.archive.length > 0) {
		// 	q += ', (e78:E78:'+prj+' {content: {archive}})';
		// }
		//
		// q += ' CREATE (e31:E31:'+prj+' {content: "e31_"+{newFileName}})-[:P102]->(e35:E35:'+prj+' {content: {title}})';
		//
		// q += ' CREATE (e31)-[:P1]->(e75:E75:'+prj+' {content: {newFileName}, type: {fileType}, thumb: "t_"+{pureNewFileName}+".jpg", original: {oldFileName}, path: {path}})';
		//
		// q += ' CREATE (e31)-[:P2]->(e55)';
		// q += ' CREATE (e31)<-[:P15]-(esub)';
		//
		// q += ' CREATE (e31)<-[:P94]-(e65:E65:'+prj+' {content: "e65_e31_"+{newFileName}})';
		//
		// q += ' CREATE (e31)<-[:P128]-(e84:E84:'+prj+' {content: "e84_e31_"+{newFileName}})';

		if(formData.sourceType == 'text') {
			q += ' CREATE (e31)-[:P70]->(e33:E33:'+prj+' {content: "e33_e31_"+{newFileName}})';
			q += ' MERGE (e56:E56:'+prj+' {content: {language}})';
			q += ' CREATE (e33)-[:P72]->(e56)';
			q += ' SET e75.contentDisplay = {pages}';
		}
		if(formData.sourceType == 'plan' || formData.sourceType == 'picture') {
			q += ' CREATE (e31)-[:P70]->(e36:E36:'+prj+' {content: "e36_e31_"+{newFileName}})';
			q += ' SET e75.contentDisplay = {pureNewFileName}+"_1024.jpg"';
			if(formData.primary) {
				q += ' MERGE (tprime:E55:'+prj+' {content: "primarySource"})';
				q += ' CREATE (e31)-[:P2]->(tprime)';
			}
		}
		if(formData.archive.length > 0) {
			q += ' CREATE (e78)-[:P46]->(e84)';
		}
		if(formData.archiveNr.length > 0) {
			q += ' MERGE (e42:E42:'+prj+' {content: {archiveNr}})';
			q += ' MERGE (e31)-[:P48]->(e42)';
		}
		if(formData.author.length > 0) {
			q += ' MERGE (e82:E82:'+prj+' {content: {author}})<-[:P131]-(e21:E21:'+prj+')';
			q += ' ON CREATE SET e21.content = "e21_'+ts+'_'+formData.author.replace(/ /g, "_")+'"';
			q += ' CREATE (e65)-[:P14]->(e21)';
		}
		if(formData.creationPlace.length > 0) {
			q += ' MERGE (e48:E48:'+prj+' {content: {creationPlace}})<-[:P87]-(e53:E53:'+prj+')';
			q += ' ON CREATE SET e53.content = "e53_'+ts+'_'+formData.creationPlace.replace(/ /g, "_")+'"';
			q += ' CREATE (e65)-[:P7]->(e53)';
		}
		if(formData.creationDate.length > 0) {
			q += ' MERGE (e61:E61:'+prj+' {content: {creationDate}})';
			q += ' CREATE (e61)<-[:P82]-(e52:E52:'+prj+' {content: "e52_e65_e31_"+{newFileName}})<-[:P4]-(e65)';
		}
		if(formData.comment.length > 0) {
			q += ' CREATE (e31)-[:P3]->(:E62:'+prj+' {content: "'+ts+'_e31_note_"+{newFileName}, value: {comment}})-[:P3_1]->(sc)';
		}
		if(formData.repros.length > 0) {
			q += ' CREATE (e31)-[:P3]->(:E62:'+prj+' {content: "'+ts+'e31_repros_"+{newFileName}, value: {repros}})-[:P3_1]->(sr)';
		}
		for(var i=0; i<formData.tags.length; i++) {
			q += ' MERGE (tag'+i+':TAG:'+prj+' {content: "'+formData.tags[i].text+'"})';
			q += ' MERGE (e31)-[:has_tag]->(tag'+i+')';
		}
		q += ' RETURN e31';
		console.log(q);

		formData.subprj = subprj === 'master' ? prj : subprj;
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
				if(response.exception) { utils.error.neo4j(res, response, '#source.getLinks'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}
	
};

module.exports = source; 
