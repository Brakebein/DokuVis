angular.module('dokuvisApp').factory('APIRequest',
	function($http, API, $stateParams) {
	
		var requests = {};
		
		/**
		  * Models
		*/
		requests.getModels = function() {
			return $http.get(API + 'auth/project/'+$stateParams.project+'/'+$stateParams.subproject+'/models');
		};
		
		requests.assignCategoryToObjects = function(e73ids, attrId) {
			return $http.post(API + 'auth/project/'+$stateParams.project+'/'+$stateParams.subproject+'/assignCategory', {
				objects: e73ids,
				attrId: attrId
			});
		};
		
		return requests;
	});

angular.module('dokuvisApp').factory('neo4jRequest', ['$http', 'Utilities',
	function($http, Utilities) {
		
		var cypherUrl = 'http://localhost:7474/db/data/cypher';
		var phpUrl = 'php/neo4jrequest.php';
		
		var requests = {};
		
		//Tasks
		requests.addTask =  function(prj,subprj,taskId,ttitle,tdesc,teditor,tfrom,tto, tpriority, tstatus){

			var q = '';
			q += 'MATCH (sub:E7:'+prj+' {content: {e7id}})';
			q += ',(ttdesc:E55:'+prj+'{content: "taskDesc"})';
			q += ',(ttask:E55:'+prj+'{content: "task"})';
			q += ',(tprior:E55:'+prj+'{content: {priority}})';
			q += ',(tstatus:E55:'+prj+'{content: {status}})';
			q += ',(editor:E21:'+prj+'{content: {editor}})';
			q += 'CREATE (e7:E7:'+prj+'{content: {tId}})-[:P2]->(ttask)'; //Activity-->Task
			q += 'CREATE (e7)-[:P3]->(tdesc:E62:'+prj+'{content: {descId}, value: {desc}})-[:P3_1]->(ttdesc)'; 
			q += 'CREATE (e7)-[:P4]->(e52:E52:'+prj+' {content:{e52idDuration}})-[:P81]->(e61:E61:'+prj+'{from: {from}, to: {to}})'; 
			q += 'CREATE(e7)-[:P102]->(e35:E35:'+prj+' {value: {title}})'; 
			q += 'CREATE(e7)-[:P14]->(editor)';
			q += 'CREATE(e7)-[:P2]->(tprior)';
			q += 'CREATE(e7)-[:P2]->(tstatus)';
			q += 'CREATE (e61n:E61:'+prj+'{content: {currentDate}})<-[:P82]-(e52n:E52:'+prj+'{content: {e52id}})<-[:P4]-(e65:E65:'+prj+' {value: {createTask}})-[:P14]->(e21:E21:'+prj+'{content: {logindata}})'; 
			q += 'CREATE (e65)-[:P94]->(e7)';
			q += 'CREATE (sub)-[:P9]->(e7)';
								
			console.log(prj);
			console.log(subprj);
			console.log(taskId);
			console.log(ttitle);
			console.log(tdesc);
			console.log(teditor);
			console.log(tfrom);
			console.log(tto);
			console.log(tpriority);
			console.log(tstatus);
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					e7id: subprj,
					tId: taskId,
					desc: tdesc,
					descId: taskId + '_taskDesc',
					editor: 'e21_' + teditor,
					e52idDuration: 'e52_' + taskId + '_duration', //in Diagramm ändern
					e52id: 'e52_' + taskId,
					from: tfrom,
					to: tto,
					title: ttitle,
					createTask: 'e65_'+ taskId + '_creation',
					currentDate: new Date(), 
					priority: tpriority,
					status: tstatus,
					logindata: 'logindata_' +  new Date().getTime()
				}
			});	
					
		};
			
		
		requests.editTask = function(prj,newTask){
			var q = '';
			q += 'MATCH (task:E7:'+prj+' {content: {tId}})-[:P4]->(E52:'+prj+')-[:P81]->(duration:E61:'+prj+'),\
			(task)-[:P3]->(taskDesc:E62),\
			(task)-[:P102]->(taskName),\
			(task)-[r]->(editorOld:E21),\
			(editorNew:E21:'+prj+' {content: {newEditor}})\
			SET duration.from = {from}, duration.to = {to}, taskName.value = {name}, taskDesc.value = {desc}\
			WITH task,duration, taskDesc,taskName, r,editorOld, editorNew\
			DELETE r\
			WITH task,duration, taskDesc,taskName,editorNew\
			CREATE (task)-[:P14]->(editorNew)\
			WITH task, duration, taskDesc,taskName,editorNew\
			RETURN task,duration,taskName,taskDesc,editorNew';
			
			console.log(newTask.staffId);
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tId: newTask.ids.graph,
					staffId: newTask.staffId,
					from: newTask.from,
					to: newTask.to,
					name: newTask.task,
					desc: newTask.desc,
					newEditor: 'e21_' + newTask.staffId
				}
				});
		};
		
		requests.connectTasks = function(prj,subpr,taskId,editorId){
			var q = '';
			q += 'MATCH (task:E7:'+prj+' {content: {tID}}),(editor:E21:'+prj+' {content: {eId}})\
				 CREATE (task)-[:P14]->(editor)\
				 RETURN task,editor';
			console.log(taskId, editorId);
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tID: taskId,
					eId: 'e21_' + editorId
				}
			});
		}
		
		requests.disconnectTask = function(prj,taskId,editorId){
			var q = '';
			q += 'MATCH (task:E7:'+prj+' {content: {tID}})-[r]->(editor:E21:'+prj+' {content: {eId}})\
				 DELETE r';
			console.log(taskId, editorId);
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tID: taskId,
					eId: 'e21_' + editorId
				}
			});
		}
		
		requests.getTaskDates = function(prj,taskName){
			var q = '';
			q += 'MATCH (task:E7:'+prj+')-[:P102]->(title:E35:'+prj+' {value: {tname}}),\
			(task)-[:P3]->(taskDesc:E62),\
			(task)-[:P14]->(person:E21)-[:P131]->(editor:E82),\
			(task)-[:P4]->(:E52)-[:P81]->(time:E61),\
			(task)-[:P2]->(status)-[:P127]->(typeS:E55 {content: "taskStatus"}),\
			(task)-[:P2]->(priority)-[:P127]->(typeP:E55 {content: "taskPriority"})\
			WITH task,title, taskDesc, time, collect(DISTINCT editor.content) as editors,status,priority\
			RETURN task.content AS graphId, title.value AS name, taskDesc.value AS desc, editors AS editors, time.from AS from, time.to AS to,status.value AS status, priority.value AS priority';
			
			console.log(taskName);
			console.log(prj);
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tname: taskName,
				}
			});
		}
		
		requests.addCommentToTask = function(prj,taskId,tcomment){
			var q = '';//KOMMENTAR -->logindata: Platzhalter für späteren Verfasser
			q += 'MATCH (task:E7:'+prj+'{content: {tId}})';
			q += 'CREATE (e62:E62:'+prj+'{value: {comment}})<-[:P3]-(e33:E33:'+prj+' {value: {lingObj}})<-[:P94]-(e65:E65:'+prj+' {value: {createComment}})-[:P14]->(e21:E21:'+prj+'{content: {logindata}})';
			q += 'CREATE (e52:E52:'+prj+'{value: {timeSpanID}})-[:P82]->(e61:E61:'+prj+'{value:{currentDate}})';
			q += 'CREATE (e65)-[:P4]->(e52)';
			q += 'CREATE (e33)-[:P129]->(task)';
			return $http.post(phpUrl, {
				query: q,
				params: {
					tId: taskId,
					comment: tcomment,
					currentDate: new Date, 
					lingObj: 'e33_'+ taskId,
					createComment: 'e65_e33_' + taskId,
					timeSpanID:'e65_e33_e52' + taskId,
					logindata: 'logindata_' +  Utilities.getUniqueId() //vorläufige eindeutige ID, wird später durch eingeloggt person ersetzt
				}
			});
		}
		
		requests.getTasksFromSubproject = function(prj,subprj){
			var q = '';
			
			/*MATCH (sub:E7:Proj_pDxnuzs {content: "subpDxnxll"}),
			(p:E7:Proj_pDxnuzs)-[:P9]->(child:E7),
			(child)-[:P102]->(title:E35),
			(child)-[:P3]->(taskDesc:E62),
			(child)-[:P14]->(person:E21)-[:P131]->(editor:E82),
			(child)-[:P4]->(:E52)-[:P81]->(time:E61),
			(child)-[:P2]->(status)-[:P127]->(typeS:E55 {content: "taskStatus"}),
			(child)-[:P2]->(priority)-[:P127]->(typeP:E55 {content: "taskPriority"}),
			path = (sub)-[:P9*]->(child)
			OPTIONAL MATCH 
			(p)-[:P1]->(subtitle),
			(child)<-[:P129]-(commentActivity:E33)-[:P3]->(commentDesc:E62),
			(commentActivity)<-[:P94]-(creationEvent:E65)-[:P4]->(:E52)-[:P82]->(creationDate:E61)
			WITH subtitle, p, child, title, taskDesc, time, priority,status, collect(editor.content) as editors,collect(editor.value) as editorNames, collect(commentDesc.value) as comments, collect(creationDate.value) as commentCreation
			RETURN {parent: p, title: subtitle} AS parent, collect({child: child, name: title.value, desc: taskDesc.value,  priority: priority.content, status: status.value, editors: editors, editorNames: editorNames, from: time.from, to: time.to, comments: comments, coCreat: commentCreation}) AS children*/
			
			
			q = 'MATCH (sub:E7:'+prj+' {content: {subprj}}),\
			(p:E7:'+prj+')-[:P9]->(child:E7),\
			(child)-[:P102]->(title:E35),\
			(child)-[:P3]->(taskDesc:E62),\
			(child)-[:P14]->(person:E21)-[:P131]->(editor:E82),\
			(child)-[:P4]->(:E52)-[:P81]->(time:E61),\
			(child)-[:P2]->(status)-[:P127]->(typeS:E55 {content: "taskStatus"}),\
			(child)-[:P2]->(priority)-[:P127]->(typeP:E55 {content: "taskPriority"}),\
			path = (sub)-[:P9*]->(child)\
			OPTIONAL MATCH (p)-[:P1]->(subtitle)\
			OPTIONAL MATCH (child)<-[:P129]-(commentActivity:E33)-[:P3]->(commentDesc:E62)\
			OPTIONAL MATCH (commentActivity)<-[:P94]-(creationEvent:E65)-[:P4]->(:E52)-[:P82]->(creationDate:E61)\
			WITH\
			subtitle, p, child, title, taskDesc, time, priority,status,\
			collect(editor.content) as editors,collect(editor.value) as editorNames, collect(commentDesc.value) as comments,\
			count(commentDesc.value) as amount, collect(creationDate.value) as commentCreation \
			RETURN {parent: p, title: subtitle} AS parent, \
			collect({child: child, name: title.value, desc: taskDesc.value,  priority: priority.value, status: status.value,\
			editors: editors, editorNames: editorNames, from: time.from, to: time.to, comments: comments, coCreat: commentCreation, amountComments: amount}) AS children';
			

			return $http.post(phpUrl, {
				query: q,
				params: {
					subprj: subprj
				}
				})
		}
		
		requests.getAllTasks = function(prj){
		var q = '';
		
		q = 'match (n:E55:'+prj+' {content: "task"})<-[:P2]-(task)-[:P102]->(name) return task.content AS taskID, name.value AS taskName';
		return $http.post(phpUrl,{
				query: q
			});		
		
		}
		
		requests.getTasksFromEditor = function(prj,editorId){
			
			var q = '';
			q = 'MATCH (editor:E82:'+prj+' {content: '+editorId+'})<-[:P131]-(activity:E21)<-[:P14]-(task)-[:P102]->(name) RETURN task.content AS taskId, name.value AS taskName';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					eid: editorId,
					
				}
			});
		}
		
		requests.addStaffToGraph = function(prj,tid,name){
			
			var q = '';
			q += 'MATCH (tpproj:E55:'+prj+'{content:"projectPerson"})';
			q += 'CREATE (tpproj)<-[:P2]-(:E21:'+prj+' {content: {pid}})-[:P131]->(:E82:'+prj+' {content: {tid}, value: {name}})';
			
			console.log(tid);
			console.log(name);
			
			return $http.post(phpUrl,{
				query: q,
				params: {
					name:  name,
					pid:    'e21_' + tid,
					tid: tid	
				}
			});		
		}
		
		requests.getCommentsFromTask = function(taskId){
			var q = '';
			q += 'MATCH (task:E7 {content: {tId}})<-[:P129]-(commentActivity:E33)-[:P3]->(commentDesc:E62)';
			q += 'OPTIONAL MATCH (commentActivity)<-[:P94]-(creationEvent:E65)-[:P4]->(:E52)-[:P82]->(creationDate:E61)';
			q += 'RETURN creationDate.value AS date, commentDesc.value AS desc';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tId: taskId,
				}
				})
		}
		
		/* requests.countCommentsFromTask = function(taskId){
			
			var q = '';
			q += 'MATCH (task:E7 {content: {tId}})<-[:P129]-(commentActivity:E33)-[:P3]->(commentDesc:E62)\
			RETURN count(commentDesc.value) as amount';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tId: taskId,
				}
				})
		} */
		
		requests.deleteTaskDates = function(prj,taskId){
		var q = '';
		q+= 'MATCH (task:E7:'+prj+' {content: {tid}})-[:P4]->(:E52:'+prj+')-[:P81]->(duration:E61:'+prj+')\
			SET duration.from =\" \" , duration.to = \" \"  RETURN duration';
		
		return $http.post(phpUrl, {
				query: q,
				params: {
					prj: prj,
					tid: taskId
					}
				})
		
		}
		
		requests.setTaskDates = function(prj,taskId,from,to){
		var q = '';
		q+= 'MATCH (task:E7:'+prj+' {content: {tid}})-[:P4]->(:E52:'+prj+')-[:P81]->(duration:E61:'+prj+')\
			SET duration.from ={from} , duration.to = {to}  RETURN duration';
		
		console.log(taskId);
		
		return $http.post(phpUrl, {
				query: q,
				params: {
					tid: taskId,
					from: from,
					to: to,
					}
				})
		
		}
		
		requests.deleteTask = function(prj,taskId){
			
			var q = '';
			
			/* q+= 'MATCH (start:E7:'+prj+' {content: {tid}}), (p:E7:'+prj+'),(p)-[:P9]->(child),path = (start)-[:P9*]->(child),\
				(child)-[f]->(name:E35),(child)-[r]->(timespan:E52)-[s]->(time:E61),\
				(child)<-[t]-(creation:E65)-[u]->(timespanCreation:E52)-[v]->(timeCreation:E61),(creation:E65)-[w]->(creator:E21),\
				(child)-[x]->(desc:E62),\
				(start)-[h]->(nameS:E35),(start)-[i]->(descS:E62),\
				(start)<-[j]-(creationS:E65)\
				OPTIONAL MATCH\
				(child)<-[k]-(lingObject:E33), (lingObject)-[l]->(comment:E62),(lingObject)<-[m]-(event:E65)-[n]->(timespanC:E52)-[o]->(timeC:E61)\
				(creationS)-[p]->(creatorS),(creationS)-[q]->(timespanCreationS)-[]->(timeCreationS),\
				(start)-[:P4]->(timespanS)-[:P81]->(timeS),\
				(start)<-[:P129]-(lingObjectS),(lingObjectS)-[:P3]->(commentS),(lingObjectS)<-[:P94]-(eventS)-[:P4]->(timespanCS)-[:P82]->(timeCS)\
				DELETE start,child,desc,name,timespan,time,lingObject,comment,event,timespanC,timeC,creation,timespanCreation,timeCreation,creator,\
				nameS,descS,creationS,creatorS,timespanCreationS,timeCreationS,timespanS,timeS,lingObjectS,commentS,eventS,timespanCS,timeCS';		
			 */
			
			/*MATCH (start:E7:Proj_px472Jk {content: "px47tGK"}), (p:E7:Proj_px472Jk),(p)-[:P9]->(child),path = (start)-[:P9*]->(child),
			(child)-[f]->(name:E35),(child)-[r]->(timespan:E52)-[s]->(time:E61),
			(child)<-[t]-(creation:E65)-[u]->(timespanCreation:E52)-[v]->(timeCreation:E61),(creation:E65)-[w]->(creator:E21),
			(child)-[x]->(desc:E62)-[x2]->(),
			(start)-[h]->(nameS:E35),(start)-[i]->(descS:E62)-[i2]->(),
			(start)<-[j]-(creationS:E65)
			OPTIONAL MATCH
			(child)<-[k]-(lingObject:E33), (lingObject:E33)-[l]->(comment:E62),(lingObject:E33)<-[m]-(event:E65)-[n]->(timespanC:E52)-[o]->(timeC:E61),
			(creationS:E65)-[p1]->(creatorS:E21),(creationS:E65)-[q]->(timespanCreationS:E52)-[q1]->(timeCreationS:E61),
			(start)-[a1]->(timespanS:E52)-[b1]->(timeS:E61),
			(start)<-[c1]-(lingObjectS:E33),(lingObjectS:E3)-[d1]->(commentS:E62),(lingObjectS:E33)<-[e1]-(eventS:E65)-[f1]->(timespanCS:E52)-[g1]->(timeCS:E61)
			DELETE start,child,desc,name,timespan,time,lingObject,comment,event,timespanC,timeC,creation,timespanCreation,timeCreation,creator,
			nameS,descS,creationS,creatorS,timespanCreationS,timeCreationS,timespanS,timeS,lingObjectS,commentS,eventS,timespanCS,timeCS,f,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,i2,x2,a1,b1,c1,d1,e1,f1,g1,q1,p1*/
				
			q += 'MATCH (task:E7:'+prj+' {content: {tid}})-[g]-(),\
				(task)-[r]->(timespan:E52)-[s]->(time:E61),\
				(task)<-[t]-(creation:E65)-[u]->(timespanCreation:E52)-[v]->(timeCreation:E61),(creation:E65)-[w]->(),\
				(task)-[x]->(desc:E62)-[x2]-(),(task)-[f]->(name:E35)\
				OPTIONAL MATCH\
				(task)<-[a]-(lingObject:E33), (lingObject)-[b]->(comment:E62),(lingObject)<-[c]-(event:E65)-[d]->(timespanC:E52)-[e]->(timeC:E61),(event)-[h]->()\
				DELETE task,name,timespan,time,creation,timespanCreation,timeCreation,lingObject,event,timespan,timeC,desc,r,s,t,u,v,w,x,a,b,c,d,e,f,g,h,x2';
			console.log(taskId)
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					prj: prj,
					tid: taskId
					}
				})
		}
		
		requests.deleteStaff = function(prj, staffId){
			var q = '';
			q += 'MATCH (editor:E21:'+prj+' {content:{sid}})-[r]->(editorDates:E82), (editor)-[a]-()\
					DELETE editor,editorDates, r,a';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					sid: 'e21_' + staffId,
				}
				})
		
		} 
		
		requests.changePriority = function(prj, taskID, priorityOld, priorityNew){
			var q = '';
			q += 'MATCH (task:E7:'+prj+' {content:{tid}})-[r]->(priorityOld:E55:'+prj+' {content: {pOld}}),(priorityNew:E55:'+prj+' {content: {pNew}})\
				DELETE r\
				WITH task,priorityNew\
				CREATE (task)-[:P2]->(priorityNew)';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tid: taskID,
					pOld: priorityOld,
					pNew: priorityNew
				}
				})
		
		} 
		
		requests.changeStatus = function(prj, taskID, statusOld, statusNew){
		
			var q = '';
			q += 'MATCH (task:E7:'+prj+' {content:{tid}})-[r:P2]->(statusOld {content: {sOld}}),(statusNew:E55:'+prj+' {content: {sNew}})\
				CREATE (task)-[:P2]->(statusNew) \
				DELETE r ';
			
			console.log(taskID, statusOld, statusNew);
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					tid: taskID,
					sOld: statusOld,
					sNew: statusNew
				}
				})
		
		} 
		
		//alle Mitarbeiter holen
		requests.getStaffFromProject = function(prj){
		var q = '';
		q += 'MATCH (person:E82:'+prj+') return person.content AS editorId, person.value AS editorName';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
				}
				})
		
		}


		// DEPRECATED
		// requests.getAllPlanObj = function() {
		// 	return $http.post(cypherUrl, {
		// 		query: 'MATCH (e31:E31)<-[:P138]-(:E36)-[:P106]->(:E73)-[:P1]->(e75:E75)'
		// 			+' RETURN e31.content AS eid, e75.content AS file',
		// 		params: {}
		// 	});
		// };

		// DEPRECATED
		// requests.getPlansFromObject = function(obj) {
		// 	return $http.post(cypherUrl, {
		// 		query: 'MATCH (:E22 {content:"'+obj+'"})<-[:P70]-(e31:E31)-[:P1]->(jpg:E75),'
		// 			+' (e31)<-[:P138]-(:E36)-[:P106]->(:E73)-[:P1]->(obj:E75),'
		// 			+' (e31)-[:P102]->(title:E35),'
		// 			+' (e31)<-[:P94]-(:E65)-[:P14]->(e21)-[:P131]->(author:E82)'
		// 			+' RETURN e31.content AS eid, jpg.content AS jpg, obj.content AS obj, title.content AS title, author.content AS author',
		// 		params: {}
		// 	});
		// };
		// DEPRECATED
		// requests.getAllPlanData = function(prj) {
		// 	/*return $http.post(phpUrl, {
		// 		query: 'MATCH (e31:E31)-[:P1]->(jpg:E75),'
		// 			+' (e31)<-[:P138]-(:E36)-[:P106]->(:E73)-[:P1]->(obj:E75),'
		// 			+' (e31)-[:P102]->(title:E35),'
		// 			+' (e31)<-[:P94]-(:E65)-[:P14]->(e21)-[:P131]->(author:E82)'
		// 			+' RETURN e31.content AS eid, jpg.content AS jpg, obj.content AS obj, title.content AS title, author.content AS author',
		// 		params: {}
		// 	});*/
		// 	return $http.post(phpUrl, {
		// 		query: 'MATCH (e31:E31:'+prj+')-[:P2]->(type:E55 {content: "plan"}),'
		// 			+' (e31)-[:P102]->(title:E35),'
		// 			+' (e31)-[:P1]->(file:E75),'
		// 			+' (e31)<-[:P94]-(e65:E65)'
		// 			+' OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82)'
		// 			+' OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48)'
		// 			+' OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61)'
		// 			+' OPTIONAL MATCH (e31)-[:P48]->(archive:E42)'
		// 			+' RETURN e31.content AS eid, type.content AS type, title.content AS title, aname.content AS author, pname.content AS place, date.content AS date, archive.content AS archive, {name: file.content, path: file.path} AS file',
		// 		params: {}
		// 	});
		// };
		// DEPRECATED
		/*requests.getAllDocuments = function(prj, subprj) {
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
					+' OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG)'
					+' RETURN e31.content AS eid, type.content AS type, title.content AS title, primary.content AS primary, aname.content AS author, pname.content AS place, date.content AS date, {identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive, {name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb} AS file, plan3d.content AS plan3d, comment.value AS comment, collect(tag.content) as tags',
				params: {
					subprj: subprj === 'master' ? prj : subprj
				}
			});
		};*/

		/**
		 * @deprecated
		 */
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
		
		// alte Suchanfrage für autocomplete
		/**
		 * @deprecated
		 */
		requests.searchForExistingNodes = function(prj, label, input) {
			return $http.post(phpUrl, {
				query: 'MATCH (n:'+label+':'+prj+')'
					+' WHERE n.content =~ "(?i).*'+input+'.*"'
					+' RETURN n.content AS content',
				params: {}
			});
		};
		
		// neue Suchanfrage für typeahead
		/**
		 * @deprecated
		 */
		requests.getAllLabelProps = function(prj, label, prop) {
			return $http.post(phpUrl, {
				query:
					'MATCH (n:'+label+':'+prj+') \
					RETURN n.'+prop+' AS content',
				params: {}
			});
		};

		/**
		 * @deprecated
		 */
		requests.findNodeWithSpecificContent = function(prj, label, input) {
			return $http.post(phpUrl, {
				query: 'MATCH (n:'+label+':'+prj+')'
					+' WHERE n.content =~ "(?i)'+input+'"'
					+' RETURN n.content AS content',
				params: {}
			});
		};

		/**
		 * @deprecated
		 */
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
		/**
		 * @deprecated
		 */
		requests.insertDocument = function(prj, subprj, formData) {
			var ts = Utilities.getUniqueId();
			console.log(formData);
			
			var q = '';
			q += 'MATCH (e55:E55:'+prj+' {content: {sourceType}})';
			q += ', (esub:E7:'+prj+' {content: {subprj}})';
			q += ', (sc:E55:'+prj+' {content: "sourceComment"})';
			q += ', (sr:E55:'+prj+' {content: "sourceRepros"})';
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
				q += ' MERGE (e56:E56:'+prj+' {content: {language}})';
				q += ' CREATE (e33)-[:P72]->(e56)';
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
				q += ' CREATE (e31)-[:P3]->(:E62:'+prj+' {content: "'+ts+'_e31_note_"+{newFileName}, value: {comment}})-[:P3_1]->(sc)';
			}
			if(formData.repros.length > 0) {
				q += ' CREATE (e31)-[:P3]->(:E62:'+prj+' {content: "'+ts+'e31_repros_"+{newFileName}, value: {repros}})-[:P3_1]->(sr)';
			}
			for(var i=0; i<formData.tags.length; i++) {
				q += ' MERGE (tag'+i+':TAG:'+prj+' {content: "'+formData.tags[i].text+'"})';
				q += ' MERGE (e31)-[:has_tag]->(tag'+i+')';
			}
			q += ' RETURN e31';
			console.log(q);
			
			formData.subprj = subprj === 'master' ? prj : subprj;
			
			return $http.post(phpUrl, {
				query: q,
				params: formData
			});
		};

		/**
		 * @deprecated
		 */
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

		/**
		 * @deprecated
		 */
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

		/**
		 * @deprecated
		 */
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

		/**
		 * @deprecated
		 * @param prj
		 * @param subprj
		 * @param objData
		 * @param markers
		 * @param title
		 * @param paintFile
		 * @returns {*}
		 */
		requests.insertScreenshot = function(prj, subprj, objData, markers, title, paintFile) {
			
			var q = '';
			q += 'MATCH (tscreen:E55:'+prj+' {content: "screenshot"})';
			q += ',(tscomment:E55:'+prj+' {content: "screenshotComment"})';
			
			if(objData.pinObject)
				q += ',(e73:E73:'+prj+' {content: {e73id}})<-[:P106]-(:E36)-[:P138]->(e22:E22)';
			else
				q += ',(e22:E22:'+prj+' {content: {e22id}})';
			
			q += ' CREATE (e36:E36:'+prj+' {e36content})-[:P2]->(tscreen)';
			q += ' CREATE (e36)-[:P1]->(e75:E75:'+prj+' {e75content})';
			q += ' CREATE (e36)-[:P102]->(e35:E35:'+prj+' {e35content})';
			q += ' CREATE (e36)-[:P138]->(e22)';
			
			for(var i=0; i<markers.length; i++) {
				q += ' CREATE (e36)-[:P106]->(:E90:'+prj+' {content: "'+markers[i].id+'", u: '+markers[i].u+', v: '+markers[i].v+'})-[:P3]->(:E62:'+prj+' {content: "e62'+markers[i].id+'", value: "'+markers[i].comment+'"})-[:P3_1]->(tscomment)';
			}
			
			q += ' MERGE (tdraw:E55:'+prj+' {content: "userDrawing"})';
			q += ' CREATE (e36)-[:P106]->(paint:E36:'+prj+' {content: {paintid}})-[:P1]->(:E75:'+prj+' {painte75content})';
			q += ',(paint)-[:P2]->(tdraw)';
			
			q += ' RETURN e36';
			
			return $http.post(phpUrl, {
				query: q,
				params: {
					e22id: 'e22_root_'+subprj,
					e73id: objData.pinObject,
					e36content: {
						content: 'e36_' + objData.filename,
						cameraCenter: objData.cameraCenter,
						cameraFOV: objData.cameraFOV,
						cameraMatrix: objData.cameraMatrix,
						pinMatrix: objData.pinMatrix
					},
					e75content: {
						content: objData.filename,
						path: objData.path,
						width: objData.width,
						height: objData.height
					},
					e35content: {
						content: Utilities.getUniqueId()+'_screenshotTitle',
						value: title
					},
					paintid: 'e36_' + paintFile,
					painte75content: {
						content: paintFile,
						path: objData.path,
						width: objData.width,
						height: objData.height
					}
				}
			});
		};

		/**
		 * @deprecated
		 * @param prj
		 * @param params
		 * @param markers
		 * @returns {*}
		 */
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

		/**
		 * @deprecated
		 * @param prj
		 * @returns {*}
		 */
		requests.getScreenshotsWithMarkers = function(prj) {
			var q = '';
			q += 'MATCH (e22:E22:'+prj+')<-[:P138]-(e36:E36:'+prj+')-[:P2]->(:E55 {content: "screenshot"})';
			q += ',(e36)-[:P1]->(e75:E75)';
			q += ',(e36)-[:P102]->(e35:E35)';
			q += ',(e36)-[:P106]->(marker:E90)-[:P3]->(comment:E62)';
			q += ',(e36)-[:P106]->(:E36)-[:P1]->(paint:E75)';
			
			//q += ' RETURN {id: e36.content, file: e75.content, path: e75.path, width: e75.width, height: e75.height, markers: collect({id: marker.content, u: marker.u, v: marker.v, comment: comment.content})} AS screenshots';
			q += ' RETURN e36.content AS id, \
				e75.content AS file, \
				e75.path AS path, \
				e75.width AS width, \
				e75.height AS height, \
				e35.value AS title, \
				{object: e22.content, matrix: e36.pinMatrix} AS pin, \
				{center: e36.cameraCenter, matrix: e36.cameraMatrix, fov: e36.cameraFOV} AS camera, \
				collect({id: marker.content, u: marker.u, v: marker.v, comment: comment.value}) AS markers, \
				{file: paint.content, path: paint.path, width: paint.width, height: paint.height} AS drawing';
			
			return $http.post(phpUrl, {
				query: q,
				params: {}
			});
		};
		
		/**
		  * tags
		 * @deprecated
		*/
		requests.getAllTags = function(prj) {
			return $http.post(phpUrl, {
				query: 'MATCH (n:TAG:'+prj+') RETURN n.content as tags',
				params: {}
			});
		};

		/**
		 * @deprecated
		 */
		requests.searchTags = function(prj, query) {
			return $http.post(phpUrl, {
				query:
					'MATCH (n:TAG:'+prj+') \
					WHERE n.content =~ ".*'+query+'.*" \
					RETURN n.content as tag ORDER BY tag',
				params: {}
			});
		};
		
		return requests;
		
	}]);

angular.module('dokuvisApp').factory('phpRequest',
	function($http) {
	
		var requests = {};

		/**
		 * @deprecated
		 * @param file
		 * @returns {*}
		 */
		requests.getSvgContent = function(file) {
			return $http.post('php/getSvgContent.php', {
				file: file
			});
		};

		/**
		 * @deprecated
		 * @param path
		 * @param filename
		 * @param base64
		 * @param thumb
		 * @returns {*}
		 */
		requests.saveBase64Image = function(path, filename, base64, thumb) {
			return $http.post('php/saveBase64Image.php', {
				path: path,
				filename: filename,
				imgdata: base64,
				thumbnail: thumb
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


angular.module('dokuvisApp').factory('mysqlRequest',
	function($http, API) {
	
		var requests = {};
		
		/**
		  * Projekte
		 */
		// Projekt Info
		requests.getProjectEntry = function(proj) {
			return $http.post('php/mysql/getProjectEntry.php', {
				proj: proj
			});
		};
		
		requests.getAllStaff = function(pid) {
			return $http.post('php/mysql/getAllStaff.php', {
				pid: pid				
			});
		};
		
		requests.getAllRoles = function() {
			return $http.post('php/mysql/getAllRoles.php', {});
		};
		
		requests.addNewStaff = function(id,name,surname,mail,role,pid) {
			
			return $http.post('php/mysql/addNewStaff.php', {
				name: name,
				surname: surname,
				sid: id,
				mail:mail,
				rid: role,
				pid: pid
			});
		};
		
		requests.updateName = function(name,id) {
			return $http.post('php/mysql/updateName.php', {
				name: name,
				sid: id
				
			});
			
		};
		
		/* requests.updateSurname = function(surname,id) {
			return $http.post('php/mysql/updateSurname.php', {
				surname: surname,
				sid: id,
				
			});
			
		};
		 */
		requests.updateMail = function(mail,id) {
			return $http.post('php/mysql/updateMail.php', {
				email: mail,
				sid: id
				
			});
			
		};
		
		requests.updateRole = function(role,id) {
			return $http.post('php/mysql/updateRame.php', {
				role: role,
				sid: id
				
			});
			
		};
		
		
		requests.removeStaff = function(staffId,roleId,pid) {
			return $http.post('php/mysql/removeStaff.php', {
				sid: staffId,
				rid: roleId,
				pid: pid
			});
		};
				
		return requests;
	});