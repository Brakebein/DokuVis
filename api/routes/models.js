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
		q += ' OPTIONAL MATCH (cobj)-[:P2]->(cmat:E57)';
		q += ' OPTIONAL MATCH (c)-[:P2]->(attr:E55)-[:P127]->(cat:E55)-[:P127]->(tcat)';
		q += ' WITH p, c, cobj, cfile, cmat, collect({catId: cat.content, catValue: cat.value, attrId: attr.content, attrValue: attr.value}) AS categories';
		
		q += ' RETURN p AS parent, collect({content: c.content, obj: cobj, file: cfile, material: cmat, categories: categories}) AS children';
		var params = {
			esub: 'e22_root_'+subprj
		};
		
		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.exception) { utils.error.neo4j(res, response, '#models.getTree'); return; }
				// null objekte rausfiltern und assoziatives Array für Kategorien
				//console.log(response.data);
				/*for(var i=0; i<response.data.length; i++) {
					for(var j=0; j<response.data[i][1].length; j++) {
						var catObj = {};
						for(var k=0; k<response.data[i][1][j].categories.data.length; k++) {
							if(!response.data[i][1][j].categories.data[k].catId) break;
							var cat = response.data[i][1][j].categories.data[k];
							catObj[cat.catId] = cat;
						}
						response.data[i][1][j].categories.data = catObj;
					}
				}*/
				var data = neo4j.extractTransactionData(response.results[0]);
				neo4j.removeEmptyArrays(data, 'categories', 'catId');
				res.json(neo4j.createHierarchy(data));
				//res.json(data);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});		
		
	},

	get: function (req, res) {
		var prj = req.params.id;

		var q = 'MATCH (obj:E73:'+prj+' {content: {e73id}})-[:P1]->(file:E75), \
			(obj)<-[:P106]-(:E36)-[:P138]->(e22) \
			OPTIONAL MATCH (e22)-[:P2]->(attr:E55)-[:P127]->(cat:E55)-[:P127]->(:E55 {content:"category"}) \
			RETURN obj, file, collect({catId: cat.content, catValue: cat.value, attrId: attr.content, attrValue: attr.value, attrColor: attr.color}) AS categories';
		
		var params = {
			e73id: req.params.modelId
		};
		
		neo4j.transaction(q, params)
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#models.get'); return; }
				var data = neo4j.extractTransactionData(response.results[0]);
				neo4j.removeEmptyArrays(data, 'categories', 'catId');
				res.json(data[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},
	
	update: function (req, res) {
		var prj = req.params.id;
		
		var q = 'MATCH (obj:E73:'+prj+' {content: {e73id}})\
			SET obj += {props}\
			RETURN obj';
		
		var params = {
			e73id: req.params.modelId,
			props: {
				name: req.body.obj.name,
				unit: req.body.obj.unit
			}
		};
		
		neo4j.transaction(q, params)
			.then(function (response) {
				if(response.errors.length) {utils.error.neo4j(res, response, '#models.update'); return; }
				res.json(response);
			})
			.catch(function (err) {
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

		neo4j.transactionArray(statements).then(function (response) {
			if(response.errors.length) { utils.error.neo4j(res, response, '#models.insert'); return; }
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
				if(response.errors.length) { utils.error.neo4j(res, response, '#models.assignCategory'); return; }
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},

	getConnections: function (req, res) {
		var prj = req.params.id;
		var q = 'MATCH (e73:E73:'+prj+' {content: {modelId}})<-[:P106]-(:E36)-[:P138]->(:E22)<-[:P138]-(:E36)<-[:P70]-(e31:E31) \
			RETURN e31.content AS sourceId';
		var params = {
			modelId: req.params.modelId
		};

		neo4j.transaction(q, params)
			.then(function(response) {
				if(response.errors.length) { utils.error.neo4j(res, response, '#source.getConnectionsInverse'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			}).catch(function(err) {
			utils.error.neo4j(res, err, '#cypher');
		});
	}
	
};

module.exports = models;
