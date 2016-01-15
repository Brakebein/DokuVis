var config = require('../config');
var utils = require('../utils');
var neo4j = require('../neo4j-request');

var models = {
	
	getTree: function(req, res) {
		var prj = req.params.id;
		var subprj = req.params.subprj;
		var q = 'MATCH (root:E22:'+prj+' {content:{esub}}), (tsp:E55:'+prj+' {content:"subproject"}), (tcat:E55:'+prj+' {content:"category"}),';
		q += ' path = (root)-[:P46*]->(c:E22)';
		if(subprj === 'master')
			q += ' WHERE all(n in nodes(path) WHERE NOT (n)<-[:P15]-(:E7)-[:P2]->(tsp))';
		else		
			q += ' WHERE all(n in nodes(path) WHERE not n.content = "e22_root_master")';
		q += ' AND any(n in nodes(path) WHERE n.content = {esub})';
		
		q += ' WITH c';
		q += ' MATCH (p:E22:'+prj+')-[:P46]->(c)<-[:P138]-(:E36)-[:P106]->(cobj:E73)-[:P1]->(cfile:E75)';
		q += ' OPTIONAL MATCH (c)-[:P2]->(attr:E55)-[:P127]->(cat:E55)-[:P127]->(tcat)';
		q += ' WITH p, c, cobj, cfile, collect({catId: cat.id, catValue: cat.value, attrId: attr.id, attrValue: attr.value}) AS categories';
		
		q += ' RETURN {parent: p} AS parent, collect({child: c, obj: cobj, file: cfile, categories: {data: categories}}) AS children';
		var params = {
			esub: 'e22_root_'+subprj
		};
		
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#models.getTree'); return; }
				// null objekte rausfiltern
				for(var i=0; i<response.data.length; i++) {
					for(var j=0; j<response.data[i][1].length; j++) {
						if(!response.data[i][1][j].categories.data[0].catId) response.data[i][1][j].categories.data = [];
					}
				}
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});		
		
	}
	
};

module.exports = models;