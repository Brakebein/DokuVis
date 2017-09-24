const shortid = require('shortid');
const utils = require('../utils');
const neo4j = require('../neo4j-request');

module.exports = {

	query: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (master:E7:'+prj+' {content: $master})-[:P9]->(sub:E7)-[:P2]->(:E55 {content: "subproject"}), \
			(sub)-[:P102]->(title:E35) \
			OPTIONAL MATCH (sub)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "projDesc"}) \
			RETURN sub.content AS id, title.value AS name, desc.value AS description';

		var params = {
			master: prj
		};

		neo4j.readTransaction(q, params)
			.then(function(results) {
				res.json(results);
			})
			.catch(function(err) {
				utils.error.neo4j(res, err, '#subproject.query');
			});
	},

	get: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (sub:E7:'+prj+' {content: $subId})-[:P2]->(:E55 {content: "subproject"}), \
			(sub)-[:P102]->(title:E35) \
			OPTIONAL MATCH (sub)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "projDesc"}) \
			RETURN sub.content AS id, title.value AS name, desc.value AS description';

		var params = {
			subId: req.params.subId
		};

		neo4j.readTransaction(q, params)
			.then(function(results) {
				res.json(results[0]);
			})
			.catch(function(err) {
				utils.error.neo4j(res, err, '#subproject.get');
			});
	},

	create: function (req, res) {
		if(!req.body.name) { utils.abort.missingData(res, 'body.name'); return; }

		var prj = req.params.id;
		var tid = shortid.generate();

		var q = 'MATCH (master:E7:'+prj+' {content: $master})-[:P15]->(e22m:E22), \
			(tsubp:E55:'+prj+' {content: "subproject"}), (tpdesc:E55:'+prj+' {content: "projDesc"}) \
			CREATE (master)-[:P9]->(sub:E7:'+prj+' {content: $subproj})-[:P2]->(tsubp), \
			(sub)-[:P102]->(title:E35:'+prj+' $title), \
			(sub)-[:P3]->(desc:E62:'+prj+' $desc)-[:P3_1]->(tpdesc), \
			(sub)-[:P15]->(e22s:E22:'+prj+' {content: "e22_root_"+$subproj}), \
			(e22m)-[:P46]->(e22s) \
			RETURN sub.content AS id, title.value AS name, desc.value AS description';

		var params = {
			master: prj,
			subproj: 'sub' + tid,
			title: {
				content: 'e35_sub' + tid,
				value: req.body.name
			},
			desc: {
				content: 'e62_sub' + tid,
				value: req.body.description || ''
			}
		};
		
		neo4j.writeTransaction(q, params)
			.then(function(results) {
				res.json(results[0]);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#subproject.create');
			});
	},

	update: function (req, res) {
		var prj = req.params.id;

		// TODO: Cypher query überarbeiten (ist Unterscheidung noch nötig?)
		var q = 'MATCH (sub:E7:'+prj+' {content: $subId})-[:P2]->(:E55 {content: "subproject"}), \
			(tpdesc:E55:'+prj+' {content: "projDesc"}), \
			(sub)-[:P102]->(title:E35) \
			OPTIONAL MATCH (sub)-[:P3]->(desc:E62)-[:P3_1]->(tpdesc) \
			FOREACH ( ignoreMe IN CASE WHEN desc IS NULL AND length($desc) > 0 THEN [1] ELSE [] END | CREATE (sub)-[:P3]->(:E62:'+prj+' {content: "e62_" + sub.content, value: {desc}})-[:P3_1]->(tpdesc) ) \
			FOREACH ( ignoreMe IN CASE WHEN NOT desc IS NULL THEN [1] ELSE [] END | SET desc.value = $desc ) \
			SET title.value = $title \
			RETURN sub.content AS id, title.value AS name, desc.value AS description';

		var params = {
			subId: req.params.subId,
			title: req.body.name,
			desc: req.body.description
		};

		neo4j.writeTransaction(q, params)
			.then(function(results) {
				res.json(results[0]);
			})
			.catch(function(err) {
				utils.error.neo4j(res, err, '#subproject.update');
			});
	}
	
	// TODO: subproject delete

};
