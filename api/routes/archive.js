const utils = require('../utils');
const neo4j = require('../neo4j-request');

var archive = {

	query: function (req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (e78:E78:'+prj+')-[:P1]-(e41:E41), \
			(e78)-[:P52]->(:E40)-[:P131]->(e82:E82) \
			RETURN e78.content AS collection, e41.value AS collectionName, e82.value AS institutionName, e82.abbr AS institutionAbbr, id(e78) AS collectionId';

		neo4j.transaction(q)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#archive.getAll'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			})
			.catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	create: function (req, res) {
		if(!req.body.tid) { utils.abort.missingData(res, 'body.tid'); return; }
		
		var prj = req.params.id;
		var tid = req.body.tid;

		// TODO: #archive.create: Abfrage nochmal überprüfen
		var q = 'MERGE (e40:E40:'+prj+')-[:P131]->(e82:E82:'+prj+' {value: {e82value}}) \
			ON CREATE SET e40.content = {e40id}, e82.content = {e82id}, e82.abbr = {e82abbr} \
			MERGE (e40)<-[:P52]-(e78:E78:'+prj+')-[:P1]->(e41:E41:'+prj+' {value: {e41value}}) \
			ON CREATE SET e78.content = {e78id}, e41.content = {e41id} \
			RETURN e40, e78';
		var params = {
			e82id: 'e82_' + tid + '_' + utils.replace(req.body.name),
			e82value: req.body.name,
			e82abbr: req.body.abbr,
			e40id: 'e40_' + tid + '_' + utils.replace(req.body.name),
			e78id: 'e78_' + tid + '_' + utils.replace(req.body.coll),
			e41id: 'e41_' + tid + '_' + utils.replace(req.body.coll),
			e41value: req.body.coll
		};

		neo4j.transaction(q, params).then(function (response) {
			if(response.errors.length) { utils.error.neo4j(res, response, '#archive.create'); return; }
			var result = neo4j.extractTransactionData(response.results[0]);
			if(result.length)
				res.json(result[0]);
			else {
				res.status(500);
				res.json({ message: 'No nodes created' });
			}
		}).catch(function (err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}
	
	// TODO: #archive: edit, delete

};

module.exports = archive;
