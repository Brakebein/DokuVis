var config = require('../config');
var utils = require('../utils');
var neo4j = require('../neo4j-request');

module.exports = {

	// alle Infos abrufen
	query: function (req, res) {
		var prj = req.params.id;
		var sub = req.params.subprj;
		
		var q = 'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62)-[:P3_1]->(:E55 {content: "projInfo"}) \
				RETURN n.value AS info, n.content AS id, r.order AS order';
		var params = {
			subproj: sub === 'master' ? prj : sub
		};
		
		neo4j.transaction(q, params)
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#projinfo.query'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	// allgemeine Info hinzufügen
	create: function (req, res) {
		if(!req.body.tid) { utils.abort.missingData(res, 'body.tid'); return; }

		var user = req.headers['x-key']; // TODO: user verknüpfen (via E33 Linguistic Object)
		var prj = req.params.id;
		var sub = req.params.subprj;

		var q = 'MATCH (p:E7:'+prj+' {content: {subproj}}), (tpinfo:E55:'+prj+' {content: "projInfo"}) \
				OPTIONAL MATCH (p)-[r:P3]->(:E62) \
				WITH p, count(r) AS anz, tpinfo \
				CREATE (p)-[:P3 {order: anz}]->(n:E62:'+prj+' {content: {content}, value: {value}})-[:P3_1]->(tpinfo) \
				RETURN n';
		var params = {
			subproj: sub === 'master' ? prj : sub,
			content: req.body.tid,
			value: req.body.info
		};
		
		neo4j.transaction(q, params)
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#projinfo.create'); return; }
				res.json(neo4j.extractTransactionData(response.results[0])[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	// allgemein Info editieren
	update: function (req, res) {
		if(!req.body.info) { utils.abort.missingData(res, 'body.info'); return; }
		
		var prj = req.params.id;
		var sub = req.params.subprj;
		
		var q = 'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62 {content: {tid}})-[:P3_1]->(:E55 {content: "projInfo"}) \
				SET n.value = {html} \
				RETURN n';
		var params = {
			subproj: sub === 'master' ? prj : sub,
				tid: req.params.piId,
				html: req.body.info
		};
		
		neo4j.transaction(q, params)
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#projinfo.update'); return; }
				res.json(neo4j.extractTransactionData(response.results[0])[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	// allgemeine Info löschen
	delete: function (req, res) {
		var prj = req.params.id;
		var sub = req.params.subprj;

		var q =	'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62 {content: {tid}})-[:P3_1]->(:E55 {content: "projInfo"}) \
				OPTIONAL MATCH (p)-[r2:P3]->(n2:E62) \
				WHERE r2.order > r.order \
				SET r2.order = r2.order-1 \
				DETACH DELETE n';
		var params = {
			subproj: sub === 'master' ? prj : sub,
			tid: req.params.piId
		};
		
		neo4j.transaction(q, params)
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#projinfo.delete'); return; }
				res.json({ message: 'ProjInfo deleted' });
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	// Info Reihenfolge tauschen
	swap: function (req, res) {
		if(!req.body.from || !req.body.to) { utils.abort.missingData(res, 'body.from || body.to'); return; }
		
		var prj = req.params.id;
		var sub = req.params.subprj;
		
		var q =	'MATCH (p:E7:'+prj+' {content: {subproj}}), (tpinfo:E55:'+prj+' {content: "projInfo"}), \
				(p)-[r1:P3]->(n1:E62 {content: {tidFrom}})-[:P3_1]->(tpinfo), \
				(p)-[r2:P3]->(n2:E62 {content: {tidTo}})-[:P3_1]->(tpinfo) \
				WITH p, r1, r2, n1, n2, r1.order AS o1, r2.order AS o2 \
				SET r1.order = o2, r2.order = o1 \
				RETURN p';
		var params = {
			subproj: sub === 'master' ? prj : sub,
			tidFrom: req.body.from,
			tidTo: req.body.to
		};

		neo4j.transaction(q, params)
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#projinfo.delete'); return; }
				res.json({ message: 'ProjInfo order swapped' });
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};
