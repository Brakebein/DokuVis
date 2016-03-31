var request = require('request-promise');
var config = require('./config');

var neo4j = {
	
	transaction: function(statements) {
		return request({
			method: 'POST',
			uri: config.neo4j.uriTransaction,
			headers: {
				'Content-type': 'application/json',
				'Authorization': config.neo4j.auth
			},
			body: {
				statements: statements
			},
			json: true
		});
	},
	
	cypher: function(query, params) {
		return request({
			method: 'POST',
			uri: config.neo4j.uriCypher,
			headers: {
				'Content-type': 'application/json',
				'Authorization': config.neo4j.auth
			},
			body: {
				query: query,
				params: params || {}
			},
			json: true
		});
	},
	
	extractTransactionData: function(data) {
		var results = [];
		for(var i=0, l=data.data.length; i<l; i++) {
			var obj = {};
			for(var j=0; j<data.columns.length; j++) {
				obj[data.columns[j]] = data.data[i].row[j];
			}
			results.push(obj);
		}
		return results;
	}
	
};

module.exports = neo4j;