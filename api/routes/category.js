var config = require('../config');
var utils = require('../utils');
var neo4j = require('../neo4j-request');

module.exports = {
	
	query: function(req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55) \
			OPTIONAL MATCH (c)<-[:P127]-(a:E55) \
			RETURN c.content AS id, c.value AS value, collect({id: a.content, value: a.value, color: a.color}) AS attributes';
			//RETURN c.content AS id, c.value AS value, collect(a) AS attributes';
			
		neo4j.transaction(q)
			.then(function (response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.query'); return; }
				var results = neo4j.extractTransactionData(response.results[0]);
				res.json(neo4j.removeEmptyArrays(results, 'attributes', 'id'));
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
		
		// neo4j.cypher(q)
		// 	.then(function(response) {
		// 		if(response.exception) { utils.error.neo4j(res, response, '#category.getAll'); return; }
		// 		// null objekte rausfiltern
		// 		for(var i=0; i<response.data.length; i++) {
		// 			if(!response.data[i][2][0].id) response.data[i][2] = [];
		// 		}
		// 		res.json(response);
		// 	}).catch(function(err) {
		// 		utils.error.neo4j(res, err, '#cypher');
		// 	});
	},
	
	create: function(req, res) {
		if(!req.body.id) { utils.abort.missingData(res, 'body.id'); return; }
		if(!req.body.value) { utils.abort.missingData(res, 'body.value'); return; }
		
		var prj = req.params.id;
		
		var q = 'MATCH (tc:E55:'+prj+' {content:"category"}) \
			CREATE (tc)<-[:P127]-(c:E55:'+prj+' {newValues}) \
			RETURN c';
		var params = {
			newValues: {
				content: req.body.id,
				value: req.body.value
			}
		};
		
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.create'); return; }
				var data = neo4j.extractTransactionData(response.results[0])[0].c;
				data.attributes = [];
				res.json(data);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	update: function(req, res) {
		if(!req.body.value) { utils.abort.missingData(res, 'body.value'); return; }

		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}}) \
			OPTIONAL MATCH (c)<-[:P127]-(a:E55) \
			SET c.value = {newValue} \
			RETURN c.content AS id, c.value AS value, collect({id: a.content, value: a.value, color: a.color}) AS attributes';
		var params = {
			cid: req.params.cid,
			newValue: req.body.value
		};
		
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.update'); return; }
				var results = neo4j.extractTransactionData(response.results[0]);
				res.json(neo4j.removeEmptyArrays(results, 'attributes', 'id')[0]);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	delete: function(req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}}) \
			OPTIONAL MATCH (c)<-[:P127]-(a:E55) \
			DETACH DELETE c, a';
		var params = {
			cid: req.params.cid
		};
		
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.delete'); return; }
				res.json({ message: 'Category deleted' });
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	createAttr: function(req, res) {
		if(!req.body.id) { utils.abort.missingData(res, 'body.id'); return; }
		if(!req.body.value) { utils.abort.missingData(res, 'body.value'); return; }
		
		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}}) \
			CREATE (c)<-[:P127]-(a:E55:'+prj+' {newValues}) \
			RETURN a';
		var params = {
			cid: req.params.cid,
			newValues: {
				content: req.body.id,
				value: req.body.value,
				color: req.body.color
			}
		};
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.createAttr'); return; }
				res.json(neo4j.extractTransactionData(response.results[0])[0].a);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	updateAttr: function(req, res) {
		var prj = req.params.id;
		var value = req.body.value;
		var color = req.body.color;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}})<-[:P127]-(a:E55 {content: {aid}})';
			if(value || color) q += ' SET ';
			if(value) q += 'a.value = {newValue}';
			if(value && color) q += ', ';
			if(color) q += 'a.color = {newColor}';
			q += ' RETURN a.content AS id, a.value AS value, a.color AS color, c.content AS cid';
		var params = {
			cid: req.params.cid,
			aid: req.params.aid,
			newValue: value,
			newColor: color
		};
		
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.updateAttr'); return; }
				res.json(neo4j.extractTransactionData(response.results[0])[0]);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	deleteAttr: function(req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}})<-[:P127]-(a:E55 {content: {aid}}) \
			DETACH DELETE a';
		var params = {
			cid: req.params.cid,
			aid: req.params.aid
		};
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.deleteAttr'); return; }
				res.json({ message: 'CategoryAttribute deleted' });
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};
