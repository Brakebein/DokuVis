var request = require('request-promise');
var config = require('./config');

var neo4j = {
	
	transaction: function (statement, parameters) {
		var params = parameters || {};
		return request({
			method: 'POST',
			uri: config.neo4j.uriTransaction,
			headers: {
				'Content-type': 'application/json',
				'Authorization': config.neo4j.auth
			},
			body: {
				statements: [{ statement: statement, parameters: params }]
			},
			json: true
		});
	},
	
	transactionArray: function (statements) {
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
	
	cypher: function (query, params) {
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
	
	extractTransactionData: function (data) {
		if(!data) return [];
		var results = [];
		for(var i=0, l=data.data.length; i<l; i++) {
			var obj = {};
			for(var j=0; j<data.columns.length; j++) {
				obj[data.columns[j]] = data.data[i].row[j];
			}
			results.push(obj);
		}
		return results;
	},
	
	extractTransactionArrayData: function (data) {
		if(!data) return [];
		var results = [];
		for(var i=0, l=data.length; i<l; i++) {
			var arr = [];
			for(var j=0, m=data[i].data.length; j<m; j++) {
				var obj = {};
				for(var k=0, n=data[i].columns.length; k<n; k++) {
					obj[data[i].columns[k]] = data[i].data[j].row[k];
				}
				arr.push(obj);
			}
			results.push(arr);
		}
		return results;
	},

	removeEmptyArrays: function (data, checkObj, checkKey) {
		for(var i= 0, l=data.length; i<l; i++) {
			if(data[i][checkObj] && data[i][checkObj] instanceof Array && data[i][checkObj][0]) {
				if(data[i][checkObj][0][checkKey] === null)
					data[i][checkObj] = [];
			}
		}
		return data;
	}
	
};

module.exports = neo4j;
