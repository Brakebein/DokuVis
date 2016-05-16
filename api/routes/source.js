var utils = require('../utils');
var neo4j = require('../neo4j-request');

var source = {
	
	getAll: function (req, res) {
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
			OPTIONAL MATCH (e31)-[:P3]->(note:E62)-[:P3_1]->({content: "sourceComment"}) \
			OPTIONAL MATCH (e31)-[:P3]->(repros:E62)-[:P3_1]->({content: "sourceRepros"}) \
			OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41), \
				(e78)-[:P52]->(:E40)-[:P131]->(inst:E82) \
			OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG) \
			OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}) \
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
				note.value AS note, \
				repros.value AS repros, \
				collect(tag.content) as tags, \
				count(ce33) AS commentLength';
		var params = {
			subprj: subprj === 'master' ? prj : subprj
		};
		
		//neo4j.cypher(q, params)
		neo4j.transaction([{statement: q, parameters: params}])
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#source.getAll'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},

	get: function (req, res) {
		var prj = req.params.id;
		var subprj = req.params.subprj;
		var q = 'MATCH (e31:E31:'+prj+' {content: {sourceId}})-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"}), \
			(e31)-[:P102]->(title:E35), \
			(e31)-[:P1]->(file:E75), \
			(e31)<-[:P94]-(e65:E65) \
			OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"}) \
			OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82) \
			OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48) \
			OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61) \
			OPTIONAL MATCH (e31)-[:P48]->(archivenr:E42) \
			OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36) \
			OPTIONAL MATCH (e31)-[:P3]->(note:E62)-[:P3_1]->({content: "sourceComment"}) \
			OPTIONAL MATCH (e31)-[:P3]->(repros:E62)-[:P3_1]->({content: "sourceRepros"}) \
			OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41), \
				(e78)-[:P52]->(:E40)-[:P131]->(inst:E82) \
			OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG) \
			OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}) \
			RETURN e31.content AS eid, \
				id(e31) AS nId, \
				type.content AS type, \
				title.content AS title, \
				primary.content AS primary, \
				aname.content AS author, \
				pname.content AS place, \
				date.content AS date, \
				{identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive, \
				{name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb, link: file.link} AS file, \
				plan3d.content AS plan3d, \
				note.value AS note, \
				repros.value AS repros, \
				collect(tag.content) as tags, \
				count(ce33) AS commentLength';
		var params = {
			subprj: subprj === 'master' ? prj : subprj,
			sourceId: req.params.sourceId
		};

		//neo4j.cypher(q, params)
		neo4j.transaction([{statement: q, parameters: params}])
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#source.get'); return; }
				var results = neo4j.extractTransactionData(response.results[0]);
				if(results.length)
					res.json(results[0]);
				else
					res.json(null);
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},

	createConnections: function (req, res) {
		var prj = req.params.id;
		var q = 'MATCH (e31:E31:'+prj+' {content: {sourceId}})-[:P70]->(e36:E36), \
			(e73:E73:'+prj+')<-[:P106]-(:E36)-[:P138]->(e22:E22) \
			WHERE e73.content IN {targets} \
			MERGE (e36)-[r:P138]->(e22) \
			RETURN count(r) AS count';
		var params = {
			sourceId: req.params.sourceId,
			targets: req.body.targets
		};

		neo4j.transaction([{statement: q, parameters: params}])
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#source.createConnections'); return; }
				res.json(neo4j.extractTransactionData(response.results[0])[0]);
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},

	getConnections: function (req, res) {
		var prj = req.params.id;
		var q = 'MATCH (e31:E31:'+prj+' {content: {sourceId}})-[:P70]->(:E36)-[:P138]->(:E22)<-[:P138]-(e36:E36)-[:P2]->(:E55 {content: "model"}), \
			(e36)-[:P106]->(e73:E73) \
			RETURN e73.content AS meshId';
		var params = {
			sourceId: req.params.sourceId
		};

		neo4j.transaction([{statement: q, parameters: params}])
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#source.getConnections'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}
	
};

module.exports = source; 