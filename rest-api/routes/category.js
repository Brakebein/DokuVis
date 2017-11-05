const shortid = require('shortid');
const utils = require('../utils');
const neo4j = require('../neo4j-request');

module.exports = {
	
	query: function(req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55) \
			OPTIONAL MATCH (c)<-[:P127]-(a:E55) \
			RETURN c.content AS id, c.value AS value, collect({id: a.content, value: a.value, color: a.color}) AS attributes';

		neo4j.readTransaction(q)
			.then(function (results) {
				neo4j.removeEmptyArrays(results, 'attributes', 'id');
				return res.json(results);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#category.query');
			});
	},
	
	create: function(req, res) {
		if(!req.body.value) { utils.abort.missingData(res, 'body.value'); return; }
		
		var prj = req.params.id;
		
		var q = 'MATCH (tc:E55:'+prj+' {content:"category"}) \
			CREATE (tc)<-[:P127]-(c:E55:'+prj+' $newValues) \
			RETURN c.content AS id, c.value AS value';
		var params = {
			newValues: {
				content: shortid.generate() + '_category',
				value: req.body.value
			}
		};
		
		neo4j.writeTransaction(q, params)
			.then(function(results) {
				var data = results[0];
				data.attributes = [];
				res.json(data);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#category.create');
			});
	},
	
	update: function(req, res) {
		if(!req.body.value) { utils.abort.missingData(res, 'body.value'); return; }

		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: $cid}) \
			OPTIONAL MATCH (c)<-[:P127]-(a:E55) \
			SET c.value = $newValue \
			RETURN c.content AS id, c.value AS value, collect({id: a.content, value: a.value, color: a.color}) AS attributes';
		var params = {
			cid: req.params.cid,
			newValue: req.body.value
		};
		
		neo4j.writeTransaction(q, params)
			.then(function(results) {
				neo4j.removeEmptyArrays(results, 'attributes', 'id');
				res.json(results[0]);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#categorie.update');
			});
	},
	
	delete: function(req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: $cid}) \
			OPTIONAL MATCH (c)<-[:P127]-(a:E55) \
			DETACH DELETE c, a';
		var params = {
			cid: req.params.cid
		};
		
		neo4j.writeTransaction(q, params)
			.then(function() {
				res.json({ message: 'Category deleted' });
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#category.delete');
			});
	},
	
	createAttr: function(req, res) {
		if(!req.body.value) { utils.abort.missingData(res, 'body.value'); return; }
		
		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: $cid}) \
			CREATE (c)<-[:P127]-(a:E55:'+prj+' $newValues) \
			RETURN a.content AS id, a.value AS value, a.color AS color, c.content AS cid';
		var params = {
			cid: req.params.cid,
			newValues: {
				content: shortid.generate() + '_categoryAttr',
				value: req.body.value,
				color: req.body.color
			}
		};
		neo4j.writeTransaction(q, params)
			.then(function(results) {
				res.json(results[0]);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#category.createAttr');
			});
	},
	
	updateAttr: function(req, res) {
		var prj = req.params.id;
		var value = req.body.value;
		var color = req.body.color;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: $cid})<-[:P127]-(a:E55 {content: $aid})';
			if(value || color) q += ' SET ';
			if(value) q += 'a.value = $newValue';
			if(value && color) q += ', ';
			if(color) q += 'a.color = $newColor';
			q += ' RETURN a.content AS id, a.value AS value, a.color AS color, c.content AS cid';
		var params = {
			cid: req.params.cid,
			aid: req.params.aid,
			newValue: value,
			newColor: color
		};
		
		neo4j.writeTransaction(q, params)
			.then(function(results) {
				res.json(results[0]);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#category.updateAttr');
			});
	},
	
	deleteAttr: function(req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (:E55:'+prj+' {content:"category"})<-[:P127]-(c:E55 {content: $cid})<-[:P127]-(a:E55 {content: $aid}) \
			DETACH DELETE a';
		var params = {
			cid: req.params.cid,
			aid: req.params.aid
		};
		neo4j.writeTransaction(q, params)
			.then(function() {
				res.json({ message: 'CategoryAttribute deleted' });
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#category.delete');
			});
	}
	
};
