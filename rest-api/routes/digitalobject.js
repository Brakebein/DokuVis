const utils = require('../utils');
const neo4j = require('../neo4j-request');

module.exports = {

	query: function (req, res) {
		var prj = req.params.prj;

		// noinspection JSAnnotator
		var q = `MATCH (tmodel:E55:`+prj+` {content: 'model'})
			WITH tmodel
			MATCH (:E7:`+prj+` {content: $subprj})-[:P15]->(devent:D7 {content: $deventId}),
				(devent)-[:L11]->(dobj:D1)-[:P1]->(file:E75),
				(dobj)-[rmat:P2]->(mat:E57),
				(dobj)<-[:P106]-(dglob:D1)-[:P2]->(tmodel),
				(dglob)-[:P67]->(e22:E22)
			WITH tmodel, dobj, file, mat
			ORDER BY rmat.order
			WITH tmodel, dobj, file, collect(mat) AS materials
			OPTIONAL MATCH (dobj)<-[:P106]-(parent:D1)
			WHERE NOT (parent)-[:P2]->(tmodel)
			RETURN dobj.content AS id,
				$deventId AS eventId,
				dobj AS obj,
				file AS file,
				materials,
				parent.content AS parent`;

		var params = {
			subprj: req.params.subprj,
			deventId: req.params.id
		};

		neo4j.readTransaction(q, params)
			.then(function (results) {
				res.json(results);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#digitalobject.query');
			});
	}

};
