var config = require('../config');
var utils = require('../utils');
var neo4j = require('../neo4j-request');

var models = {
	
	getTree: function (req, res) {
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
		q += ' WITH p, c, cobj, cfile, collect({catId: cat.content, catValue: cat.value, attrId: attr.content, attrValue: attr.value}) AS categories';
		
		q += ' RETURN {parent: p} AS parent, collect({child: c, obj: cobj, file: cfile, categories: {data: categories}}) AS children';
		var params = {
			esub: 'e22_root_'+subprj
		};
		
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#models.getTree'); return; }
				// null objekte rausfiltern und assoziatives Array für Kategorien
				for(var i=0; i<response.data.length; i++) {
					for(var j=0; j<response.data[i][1].length; j++) {
						var catObj = {};
						for(var k=0; k<response.data[i][1][j].categories.data.length; k++) {
							if(!response.data[i][1][j].categories.data[k].catId) break;
							var cat = response.data[i][1][j].categories.data[k];
							catObj[cat.catId] = cat;
						}
						response.data[i][1][j].categories.data = catObj;
					}
				}
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});		
		
	},

	insert: function (req, res) {
		var prj = req.params.id;
		var subprj = req.params.subprj;
		var formData = req.body.formData;
		var statements = [];

		for(var i=0, l=req.body.objDatas.length; i<l; i++) {
			var objData = req.body.objDatas[i];

			var q = 'MATCH (tmodel:E55:' + prj + ' {content: "model"})';
			if (!objData.parentid)
				q += ', (parent:E22:' + prj + ' {content: "e22_root_"+{subprj}})';
			else
				q += ' MERGE (parent:E22:' + prj + ' {content: {parentid}})';

			q += ' MERGE (e22:E22:' + prj + ' {content: "e22_"+{contentid}})';
			q += ' MERGE (parent)-[:P46]->(e22)';

			q += ' CREATE (e22)<-[:P138]-(e36:E36:' + prj + ' {content: "e36_"+{contentid}})-[:P2]->(tmodel)';
			q += ' MERGE (e75:E75:' + prj + ' {content:{e75content}.content})';
			q += ' ON CREATE SET e75 = {e75content}';
			q += ' CREATE (e73:E73:' + prj + ' {e73content})-[:P1]->(e75)';
			q += ' CREATE (e36)-[:P106]->(e73)';

			q += ' RETURN e22.content';

			var params = {
				subprj: subprj,
				contentid: formData.tid + '_' + objData.id.replace(/ /g, "_"),
				parentid: objData.parentid ? 'e22_' + formData.tid + '_' + objData.parentid.replace(/ /g, "_") : '',
				e73content: {
				content: 'e73_' + formData.tid + '_' + objData.id.replace(/ /g, "_"),
					id: objData.id,
					name: objData.name,
					type: objData.type,
					layer: objData.layer,
					materialId: objData.material ? objData.material.id : '',
					materialName: objData.material ? objData.material.name : '',
					materialColor: objData.material ? objData.material.color : '',
					unit: objData.unit,
					upAxis: objData.upAxis,
					matrix: objData.matrix
				},
				e75content: {
					content: objData.geometryUrl.length > 0 ? formData.tid + '_' + objData.geometryUrl.replace(/ /g, "_") + '.ctm' : formData.newFileName ,
					path: formData.path,
					type: formData.fileType,
					original: formData.newFileName,
					geometryId: objData.geometryUrl
				}
			};

			statements.push({ statement: q, parameters: params });
		}

		neo4j.transaction(statements).then(function (response) {
			if(response.exception) { utils.error.neo4j(res, response, '#models.insert'); return; }
			res.json(response);
		}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	},
	
	assignCategory: function (req, res) {
		var prj = req.params.id;
		var q = 'MATCH (attrNew:E55:'+prj+' {content: {attrId}})-[:P127]->(cat:E55)-[:P127]->(:E55 {content: "category"}), \
			(e73:E73:'+prj+')<-[:P106]-(:E36)-[:P138]->(e22:E22) \
			WHERE e73.content IN {objects} \
			OPTIONAL MATCH (e22)-[tr:P2]->(attrOld:E55)-[:P127]->(cat) \
			DELETE tr';
			if(req.body.attrId) q += ' CREATE (e22)-[:P2]->(attrNew)';
			q += ' RETURN e22';
		var params = {
			objects: req.body.objects,
			attrId: req.body.attrId
		};
		
		neo4j.cypher(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#models.assignCategory'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};

module.exports = models;