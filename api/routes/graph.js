var Promise = require('bluebird');
var config = require('../config');
var utils = require('../utils');
var neo4j = require('../neo4j-request');

var graph = {
	
	getPaths: function(req, res) {
		
		var statements = [{
			statement: 'match path = (n)-[]-() where id(n) = {id} return path',
			parameters: {
				id: req.body.id
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