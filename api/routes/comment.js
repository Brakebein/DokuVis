var utils = require('../utils');
var neo4j = require('../neo4j-request');

var comment = {
	
	create: function(req, res) {
		var prj = req.params.id;
		
		var cType = '';
		switch(req.body.type) {
			case 'source': cType = 'commentSource'; break;
			default: cType = 'commentGeneral';
		}
		
		var q = 'MATCH (e31:E31:'+prj+' {content: {targetId}}), \
			(e21:E21:'+prj+' {content: {user}}), \
			(type:E55:'+prj+' {content: {type}}) \
			CREATE (e33:E33:'+prj+' {content: {e33id}})-[:P3]->(:E62:'+prj+' {e62content}), \
			(e65:E65:'+prj+' {content: "e65_" + {e33id}})-[:P4]->(:E52:'+prj+' {content: "e52_e65_" + {e33id}})-[:P82]->(:E61:'+prj+' {value: {time}}), \
			(e33)-[:P2]->(type), \
			(e33)-[:P129]->(e31), \
			(e65)-[:P94]->(e33), \
			(e65)-[:P14]->(e21) \
			RETURN e33';
		var params = {
			targetId: req.body.targetId,
			user: 'e21_' + req.body.user,
			type: cType,
			e33id: 'e33_' + req.body.id + '_comment',
			e62content: {
				content: 'e62_e33_' + req.body.id + '_comment',
				value: req.body.text
			},
			time: req.body.time
		};
		
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#comment.create'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};

module.exports = comment; 