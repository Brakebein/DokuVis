const utils = require('../utils');
const neo4j = require('../neo4j-request');

var archive = {

	query: function (req, res) {
		// checkPermission
		var prj = req.params.id;
		
		var q = 'MATCH (e78:E78:'+prj+')-[:P1]-(e41:E41), \
			(e78)-[:P52]->(:E40)-[:P131]->(e82:E82) \
			RETURN e78.content AS collection, e41.content AS collectionName, e82.content AS institutionName, e82.abbr AS institutionAbbr, id(e78) AS collectionId';

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
		
		utils.checkPermission(req, res, ['admin', 'historian']).then(function () {
			var prj = req.params.id;
			var tid = req.body.tid;
	
			// TODO: #archive.create: Abfrage nochmal überprüfen
			var q = 'MERGE (e40:E40:'+prj+')-[:P131]->(e82:E82:'+prj+' {content: {e82name}}) \
				ON CREATE SET e82.abbr = {e82abbr}, e40.content = {e40cont} \
				MERGE (e41:E41:'+prj+' {content: {e41name}}) \
				CREATE (e78:E78:'+prj+' {content: {e78cont}})-[:P1]->(e41), \
					(e78)-[:P52]->(e40) \
				RETURN e40, e78';
			var params = {
				e82name: req.body.name,
				e82abbr: req.body.abbr,
				e40cont: 'e40_' + tid + '_' + utils.replace(req.body.name),
				e78cont: 'e78_' + tid + '_' + utils.replace(req.body.coll),
				e41name: req.body.coll
			};
	
			return neo4j.transaction(q, params);
		}).then(function (response) {
			if(response.exception) { utils.error.neo4j(res, response, '#archive.create'); return; }
			res.json(neo4j.extractTransactionData(response.results[0])[0]);
		}).catch(function (err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}
	
	// TODO: #archive: edit, delete

};

module.exports = archive;
