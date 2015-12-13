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
					// project
				'CREATE (proj:E7:'+prj+' {content: {master}}), \
					(root:E22:'+prj+' {content:"e22_root_master"}), \
					(tproj:E55:'+prj+' {content:"project"}), \
					(tsubproj:E55:'+prj+' {content:"subproject"}), \
					(tpdesc:E55:'+prj+' {content:"projDesc"}), \
					(tpinfo:E55:'+prj+' {content:"projInfo"}), \
					(proj)-[:P2]->(tproj), \
					(proj)-[:P15]->(root), \
					(proj)-[:P2]->(tproj), '
					// source
				  + '(tsource:E55:'+prj+' {content:"sourceType"}), \
					(tplan:E55:'+prj+' {content:"plan"}), \
					(tpic:E55:'+prj+' {content:"picture"}), \
					(ttext:E55:'+prj+' {content:"text"}), \
					(tsource)<-[:P127]-(tplan), \
					(tsource)<-[:P127]-(tpic), \
					(tsource)<-[:P127]-(ttext), \
					(tprime:E55:'+prj+' {content:"primarySource"}), \
					(tsins:E55:'+prj+' {content:"sourceInsertion"}), \
					(tscomment:E55:'+prj+' {content:"sourceComment"}), '
					// screenshot
				  + '(tscreen:E55:'+prj+' {content:"screenshot"}),\
					(tscreencomment:E55:'+prj+' {content:"screenshotComment"}), '
					// model
				  + '(tmodel:E55:'+prj+' {content:"model"}), \
					(tmodelplan:E55:'+prj+' {content:"model/plan"}), '
					// personal
				  + '(tpproj:E55:'+prj+'{content:"projectPerson"}), \
					(tphist:E55:'+prj+'{content:"historicPerson"}), '
					// task
				  + '(ttask:E55:'+prj+'{content:"task"}), \
					(ttdesc:E55:'+prj+'{content:"taskDesc"}), \
					(ttprior:E55:'+prj+'{content:"taskPriority"}), \
					(ttphigh:E55:'+prj+'{content:"priority_high"}), \
					(ttpmedium:E55:'+prj+'{content:"priority_medium"}), \
					(ttplow:E55:'+prj+'{content:"priority_low"}), \
					(ttprior)<-[:P127]-(ttphigh), \
					(ttprior)<-[:P127]-(ttpmedium), \
					(ttprior)<-[:P127]-(ttplow), \
					(ttstatus:E55:'+prj+'{content:"taskStatus"}), \
					(ttsdone:E55:'+prj+'{content:"status_done"}), \
					(ttstodo:E55:'+prj+'{content:"status_todo"}), \
					(ttstatus)<-[:P127]-(ttsdone), \
					(ttstatus)<-[:P127]-(ttstodo)',
				params: {
					master: prj
				}
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
		
		//Tasks
		requests.addTask =  function(prj,subprj,taskID,ttitle,tdesc,teditorId,teditorName,tfrom,tto, tpriority, tstatus){

			
			var q = '';
			q += 'MATCH (sub:E7:'+prj+' {content: {e7id}})';
			q += ',(ttdesc:E55:'+prj+'{content: "taskDesc"})';
			q += ',(ttask:E55:'+prj+'{content: "task"})';
			q += ',(tprior:E55:'+prj+'{content: {priority}})';
			q += ',(tstatus:E55:'+prj+'{content: {status}})';
			q += 'CREATE (e7:E7:'+prj+'{content: {tID}})-[:P2]->(ttask)'; //Activity-->Task
			q += 'CREATE (e7)-[:P3]->(tdesc:E62:'+prj+'{content: {descId}, value: {desc}})-[:P3_1]->(taskDesc)'; 
			q += 'CREATE (e7)-[:P4]->(e52:E52:'+prj+' {content:{e52idDuration}})-[:P81]->(e61:E61:'+prj+'{from: {from}, to: {to}})'; 
			q += 'CREATE(e7)-[:P102]->(e35:E35:'+prj+' {value: {title}})'; 
			//Prüfen, ob editor existiert 
			q += 'CREATE(e7)-[:P14]->(editor:E21:'+prj+'{content: {editorId}, value: {editorName}})';
			q += 'CREATE(e7)-[:P2]->(tprior)';
			q += 'CREATE(e7)-[:P2]->(tstatus)';
			//ersteller+zeitstempel  -->Prüfen, ob ersteller schon existiert
			q += 'CREATE (e61n:E61:'+prj+'{content: {currentDate}})<-[:P82]-(e52n:E52:'+prj+'{content: {e52id}})<-[:P4]-(e65:E65:'+prj+' {value: {createTask}})-[:P14]->(e21:E21:'+prj+'{content: {logindata}})'; 
			q += 'CREATE (e65)-[:P94]->(e7)';
			q += 'CREATE (sub)-[:P9]->(e7)'
				
			// Match (sub:E7:Proj_pwLoMDJ {content: "subpwLoQXn"}), (editor:E21:Proj_pwLoMDJ) Where exists(editor.value) return editor
			/* MATCH (n:Proj_pwLoMDJ {content: "subpwLoQXn"})-[:P9*]->(task)-[:P14]->(editor)
			RETURN
			CASE editor.content
			WHEN '072c2b97-06db-e018-dc32-8722993017ca'
			THEN 1
			ELSE 'not found'
			END */
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					e7id: subprj,
					tID: taskID,
					desc: tdesc,
					descId: taskID + '_taskDesc',
					editorId: teditorId,
					editorName: teditorName,
					e52idDuration: 'e52_' + taskID + '_duration', //in Diagramm ändern
					e52id: 'e52_' + taskID,
					from: tfrom,
					to: tto,
					title: ttitle,
					createTask: 'e65_'+ taskID + '_creation',
					currentDate: new Date().getTime(), 
					priority: tpriority,
					status: tstatus,
					logindata: 'logindata_' +  new Date().getTime()
				}
			});	
					
		}
		
		requests.EditorExists = function(prj,subprj,editorId){
		var q = '';
		q += 'MATCH (n:'+prj+' {content: {subprj}})-[:P9*]->(task)-[:P14]->(editor {content: {editorId}})';
		q += 'WHERE EXISTS(editor.content)';
		q += 'return editor.content AS editorID';
		
		return $http.post(phpUrl, {
				query: q,
				params: {
					subprj: subprj,
					editorId: editorId
				}
			});
		}
		
		requests.addCommentToTask = function(prj,taskID,tcomment){
			var q = '';//KOMMENTAR -->logindata: Platzhalter für späteren Verfasser
			q += 'MATCH (task:E7:'+prj+'{content: {tID}})';
			q += 'CREATE (e62:E62:'+prj+'{value: {comment}})<-[:P3]-(e33:E33:'+prj+' {value: {lingObj}})<-[:P94]-(e65:E65:'+prj+' {value: {createComment}})-[:P14]->(e21:E21:'+prj+'{content: {logindata}})';
			q += 'CREATE (e52:E52:'+prj+'{value: {timeSpanID}})-[:P82]->(e61:E61:'+prj+'{value:{currentDate}})';
			q += 'CREATE (e65)-[:P4]->(e52)';
			q += 'CREATE (e33)-[:P129]->(task)';
			return $http.post(phpUrl, {
				query: q,
				params: {
					tID: taskID,
					comment: tcomment,
					currentDate: new Date().getTime(), 
					lingObj: 'e33_'+ taskID,
					createComment: 'e65_e33_' + taskID,
					timeSpanID:'e65_e33_e52' + taskID,
					logindata: 'logindata_' +  new Date().getTime() //vorläufige eindeutige ID, wird später durch eingeloggt person ersetzt
				}
			});
		}
		
		requests.getTasksFromSubproject = function(subprj){
			var q = '';
			q += 'MATCH (sub:E7 {content: {subprj}})-[:P9*]->(task:E7)';
			q += ',(task)-[:P102]->(title:E35)';
			q += ',(task)-[:P3]->(taskDesc:E62)';
			q += ',(task)-[:P14]->(editor:E21)';
			
			q += 'OPTIONAL MATCH (task)-[:P4]->(:E52)-[:P81]->(time:E61)';
			q += 'RETURN task.content AS id, title.value AS name,taskDesc.value AS taskDesc, editor.content AS editorId, time.from AS from, time.to AS to';
			// q += ',(task)<-[:P129]-(commentActivity:E33)-[:P3]->(commentDesc:E62)',
			// q += 'OPTIONAL MATCH (commentActivity)<-[:P94]-(creationEvent:E65)-[:P4]->(:E52)-[:P82]->(creationDate:E61)';
			// q += 'creationDate.value AS date, commentDesc.value AS commentDesc';

			return $http.post(phpUrl, {
				query: q,
				params: {
					subprj: subprj,
				}
				})
		}
		
		requests.getCommentsFromTask = function(taskID){
			var q = '';
			q += 'MATCH (task:E7 {content: {tid}})<-[:P129]-(commentActivity:E33)-[:P3]->(commentDesc:E62)';
			q += 'OPTIONAL MATCH (commentActivity)<-[:P94]-(creationEvent:E65)-[:P4]->(:E52)-[:P82]->(creationDate:E61)';
			q += 'RETURN creationDate.value AS date, commentDesc.value AS desc';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tid: taskID,
				}
				})
		}
		
		/* requests.changePriority = function(prj, subprj, taskID, priorityOld,priorityNew){
		
			var q = '';
			q += 'MATCH (n:'+prj+' {content: {subprj}})-[:P9]->(task:'+prj+' {content: {tid}})-[r:P2]->(priority)'
			q += 'Delete r'
			MATCH (n:Proj_pwLoMDJ {content: "subpwLoQXn"})-[:P9]->(task:Proj_pwLoMDJ {content: "pwLoYJM"})-[r:P2]->(priority)
CREATE(task)-[:P2]->(prior:E55 {content: "priority_high"})
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					subpr: subprj,
					tid: taskID,
					priority: priority
				}
				})
		
		} */
		
		//alle Mitarbeiter holen
		requests.getStaffFromSubproject = function(subprj){
		var q = '';
			q += 'match (sub:E7 {content: {subprj}})-[:P9*]->(task:E7)-[:P14]->(editor:E21) return editor.content AS editorId, editor.value AS editorName';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					subprj: subprj,
				}
				})
		
		}
		
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
		  * Unterprojekte
		*/
		// alle Unterprojekte abrufen
		requests.getAllSubprojects = function(prj) {
			return $http.post(phpUrl, {
				query:
					'MATCH (master:E7:'+prj+' {content: {master}})-[:P9]->(sub:E7)-[:P2]->(:E55 {content: "subproject"}), \
					(sub)-[:P1]->(title:E35) \
					OPTIONAL MATCH (sub)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "projDesc"}) \
					RETURN sub.content AS subId, title.content AS title, desc.value AS desc',
				params : {
					master: prj
				}
			});
		};
		// Unterprojektinfo abrufen
		requests.getSubprojectInfo = function(prj, sub) {
			return $http.post(phpUrl, {
				query:
					'MATCH (sub:E7:'+prj+' {content: {subproj}})-[:P2]->(:E55 {content: "subproject"}), \
					(sub)-[:P1]->(title:E35) \
					OPTIONAL MATCH (sub)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "projDesc"}) \
					RETURN title.content AS name, desc.value AS desc',
				params : {
					subproj: sub
				}
			});
		};
		// Unterprojekt erstellen
		requests.createSubproject = function(prj, title, desc) {
			var tid = new Utilities.Base62().encode(new Date().getTime());
			
			var q = 'MATCH (master:E7:'+prj+' {content: {master}})-[:P15]->(e22m:E22), \
					(tsubp:E55:'+prj+' {content: "subproject"}), (tpdesc:E55:'+prj+' {content: "projDesc"}) \
					CREATE (master)-[:P9]->(sub:E7:'+prj+' {content: {subproj}})-[:P2]->(tsubp), \
					(sub)-[:P1]->(:E35:'+prj+' {content: {title}}), \
					(sub)-[:P15]->(e22s:E22:'+prj+' {content: "e22_root_"+{subproj}}), \
					(e22m)-[:P46]->(e22s)';
			if(desc.length > 0)
				q += ', (sub)-[:P3]->(:E62:'+prj+' {content: {descId}, value: {desc}})-[:P3_1]->(tpdesc)';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					master: prj,
					subproj: 'sub' + tid,
					title: title,
					descId: tid + '_sub' + tid,
					desc: desc
				}
			});
		};
		// TODO: subproject editieren
		// TODO: subproject löschen
		
		/**
		  * allgemeine Infos
		*/
		// alle Infos abrufen
		requests.getProjInfos = function(prj, sub) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62)-[:P3_1]->(:E55 {content: "projInfo"}) \
					RETURN n.value AS info, n.content AS id, r.order AS order',
				params: {
					subproj: sub === 'master' ? prj : sub
				}
			});
		};
		// allgemeine Info hinzufügen
		requests.addProjInfo = function(prj, sub, info) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {subproj}}), (tpinfo:E55:'+prj+' {content: "projInfo"}) \
					OPTIONAL MATCH (p)-[r:P3]->(:E62) \
					WITH p, count(r) AS anz, tpinfo \
					CREATE (p)-[:P3 {order: anz}]->(n:E62:'+prj+' {content: {content}, value: {value}})-[:P3_1]->(tpinfo) \
					RETURN n',
				params: {
					subproj: sub === 'master' ? prj : sub,
					content: new Utilities.Base62().encode(new Date().getTime()) + '_' + sub,
					value: info
				}
			});
		};
		// allgemeine Info editieren
		requests.editProjInfo = function(prj, sub, tid, newHtml) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62 {content: {tid}})-[:P3_1]->(:E55 {content: "projInfo"}) \
					SET n.value = {html} \
					RETURN n',
				params: {
					subproj: sub === 'master' ? prj : sub,
					tid: tid,
					html: newHtml
				}
			});
		};
		// allgemeine Info löschen
		requests.removeProjInfo = function(prj, sub, tid) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {subproj}})-[r:P3]->(n:E62 {content: {tid}})-[rt:P3_1]->(:E55 {content: "projInfo"}), \
					(p)-[r2:P3]->(n2:E62) \
					WHERE r2.order > r.order \
					SET r2.order = r2.order-1 \
					DELETE r,rt,n',
				params: {
					subproj: sub === 'master' ? prj : sub,
					tid: tid
				}
			});
		};
		// Info Reihenfolge tauschen
		requests.swapProjInfoOrder = function(prj, sub, tid1, tid2) {
			return $http.post(phpUrl, {
				query:
					'MATCH (p:E7:'+prj+' {content: {subproj}}), (tpinfo:E55:'+prj+' {content: "projInfo"}), \
					(p)-[r1:P3]->(n1:E62 {content: {tid1}})-[:P3_1]->(tpinfo), \
					(p)-[r2:P3]->(n2:E62 {content: {tid2}})-[:P3_1]->(tpinfo) \
					WITH p, r1, r2, n1, n2, r1.order AS o1, r2.order AS o2 \
					SET r1.order = o2, r2.order = o1 \
					RETURN p',
				params: {
					subproj: sub === 'master' ? prj : sub,
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
		
		requests.getAllDocuments = function(prj, subprj) {
			console.log('service getAllDocuments', prj);
			return $http.post(phpUrl, {
				query: 'MATCH (e31:E31:'+prj+')-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"}),'
					+' (e31)<-[:P15]-(:E7 {content:{subprj}}),'
					+' (e31)-[:P102]->(title:E35),'
					+' (e31)-[:P1]->(file:E75),'
					+' (e31)<-[:P94]-(e65:E65)'
					+' OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"})'
					+' OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82)'
					+' OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48)'
					+' OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61)'
					+' OPTIONAL MATCH (e31)-[:P48]->(archivenr:E42)'
					+' OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36)'
					+' OPTIONAL MATCH (e31)-[:P3]->(comment:E62)'
					+' OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41),'
					+' (e78)-[:P52]->(:E40)-[:P131]->(inst:E82)'
					+' RETURN e31.content AS eid, type.content AS type, title.content AS title, primary.content AS primary, aname.content AS author, pname.content AS place, date.content AS date, {identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive, {name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb} AS file, plan3d.content AS plan3d, comment.value AS comment',
				params: {
					subprj: subprj === 'master' ? prj : subprj
				}
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
					RETURN e78.content AS collection, e41.content AS collectionName, e82.content AS institutionName, e82.abbr AS institutionAbbr',
				params: {}
			});
		};
		
		// Institution mit Archiv hinzufügen
		requests.addArchive = function(prj, coll, name, abbr) {
			var tid = new Utilities.Base62().encode(new Date().getTime());
			return $http.post(phpUrl, {
				query:
					'MERGE (e40:E40:'+prj+')-[:P131]->(e82:E82:'+prj+' {content: {e82name}}) \
					ON CREATE SET e82.abbr = {e82abbr}, e40.content = {e40cont} \
					MERGE (e41:E41:'+prj+' {content: {e41name}}) \
					CREATE (e78:E78:'+prj+' {content: {e78cont}})-[:P1]->(e41), \
					(e78)-[:P52]->(e40)',
				params: {
					e82name: name,
					e82abbr: abbr,
					e40cont: 'e40_'+tid+'_'+name.replace(/ /g, "_"),
					e78cont: 'e78_'+tid+'_'+coll.replace(/ /g, "_"),
					e41name: coll
				}
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
		requests.insertDocument = function(prj, subprj, formData) {
			var ts = new Utilities.Base62().encode(new Date().getTime());
			
			var q = '';
			q += 'MATCH (e55:E55:'+prj+' {content: {sourceType}})';
			q += ', (esub:E7:'+prj+' {content: {subprj}})';
			if(formData.archive.length > 0) {
				q += ', (e78:E78:'+prj+' {content: {archive}})';
			}
			
			q += ' CREATE (e31:E31:'+prj+' {content: "e31_"+{newFileName}})-[:P102]->(e35:E35:'+prj+' {content: {title}})';
			
			q += ' CREATE (e31)-[:P1]->(e75:E75:'+prj+' {content: {newFileName}, type: {fileType}, thumb: "t_"+{pureNewFileName}+".jpg", original: {oldFileName}, path: {path}})';
			
			q += ' CREATE (e31)-[:P2]->(e55)';
			q += ' CREATE (e31)<-[:P15]-(esub)';
			
			q += ' CREATE (e31)<-[:P94]-(e65:E65:'+prj+' {content: "e65_e31_"+{newFileName}})';
			
			q += ' CREATE (e31)<-[:P128]-(e84:E84:'+prj+' {content: "e84_e31_"+{newFileName}})';
			
			if(formData.sourceType == 'text') {
				q += ' CREATE (e31)-[:P70]->(e33:E33:'+prj+' {content: "e33_e31_"+{newFileName}})';
				q += ' MERGE (e33)-[:P72]->(e56:E56:'+prj+' {content: {language}})';
				q += ' SET e75.contentDisplay = {pages}';
			}
			if(formData.sourceType == 'plan' || formData.sourceType == 'picture') {
				q += ' CREATE (e31)-[:P70]->(e36:E36:'+prj+' {content: "e36_e31_"+{newFileName}})';
				q += ' SET e75.contentDisplay = {pureNewFileName}+"_1024.jpg"';
				if(formData.primary) {
					q += ' MERGE (tprime:E55:'+prj+' {content: "primarySource"})';
					q += ' CREATE (e31)-[:P2]->(tprime)';
				}
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
				q += ' CREATE (e31)-[:P3]->(e62:E62:'+prj+' {content: "'+ts+'_e31_"+{newFileName}, value: {comment}})';
			}
			q += ' RETURN e31';
			//console.log(q);
			
			formData.subprj = subprj === 'master' ? prj : subprj;
			
			return $http.post(phpUrl, {
				query: q,
				params: formData
			});
		};
		
		requests.insertModel = function(prj, subprj, formData, objData) {
			var q = '';
			/*if(objData.parentid)
				q += 'MATCH (parent:E22:'+prj+' {content: {parentid}}) ';
			else
				q += 'MATCH (parent:E22:'+prj+' {content: "e22_root_"+{subprj}}) ';
			
			q += ',(tmodel:E55:'+prj+' {content: "model"}) ';
			
			q += 'CREATE (e22:E22:'+prj+' {content: "e22_"+{contentid}})';
			q += ' CREATE (parent)-[:P46]->(e22)';
			
			//if(objData.type == 'object') {
			q += ' CREATE (e22)<-[:P138]-(e36:E36:'+prj+' {content: "e36_"+{contentid}})-[:P2]->(tmodel)';
			q += ' MERGE (e75:E75:'+prj+' {content:{e75content}.content})';
			q += ' ON CREATE SET e75 = {e75content}';
			q += ' CREATE (e73:E73:'+prj+' {e73content})-[:P1]->(e75)';
			q += ' CREATE (e36)-[:P106]->(e73)';
			//}
			q += ' RETURN e22';
			*/
			q += 'MATCH (tmodel:E55:'+prj+' {content: "model"})';
			if(!objData.parentid)
				q += ', (parent:E22:'+prj+' {content: "e22_root_"+{subprj}})';
			else
				q += ' MERGE (parent:E22:'+prj+' {content: {parentid}})';
			
			q += ' MERGE (e22:E22:'+prj+' {content: "e22_"+{contentid}})';
			q += ' MERGE (parent)-[:P46]->(e22)';
			
			q += ' CREATE (e22)<-[:P138]-(e36:E36:'+prj+' {content: "e36_"+{contentid}})-[:P2]->(tmodel)';
			q += ' MERGE (e75:E75:'+prj+' {content:{e75content}.content})';
			q += ' ON CREATE SET e75 = {e75content}';
			q += ' CREATE (e73:E73:'+prj+' {e73content})-[:P1]->(e75)';
			q += ' CREATE (e36)-[:P106]->(e73)';
			
			q += ' RETURN e22';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
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
		
		requests.getModelsWithChildren = function(prj, subprj) {
			
			var q = 'MATCH (root:E22:'+prj+' {content:{esub}}), (tsp:E55:'+prj+' {content:"subproject"}),';
			q += ' (p:E22:'+prj+')-[:P46]->(c:E22)<-[:P138]-(:E36)-[:P106]->(cobj:E73)-[:P1]->(cfile:E75),';
			q += ' path = (root)-[:P46*]->(c)';
			if(subprj === 'master')
				q += ' WHERE all(n in nodes(path) WHERE NOT (n)<-[:P15]-(:E7)-[:P2]->(tsp))';
			else		
				q += ' WHERE all(n in nodes(path) WHERE not n.content = "e22_root_master")';
			q += ' AND any(n in nodes(path) WHERE n.content = {esub})';
			
			q += ' RETURN {parent: p} AS parent, collect({child: c, obj: cobj, file: cfile}) AS children';
			
			return $http.post(phpUrl, {
				query: q,
					/*'MATCH (maxp:E22:'+prj+' {content: {esub}}), (maxp)-[:P46*]->(p:E22)-[:P46]->(c:E22)<-[:P138]-(:E36)-[:P106]->(cobj:E73)-[:P1]->(cfile:E75)'
					+ ' RETURN {parent: p} AS parent, collect({child: c, obj: cobj, file: cfile}) AS children',*/
				params: {
					esub: 'e22_root_'+subprj
				}
			});
		};
		
		requests.addEdgesFile = function(prj, file, edges) {
			return $http.post(phpUrl, {
				query:
					'MATCH (e75:E75:'+prj+' {content: {file}}) \
					SET e75.edges = {edges}',
				params: {
					file: file,
					edges: edges
				}
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
		
		requests.insertScreenshot = function(prj, subprj, objData, markers) {
			
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
					e22id: 'e22_root_'+subprj,
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
		
		requests.saveBase64Image = function(path, filename, base64) {
			return $http.post('php/saveBase64Image.php', {
				path: path,
				filename: filename,
				imgdata: base64
			});
		};
		
		requests.saveGeoToJson = function(path, filename, data) {
			return $http.post('php/saveGeoToJson.php', {
				path: path,
				filename: filename,
				data: data
			});
		};
		
		// indexing and searching
		requests.indexDocuments = function(prj) {
			return $http.post('php/indexText.php', {
				project: prj
			});
		};
		requests.getIndex = function(prj) {
			return $http.post('php/getIndex.php', {
				project: prj
			});
		};
		requests.searchText = function(prj, search) {
			return $http.post('php/searchText.php', {
				project: prj,
				search: search
			});
		};
		requests.setNewBlacklist = function(prj, list) {
			return $http.post('php/setBlackWhitelist.php', {
				project: prj,
				file: 'blacklist.txt',
				words: list
			});
		};
		requests.setNewWhitelist = function(prj, list) {
			return $http.post('php/setBlackWhitelist.php', {
				project: prj,
				file: 'whitelist.txt',
				words: list
			});
		};
		requests.getBlacklist = function(prj) {
			return $http.post('php/getBlackWhitelist.php', {
				project: prj,
				file: 'blacklist.txt'
			});
		};
		requests.getWhitelist = function(prj) {
			return $http.post('php/getBlackWhitelist.php', {
				project: prj,
				file: 'whitelist.txt'
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

// Schnittstelle zwischen Three.js-Scope und Seite
webglServices.factory('webglInterface',
	function($rootScope) {
		
		var wi = {};
		
		// Funktionsaufrufe vom Controller
		wi.callFunc = {};
		
		// Einstellungen
		wi.viewportSettings = {};
		wi.viewportSettings.shading = ['color', 'grey', 'transparent', 'onlyEdges', 'xray'];
		wi.viewportSettings.shadingSel = wi.viewportSettings.shading[0];
		wi.viewportSettings.edges = true;
		wi.viewportSettings.camera = ['Perspective', 'Top', 'Front', 'Back', 'Left', 'Right', 'Custom'];
		wi.viewportSettings.cameraSel = wi.viewportSettings.camera[0];
		
		wi.unsafeSettings = {};
		
		wi.vizSettings = {};
		wi.vizSettings.opacitySelected = 100;
		wi.vizSettings.edges = true;
		wi.vizSettings.edgesOpacity = 100;
		wi.vizSettings.edgesColor = 100
		
		// Listen
		wi.objects = [];
		wi.layerList = [];
		wi.layers = [];
		wi.hierarchList = [];
		
		wi.plans = [];
		
		var layerDict = {};
		
		wi.insertIntoLists = function(item) {
			var objentry = new wi.ObjectEntry(item);
			insertIntoHierarchList(objentry);
			insertIntoLayerList(objentry);
			$rootScope.$applyAsync();
		};
		
		wi.insertIntoPlanlist = function(item) {
			item.visible = true;
			item.selected = false;
			item.opacity = 1.0;
			wi.plans.push(item);
			$rootScope.$applyAsync();
		};
		
		wi.clearLists = function() {
			console.log('clearList');
			wi.layerLists = [];
			wi.layers = [];
			wi.hierarchList = [];
			wi.plans = [];
		};
		
		wi.ObjectEntry = function(item) {
			this.id = item.id;
			this.name = item.name;
			this.title = item.title;
			this.type = item.type;
			this.layer = item.layer || 0;
			
			this.parent = item.parent || null;
			this.children = [];
			
			this.parentVisible = true;
			this.visible = true;
			this.selected = false;
			this.expand = false;
			this.opacity = 1.0;
			
			var scope = this;
			
			this.toggle = function() {
				scope.visible = !scope.visible;
				if(!scope.visible && scope.selected)
					wi.callFunc.selectObject(scope.id, false, true);
				wi.callFunc.toggleObject(scope, scope.visible);
			};
			this.select = function(event) {
				if(scope.visible && event)
					wi.callFunc.selectObject(scope.id, event.ctrlKey, false);
			};
			this.setOpacity = function(value) {
				wi.callFunc.setObjectOpacity(scope, value);
			};
			this.focus = function() {
				wi.callFunc.focusObject(scope.id);
			};
		};
		
		wi.PlanEntry = function(id, name, title, type) {
			this.id = id;
			this.name = name;
			this.title = title;
			this.type = type;
			this.visible = true;
			this.selected = false;
			this.opacity = 1.0;
			
			var scope = this;
			
			this.toggle = function() {
				scope.visible = !scope.visible;
				if(!scope.visible && scope.selected)
					wi.callFunc.selectPlan(scope.id, false, true);
				wi.callFunc.togglePlan(scope.id, scope.visible);
				
			};
			this.select = function(event) {
				if(scope.visible && event)
					wi.callFunc.selectPlan(scope.id, event.ctrlKey, false);
			};
			this.setOpacity = function(value) {
				wi.callFunc.setPlanOpacity(scope.id, value);
			};
			this.setOrthoView = function() {
				wi.callFunc.viewOrthoPlan(scope.id);
			};
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
		
		function findPlanlistObject(id) {
			for(var i=0; i<wi.plans.length; i++) {
				if(wi.plans[i].id === id)
					return wi.plans[i];
			}
		}
		
		wi.selectListEntry = function(id, type) {
			var item = (type === 'plan') ? findPlanlistObject(id) : findHierarchyObject(wi.hierarchList, id);
			item.selected = true;
			if(item.parent) expandParents(item.parent);
			$rootScope.$applyAsync();
		};
		
		wi.deselectListEntry = function(id, type) {
			var item = (type === 'plan') ? findPlanlistObject(id) : findHierarchyObject(wi.hierarchList, id);
			item.selected = false;
			$rootScope.$applyAsync();
		};
		
		function expandParents(item) {
			item.expand = true;
			if(item.parent) expandParents(item.parent);
		}
		
		return wi;
		
	});