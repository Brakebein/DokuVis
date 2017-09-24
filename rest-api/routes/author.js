const utils = require('../utils');
const neo4j = require('../neo4j-request');
const shortid = require('shortid');

module.exports = {
	
	query: function (req, res) {
		var prj = req.params.prj;

		var q = 'MATCH (e21:E21:'+prj+')\
			WHERE NOT (e21)-[:P2]->(:E55 {content: "projectPerson"})\
			MATCH (e21)-[:P131]->(e82:E82)\
			OPTIONAL MATCH (e21)<-[:P14]-(events)\
			RETURN e21.content AS id,\
				id(e21) AS nodeId,\
				e82.value AS name,\
				{ documents: count(events) } AS linkStats';

		neo4j.readTransaction(q)
			.then(function (results) {
				res.json(results);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#author.query');
			});
	},
	
	get: function (req, res) {
		var prj = req.params.prj;

		var q = 'MATCH (e21:E21:'+prj+' {content: $id})\
			WHERE NOT (e21)-[:P2]->(:E55 {content: "projectPerson"})\
			MATCH (e21)-[:P131]->(e82:E82)\
			OPTIONAL MATCH (e21)<-[:P14]-(events)\
			RETURN e21.content AS id,\
				id(e21) AS nodeId,\
				e82.value AS name,\
				{ documents: count(events) } AS linkStats';

		var params = {
			id: req.params.id
		};

		neo4j.readTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#author.get');
			});
	},
	
	create: function (req, res) {
		if (!req.body.name) { utils.abort.missingData(res, '#author.create name'); return; }

		var prj = req.params.prj;
		var id = shortid.generate();

		var q = 'MERGE (e82:E82:'+prj+' {value: $name})<-[:P131]-(e21:E21:'+prj+')\
				ON CREATE SET e21.content = $e21id, e82.content = $e82id\
			RETURN e21.content AS id,\
				id(e21) AS nodeId,\
				e82.value AS name,\
				{ documents: 0 } AS linkStats';

		var params = {
			name: req.body.name,
			e21id: 'e21_' + id + '_' + utils.replace(req.body.name),
			e82id: 'e82_' + id + '_' + utils.replace(req.body.name)
		};

		neo4j.writeTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#author.create');
			});
	},
	
	update: function (req, res) {
		if (!req.body.name) { utils.abort.missingData(res, '#author.update name'); return; }

		var prj = req.params.prj;

		var q = 'MATCH (e21:E21:'+prj+' {content: $id})\
			WHERE NOT (e21)-[:P2]->(:E55 {content: "projectPerson"})\
			MATCH (e21)-[:P131]->(e82:E82)\
			OPTIONAL MATCH (e21)<-[:P14]-(events)\
			SET e82.value = $name\
			RETURN e21.content AS id,\
				id(e21) AS nodeId,\
				e82.value AS name,\
				{ documents: count(events) } AS linkStats';

		var params = {
			id: req.params.id,
			name: req.body.name
		};

		neo4j.writeTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#author.update');
			});
	},
	
	delete: function (req, res) {
		var prj = req.params.prj;

		var q = 'MATCH (e21:E21:'+prj+' {content: $id})\
			WHERE NOT (e21)-[:P2]->(:E55 {content: "projectPerson"})\
			MATCH (e21)-[:P131]->(e82:E82)\
			DETACH DELETE e21, e82';

		var params = {
			id: req.params.id
		};

		neo4j.writeTransaction(q, params)
			.then(function () {
				res.json({ message: 'Author with ID ' + req.params.id + ' deleted' });
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#author.delete');
			});
	}

};
