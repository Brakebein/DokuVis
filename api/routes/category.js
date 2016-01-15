var config = require('../config');
var utils = require('../utils');
var neo4j = require('../neo4j-request');

var category = {
	
	getAll: function(req, res) {
		var q = 'MATCH (:E55:'+req.params.id+' {content:"category"})<-[:P127]-(c:E55) \
			OPTIONAL MATCH (c)<-[:P127]-(a:E55) \
			RETURN c.content AS id, c.value AS value, collect({id: a.content, value: a.value, color: a.color}) AS attributes';
			//RETURN c.content AS id, c.value AS value, collect(a) AS attributes';
			
		neo4j.cypher(q)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.getAll'); return; }
				// null objekte rausfiltern
				for(var i=0; i<response.data.length; i++) {
					if(!response.data[i][2][0].id) response.data[i][2] = [];
				}
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	create: function(req, res) {
		var q = 'MATCH (tc:E55:'+req.params.id+' {content:"category"}) \
			CREATE (tc)<-[:P127]-(c:E55:'+req.params.id+' {newValues}) \
			RETURN c';
		var params = {
			newValues: {
				content: req.body.id,
				value: req.body.value
			}
		};
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.create'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	update: function(req, res) {
		var q = 'MATCH (:E55:'+req.params.id+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}}) \
			SET c.value = {newValue} \
			RETURN c';
		var params = {
			cid: req.params.cid,
			newValue: req.body.value
		};
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.update'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	delete: function(req, res) {
		var q = 'MATCH (:E55:'+req.params.id+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}})<-[:P127]-(a:E55) \
			DETACH DELETE c, a';
		var params = {
			cid: req.params.cid
		};
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.delete'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	createAttr: function(req, res) {
		var q = 'MATCH (:E55:'+req.params.id+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}}) \
			CREATE (c)<-[:P127]-(a:E55:'+req.params.id+' {newValues}) \
			RETURN a';
		var params = {
			cid: req.params.cid,
			newValues: {
				content: req.body.id,
				value: req.body.value,
				color: req.body.color
			}
		};
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.createAttr'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	updateAttr: function(req, res) {
		var q = 'MATCH (:E55:'+req.params.id+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}})<-[:P127]-(a:E55 {content: {aid}})';
			if(req.body.value || req.body.color) q += ' SET ';
			if(req.body.value) q += 'a.value = {newValue}';
			if(req.body.value && req.body.color) q += ', ';
			if(req.body.color) q += 'a.color = {newColor}';
			q += ' RETURN a';
		var params = {
			cid: req.params.cid,
			aid: req.params.aid,
			newValue: req.body.value,
			newColor: req.body.color
		};
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.updateAttr'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	deleteAttr: function(req, res) {
		var q = 'MATCH (:E55:'+req.params.id+' {content:"category"})<-[:P127]-(c:E55 {content: {cid}})<-[:P127]-(a:E55 {content: {aid}}) \
			DETACH DELETE a';
		var params = {
			cid: req.params.cid,
			aid: req.params.aid
		};
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#category.deleteAttr'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};

module.exports = category;