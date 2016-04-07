var utils = require('../utils');
var neo4j = require('../neo4j-request');

var graph = {
	
	getPaths: function(req, res) {
		var prj = req.params.id;
		
		var statements = [{
			statement: 'match path = (n:'+prj+')-[]-() where id(n) = {id} return path',
			parameters: {
				id: +req.params.nodeId
			},
			resultDataContents: ['row', 'graph']
		}];
		
		neo4j.transaction(statements)
			.then(function(response) {
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};

module.exports = graph;