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
		var prj = req.params.prj;
		var subprj = req.params.subprj;

		var q = 'MATCH (e31:E31:'+prj+')-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"}), \
			(e31)<-[:P15]-(:E7 {content: $subprj}), \
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
			OPTIONAL MATCH (e31)<-[:P31]-(e11:E11)-[:P14]->(mUser:E21)-[:P131]->(mUserName:E82),\
				(e11)-[:P4]->(:E52)-[:P82]->(mDate:E61)\
			RETURN e31.content AS id, \
				type.content AS type, \
				title.value AS title, \
				primary IS NOT NULL AS primary, \
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
				{id: user.content, name: userName.value, date: upDate.value} AS created,\
				{id: mUser.content, name: mUserName.value, date: mDate.value} AS modified';

		var params = {
			subprj: subprj === 'master' ? prj : subprj
		};

		neo4j.readTransaction(q, params)
			.then(function (results) {
				res.json(results);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#source.query');
			});
	},

	get: function (req, res) {
		var prj = req.params.prj;
		var subprj = req.params.subprj;

		var q = 'MATCH (e31:E31:'+prj+' {content: $id})-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"}), \
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
			OPTIONAL MATCH (e31)<-[:P31]-(e11:E11)-[:P14]->(mUser:E21)-[:P131]->(mUserName:E82),\
				(e11)-[:P4]->(:E52)-[:P82]->(mDate:E61)\
			RETURN e31.content AS id, \
				id(e31) AS nId, \
				type.content AS type, \
				title.value AS title, \
				primary IS NOT NULL AS primary, \
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
				{id: user.content, name: userName.value, date: upDate.value} AS created,\
				{id: mUser.content, name: mUserName.value, date: mDate.value} AS modified';

		var params = {
			subprj: subprj === 'master' ? prj : subprj,
			id: req.params.id
		};

		neo4j.readTransaction(q, params)
			.then(function (results) {
				if (results.length)
					res.json(results[0]);
				else
					res.json(null);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#source.get')
			});
	},

	create: function (req, res) {

		utils.log.fileupload(req.file);

		var prj = req.params.prj;
		var id = shortid.generate();

		// check for essential data
		// if missing then delete file and abort
		if (!req.body.sourceType || !req.body.date || !req.body.title) {
			utils.abort.missingData(res, '#source.create sourceType|date|title');
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

				// match types, project, and user
				var q = 'MATCH (type:E55:'+prj+' {content: $sourceType}), \
						(sub:E7:'+prj+' {content: $subprj}), \
						(user:E21:'+prj+' {content: $user})-[:P131]->(userName:E82), \
						(su:E55:'+prj+' {content: "sourceUpload"}), \
						(sc:E55:'+prj+' {content: "sourceComment"}), \
						(sr:E55:'+prj+' {content: "sourceRepros"}), \
						(tprime:E55:'+prj+' {content: "primarySource"})';
				if (req.body.archive) {
					q += ', (e78:E78:'+prj+' {content: $archive})-[:P1]->(coll:E41), \
						(e78)-[:P52]->(:E40)-[:P131]->(inst:E82)';
				}

				// create essential nodes
				q += ' CREATE (e31:E31:'+prj+' {content: $e31id}), \
						(e31)-[:P1]->(file:E75:'+prj+' $e75file), \
						(e31)-[:P2]->(type), \
						(e31)<-[:P15]-(sub), \
						(e31)-[:P102]->(title:E35:'+prj+' $e35title), \
						(e31)<-[:P94]-(e65:E65:'+prj+' {content: $e65id}), \
						(e31)<-[:P128]-(e84:E84:'+prj+' {content: $e84id})';

				if (req.body.sourceType === 'plan' || req.body.sourceType === 'picture') {
					q += ' CREATE (e31)-[:P70]->(e36:E36:'+prj+' {content: $e36id})';
				}
				if (req.body.sourceType === 'text') {
					q += ' CREATE (e31)-[:P70]->(e33:E33:'+prj+' {content: $e33id}) \
						MERGE (e56:E56:'+prj+' {content: $language}) \
						CREATE (e33)-[:P72]->(e56)';
				}
				// primary
				if (req.body.primary === 'true')
					q += ' CREATE (e31)-[:P2]->(tprime)';
				// author
				if (req.body.author) {
					q += 'MERGE (aname:E82:'+prj+' {value: $author})<-[:P131]-(e21:E21:'+prj+') \
						ON CREATE SET e21.content = $e21id, aname.content = $e82id \
						CREATE (e65)-[:P14]->(e21)';
				}
				// place
				if (req.body.creationPlace) {
					q += ' MERGE (pname:E48:'+prj+' {value: $place})<-[:P87]-(e53:E53:'+prj+') \
						ON CREATE SET e53.content = $e53id, pname.content = $e48id \
						CREATE (e65)-[:P7]->(e53)';
				}
				// dating
				if (req.body.creationDate) {
					q += ' MERGE (date:E61:'+prj+' {value: $e61value}) \
						CREATE (date)<-[:P82]-(e52:E52:'+prj+' {content: $e52id})<-[:P4]-(e65)';
				}
				// note/misc
				if (req.body.note) {
					q += ' CREATE (e31)-[:P3]->(note:E62:'+prj+' $e62note)-[:P3_1]->(sc)';
				}
				// repros/reference
				if (req.body.repros) {
					q += ' CREATE (e31)-[:P3]->(repros:E62:'+prj+' $e62repros)-[:P3_1]->(sr)';
				}
				// archive
				if (req.body.archive) {
					q += ' CREATE (e78)-[:P46]->(e84)';
				}
				if (req.body.archiveNr) {
					q += ' MERGE (archivenr:E42:'+prj+' {value: $archiveNr}) \
						ON CREATE SET archivenr.content = $e42id \
						CREATE (e84)-[:P48]->(archivenr)';
				}

				// user/timestamp
				q += ' CREATE (e31)<-[:P15]-(si7:E7:'+prj+' {content: $upload7})-[:P2]->(su), \
						(si7)-[:P14]->(user), \
						(si7)-[:P4]->(:E52:'+prj+' {content: $upload52})-[:P82]->(upDate:E61:'+prj+' {value: $date})';
				// tags
				q += ' FOREACH (tag in $tags | \
							MERGE (t:TAG:'+prj+' {content: tag}) \
							MERGE (e31)-[:has_tag]->(t) )';

				q += ' RETURN e31.content AS id, \
					id(e31) AS nId, \
					type.content AS type, \
					title.value AS title, \
					file AS file, \
					toBoolean($primary) AS primary,';
					if (req.body.author) q += ' aname.value AS author,';
					if (req.body.creationPlace) q += ' pname.value AS place,';
					if (req.body.creationDate) q += ' date.value AS date,';
					if (req.body.note) q += ' note.value AS note,';
					if (req.body.repros) q += ' repros.value AS repros,';
					if (req.body.archive && req.body.archiveNr) q += ' {identifier: archivenr.value, collection: coll.value, institution: inst.value, institutionAbbr: inst.abbr} AS archive,';
					if (req.body.archive && !req.body.archiveNr) q += ' {identifier: null, collection: coll.value, institution: inst.value, institutionAbbr: inst.abbr} AS archive,';
					if (!req.body.archive && req.body.archiveNr) q += ' {identifier: archivenr.value, collection: null, institution: null, institutionAbbr: null} AS archive,';
				q += '$tags AS tags, \
					{id: user.content, name: userName.value, date: upDate.value} AS user';

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
					primary: req.body.primary === 'true',
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

	update: function (req, res) {
		var prj = req.params.prj;
		var mId = shortid.generate();

		var q = 'MATCH (st:E55:'+prj+' {content: "sourceType"})<-[:P127]-(type:E55 {content: $type}),\
				(sc:E55:'+prj+' {content: "sourceComment"}),\
				(sr:E55:'+prj+' {content: "sourceRepros"}),\
				(sp:E55:'+prj+' {content: "primarySource"}),\
				(mUser:E21:'+prj+' {content: $user})-[:P131]->(mUserName:E82)\
			WITH st, sc, sr, sp, type, mUser, mUserName\
			MATCH (e31:E31:'+prj+' {content: $id})-[rtype:P2]->(:E55)-[:P127]->(st),\
				(e31)-[:P102]->(title:E35),\
				(e31)-[:P1]->(file:E75),\
				(e31)<-[:P94]-(e65:E65),\
				(e31)<-[:P128]-(e84:E84)\
			OPTIONAL MATCH (e31)-[rtag:has_tag]->(:TAG)\
			WITH sc, sr, sp, type, mUser, mUserName, e31, title, file, e65, e84, rtype, collect(rtag) AS rtags';

		q += ' OPTIONAL MATCH (e65)-[rauthor:P14]->(:E21)\
			OPTIONAL MATCH (e65)-[rplace:P7]->(:E53)\
			OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(dateOld:E61)\
			OPTIONAL MATCH (dateOld)<-[rdate:P82]-()\
			OPTIONAL MATCH (e31)-[rprimary:P2]->(sp)\
			OPTIONAL MATCH (e84)<-[rcoll:P46]-(:E78)\
			OPTIONAL MATCH (e31)<-[:P31]-(:E11)-[rmp14:P14]->(:E21)\
			OPTIONAL MATCH (e84)-[ranr:P48]->(archivenrOld:E42)\
			OPTIONAL MATCH (archivenrOld)<-[ranrs:P48]-()';

		q += ' DELETE rtype, rauthor, rplace, rprimary, rcoll, rmp14, rdate, ranr\
			FOREACH (rt in rtags | DELETE rt)';

		q += ' WITH sc, sr, sp, type, mUser, mUserName, e31, title, file, e65, e84, dateOld, count(rdate) AS rdcount, archivenrOld, count(ranrs) AS racount';

		q += ' OPTIONAL MATCH (coll:E41:'+prj+' {value: $coll})<-[:P1]-(e78:E78)-[:P52]->(:E40)-[:P131]->(inst:E82 {value: $inst})';

		if (!req.body.note)
			q += ' OPTIONAL MATCH (e31)-[:P3]->(noteOld:E62)-[:P3_1]->(sc)';
		if (!req.body.repros)
			q += ' OPTIONAL MATCH (e31)-[:P3]->(reprosOld:E62)-[:P3_1]->(sr)';

		q += ' OPTIONAL MATCH (e31)<-[:P15]-(up:E7)-[:P2]->(:E55 {content: "sourceUpload"}),\
				(up)-[:P14]->(cUser:E21)-[:P131]->(cUserName:E82),\
				(up)-[:P4]->(:E52)-[:P82]->(cDate:E61)';

		q += ' CREATE (e31)-[:P2]->(type)';

		q += ' MERGE (e31)<-[:P31]-(me11:E11:'+prj+')-[:P4]->(me52:E52:'+prj+')-[:P82]->(mDate:E61:'+prj+')\
				ON CREATE SET me11.content = $me11, me52.content = $me52, mDate.value = $mDate\
				ON MATCH SET mDate.value = $mDate\
			CREATE (me11)-[:P14]->(mUser)';

		if (req.body.primary)
			q += ' CREATE (e31)-[primary:P2]->(sp)';
		if (req.body.author)
			q += ' MERGE (aname:E82:'+prj+' {value: $author})<-[:P131]-(e21:E21:'+prj+')\
					ON CREATE SET e21.content = $e21id, aname.content = $e82id\
				CREATE (e65)-[:P14]->(e21)';
		if (req.body.date)
			q += ' MERGE (date:E61:'+prj+' {value: $date})\
				MERGE (e65)-[:P4]->(e52:E52:'+prj+')\
					ON CREATE SET e52.content = $dateId\
				CREATE (e52)-[:P82]->(date)';
		if (req.body.place)
			q += ' MERGE (pname:E48:'+prj+' {value: $place})<-[:P87]-(e53:E53:'+prj+')\
					ON CREATE SET e53.content = $placeId, pname.content = $placeNameId\
				CREATE (e65)-[:P7]->(e53)';
		if (req.body.note)
			q+= ' MERGE (e31)-[:P3]->(note:E62:'+prj+')-[:P3_1]->(sc)\
					ON CREATE SET note.content = $noteId, note.value = $note\
					ON MATCH SET note.value = $note';
		if (req.body.repros)
			q += ' MERGE (e31)-[:P3]->(repros:E62:'+prj+')-[:P3_1]->(sr)\
					ON CREATE SET repros.content = $reprosId, repros.value = $repros\
					ON MATCH SET repros.value = $repros';
		if (req.body.archive.collection)
			q += ' CREATE (e84)<-[:P46]-(e78)';
		if (req.body.archive.identifier)
			q += ' MERGE (archivenr:E42:'+prj+' {value: $archiveNr})\
					ON CREATE SET archivenr.content = $archiveNrId\
				CREATE (e84)-[:P48]->(archivenr)';

		q += ' SET title.value = $title';

		q += ' FOREACH (ignoreMe IN CASE WHEN archivenrOld.value <> $archiveNr AND racount < 2 THEN [archivenrOld] ELSE [] END |\
				DETACH DELETE archivenrOld )\
			FOREACH (ignoreMe IN CASE WHEN dateOld.value <> $date AND rdcount < 2 THEN [dateOld] ELSE [] END |\
				DETACH DELETE dateOld )';

		if (!req.body.note)
			q += ' DETACH DELETE noteOld';
		if (!req.body.repros)
			q += ' DETACH DELETE reprosOld';

		q += ' FOREACH (tag in $tags | \
				MERGE (t:TAG:'+prj+' {content: tag}) \
				CREATE (e31)-[:has_tag]->(t) )';

		q += ' RETURN e31.content AS id,\
			id(e31) AS nId,\
			type.content AS type,\
			title.value AS title,\
			toBoolean($primary) AS primary,\
			' + (req.body.author ? 'aname.value' : 'NULL') + ' AS author,\
			' + (req.body.place ? 'pname.value' : 'NULL') + ' AS place,\
			' + (req.body.date ? 'date.value' : 'NULL') + ' AS date,\
			{identifier: ' + (req.body.archive.identifier ? 'archivenr.value' : 'NULL') + ', collection: coll.value, institution: inst.value, institutionAbbr: inst.abbr} AS archive,\
			file AS file,\
			' + (req.body.note ? 'note.value' : 'NULL') + ' AS note,\
			' + (req.body.repros ? 'repros.value' : 'NULL') + ' AS repros,\
			$tags AS tags,\
			{id: cUser.content, name: cUserName.value, date: cDate.value} AS created,\
			{id: mUser.content, name: mUserName.value, date: mDate.value} AS modified';

		var params = {
			user: req.headers['x-key'],
			id: req.params.id,
			type: req.body.type,
			title: req.body.title,
			author: req.body.author,
			date: req.body.date,
			dateId: 'e52_e65_' + req.params.id,
			place: req.body.place,
			placeId: 'e53_' + mId + '_' + utils.replace(req.body.place || ''),
			placeNameId: 'e48_' + mId + '_' + utils.replace(req.body.place || ''),
			note: req.body.note,
			noteId: 'note_' + req.params.id,
			repros: req.body.repros,
			reprosId: 'repros_' + req.params.id,
			coll: req.body.archive.collection,
			inst: req.body.archive.institution,
			archiveNr: req.body.archive.identifier,
			archiveNrId: 'e42_e84_' + req.params.id,
			primary: req.body.primary,
			tags: req.body.tags,
			mDate: req.body.modificationDate,
			me11: 'e11_m_' + mId,
			me52: 'e52_m_' + mId
		};

		neo4j.writeTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#source.update');
			});
	},

	delete: function (req, res) {
		var prj = req.params.prj;

		// TODO: handle spazialized plan/foto and comments

		var q = 'MATCH (e31:E31:'+prj+' {content: $id})-[:P70]->(lv), \
				(e31)-[:P102]->(title:E35), \
				(e31)-[:P1]->(file:E75), \
				(e31)<-[:P94]-(e65:E65), \
				(e31)<-[:P128]-(e84:E84) \
			OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82) \
			OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48) \
			OPTIONAL MATCH (e65)-[:P4]->(e52:E52)-[:P82]->(date:E61) \
			OPTIONAL MATCH (date)<-[rdate:P82]-() \
			OPTIONAL MATCH (e84)-[:P48]->(archivenr:E42) \
			OPTIONAL MATCH (archivenr)<-[ranr:P48]-()\
			OPTIONAL MATCH (e31)-[:P3]->(note:E62)-[:P3_1]->({content: "sourceComment"}) \
			OPTIONAL MATCH (e31)-[:P3]->(repros:E62)-[:P3_1]->({content: "sourceRepros"}) \
			OPTIONAL MATCH (e84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41), \
				(e78)-[:P52]->(:E40)-[:P131]->(inst:E82) \
			OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}) \
			OPTIONAL MATCH (e31)<-[:P15]-(upe7:E7)-[:P2]->(:E55 {content: "sourceUpload"}), \
				(upe7)-[:P4]->(upe52:E52)-[:P82]->(upDate:E61) \
			OPTIONAL MATCH (e31)<-[:P31]-(me11:E11)-[:P4]->(me52:E52)-[:P82]->(mDate:E61)\
			\
			DETACH DELETE e31, lv, title, note, repros, e65, e84, e52, \
				upe7, upe52, upDate, me11, me52, mDate \
			\
			WITH file, file.path AS path, date, count(rdate) AS rdcount, archivenr, count(ranr) AS racount\
			FOREACH (ignoreMe IN CASE WHEN rdcount < 2 THEN [date] ELSE [] END |\
				DETACH DELETE date )\
			FOREACH (ignoreMe IN CASE WHEN racount < 2 THEN [archivenr] ELSE [] END |\
				DETACH DELETE archivenr )\
			DETACH DELETE file\
			\
			RETURN path';

		var params = {
			id: req.params.id
		};

		var path = config.path.data + '/';

		neo4j.writeTransaction(q, params)
			.catch(function (err) {
				utils.error.neo4j(res, err, '#source.delete');
				return Promise.reject();
			})
			.then(function (results) {
				res.json({ message: 'Source with ID ' + req.params.id + ' deleted' });

				// remove directory
				path += results[0].path;
				return fs.existsAsync(path);
			})
			.then(function (exists) {
				if (exists) {
					console.warn('Unlink directory:', path);
					return fs.removeAsync(path);
				}
				else
					console.warn('Directory does not exist:', path);
			})
			.catch(function (err) {
				if (err) console.error('Unlink directory failed:', path, err);
			});
	},

	updateFile: function (req, res) {

		utils.log.fileupload(req.file);

		var prj = req.params.prj;
		var id = shortid.generate();

		// check for essential data
		// if missing then delete file and abort
		if (!req.body.date) {
			utils.abort.missingData(res, '#source.updateFile date');
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
		var path = config.path.data + '/';
		var filename = id + '_' + utils.replace(req.file.originalname);
		var filenameThumb = filename.slice(0, filename.lastIndexOf(".")) + '_thumb.jpg';
		var filenamePreview = filename.slice(0, filename.lastIndexOf(".")) + '_preview.jpg';
		var filenameTexture = filename.slice(0, filename.lastIndexOf(".")) + '_tex.jpg';
		var filenameTexturePreview = filename.slice(0, filename.lastIndexOf(".")) + '_tex_preview.jpg';

		var imgWidth, imgHeight;
		var fileOld;

		var filequery = 'MATCH (e31:E31:' + prj + ' {content: $id})-[:P1]->(file:E75) RETURN file';

		neo4j.readTransaction(filequery, {id: req.params.id})
			.then(function (results) {
				if (!results[0] && !results[0].file) return Promise.reject('No results');
				fileOld = results[0].file;
				path += fileOld.path;
				return Promise.resolve();
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#source.updateFile getfile');
				return Promise.reject();
			})
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
				if (err) utils.error.server(res, err, '#source.updateFile fs/exec @ ' + path + filename);
				return Promise.reject();
			})
			.then(function () {
				// neo4j query
				var updatequery = 'MATCH (e31:E31:' + prj + ' {content: $id})-[:P1]->(file:E75)\
					SET file = $file\
					RETURN file';

				var params = {
					id: req.params.id,
					file: {
						content: filename,
						original: req.file.originalname,
						path: fileOld.path,
						width: imgWidth,
						height: imgHeight,
						preview: filenamePreview,
						thumb: filenameThumb,
						texture: filenameTexture,
						texturePreview: filenameTexturePreview,
						type: filename.split(".").pop().toLowerCase()
					}
				};

				return neo4j.writeTransaction(updatequery, params);
			})
			.then(function (results) {
				if (!results[0] && !results[0].file) return Promise.reject('No updates');
				res.json(results[0]);

				// remove old files
				return Promise.resolve([fileOld.content, fileOld.thumb, fileOld.preview, fileOld.texture, fileOld.texturePreview]);
			})
			.catch(function (err) {
				if (err) utils.error.neo4j(res, err, '#source.updateFile setfile');

				// remove generated files
				return Promise.resolve([filename, filenameThumb, filenamePreview, filenameTexture, filenameTexturePreview]);
			})
			.then(function (filenames) {
				Promise.each(filenames, function (fname) {
					fs.existsAsync(path + fname)
						.then(function (exists) {
							if (exists) fs.unlinkAsync(path + fname);
						});
				});
			})
			.then(function () {
				fs.existsAsync(req.file.path)
					.then(function (exists) {
						if (exists) fs.unlinkAsync(req.file.path);
					});
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
