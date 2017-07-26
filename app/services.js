angular.module('dokuvisApp').factory('APIRequest',
	function($http, API, $stateParams) {
	
		var requests = {};

		/**
		 * @deprecated
		 */
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

		var phpUrl = 'php/neo4jrequest.php';
		
		var requests = {};
		

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
