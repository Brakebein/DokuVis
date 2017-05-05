var utils = require('../utils');
var neo4j = require('../neo4j-request');

module.exports = {

	query: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (e21:E21:'+prj+') \
			WHERE NOT (e21)-[:P2]->(:E55 {content: "projectPerson"}) \
			MATCH (e21)-[:P131]->(e82:E82) \
			RETURN e21.content AS person, id(e21) AS personId, e82.value AS name';

		neo4j.readTransaction(q)
			.then(function (result) {
				res.json(result);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#person.query');
			});
	}

	// TODO: edit, delete

};
