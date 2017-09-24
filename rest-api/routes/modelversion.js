const utils = require('../utils');
const neo4j = require('../neo4j-request');

module.exports = {

	query: function (req, res) {
		var prj = req.params.prj;

		// noinspection JSAnnotator
		var q = `MATCH (:E7:`+prj+` {content: $subprj})-[:P15]->(devent:D7),
				(devent)-[:P102]->(title:E35),
				(devent)-[:P3]->(note:E62),
				(devent)-[:P14]->(user:E21)-[:P131]->(userName:E82),
				(devent)-[:P4]->(:E52)-[:P82]->(date:E61)
			OPTIONAL MATCH (devent)-[:L23]->(software:D14)
			OPTIONAL MATCH (devent)-[:P134]->(prev:D7)
			RETURN devent.content AS id,
				title.value AS title,
				note.value AS note,
				{id: user.content, name: userName.value, date: date.value} AS created,
				software.value AS software,
				prev.content AS predecessor
			ORDER BY date.value`;

		var params = {
			subprj: req.params.subprj
		};

		neo4j.readTransaction(q, params)
			.then(function (results) {
				res.json(results);
			})
			.catch(function (err) {
				utils.error.neo4j(req, err, '#digitalevent.query');
			});
	},

	get: function (req, res) {
		var prj = req.params.prj;

		// noinspection JSAnnotator
		var q = `MATCH (:E7:`+prj+` {content: $subprj})-[:P15]->(devent:D7 {content: $deventId}),
				(devent)-[:P102]->(title:E35),
				(devent)-[:P3]->(note:E62),
				(devent)-[:P14]->(user:E21)-[:P131]->(userName:E82),
				(devent)-[:P4]->(:E52)-[:P82]->(date:E61)
			OPTIONAL MATCH (devent)-[:L23]->(software:D14)
			OPTIONAL MATCH (devent)-[:P134]->(prev:D7)
			RETURN devent.content AS id,
				title.value AS title,
				note.value AS note,
				{id: user.content, name: userName.value, date: date.value} AS created,
				software.value AS software,
				prev.content AS predecessor`;

		var params = {
			subprj: req.params.subprj,
			deventId: req.params.id
		};

		neo4j.readTransaction(q, params)
			.then(function (results) {
				res.json(results[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#digitalevent.get');
			});
	}

};
