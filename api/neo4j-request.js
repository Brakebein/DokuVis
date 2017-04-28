var request = require('request-promise');
var config = require('./config');

module.exports = {
	
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
		if (!data) return [];
		var results = [];
		for (var i=0, l=data.data.length; i<l; i++) {
			var obj = {};
			for (var j=0; j<data.columns.length; j++) {
				obj[data.columns[j]] = data.data[i].row[j];
			}
			results.push(obj);
		}
		return results;
	},
	
	extractTransactionArrayData: function (data) {
		if (!data) return [];
		var results = [];
		for (var i=0, l=data.length; i<l; i++) {
			var arr = [];
			for (var j=0, m=data[i].data.length; j<m; j++) {
				var obj = {};
				for (var k=0, n=data[i].columns.length; k<n; k++) {
					obj[data[i].columns[k]] = data[i].data[j].row[k];
				}
				arr.push(obj);
			}
			results.push(arr);
		}
		return results;
	},

	removeEmptyArrays: function (data, checkObj, checkKey) {
		for (var i= 0, l=data.length; i<l; i++) {
			if (data[i][checkObj] && data[i][checkObj] instanceof Array && data[i][checkObj][0]) {
				if (data[i][checkObj][0][checkKey] === null)
					data[i][checkObj] = [];
			}
			for (var key in data[i]) {
				if (data[i][key] instanceof Array)
					this.removeEmptyArrays(data[i][key], checkObj, checkKey);
			}
		}
		return data;
	},
	
	createHierarchy: function (data) {
		var results = [];
		for (var i=0; i<data.length; i++) {
			var parent = {
				content: data[i].parent.content,
				children: data[i].children
			};
			for (var j=0, k=parent.children.length; j<k; j++) {
				parent.children[j].children = [];
			}
			results.push(parent);
		}
		for (i=0; i<results.length; i++) {
			for (j=0, k=results.length; j<k; j++) {
				if (i === j) continue;
				var p = getHierarchyElement(results[j], results[i].content);
				if (p !== undefined) {
					p.children = results[i].children;
					results.splice(i,1);
					i--;
					break;
				}
			}
		}
		return results;
	}
	
};

function getHierarchyElement(node, content) {
	if (node.content === content) return node;
	for (var i=0; i<node.children.length; i++) {
		var obj = getHierarchyElement(node.children[i], content);
		if (obj !== undefined) return obj;
	}
	return undefined;
}
