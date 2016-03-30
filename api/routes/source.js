var utils = require('../utils');
var neo4j = require('../neo4j-request');

var source = {
	
	getAll: function(req, res) {
		var prj = req.params.id;
		var subprj = req.params.subprj;
		var q = 'MATCH (e31:E31:'+prj+')-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"}), \
			(e31)<-[:P15]-(:E7 {content:{subprj}}), \
			(e31)-[:P102]->(title:E35), \
			(e31)-[:P1]->(file:E75), \
			(e31)<-[:P94]-(e65:E65) \
			OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"}) \
			OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82) \
			OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48) \
			OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61) \
			OPTIONAL MATCH (e31)-[:P48]->(archivenr:E42) \
			OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36) \
			OPTIONAL MATCH (e31)-[:P3]->(comment:E62) \
			OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41), \
			(e78)-[:P52]->(:E40)-[:P131]->(inst:E82) \
			OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG) \
			RETURN e31.content AS eid, \
				type.content AS type, \
				title.content AS title, \
				primary.content AS primary, \
				aname.content AS author, \
				pname.content AS place, \
				date.content AS date, \
				{identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive, \
				{name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb} AS file, \
				plan3d.content AS plan3d, \
				comment.value AS comment, \
				collect(tag.content) as tags';
		var params = {
			subprj: subprj === 'master' ? prj : subprj
		};
		
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#source.getAll'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};

module.exports = source; 