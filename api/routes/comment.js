var utils = require('../utils');
var config = require('../config');
var Promise = require('bluebird');
var neo4j = require('../neo4j-request');
var fs = require('fs-extra-promise');
var exec = require('child-process-promise').exec;

var comment = {
	
	create: function(req, res) {
		var prj = req.params.id;
		
		var cType = '';
		switch(req.body.type) {
			case 'source': cType = 'commentSource'; break;
			case 'answer': cType = 'commentAnswer'; break;
			case 'model': cType = 'commentModel'; break;
			case 'task': cType = 'commentTask'; break;
			default: cType = 'commentGeneral';
		}

		var screens = [];
		var promises = [];
		var path = config.paths.data + '/' + req.body.path;

		for(var i=0; i<req.body.screenshots.length; i++) {
			(function (screen) {
				var sFilename = req.body.id + '_screenshot_' + i + '.jpg';
				var pFilename = req.body.id + '_paint_' + i + '.png';

				screen.sData = screen.sData.replace(/^data:image\/\w+;base64,/, "");
				screen.pData = screen.pData.replace(/^data:image\/\w+;base64,/, "");

				promises.push(
					fs.writeFileAsync(path + sFilename, new Buffer(screen.sData, 'base64')).then(function () {
						return fs.writeFile(path + pFilename, new Buffer(screen.pData, 'base64'));
					}).catch(function (err) {
						//if (err) utils.error.server(res, err, '#writeFile screenshot.jpg or paint.png');
						return Promise.reject(err);
					}).then(function () {
						return exec(config.exec.ImagickConvert + " " + path + sFilename + " -resize \"160x90^\" -gravity center -extent 160x90 " + path + "_thumbs/t_" + sFilename);
					}).catch(function (err) {
						//if (err) utils.error.server(res, err, '#ImagickConvert screenshot.jpg or paint.png');
						return Promise.reject(err);
					})
				);

				screens.push({
					screen36content: {
						content: 'e36_' + sFilename,
						cameraCenter: screen.cameraCenter,
						cameraFOV: screen.cameraFOV,
						cameraMatrix: screen.cameraCenter
					},
					screen75content: {
						content: sFilename,
						path: screen.path,
						width: screen.width,
						height: screen.height
					},
					paintId: 'e36_' + pFilename,
					paint75content: {
						content: pFilename,
						path: screen.path,
						width: screen.width,
						height: screen.height
					}
				});

			})(req.body.screenshots[i]);
		}

		// TODO: e22 ids rausfinden und pins/pinMatrix einbinden

		Promise.all(promises).catch(function (err) {
			if (err) utils.error.server(res, err, '#Error writeFile or #ImagickConvert screenshot or paint');
			return Promise.reject();
		}).then(function () {

			var q = 'MATCH (e21:E21:'+prj+' {content: {user}})-[:P131]->(userName:E82), \
				(type:E55:'+prj+' {content: "commentModel"}) \
				WITH e21, userName, type \
				OPTIONAL MATCH (target:'+prj+') WHERE target.content IN {targets} \
				WITH e21, userName, type, collect(DISTINCT target) AS targets \
				MATCH (ref:'+prj+') WHERE ref.content IN {refs} \
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
						CREATE (e33)-[:P67]->(screen:E36:'+prj+' {s.screen36content})-[:P2]->(tSs), \
							(screen)-[:P1]->(:E75:'+prj+' {s.screen75content}), \
							(screen)-[:P106]->(draw:E36:'+prj+' {content: {s.paintId}})-[:P2]->(tUd), \
							(draw)-[:P1]->(:E75:'+prj+' {s.paint75content}) ) ';

			q += 'RETURN e33.content AS id, e62.value AS value, e61.value AS date, userName.value AS author, type.content AS type';

			var params = {
				targets: req.body.targets || [],
				user: 'e21_' + req.body.user,
				type: cType,
				e33id: 'e33_' + req.body.id + '_comment',
				e62content: {
					content: 'e62_e33_' + req.body.id + '_comment',
					value: req.body.text
				},
				e35content: {
					content: 'e35_e33_' + req.body.id + '_comment',
					value: req.body.title
				},
				date: req.body.date,
				refs: req.body.refs || [],
				screenshots: screens || []
			};
		
			res.json({statement: q, parameters: params, body: req.body});
			//return neo4j.transaction([{statement: q, parameters: params}]);
		}).then(function(response) {
			//if(response.exception) { utils.error.neo4j(res, response, '#comment.create'); return; }
			//res.json(neo4j.extractTransactionData(response.results[0]));
			//res.json(response);
		}).catch(function(err) {
			//utils.error.neo4j(res, err, '#cypher');
		});
	},
	
	get: function(req, res) {
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

		neo4j.transaction([{statement: q, parameters: params}])
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#comment.get'); return; }
				var results = neo4j.extractTransactionData(response.results[0]);
				res.json(neo4j.removeEmptyArrays(results, 'answers', 'id'));
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};

module.exports = comment;