var webglServices = angular.module('webglServices', []);

webglServices.factory('neo4jRequest', ['$http', 'Utilities',
	function($http, Utilities) {
		
		var cypherUrl = 'http://localhost:7474/db/data/cypher';
		var phpUrl = 'php/neo4jrequest.php';
		
		var requests = {};
		
		/**
		  * Projekte
		*/
		// alle initialen Knoten anlegen
		requests.createInitProjectNodes = function(prj) {
			return $http.post(phpUrl, {
				query: 
					'CREATE (proj:E7:'+prj+' {content: "'+prj+'"}), \
					(root:E22:'+prj+' {content:"e22_root"}), \
					(tplan:E55:'+prj+' {content:"plan"}), \
					(tpic:E55:'+prj+' {content:"picture"}), \
					(ttext:E55:'+prj+' {content:"text"}), \
					(tscreen:E55:'+prj+' {content:"screenshot"}),\
					(tscomment:E55:'+prj+' {content:"screenshotComment"}), \
					(tmodel:E55:'+prj+' {content:"model"}), \
					(tproj:E55:'+prj+' {content:"project"}), \
					(proj)-[:P2]->(tproj)',
				params: {}
			});
		};
		// constraint anlegen
		requests.createProjectConstraint = function(prj) {
			return $http.post(phpUrl, {
				query: 'CREATE CONSTRAINT ON (p:'+prj+') ASSERT p.content IS UNIQUE',
				params: {}
			});
		};
		// constraint löschen
		requests.dropProjectConstraint = function(prj) {
			return $http.post(phpUrl, {
				query: 'DROP CONSTRAINT ON (p:'+prj+') ASSERT p.content IS UNIQUE',
				params: {}
			});
		};
		// alle Knoten und Kanten des Projekts löschen
		requests.deleteAllProjectNodes = function(prj) {
			return $http.post(phpUrl, {
				query: 
					'MATCH (n:'+prj+') \
					OPTIONAL MATCH (:'+prj+')-[r]-() \
					DELETE r,n',
				params: {}
			});
		};
		
		/**
		  * allgemeine Infos
		*/
		// alle Infos abrufen
		requests.getProjInfos = function(prj) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {proj}})-[r:P3]->(n:E62) \
					RETURN n.content AS info, n.tid AS id, r.order AS order',
				params: {
					proj: prj
				}
			});
		};
		// allgemeine Info hinzufügen
		requests.addProjInfo = function(prj, info) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {proj}}) \
					OPTIONAL MATCH (p)-[r:P3]->(:E62) \
					WITH p, count(r) AS anz \
					CREATE (p)-[:P3 {order: anz}]->(n:E62:'+prj+' {content: {content}, tid: {tid}}) \
					RETURN n',
				params: {
					proj: prj,
					tid: new Utilities.Base62().encode(new Date().getTime()),
					content: info
				}
			});
		};
		// allgemeine Info löschen
		requests.removeProjInfo = function(prj, tid) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {proj}})-[r:P3]->(n:E62 {tid: {tid}}), \
					(p)-[r2:P3]->(n2:E62) \
					WHERE r2.order > r.order \
					SET r2.order -= 1 \
					DELETE r,n',
				params: {
					proj: prj,
					tid: tid
				}
			});
		};
		// Info Reihenfolge tauschen
		requests.swapProjInfoOrder = function(prj, tid1, tid2) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {proj}}), \
					(p)-[r1:P3]->(n1:E62 {tid: {tid1}}), \
					(p)-[r2:P3]->(n2:E62 {tid: {tid2}}) \
					WITH p, r1, r2, n1, n2, r1.order AS o1, r2.order AS o2 \
					SET r1.order = o2, r2.order = o1 \
					RETURN p',
				params: {
					proj: prj,
					tid1: tid1,
					tid2: tid2
				}
			});
		};
		
		
		//
		requests.insertObject = function(name) {
			return $http.post(cypherUrl, {
				query: 'MERGE (e22:E22 {content:"e22_'+name+'"})'
					+' MERGE (e36:E36 {content:"e36_'+name+'"})'
					+' MERGE (e73:E73 {content:"e73_'+name+'"})'
					+' MERGE (e75:E75 {content:"'+name+'.obj", type:"obj"})'
					+' MERGE (e22)<-[:P138]-(e36)'
					+' MERGE (e36)-[:P106]->(e73)'
					+' MERGE (e73)-[:P1]->(e75)',
				params: {}
			});
		};
		
		requests.insertPlan = function(name, title) {
			return $http.post(cypherUrl, {
				query: 'MATCH (e21:E21 {content:"e21_conrad_schick"})'
					+' MERGE (e31:E31 {content:"e31_'+name+'"})'
					+' MERGE (e36:E36 {content:"e36_'+name+'"})'
					+' MERGE (e73:E73 {content:"e73_'+name+'"})'
					+' MERGE (e75:E75 {content:"'+name+'.obj", type:"obj"})'
					+' MERGE (jpg:E75 {content:"'+name+'.jpg", type:"jpg"})'
					+' MERGE (e35:E35 {content:"'+title+'"})'
					+' MERGE (e65:E65 {content:"e65_e31_'+name+'"})'
					+' MERGE (e31)<-[:P138]-(e36)'
					+' MERGE (e36)-[:P106]->(e73)'
					+' MERGE (e73)-[:P1]->(e75)'
					+' MERGE (e31)-[:P1]->(jpg)'
					+' MERGE (e31)-[:P102]->(e35)'
					+' MERGE (e31)<-[:P94]-(e65)'
					+' MERGE (e65)-[:P14]->(e21)',
				params: {}
			});
		};
		
		requests.getAllObj = function() {
			return $http.post(cypherUrl, {
				query: 'MATCH (e22:E22)<-[:P138]-(:E36)-[:P106]->(:E73)-[:P1]->(e75:E75)'
					+' RETURN e22.content AS eid, e75.content AS file',
				params: {}
			});
		};
		
		requests.getAllPlanObj = function() {
			return $http.post(cypherUrl, {
				query: 'MATCH (e31:E31)<-[:P138]-(:E36)-[:P106]->(:E73)-[:P1]->(e75:E75)'
					+' RETURN e31.content AS eid, e75.content AS file',
				params: {}
			});
		};
		
		requests.connectPlanToObj = function(plan, obj) {
			return $http.post(cypherUrl, {
				query: 'MATCH (e31:E31 {content:"e31_'+plan+'"}),'
					+' (e22:E22 {content:"e22_'+obj+'"})'
					+' MERGE (e31)-[:P70]->(e22)',
				params: {}
			});
		};
		
		requests.getPlansFromObject = function(obj) {
			return $http.post(cypherUrl, {
				query: 'MATCH (:E22 {content:"'+obj+'"})<-[:P70]-(e31:E31)-[:P1]->(jpg:E75),'
					+' (e31)<-[:P138]-(:E36)-[:P106]->(:E73)-[:P1]->(obj:E75),'
					+' (e31)-[:P102]->(title:E35),'
					+' (e31)<-[:P94]-(:E65)-[:P14]->(e21)-[:P131]->(author:E82)'
					+' RETURN e31.content AS eid, jpg.content AS jpg, obj.content AS obj, title.content AS title, author.content AS author',
				params: {}
			});
		};
		
		requests.getObjFromPlan = function(plan) {
			return $http.post(cypherUrl, {
				query: 'MATCH (:E31 {content:"'+plan+'"})-[:P70]->(e22:E22)'
					+' RETURN e22.content AS eid',
				params: {}
			});
		};
		
		requests.getAllPlanData = function(prj) {
			/*return $http.post(phpUrl, {
				query: 'MATCH (e31:E31)-[:P1]->(jpg:E75),'
					+' (e31)<-[:P138]-(:E36)-[:P106]->(:E73)-[:P1]->(obj:E75),'
					+' (e31)-[:P102]->(title:E35),'
					+' (e31)<-[:P94]-(:E65)-[:P14]->(e21)-[:P131]->(author:E82)'
					+' RETURN e31.content AS eid, jpg.content AS jpg, obj.content AS obj, title.content AS title, author.content AS author',
				params: {}
			});*/
			return $http.post(phpUrl, {
				query: 'MATCH (e31:E31:'+prj+')-[:P2]->(type:E55 {content: "plan"}),'
					+' (e31)-[:P102]->(title:E35),'
					+' (e31)-[:P1]->(file:E75),'
					+' (e31)<-[:P94]-(e65:E65)'
					+' OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82)'
					+' OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48)'
					+' OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61)'
					+' OPTIONAL MATCH (e31)-[:P48]->(archive:E42)'
					+' RETURN e31.content AS eid, type.content AS type, title.content AS title, aname.content AS author, pname.content AS place, date.content AS date, archive.content AS archive, {name: file.content, path: file.path} AS file',
				params: {}
			});
		};
		
		requests.getAllDocuments = function(prj) {
			console.log('service getAllDocuments', prj);
			return $http.post(phpUrl, {
				query: 'MATCH (e31:E31:'+prj+')-[:P2]->(type:E55),'
					+' (e31)-[:P102]->(title:E35),'
					+' (e31)-[:P1]->(file:E75),'
					+' (e31)<-[:P94]-(e65:E65)'
					+' OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82)'
					+' OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48)'
					+' OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61)'
					+' OPTIONAL MATCH (e31)-[:P48]->(archive:E42)'
					+' OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36)'
					+' OPTIONAL MATCH (e31)-[:P3]->(comment:E62)'
					+' RETURN e31.content AS eid, type.content AS type, title.content AS title, aname.content AS author, pname.content AS place, date.content AS date, archive.content AS archive, {name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb} AS file, plan3d.content AS plan3d, comment.content AS comment',
				params: {}
			});
		};
		
		requests.getAttached3DPlan = function(prj, e31content, e36content) {
			return $http.post(phpUrl, {
				query: 'MATCH (:E31:'+prj+' {content: {e31id}})<-[:P138]-(:E36:'+prj+' {content: {e36id}})-[:P106]->(e73:E73)-[:P1]->(e75:E75)'
					+' RETURN e73 AS object, e75 AS file',
				params: {
					e31id: e31content,
					e36id: e36content
				}
			});
		};
		
		// alle Institutionen mit Archiven
		requests.getArchives = function(prj) {
			return $http.post(phpUrl, {
				query: 
					'MATCH (e78:E78:'+prj+')-[:P1]-(e41:E41), \
					(e78)-[:P52]->(:E40)-[:P131]->(e82:E82) \
					RETURN e78.content AS collection, e41.content AS collectionName, e82.content AS institutionName',
				params: {}
			});
		};
		
		// alte Suchanfrage für autocomplete
		requests.searchForExistingNodes = function(prj, label, input) {
			return $http.post(phpUrl, {
				query: 'MATCH (n:'+label+':'+prj+')'
					+' WHERE n.content =~ "(?i).*'+input+'.*"'
					+' RETURN n.content AS content',
				params: {}
			});
		};
		
		// neue Suchanfrage für typeahead
		requests.getAllLabelProps = function(prj, label, prop) {
			return $http.post(phpUrl, {
				query:
					'MATCH (n:'+label+':'+prj+') \
					RETURN n.'+prop+' AS content',
				params: {}
			});
		};
		
		requests.findNodeWithSpecificContent = function(prj, label, input) {
			return $http.post(phpUrl, {
				query: 'MATCH (n:'+label+':'+prj+')'
					+' WHERE n.content =~ "(?i)'+input+'"'
					+' RETURN n.content AS content',
				params: {}
			});
		};
		
		requests.testInputsForExistingNodes = function(values) {
			var q = '', r = 'RETURN ';
			for(var i=0; i<values.length; i++) {
				q += 'OPTIONAL MATCH (n'+i+':'+values[i].label+' {content:"'+values[i].content+'"})<--(m'+i+') ';
				r += 'm'+i+'.content';
				if(i < values.length-1)
					r += ', ';
			}
			console.log(q+r);
			return $http.post(phpUrl, {
				query: q + r,
				params: {}
			});
		};
		
		// Einfügen der Quelle
		requests.insertDocument = function(prj, formData) {
			var ts = new Utilities.Base62().encode(new Date().getTime());
			
			var q = '';
			q += 'MATCH (e55:E55:'+prj+' {content: {sourceType}})';
			if(formData.archive.length > 0) {
				q += ', (e78:E78:'+prj+' {content: {archive}})';
			}
			
			q += ' CREATE (e31:E31:'+prj+' {content: "e31_"+{newFileName}})-[:P102]->(e35:E35:'+prj+' {content: {title}})';
			
			q += ' CREATE (e31)-[:P1]->(e75:E75:'+prj+' {content: {newFileName}, type: {fileType}, thumb: "t_"+{pureNewFileName}+".jpg", original: {oldFileName}, path: {path}})';
			
			q += ' CREATE (e31)-[:P2]->(e55)';
			
			q += ' CREATE (e31)<-[:P94]-(e65:E65:'+prj+' {content: "e65_e31_"+{newFileName}})';
			
			q += ' CREATE (e84:E84'+prj+' {content: "e84_e31_"+{newFileName}})';
			
			if(formData.sourceType == 'text') {
				q += ' CREATE (e31)-[:P70]->(e33:E33:'+prj+' {content: "e33_e31_"+{newFileName}})';
				q += ' MERGE (e33)-[:P72]->(e56:E56:'+prj+' {content: {language}})';
				q += ' SET e75.contentDisplay = {pages}';
			}
			if(formData.sourceType == 'plan' || formData.sourceType == 'picture') {
				q += ' CREATE (e31)-[:P70]->(e36:E36:'+prj+' {content: "e36_e31_"+{newFileName}})';
				q += ' SET e75.contentDisplay = {pureNewFileName}+"_1024.jpg"';
			}
			if(formData.archive.length > 0) {
				q += ' CREATE (e78)-[:P46]->(e84)';
			}
			if(formData.archiveNr.length > 0) {
				q += ' MERGE (e42:E42:'+prj+' {content: {archiveNr}})';
				q += ' MERGE (e31)-[:P48]->(e42)';
			}
			if(formData.author.length > 0) {
				q += ' MERGE (e82:E82:'+prj+' {content: {author}})<-[:P131]-(e21:E21:'+prj+')';
				q += ' ON CREATE SET e21.content = "e21_'+ts+'_'+formData.author.replace(/ /g, "_")+'"';
				q += ' CREATE (e65)-[:P14]->(e21)';
			}
			if(formData.creationPlace.length > 0) {
				q += ' MERGE (e48:E48:'+prj+' {content: {creationPlace}})<-[:P87]-(e53:E53:'+prj+')';
				q += ' ON CREATE SET e53.content = "e53_'+ts+'_'+formData.creationPlace.replace(/ /g, "_")+'"';
				q += ' CREATE (e65)-[:P7]->(e53)';
			}
			if(formData.creationDate.length > 0) {
				q += ' MERGE (e61:E61:'+prj+' {content: {creationDate}})';
				q += ' CREATE (e61)<-[:P82]-(e52:E52:'+prj+' {content: "e52_e65_e31_"+{newFileName}})<-[:P4]-(e65)';
			}
			if(formData.comment.length > 0) {
				q += ' CREATE (e31)-[:P3]->(e62:E62:'+prj+' {content: {comment}})';
			}
			q += ' RETURN e31';
			//console.log(q);
			
			return $http.post(phpUrl, {
				query: q,
				params: formData
			});
		};
		
		requests.insertModel = function(prj, formData, objData) {
			var q = '';
			if(objData.parentid)
				q += 'MATCH (parent:E22:'+prj+' {content: {parentid}}) ';
			else
				q += 'MATCH (parent:E22:'+prj+' {content: "e22_root"}) ';
			
			q += ',(tmodel:E55:'+prj+' {content: "model"}) ';
			
			q += 'CREATE (e22:E22:'+prj+' {content: "e22_"+{contentid}})';
			q += ' CREATE (parent)-[:P46]->(e22)';
			
			//if(objData.type == 'object') {
			q += ' CREATE (e22)<-[:P138]-(e36:E36:'+prj+' {content: "e36_"+{contentid}})-[:P2]->(tmodel)';
			q += ' CREATE (e73:E73:'+prj+' {e73content})-[:P1]->(e75:E75:'+prj+' {e75content})';
			q += ' CREATE (e36)-[:P106]->(e73)';
			//}
			q += ' RETURN e22';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
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
						content: formData.tid + '_' + objData.geometryUrl.replace(/ /g, "_") + '.ctm',
						path: formData.path,
						type: formData.fileType,
						original: formData.newFileName,
						geometryId: objData.geometryUrl
					}
				}
			});
		};
		
		requests.getAllModels = function(prj) {
			var q = 'MATCH (e22:E22:'+prj+')<-[:P138]-(:E36)-[:P106]->(e73:E73)-[:P1]->(e75:E75)';
			q += ' RETURN e73 AS object, e75 AS file';
			
			return $http.post(phpUrl, {
				query: q,
				params: {}
			});
		};
		
		requests.getModelsWithChildren = function(prj) {
			return $http.post(phpUrl, {
				query: 'MATCH (p:E22:'+prj+')-[:P46]->(c:E22)<-[:P138]-(:E36)-[:P106]->(cobj:E73)-[:P1]->(cfile:E75)'
					+ ' RETURN {parent: p} AS parent, collect({child: c, obj: cobj, file: cfile}) AS children',
				params: {}
			});
		};
		
		requests.attach3DPlan = function(prj, formData, objData, parent) {
			//console.log(prj, formData, objData, parent);
			var q = '';
			q += 'MATCH (parent:E31:'+prj+' {content: {parentid}})';
			q += ',(tmodel:E55:'+prj+' {content: "model"})';
			
			q += ' CREATE (parent)<-[:P138]-(e36:E36:'+prj+' {content: {contentid}})-[:P2]->(tmodel)';
			q += ' CREATE (e73:E73:'+prj+' {e73content})-[:P1]->(e75:E75:'+prj+' {e75content})';
			q += ' CREATE (e36)-[:P106]->(e73)';
			
			q += ' RETURN e73';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					contentid: 'e36_' + formData.pureNewFileName,
					parentid: parent.eid,
					e73content: {
						content: 'e73_' + formData.pureNewFileName,
						name: objData.name,
						type: objData.type,
						materialName: objData.materialName,
						materialMap: objData.materialMap,
						materialMapPath: formData.path + 'maps/'
					},
					e75content: {
						content: objData.file,
						path: formData.path
					}
				}
			});
		};
		
		requests.insertScreenshot = function(prj, objData, markers) {
			
			var q = '';
			q += 'MATCH (e22:E22:'+prj+' {content: {e22id}})';
			q += ',(tscreen:E55:'+prj+' {content: "screenshot"})';
			q += ',(tscomment:E55:'+prj+' {content: "screenshotComment"})';
			
			q += ' CREATE (e36:E36:'+prj+' {e36content})-[:P2]->(tscreen)';
			q += ' CREATE (e36)-[:P1]->(e75:E75:'+prj+' {e75content})';
			q += ' CREATE (e36)-[:P138]->(e22)';
			
			for(var i=0; i<markers.length; i++) {
				q += ' CREATE (e36)-[:P106]->(:E90:'+prj+' {content: "'+markers[i].id+'", u: '+markers[i].u+', v: '+markers[i].v+'})-[:P3]->(:E62:'+prj+' {content: "'+markers[i].comment+'"})-[:P3_1]->(tscomment)';
			}
			
			q += ' RETURN e36';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					e22id: 'e22_root',
					e36content: {
						content: 'e36_' + objData.filename,
						cameraCenter: objData.data.cameraCenter,
						cameraFOV: objData.data.cameraFOV,
						cameraMatrix: objData.data.cameraMatrix
					},
					e75content: {
						content: objData.filename,
						path: objData.path,
						width: objData.data.width,
						height: objData.data.height
					}
				}
			});
		};
		
		requests.insertScreenshotMarkers = function(prj, params, markers) {
			
			var q = '';
			q += 'MATCH (e36:E36:'+prj+' {content: {e36id}})';
			q += ',(tscomment:E55:'+prj+' {content: "screenshotComment"})';
			
			for(var i=0; i<markers.length; i++) {
				q += ' CREATE (e36)-[:P106]->(:E90:'+prj+' {content: "'+markers[i].id+'", u: '+markers[i].u+', v: '+markers[i].v+'})-[:P3]->(:E62:'+prj+' {content: "'+markers[i].comment+'"})-[:P3_1]->(tscomment)';
			}
			
			q += ' RETURN e36';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					e36id: params.data.id
				}
			});
		};
		
		requests.getScreenshotsWithMarkers = function(prj) {
			var q = '';
			q += 'MATCH (e22:E22:'+prj+')<-[P138]-(e36:E36:'+prj+')-[:P2]->(:E55 {content: "screenshot"})';
			q += ',(e36)-[:P1]->(e75:E75)'
			q += ',(e36)-[:P106]->(marker:E90)-[:P3]->(comment:E62)'
			
			//q += ' RETURN {id: e36.content, file: e75.content, path: e75.path, width: e75.width, height: e75.height, markers: collect({id: marker.content, u: marker.u, v: marker.v, comment: comment.content})} AS screenshots';
			q += ' RETURN e36.content AS id, e75.content AS file, e75.path AS path, e75.width AS width, e75.height AS height, collect({id: marker.content, u: marker.u, v: marker.v, comment: comment.content}) AS markers';
			
			return $http.post(phpUrl, {
				query: q,
				params: {}
			});
		};
		
		return requests;
		
	}]);

webglServices.factory('phpRequest',
	function($http) {
	
		var requests = {};
		
		requests.saveBase64Image = function(path, filename, base64) {
			return $http.post('php/saveBase64Image.php', {
				path: path,
				filename: filename,
				imgdata: base64
			});
		};
		
		requests.createProjectFolders = function(prj) {
			return $http.post('php/createProjectFolders.php', {
				project: prj
			});
		};
		
		requests.deleteProjectFolders = function(prj) {
			return $http.post('php/deleteProjectFolders.php', {
				project: prj
			});
		};
		
		requests.getSvgContent = function(file) {
			return $http.post('php/getSvgContent.php', {
				file: file
			});
		};
		
		return requests;
		
	});


webglServices.factory('mysqlRequest',
	function($http) {
	
		var requests = {};
		
		/**
		  * Projekte
		 */
		// neues Projekt anlegen
		requests.newProjectEntry = function(proj, name, desc) {
			return $http.post('php/mysql/newProjectEntry.php', {
				proj: proj,
				name: name,
				description: desc
			});
		};
		// Projekt Info
		requests.getProjectEntry = function(proj) {
			return $http.post('php/mysql/getProjectEntry.php', {
				proj: proj
			});
		};
		// Projekt löschen
		requests.removeProjectEntry = function(proj) {
			return $http.post('php/mysql/removeProjectEntry.php', {
				proj: proj
			});
		};
		// alle Projekte auflisten
		requests.getAllProjects = function() {
			return $http.post('php/mysql/getAllProjects.php', {});
		};
		// Projekt editieren
		requests.updateProjectDescription = function(desc,id) {
			return $http.post('php/mysql/updateProjectDescription.php', {
				pid: id,
				description: desc
			});
		};
		
		requests.getAllStaff = function() {
			return $http.post('php/mysql/getAllStaff.php', {});
		};
		
		requests.addNewStaff = function(name,surname,mail,role) {
			return $http.post('php/mysql/addNewStaff.php', {
				name: name,
				surname:surname,
				mail:mail,
				role:role
			});
		};
		
		requests.updateName = function(name,id) {
			return $http.post('php/mysql/updateName.php', {
				name: name,
				sid: id,
				
			});
			
		};
		
		requests.updateSurname = function(surname,id) {
			return $http.post('php/mysql/updateSurname.php', {
				surname: surname,
				sid: id,
				
			});
			
		};
		
		requests.updateMail = function(mail,id) {
			return $http.post('php/mysql/updateMail.php', {
				mail: mail,
				sid: id,
				
			});
			
		};
		
		requests.updateRole = function(role,id) {
			return $http.post('php/mysql/updateRame.php', {
				role: role,
				sid: id,
				
			});
			
		};
		
		
		requests.removeStaff = function(id) {
			return $http.post('php/mysql/removeStaff.php', {
				sid: id
			});
		};
				
		return requests;
		
	});
	
	
webglServices.factory('neo4jExtraction',
	function() {
		
		var f = {};
		
		f.extractData = function(data) {
			var results = [];
			for(var i=0; i<data.data.length; i++) {
				var object = new Object();
				for(var j=0; j<data.columns.length; j++) {
					if(data.data[i][j] == null)
						//object[data.columns[j]] = 'unbekannt';
						object[data.columns[j]] = null;
					else
						object[data.columns[j]] = data.data[i][j].data;
						//object[data.columns[j]] = data.data[i][j].data.content;
				}
				results.push(object);
			}
			return results;
		};
		
		f.cleanData = function(data, selected) {
			selected = selected || false;
			var results = [];
			for(var i=0; i<data.data.length; i++) {
				var obj = new Object();
				for(var j=0; j<data.columns.length; j++) {
					if(data.data[i][j] == null)
						//obj[data.columns[j]] = 'unbekannt';
						obj[data.columns[j]] = null;
					else
						obj[data.columns[j]] = data.data[i][j];
				}
				if(selected)
					obj.selected = false;
				results.push(obj);
			}
			return results;
		};
		
		f.createHierarchy = function(data) {
			var results = [];
			for(var i=0, l=data.data.length; i<l; i++) {
				var parent = {};
				/*parent.file = data.data[i][0].file.data;
				parent.obj = data.data[i][0].obj.data;*/
				parent.content = data.data[i][0].parent.data.content;
				parent.children = [];
				for(var j=0, m=data.data[i][1].length; j<m; j++) {
					var child = {};
					child.file = data.data[i][1][j].file.data;
					child.obj = data.data[i][1][j].obj.data;
					child.content = data.data[i][1][j].child.data.content;
					child.children = [];
					parent.children.push(child);
				}
				results.push(parent);
			}
			for(var i=0; i<results.length; i++) {
				for(var j=0, m=results.length; j<m; j++) {
					if(i===j) continue;
					var p = getElementInHierarchy(results[j], results[i].content);
					if(p !== undefined) {
						p.children = results[i].children;
						results.splice(i,1);
						i--;
						break;
					}
				}
			}
			return results;
		};
		
		function getElementInHierarchy(node, content) {
			if(node.content === content) return node;
			for(var i=0, l=node.children.length; i<l; i++) {
				var obj = getElementInHierarchy(node.children[i], content);
				if(obj !== undefined) return obj;
			}
			return undefined;
		}
		
		return f;
		
	});

webglServices.factory('Utilities',
	function() {
		
		var f = {};
		
		/**
		  * Base62 encoder/decoder
		*/
		f.Base62 = function() {
			var DEFAULT_CHARACTER_SET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
			this.characterSet = DEFAULT_CHARACTER_SET;
		};
		f.Base62.prototype.encode = function(integer) {
			if(integer === 0) return '0';
			var s = '';
			while(integer > 0) {
				s = this.characterSet[integer % 62] + s;
				integer = Math.floor(integer/62);
			}
			return s;
		};
		f.Base62.prototype.decode = function(base62String) {
			var val = 0, base62Chars = base62String.split("").reverse();
			base62Chars.forEach(function(character, index) {
				val += this.characterSet.indexOf(character) * Math.pow(62, index);
			});
			return val;
		};
		f.Base62.prototype.setCharacterSet = function(chars) {
			var arrayOfChars = chars.split(""), uniqueCharacters = [];

			if(arrayOfChars.length != 62) throw Error("You must supply 62 characters");

			arrayOfChars.forEach(function(char){
				if(!~uniqueCharacters.indexOf(char)) uniqueCharacters.push(char);
			});

			if(uniqueCharacters.length != 62) throw Error("You must use unique characters.");

			this.characterSet = arrayOfChars;
		};
		
		/**
		  * generate unique id from timestamp
		*/
		f.getUniqueId = function() {
			return new f.Base62().encode(new Date().getTime());
		};
		
		/**
		  * sleep function - application on hold
		*/
		f.sleep = function(milliseconds) {
			var start = new Date().getTime();
			for (var i = 0; i < 1e7; i++) {
				if ((new Date().getTime() - start) > milliseconds){
					break;
				}
			}
		};
		
		/**
		  * @desc wait until condition is met
		  * @param
		  *	  test - function that returns a value
		  *	  expectedValue - value of the test function we are waiting for
		  *	  msec - delay between the calls to test
		  *	  callback - function to execute wehen the condition is met
		  * @return nothing
		*/
		 f.waitfor = function(test, expectedValue, msec, params, callback) {
			// check if condition met. if not, re-check later
			while(test() !== expectedValue) {
				setTimeout(function() {
					waitfor(test, expectedValue, msec, params, callback);
				}, msec);
				return;
			}
			// condition finally met. callback() can be executed
			callback(params);
		}
		
		/**
		  * extracts data from neo4j response object
		  * if return values are nodes
		*/
		f.extractNeo4jData = function(data) {
			var results = [];
			for(var i=0; i<data.data.length; i++) {
				var object = new Object();
				for(var j=0; j<data.columns.length; j++) {
					if(data.data[i][j] == null)
						//object[data.columns[j]] = 'unbekannt';
						object[data.columns[j]] = null;
					else
						object[data.columns[j]] = data.data[i][j].data;
						//object[data.columns[j]] = data.data[i][j].data.content;
				}
				results.push(object);
			}
			return results;
		};
		
		/**
		  * extracts data from neo4j response object
		  * if return values are normal values or objects
		*/
		f.cleanNeo4jData = function(data, selected) {
			selected = selected || false;
			var results = [];
			for(var i=0; i<data.data.length; i++) {
				var obj = new Object();
				for(var j=0; j<data.columns.length; j++) {
					if(data.data[i][j] == null)
						//obj[data.columns[j]] = 'unbekannt';
						obj[data.columns[j]] = null;
					else
						obj[data.columns[j]] = data.data[i][j];
				}
				if(selected)
					obj.selected = false;
				results.push(obj);
			}
			return results;
		};
		
		f.createHierarchy = function(data) {
			var results = [];
			for(var i=0, l=data.data.length; i<l; i++) {
				var parent = {};
				/*parent.file = data.data[i][0].file.data;
				parent.obj = data.data[i][0].obj.data;*/
				parent.content = data.data[i][0].parent.data.content;
				parent.children = [];
				for(var j=0, m=data.data[i][1].length; j<m; j++) {
					var child = {};
					child.file = data.data[i][1][j].file.data;
					child.obj = data.data[i][1][j].obj.data;
					child.content = data.data[i][1][j].child.data.content;
					child.children = [];
					parent.children.push(child);
				}
				results.push(parent);
			}
			for(var i=0; i<results.length; i++) {
				for(var j=0, m=results.length; j<m; j++) {
					if(i===j) continue;
					var p = getElementInHierarchy(results[j], results[i].content);
					if(p !== undefined) {
						p.children = results[i].children;
						results.splice(i,1);
						i--;
						break;
					}
				}
			}
			return results;
		};
		
		return f;
		
	});

// Schnittstelle zwischen Three.js-Scope und Seite
webglServices.factory('webglInterface',
	function() {
		
		var wi = {};
		
		// Funktionsaufrufe vom Controller
		wi.callFunc = {};
		
		// Einstellungen
		wi.viewportSettings = {};
		//wi.viewportSettings.
		wi.unsafeSettings = {};
		
		// Listen
		wi.objects = [];
		wi.layerList = [];
		wi.layers = [];
		wi.hierarchList = [];
		
		var layerDict = {};
		
		wi.insertIntoLists = function(item) {
			item.children = [];
			item.visible = true;
			item.expand = false;
			insertIntoHierarchList(item);
			insertIntoLayerList(item);
		};
		
		wi.clearLists = function() {
			console.log('clearList');
			wi.layerLists = [];
			wi.layers = [];
			wi.hierarchList = [];
		};
		
		function insertIntoHierarchList(item) {
			var parentItem = findHierarchyObject(wi.hierarchList, item.parent);
			if(parentItem !== undefined) {
				item.parent = parentItem;
				parentItem.children.push(item);
			}
			else {
				item.parent = null;
				wi.hierarchList.push(item);
			}
		}
		
		function insertIntoLayerList(item) {
			wi.layerList.push(item);
			if(item.layer in layerDict) {
				layerDict[item.layer].count++;
			}
			else {
				layerDict[item.layer] = {count: 1};
				wi.layers.push({name: item.layer, visible: true, expand: false});
			}
		}
		
		function findHierarchyObject(list, id) {
			for(var i=0, l=list.length; i<l; i++) {
				var child = list[i];
				if(child.id === id) return child;
				var object = findHierarchyObject(child.children, id);
				if(object !== undefined) return object;
			}
			return undefined;
		}
		
		return wi;
		
	});