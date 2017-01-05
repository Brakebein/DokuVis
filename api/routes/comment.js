var utils = require('../utils');
var config = require('../config');
var Promise = require('bluebird');
var neo4j = require('../neo4j-request');
var fs = require('fs-extra-promise');
var exec = require('child-process-promise').exec;

module.exports = {

	query: function (req, res) {
		var prj = req.params.id,
			sub = req.params.subprj;

		// target [:P15|P46|P9*1..9]

		var q = 'MATCH (tSs:E55:'+prj+' {content: "screenshot"}), (tUd:E55:'+prj+' {content: "userDrawing"}) \
			WITH tSs, tUd \
			MATCH (:E55:'+prj+' {content: "commentType"})<-[:P127]-(type:E55) \
			WHERE type.content <> "commentAnswer" \
			MATCH (type)<-[:P2]-(e33:E33), \
				(e33)-[:P3]->(text:E62), \
				(e33)<-[:P94]-(e65:E65), \
				(e65)-[:P14]->(user:E21)-[:P131]->(userName:E82), \
				(e65)-[:P4]->(:E52)-[:P82]->(date:E61), \
				(e33)-[:P129]->(targets)<-[:P15|P46*1..9]-(:E7 {content: {subproj}}) \
			OPTIONAL MATCH (e33)-[:P102]->(title:E35) \
			OPTIONAL MATCH (e33)-[:P67]->(refs) WHERE NOT (refs)-[:P2]->(tSs) \
			OPTIONAL MATCH (e33)<-[:P129]-(answer:E33)-[:P2]->(:E55 {content: "commentAnswer"}) \
			WITH e33, text, title, type, {id: user.content, name: userName.value } AS author, date.value AS date, collect(targets.content) AS targets, collect(refs.content) AS refs, count(answer) AS answerLength, tSs, tUd \
			OPTIONAL MATCH (e33)-[:P67]->(screen:E36)-[:P2]->(tSs), \
				(screen)-[:P1]->(screenFile:E75), \
				(screen)-[:P106]->(paint:E36)-[:P2]->(tUd), \
				(paint)-[:P1]->(paintFile:E75) \
			WITH e33, text, title, type, author, date, targets, refs, CASE WHEN count(screen) = 0 THEN [] ELSE collect({screenId: screen.content, cameraCenter: screen.cameraCenter, cameraFOV: screen.cameraFOV, cameraMatrix: screen.cameraMatrix, file: screenFile.content, path: screenFile.path, width: screenFile.width, height: screenFile.height, paint: {id: paint.content, file: paintFile.content, path: paintFile.path, width: paintFile.width, height: paintFile.height}}) END AS screenshots, screen, answerLength \
			OPTIONAL MATCH (screen)-[:P106]->(pin:E73) \
			RETURN e33.content AS eid, text.value AS text, title.value AS title, author, date, type.content AS type, targets AS targets, refs AS refs, screenshots, collect(DISTINCT pin) AS pins, answerLength';

		var params = {
			subproj: sub === 'master' ? prj : sub
		};

		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#comment.query'); return; }
				var results = neo4j.extractTransactionData(response.results[0]);
				//res.json(neo4j.removeEmptyArrays(results, 'answers', 'id'));
				res.json(results);
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},

	queryTarget: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (target:'+prj+' {content: {id}})<-[:P129]-(ce33:E33)-[:P2]->(type)-[:P127]->(:E55 {content: "commentType"}), \
				(ce33)-[:P3]->(ce62:E62), \
				(ce33)<-[:P94]-(ce65:E65)-[:P14]->(:E21)-[:P131]->(ce82:E82), \
				(ce65)-[:P4]->(:E52)-[:P82]->(ce61:E61) \
			OPTIONAL MATCH (ce33)<-[:P129]-(ae33:E33)-[:P2]->(atype), \
				(ae33)-[:P3]->(ae62:E62), \
				(ae33)<-[:P94]-(ae65:E65)-[:P14]->(:E21)-[:P131]->(ae82:E82), \
				(ae65)-[:P4]->(:E52)-[:P82]->(ae61:E61) \
			RETURN ce33.content AS id, ce62.value AS value, ce61.value AS date, ce82.value AS author, type.content AS type, \
				collect({ id: ae33.content, value: ae62.value, date: ae61.value, author: ae82.value, type: atype.content }) AS answers';
		var params = {
			id: req.params.targetId
		};

		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#comment.get'); return; }
				var results = neo4j.extractTransactionData(response.results[0]);
				res.json(neo4j.removeEmptyArrays(results, 'answers', 'id'));
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},
	
	create: function (req, res) {
		var prj = req.params.id;

		// set type
		var cType = '';
		switch(req.body.type) {
			case 'source': cType = 'commentSource'; break;
			case 'answer': cType = 'commentAnswer'; break;
			case 'model': cType = 'commentModel'; break;
			case 'task': cType = 'commentTask'; break;
			default: cType = 'commentGeneral';
		}

		var screens = [], objIds = [];
		var promises = [], p;
		var path = config.path.data + '/' + prj + '/screenshots/';

		// check, if there is at least one target
		var targets = req.body.targets || [];
		if(!Array.isArray(targets)) targets = [targets];
		if(!targets.length) { utils.abort.missingData(res, 'body.targets'); return; }

		req.body.refs = req.body.refs || [];
		req.body.screenshots = req.body.screenshots || [];

		// prepare screenshots and process image data
		for(var i=0; i<req.body.screenshots.length; i++) {
			(function (screen) {
				var sFilename = req.body.tid + '_screenshot_' + i + '.jpg';
				var pFilename = req.body.tid + '_paint_' + i + '.png';

				screen.sData = screen.sData.replace(/^data:image\/\w+;base64,/, "");
				screen.pData = screen.pData.replace(/^data:image\/\w+;base64,/, "");

				p =	fs.writeFileAsync(path + sFilename, new Buffer(screen.sData, 'base64')).then(function () {
					return fs.writeFile(path + pFilename, new Buffer(screen.pData, 'base64'));
				}).catch(function (err) {
					//if (err) utils.error.server(res, err, '#writeFile screenshot.jpg or paint.png');
					return Promise.reject(err);
				}).then(function () {
					return exec(config.exec.ImagickConvert + " " + path + sFilename + " -resize \"160x90^\" -gravity center -extent 160x90 " + path + "_thumbs/t_" + sFilename);
				}).catch(function (err) {
					//if (err) utils.error.server(res, err, '#ImagickConvert screenshot.jpg or paint.png');
					return Promise.reject(err);
				});

				promises.push(p);

				var screenMap = {
					screen36content: 'e36_' + sFilename,
					cameraCenter: screen.cameraCenter,
					cameraFOV: screen.cameraFOV,
					cameraMatrix: screen.cameraMatrix,
					screen75content: sFilename,
					paintId: 'e36_' + pFilename,
					paint75content: pFilename,
					path: prj + '/screenshots/',
					width: screen.width,
					height: screen.height
				};

				if(cType === 'commentModel') {
					var pins = [];
					for (var j = 0; j < targets.length; j++) {
						objIds.push(targets[j].eid);
						pins.push({
							id: 'e73_' + screenMap.screen36content + '_pin_' + j,
							targetId: targets[j].eid,
							screenIndex: i,
							pinMatrix: targets[j].pinMatrix
						});
					}
					screenMap.pins = pins;
				}

				screens.push(screenMap);

			})(req.body.screenshots[i]);
		}

		// zusätzliche Aufbereitung der Daten für 'commentModel'
		if(cType === 'commentModel') {
			var statement = 'MATCH (obj:'+prj+') WHERE obj.content IN {objIds} \
				MATCH (obj)<-[:P106]-(:E36)-[:P138]->(target:E22) \
				RETURN target.content AS target';

			p = neo4j.transaction(statement, { objIds: objIds })
				.then(function (response) {
					var res = neo4j.extractTransactionData(response.results[0]);
					targets = [];
					for(var i=0; i<res.length; i++) {
						console.debug(res[i].target);
						targets.push(res[i].target);
					}
				}).catch(function(err) {
					return Promise.reject(err);
				});
			promises.push(p);
		}

		// refIds rausfiltern
		var refs = [];
		for(var j=0; j<req.body.refs.length; j++) {
			refs.push(req.body.refs[j].eid);
		}
		req.body.refs = refs;

		// fahre erst fort, wenn alle Aufgaben oben fertig sind
		Promise.all(promises).catch(function (err) {
			//if (err) utils.error.server(res, err, '#Error writeFile or #ImagickConvert screenshot or paint');
			return Promise.reject(err);
		}).then(function () {

			var q = 'MATCH (e21:E21:'+prj+' {content: {user}})-[:P131]->(userName:E82), \
				(type:E55:'+prj+' {content: {type}}) \
				WITH e21, userName, type \
				OPTIONAL MATCH (target:'+prj+') WHERE target.content IN {targets} \
				WITH e21, userName, type, collect(DISTINCT target) AS targets \
				OPTIONAL MATCH (ref:'+prj+') WHERE ref.content IN {refs} \
				WITH e21, userName, type, targets, collect(DISTINCT ref) AS refs \
				CREATE (e33:E33:'+prj+' {content: {e33id}})-[:P3]->(e62:E62:'+prj+' {e62content}), \
					(e65:E65:'+prj+' {content: "e65_" + {e33id}})-[:P4]->(:E52:'+prj+' {content: "e52_e65_" + {e33id}})-[:P82]->(e61:E61:'+prj+' {value: {date}}), \
					(e33)-[:P2]->(type), ';
			
			if(req.body.title)
				q += '(e33)-[:P102]->(:E35:'+prj+' {e35content}), ';
			
			  q += '(e65)-[:P94]->(e33), \
					(e65)-[:P14]->(e21) \
				FOREACH (t IN targets | CREATE (e33)-[:P129]->(t)) \
				FOREACH (r IN refs | CREATE (e33)-[:P67]->(r)) ';

			if(cType === 'commentModel')
				q += 'WITH e33, e62, e61, userName, type \
					MATCH (tSs:E55:'+prj+' {content: "screenshot"}), (tUd:E55:'+prj+' {content: "userDrawing"}) \
					FOREACH (s IN {screenshots} | \
						CREATE (e33)-[:P67]->(screen:E36:'+prj+' {content: s.screen36content, cameraCenter: s.cameraCenter, cameraFOV: s.cameraFOV, cameraMatrix: s.cameraMatrix})-[:P2]->(tSs), \
							(screen)-[:P1]->(:E75:'+prj+' {content: s.screen75content, path: s.path, width: s.width, height: s.height}), \
							(screen)-[:P106]->(draw:E36:'+prj+' {content: s.paintId})-[:P2]->(tUd), \
							(draw)-[:P1]->(:E75:'+prj+' {content: s.paint75content, path: s.path, width: s.width, height: s.height}) \
						FOREACH (p in s.pins | \
							CREATE (screen)-[:P106]->(:E73:'+prj+' {content: p.id, targetId: p.targetId, screenIndex: p.screenIndex, pinMatrix: p.pinMatrix}) ) ) ';

			q += 'RETURN e33.content AS id, e62.value AS value, e61.value AS date, userName.value AS author, type.content AS type';

			var params = {
				targets: targets,
				user: 'e21_' + req.headers['x-key'],
				type: cType,
				e33id: 'e33_' + req.body.tid + '_comment',
				e62content: {
					content: 'e62_e33_' + req.body.tid + '_comment',
					value: req.body.text
				},
				e35content: {
					content: 'e35_e33_' + req.body.tid + '_comment',
					value: req.body.title
				},
				date: req.body.date,
				refs: req.body.refs || [],
				screenshots: screens || []
			};
			
			//console.debug(q, params);
		
			//res.json({statement: q, parameters: params, body: req.body});
			return neo4j.transaction(q, params);
		}).then(function(response) {
			if(response.errors.length) { utils.error.neo4j(res, response, '#comment.create'); return; }
			res.json(neo4j.extractTransactionData(response.results[0])[0]);
			//res.json(response);
		}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}

};
