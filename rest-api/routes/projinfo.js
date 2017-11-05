const shortid = require('shortid');
const utils = require('../utils');
const neo4j = require('../neo4j-request');

module.exports = {

	// alle Infos abrufen
	query: function (req, res) {
		var prj = req.params.id;
		var sub = req.params.subprj;
		
		var q = 'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62)-[:P3_1]->(:E55 {content: "projInfo"}) \
				RETURN n.content AS id, n.value AS value, r.order AS order';

		var params = {
			subproj: sub === 'master' ? prj : sub
		};
		
		neo4j.readTransaction(q, params)
			.then(function (results) {
				res.json(results);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#projinfo.query');
			});
	},

	// projinfo by id
	get: function (req, res) {
		var prj = req.params.id;
		var sub = req.params.subprj;

		var q = 'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62 {content: {infoId}})-[:P3_1]->(:E55 {content: "projInfo"}) \
				RETURN n.content AS id, n.value AS value, r.order AS order';

		var params = {
			subproj: sub === 'master' ? prj : sub,
			infoId: req.params.piId
		};

		neo4j.readTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#projinfo.query');
			});
	},
	
	// allgemeine Info hinzufügen
	create: function (req, res) {
		if (!req.body.value) { utils.abort.missingData(res, 'body.info'); return; }

		var user = req.headers['x-key']; // TODO: user verknüpfen (via E33 Linguistic Object)
		var prj = req.params.id;
		var sub = req.params.subprj;

		var q = 'MATCH (p:E7:'+prj+' {content: {subproj}}), (tpinfo:E55:'+prj+' {content: "projInfo"}) \
				OPTIONAL MATCH (p)-[a:P3]->(:E62) \
				WITH p, count(a) AS anz, tpinfo \
				CREATE (p)-[r:P3 {order: anz}]->(n:E62:'+prj+' {content: {content}, value: {value}})-[:P3_1]->(tpinfo) \
				RETURN n.content AS id, n.value AS value, r.order AS order';

		var params = {
			subproj: sub === 'master' ? prj : sub,
			content: shortid.generate() + '_' + sub,
			value: req.body.value
		};
		
		neo4j.writeTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#projinfo.create');
			});
	},
	
	// allgemein Info editieren
	update: function (req, res) {
		if (!req.body.value) { utils.abort.missingData(res, 'body.info'); return; }
		
		var prj = req.params.id;
		var sub = req.params.subprj;
		
		var q = 'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62 {content: {tid}})-[:P3_1]->(:E55 {content: "projInfo"}) \
				SET n.value = {html} \
				RETURN n.content AS id, n.value AS value, r.order AS order';

		var params = {
			subproj: sub === 'master' ? prj : sub,
				tid: req.params.piId,
				html: req.body.value
		};
		
		neo4j.writeTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#projinfo.update');
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
		
		neo4j.writeTransaction(q, params)
			.then(function () {
				res.json({ message: 'ProjInfo deleted' });
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#projinfo.delete');
			});
	},
	
	// Info Reihenfolge tauschen
	swap: function (req, res) {
		if (!req.body.from || !req.body.to) { utils.abort.missingData(res, 'body.from || body.to'); return; }
		
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

		neo4j.writeTransaction(q, params)
			.then(function () {
				res.json({ message: 'ProjInfo order swapped' });
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};
