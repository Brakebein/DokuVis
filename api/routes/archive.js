var utils = require('../utils');
var neo4j = require('../neo4j-request');

var archive = {

	getAll: function (req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (e78:E78:'+prj+')-[:P1]-(e41:E41), \
			(e78)-[:P52]->(:E40)-[:P131]->(e82:E82) \
			RETURN e78.content AS collection, e41.content AS collectionName, e82.content AS institutionName, e82.abbr AS institutionAbbr, id(e78) AS collectionId';

		neo4j.transaction([{statement: q, parameters: {}}])
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#archive.getAll'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}
	
	// TODO: edit, delete

};

module.exports = archive;
