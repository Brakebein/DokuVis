const shortid = require('shortid');
const utils = require('../utils');
const neo4j = require('../neo4j-request');

module.exports = {

	query: function (req, res) {
		var prj = req.params.prj;
		
		var q = 'MATCH (e78:E78:'+prj+')-[:P1]-(e41:E41), \
				(e78)-[:P52]->(e40:E40)-[:P131]->(e82:E82) \
			OPTIONAL MATCH (e78)-[:P46]->(carriers)\
			RETURN  { id: e78.content, name: e41.value, nodeId: id(e78) } AS collection,\
					{ id: e40.content, name: e82.value, abbr: e82.abbr } AS institution,\
					{ documents: count(carriers) } AS linkStats';

		neo4j.readTransaction(q)
			.then(function(results) {
				res.json(results);
			})
			.catch(function(err) {
				utils.error.neo4j(res, err, '#archive.query');
			});
	},

	get: function (req, res) {
		var prj = req.params.prj;

		var q = 'MATCH (e78:E78:'+prj+' {content: $id})-[:P1]-(e41:E41), \
				(e78)-[:P52]->(e40:E40)-[:P131]->(e82:E82) \
			OPTIONAL MATCH (e78)-[:P46]->(carriers)\
			RETURN  { id: e78.content, name: e41.value, nodeId: id(e78) } AS collection,\
					{ id: e40.content, name: e82.value, abbr: e82.abbr } AS institution,\
					{ documents: count(carriers) } AS linkStats';

		var params = {
			id: req.params.id
		};

		neo4j.readTransaction(q, params)
			.then(function(results) {
				res.json(results[0]);
			})
			.catch(function(err) {
				utils.error.neo4j(res, err, '#archive.get');
			});
	},
	
	create: function (req, res) {
		if (!req.body.collection || !req.body.institution) { utils.abort.missingData(res, 'body.collection|body.institution'); return; }
		
		var prj = req.params.prj;
		var tid = shortid.generate();

		var q = 'MERGE (e40:E40:'+prj+')-[:P131]->(e82:E82:'+prj+' {value: $e82value}) \
				ON CREATE SET e40.content = $e40id, e82.content = $e82id, e82.abbr = $e82abbr \
			MERGE (e40)<-[:P52]-(e78:E78:'+prj+')-[:P1]->(e41:E41:'+prj+' {value: $e41value}) \
				ON CREATE SET e78.content = $e78id, e41.content = $e41id \
			RETURN  { id: e78.content, name: e41.value, nodeId: id(e78) } AS collection,\
					{ id: e40.content, name: e82.value, abbr: e82.abbr } AS institution,\
					{ documents: 0 } AS linkStats';

		var params = {
			e82id: 'e82_' + tid + '_' + utils.replace(req.body.institution),
			e82value: req.body.institution,
			e82abbr: req.body.abbr,
			e40id: 'e40_' + tid + '_' + utils.replace(req.body.institution),
			e78id: 'e78_' + tid + '_' + utils.replace(req.body.collection),
			e41id: 'e41_' + tid + '_' + utils.replace(req.body.collection),
			e41value: req.body.collection
		};

		neo4j.writeTransaction(q, params)
			.then(function (results) {
				if (results.length)
					res.json(results[0]);
				else {
					res.status(500);
					res.json({ message: 'No nodes created' });
				}
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#archive.create');
			});
	},

	update: function (req, res) {
		var prj = req.params.prj;

		var q = 'MATCH (e78:E78:'+prj+' {content: $id})-[:P1]-(e41:E41), \
				(e78)-[:P52]->(e40:E40)-[:P131]->(e82:E82)\
			OPTIONAL MATCH (e78)-[:P46]->(carriers) \
			SET e41.value = $collection,\
				e82.value = $institution, \
				e82.abbr = $abbr \
			RETURN  { id: e78.content, name: e41.value, nodeId: id(e78) } AS collection,\
					{ id: e40.content, name: e82.value, abbr: e82.abbr } AS institution,\
					{ documents: count(carriers) } AS linkStats';

		var params = {
			id: req.params.id,
			collection: req.body.collection.name,
			institution: req.body.institution.name,
			abbr: req.body.institution.abbr
		};

		neo4j.writeTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#archive.update');
			});
	},

	delete: function (req, res) {
		var prj = req.params.prj;

		// delete collection
		// delete institution only, if there are no other collections attached to
		var q = 'MATCH (e78:E78:'+prj+' {content: $id})-[:P1]-(e41:E41), \
				(e78)-[:P52]->(e40:E40)-[:P131]->(e82:E82) \
			OPTIONAL MATCH	(e40)<-[r:P52]-(:E78) \
			WITH e78, e41,\
				 CASE WHEN count(r) < 2 THEN e40 ELSE NULL END AS e40,\
				 CASE WHEN count(r) < 2 THEN e82 ELSE NULL END AS e82 \
			DETACH DELETE e78, e41, e40, e82';

		var params = {
			id: req.params.id
		};

		neo4j.writeTransaction(q, params)
			.then(function () {
				res.json({ message: 'Archive with collection ID ' + req.params.id + ' deleted' });
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, 'archive.delete');
			});
	}

};
