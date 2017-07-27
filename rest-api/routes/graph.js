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
		
		neo4j.transactionArray(statements)
			.then(function(response) {
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	getTitle: function (req, res) {
		var prj = req.params.id;

		var statements = [{
			statement: 'match (n:'+prj+')-[]-(t) where id(n) = {id} and {label} in labels(t) return t AS title',
			parameters: {
				id: +req.params.nodeId,
				label: req.params.label
			},
			resultDataContents: ['row', 'graph']
		}];

		neo4j.transactionArray(statements)
			.then(function(response) {
				if(response.results[0] && response.results[0].data[0])
					res.json(response.results[0].data[0].row[0]);
				else
					res.send();
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},

	getAbstractNodes: function (req, res) {
		var prj = req.params.id;

		var statements = [{
			statement: 'match (n:'+prj+')-[]-(t) where id(n) = {id} and {label} in labels(t) return t AS title',
			parameters: {
				id: +req.params.nodeId,
				label: req.params.label
			},
			resultDataContents: ['row', 'graph']
		}];

		neo4j.transactionArray(statements)
			.then(function(response) {
				if(response.results[0] && response.results[0].data[0])
					res.json(response.results[0].data[0].row[0]);
				else
					res.send();
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},

	getE22Name: function (req, res) {
		var prj = req.params.id;

		var statements = [{
			statement: 'match (n:'+prj+')<-[:P138]-(e36:E36)-[:P2]->(:E55 {content: "model"}) where id(n) = {id} match (e36)-[:P106]->(e73:E73) return e73 AS title',
			parameters: {
				id: +req.params.nodeId
			},
			resultDataContents: ['row', 'graph']
		}];

		neo4j.transactionArray(statements)
			.then(function(response) {
				if(response.results[0] && response.results[0].data[0])
					res.json(response.results[0].data[0].row[0]);
				else
					res.send();
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}
	
};

module.exports = graph;
