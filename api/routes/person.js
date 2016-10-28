var utils = require('../utils');
var neo4j = require('../neo4j-request');

var person = {

	getAll: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (e21:E21:'+prj+') \
			WHERE NOT (e21)-[:P2]->(:E55 {content: "projectPerson"}) \
			MATCH (e21)-[:P131]->(e82:E82) \
			RETURN e21.content AS person, id(e21) AS personId, e82.content AS name';

		neo4j.transaction(q)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#archive.getAll'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}

	// TODO: edit, delete

};

module.exports = person;
