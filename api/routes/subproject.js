var utils = require('../utils');
var neo4j = require('../neo4j-request');

module.exports = {

	create: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (master:E7:'+prj+' {content: {master}})-[:P15]->(e22m:E22), \
			(tsubp:E55:'+prj+' {content: "subproject"}), (tpdesc:E55:'+prj+' {content: "projDesc"}) \
			CREATE (master)-[:P9]->(sub:E7:'+prj+' {content: {subproj}})-[:P2]->(tsubp), \
			(sub)-[:P102]->(:E35:'+prj+' {title}), \
			(sub)-[:P15]->(e22s:E22:'+prj+' {content: "e22_root_"+{subproj}}), \
			(e22m)-[:P46]->(e22s)';
		if(req.body.desc.length)
			q += ', (sub)-[:P3]->(:E62:'+prj+' {desc})-[:P3_1]->(tpdesc)';

		var params = {
			master: prj,
			subproj: 'sub' + req.body.id,
			title: {
				content: 'e35_sub' + req.body.id,
				value: req.body.name
			},
			desc: {
				content: 'e62_sub' + req.body.id,
				value: req.body.desc
			}
		};
		
		neo4j.transaction([{ statement: q, parameters: params }])
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#subproject.create'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},

	getAll: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (master:E7:'+prj+' {content: {master}})-[:P9]->(sub:E7)-[:P2]->(:E55 {content: "subproject"}), \
			(sub)-[:P102]->(title:E35) \
			OPTIONAL MATCH (sub)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "projDesc"}) \
			RETURN sub.content AS subId, CASE WHEN exists(title.value) THEN title.value ELSE title.content END AS title, desc.value AS desc';

		var params = {
			master: prj
		};

		neo4j.transaction([{ statement: q, parameters: params }])
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#subproject.getAll'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},

	get: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (sub:E7:'+prj+' {content: {subId}})-[:P2]->(:E55 {content: "subproject"}), \
			(sub)-[:P102]->(title:E35) \
			OPTIONAL MATCH (sub)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "projDesc"}) \
			RETURN CASE WHEN exists(title.value) THEN title.value ELSE title.content END AS name, desc.value AS desc';

		var params = {
			subId: req.params.subId
		};

		neo4j.transaction([{ statement: q, parameters: params }])
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#subproject.get'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},

	change: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (sub:E7:'+prj+' {content: {subId}})-[:P2]->(:E55 {content: "subproject"}), \
			(tpdesc:E55:'+prj+' {content: "projDesc"}), \
			(sub)-[:P102]->(title:E35) \
			OPTIONAL MATCH (sub)-[:P3]->(desc:E62)-[:P3_1]->(tpdesc) \
			CASE WHEN desc IS NULL AND length({desc}) > 0 THEN CREATE (sub)-[:P3]->(:E62:'+prj+' {content: "e62_" + sub.content, value: {desc})-[:P3_1]->(tpdesc) \
			ELSE SET desc.value = {desc} END \
			SET title.value = {title}';

		var params = {
			subId: req.params.subId,
			title: req.body.name,
			desc: req.body.desc
		};

		neo4j.transaction([{ statement: q, parameters: params }])
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#subproject.get'); return; }
				res.json(response);
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}

};
