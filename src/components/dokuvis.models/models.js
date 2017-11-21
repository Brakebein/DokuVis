/**
 * Module that adds functionality to upload and query models and different versions of it.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 * * [ui.router](https://ui-router.github.io/ng1/docs/0.3.2/#/api)
 * * [angularFileUpload](https://github.com/nervgh/angular-file-upload)
 * * [angularMoment](https://github.com/urish/angular-moment)
 * * [pascalprecht.translate](https://angular-translate.github.io/)
 * * [ngTagsInput](http://mbenford.github.io/ngTagsInput/)
 *
 * ### ModelVersion object
 * ```
 * {
 *   created: {                  // who uploaded the model?
 *     id: <id>,                 // user id
 *     name: <string>,           // user name
 *     date: <string>,           // upload date
 *   },
 *   id: <id>,                   // id of the version
 *   note: <string>,             // additional notes describing the version
 *   predecessor: <id>,          // id of the predecessor version
 *   software: <Array<string>>,  // used software
 *   summary: <string>           // summary of version description
 * }
 * ```
 *
 * ### DigitalObject object
 * ```
 * {
 *   children: <Array<DigitalObject>>,      // DigitalObjects linked to this instance hierarchically
 *   file: {
 *     content: <id|Array<id>>,             // filename or filenames of the geometry files
 *     edges: <string|Array<string>>,       // filename or filenames of the files containing the edges geometry
 *     geometryId: <string|Array<string>>,  // id of geometry within the DAE file
 *     original: <string>,                  // filename of the original DAE/ZIP file
 *     path: <string>,                      // path to the files
 *     type: <string>                       // type of the original file (should be 'dae' or 'zip')
 *   },
 *   id: <id>,                              // id of the DigitalObject
 *   materials: <Array<{
 *     alpha: <string>,                     // filename of the alpha map (optional)
 *     content: <id>,                       // internal id of the material
 *     diffuse: <string|Array<number>>,     // filename of the texture or array of color values
 *     id: <string>,                        // id of material within the DAE file
 *     name: <string>,                      // name of the file as retrieved from the DAE file
 *     path: <string>                       // path to texture files
 *   }>>,
 *   obj: {
 *     content: <id>,                       // id of the object (same as above)
 *     id: <string>,                        // id of the mesh as described within the DAE file
 *     matrix: <Array<number>>,             // 4x4 matrix values
 *     name: <string>,                      // name of the object as retrieved from the DAE file
 *     type: <string>,                      // type of the object (should be 'object', or 'group' if there is no geometry)
 *     unit: <number>,                      // unit as retrieved from DAE file (1.0 = meter)
 *     up: <string>                         // up axis (should be 'Y' or 'Z')
 *   },
 *   parent: <id|null>,                     // id of parent DigitalObject
 *   versionId: <id>                        // id of the associated version
 * }
 * ```
 *
 * @ngdoc module
 * @name dokuvis.models
 * @module dokuvis.models
 */
angular.module('dokuvis.models', [
	'ngResource',
	'ui.router',
	'angularFileUpload',
	'angularMoment',
	'pascalprecht.translate',
	'ngTagsInput'
])

/**
 * @deprecated
 */
.factory('Model', ['$http', 'API', '$stateParams',
	function ($http, API, $stateParams) {

		return {
			getModels: function () {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/models');
			},

			insert: function (formData, objDatas) {
				return $http.post(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/models', {
					formData: formData,
					objDatas: objDatas
				});
			},

			getConnections: function (id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/model/' + id + '/connect');
			},

			get: function (id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/model/' + id);
			},

			update: function (data) {
				return $http.put(API + 'auth/project/' + $stateParams.project + '/model/' + data.obj.content, data);
			}
		};

	}
])

/**
 * $resource to query versions of models.
 * @ngdoc factory
 * @name ModelVersion
 * @module dokuvis.models
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiModelVersion
 */
.factory('ModelVersion', ['$resource', 'ApiParams', 'ApiModelVersion',
	function ($resource, ApiParams, ApiModelVersion) {

		return $resource(ApiModelVersion + '/:id', angular.extend({ id: '@id' }, ApiParams), {
			queryModels: {
				url: ApiModelVersion + '/:id/object',
				methed: 'GET',
				isArray: true
			}
		});

		/**
		 * Get all versions within the current subproject.
		 * ```
		 * ModelVersion.query().$promise
		 *   .then(function (versions) {...});
		 * ```
		 * @ngdoc method
		 * @name ModelVersion#query
		 * @return {Promise} Promise with versions as array as resolve value.
		 */

	}
])

/**
 * $resource to query the 3D objects of a version.
 * @ngdoc factory
 * @name DigitalObject
 * @module dokuvis.models
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiModelVersion
 */
.factory('DigitalObject', ['$resource', 'ApiParams', 'ApiModelVersion',
	function ($resource, ApiParams, ApiModelVersion) {

		function createHierarchy(data) {
			for (var i = 0; i < data.length; i++) {
				var obj = data[i];
				if (!obj.children) obj.children = [];
				if (obj.parent) {
					var parent = getObjectById(data, obj.parent);
					if (parent) {
						if (!parent.children) parent.children = [];
						parent.children.push(new resource(obj));
						data.splice(i, 1);
						i--;
					}
				}
			}
			return data;
		}

		function getObjectById(data, id) {
			for (var i = 0; i < data.length; i++) {
				if (data[i].id === id) return data[i];
				if (data[i].children) {
					var obj = getObjectById(data[i].children, id);
					if (obj !== undefined) return obj;
				}
			}
			return undefined;
		}

		var resource =  $resource(ApiModelVersion + '/:versionId/object/:id', angular.extend({ id: '@id', versionId: '@versionId' }, ApiParams), {
			query: {
				method: 'GET',
				isArray: true,
				transformResponse: function (json) {
					return createHierarchy(angular.fromJson(json));
				}
			},
			update: {
				method: 'PUT'
			}
		});

		return resource;

	}
])

/**
 * $resource to query software entries.
 * @ngdoc factory
 * @name Software
 * @module dokuvis.models
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiSoftware
 */
.factory('Software', ['$resource', 'ApiParams', 'ApiSoftware',
	function ($resource, ApiParams, ApiSoftware) {

		return $resource(ApiSoftware + '/:id', angular.extend({ id: '@id' }, ApiParams));

	}
])

/**
 * This factory provides an instance of [FileUploader](https://github.com/nervgh/angular-file-upload) specified to upload models/3D files.
 * @ngdoc factory
 * @name ModelUploader
 * @module dokuvis.models
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires ApiParams
 * @requires ApiModelVersion
 * @requires https://github.com/nervgh/angular-file-upload FileUploader
 * @requires Utilities
 * @requires https://github.com/urish/angular-moment moment
 * @return {FileUploader} An instance of FileUploader.
  */
.factory('ModelUploader', ['$window', '$rootScope', 'ApiParams', 'ApiModelVersion', 'FileUploader', 'Utilities', 'moment',
	function ($window, $rootScope, ApiParams, ApiModelVersion, FileUploader, Utilities, moment) {

		var headers = {};
		if ($window.localStorage.token) {
			headers['X-Access-Token'] = $window.localStorage.token;
			headers['X-Key'] = $window.localStorage.user;
		}

		var uploader = new FileUploader({
			headers: headers,
			alias: 'uploadModelFile',
			queueLimit: 1
		});

		// FILTER
		var modelTypes = ['dae','zip'];

		// restrict to file types
		uploader.filters.push({
			name: 'modelFilter',
			fn: function(item) {
				var type = item.name.slice(item.name.lastIndexOf('.') + 1).toLowerCase();
				return modelTypes.indexOf(type) !== -1;
			}
		});

		// CALLBACKS
		uploader.onWhenAddingFileFailed = function(item, filter, options) {
			// if there is already another file in the queue, replace it by the new file
			if (filter.name === 'queueLimit') {
				uploader.clearQueue();
				uploader.addToQueue(item);
			}
			else if (filter.name === 'modelFilter') {
				Utilities.dangerAlert('error_file_nosupport');
			}
			else {
				console.warn('onWhenAddingFileFailed', item, filter, options);
				Utilities.dangerAlert('error_unknown');
			}
		};

		uploader.onAfterAddingFile = function (item) {
			item.isProcessing = false;
		};

		uploader.onProgressItem = function(fileItem, progress) {
			if (progress === 100)
				fileItem.isProcessing = true;
		};

		uploader.onBeforeUploadItem = function (item) {
			// set POST request url
			item.url = Utilities.setUrlParams(ApiModelVersion, ApiParams);

			// push data to request form data
			item.formData = [];
			item.formData.push({
				date: moment().format(),
				summary: item.commit.summary,
				note: item.commit.note,
				software: item.commit.software.map(function (sw) {
					return sw.name;
				}),
				predecessor: item.commit.parent
			});

			item.showProgress = true;
		};

		uploader.onSuccessItem = function (item, response) {
			item.isProcessing = false;

			if (!(response instanceof Object) || response.error) {
				item.isSuccess = false;
				item.isError = true;
				item.isUploaded = false;
				Utilities.throwApiException('#ModelVersion.upload', response);
				modelUploadError(response);
			}
			else {
				modelUploadSuccess(response);
			}
		};

		uploader.onErrorItem = function(fileItem, response, status, headers) {
			console.error('onErrorItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
			fileItem.isUploaded = false;
			Utilities.throwApiException('#ModelVersion.upload', response);
			modelUploadError(response);
		};

		// uploader.onCompleteItem = function (fileItem) {
		// 	console.log('done', fileItem)
		// };

		uploader.onCancelItem = function(fileItem, response, status, headers) {
			console.warn('onCancelItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
		};

		/**
		 * Event that gets fired, when the the file was successfully uploaded and processed.
		 * @ngdoc event
		 * @name ModelUploader#modelUploadSuccess
		 * @eventType broadcast on $rootScope
		 * @param response {Object} HTTP request response object.
		 */
		function modelUploadSuccess(response) {
			$rootScope.$broadcast('modelUploadSuccess', response);
		}

		/**
		 * Event that gets fired, when an error occured while uploading or processing the file server-side.
		 * @ngdoc event
		 * @name ModelUploader#modelUploadError
		 * @eventType broadcast on $rootScope
		 * @param response {Object} HTTP request response object.
		 */
		function modelUploadError(response) {
			$rootScope.$broadcast('modelUploadError', response);
		}

		return uploader;

	}
])

/**
 * Controller for modal for uploading 3D files.
 * @ngdoc controller
 * @name modelUploadModalCtrl
 * @module dokuvis.models
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires ModelUploader
 * @requires Software
 * @requires Utilities
 */
.controller('modelUploadModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'ModelUploader', 'Software', 'Utilities',
	function ($scope, $state, $stateParams, $timeout, ModelUploader, Software, Utilities) {

		/**
		 * Instance of `{@link https://github.com/nervgh/angular-file-upload FileUploader}` provided by `ModelUploader` factory.
		 * @ngdoc property
		 * @name modelUploadModalCtrl#uploader
		 * @type {FileUploader}
		 */
		$scope.uploader = ModelUploader;

		$scope.commit = {
			summary: '',
			note: '',
			software: []
		};

		$scope.parent = $stateParams.parent;

		// watch first queue item and assign to $scope
		$scope.$watch(function () {
			return ModelUploader.queue[0];
		}, function (item) {
			if (item)
				$scope.fileitem = ModelUploader.queue[0];
			else
				$scope.fileitem = null;
		});

		// start upload
		$scope.checkAndUpload = function () {
			if (!$scope.fileitem) return;
			if (!$scope.commit.summary.length) {
				Utilities.dangerAlert('model_form_summary_missing');
				return;
			}

			$scope.fileitem.commit = $scope.commit;
			$scope.fileitem.commit.parent = $scope.parent && $scope.parent.id !== 'root' ? $scope.parent.id : null;
			$scope.fileitem.upload();
		};

		// query software entries for ngInputTags
		$scope.searchSoftware = function (query) {
			return Software.query({ search: query }).$promise
				.then(function (results) {
					return results;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Software.query', reason);
					return [];
				});
		};

		/**
		 * Close the modal and go to parent state.
		 * @ngdoc method
		 * @name modelUploadModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^.^');
		};

	}
])

/**
 * Directive displaying all the versions as a graph.
 * @ngdoc directive
 * @name versionGraph
 * @module dokuvis.models
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires ModelVersion
 * @requires Utilities
 * @requires https://github.com/urish/angular-moment moment
 * @requires https://docs.angularjs.org/api/ng/service/$log $log
 * @restrict E
 * @scope
 */
.directive('versionGraph', ['$rootScope', '$state', 'ModelVersion', 'Utilities', 'moment', '$log',
	function ($rootScope, $state, ModelVersion, Utilities, moment, $log) {

		return {
			templateUrl: 'components/dokuvis.models/versionGraph.tpl.html',
			restrict: 'E',
			scope: {},
			link: function (scope) {

				var versions = null,
					activeVersion = null;

				function queryVersions() {
					ModelVersion.query().$promise
						.then(function (results) {
							$log.debug('versions:', results);
							// add root
							results.unshift({ id: 'root', predecessor: null, summary: 'root', created: { date: 0 } });
							versions = results;
							scope.select(versions[versions.length - 1]);
							// buildGraph(results);
						})
						.catch(function (reason) {
							Utilities.throwApiException('#ModelVersion.query', reason);
						});
				}

				// init
				queryVersions();

				// listen to modelUploadSuccess event
				scope.$on('modelUploadSuccess', function () {
					queryVersions();
				});

				function buildGraph(data) {
					var tmpData = [].concat(data);

					// add blind version / only in subproject
					if ($rootScope.globalSubproject)
						tmpData.push({
							id: 'blind',
							predecessor: activeVersion ? activeVersion.id : tmpData[tmpData.length - 1].id,
							summary: 'model_version_new',
							created: { date: moment().format() }
						});

					// create d3 hierarchie
					var root = d3.stratify()
						.id(function (d) { return d.id;	})
						.parentId(function (d) {
							if (d.id === 'root') return null;
							return d.predecessor || 'root';
						})
						(tmpData);

					// get d3 nodes as sorted array
					var sorted = root.descendants().sort(function (a, b) {
						if (!a.data.created.date) return -1;
						if (!b.data.created.date) return 1;
						if (a.data.created.date < b.data.created.date) return -1;
						else return 1;
					});

					var newColOffset = 0;
					var cols = {};
					var blindIndex = 0;

					// determine postion (row, col) of each node
					// and get start/end of each col
					sorted.forEach(function (node, index) {
						var colIndex = 0;
						var parentRow = -1;
						var parentCol = 0;

						if (node.parent) {
							parentRow = node.parent.index.row;
							parentCol = node.parent.index.col;

							if (node.parent.children[0] === node)
								colIndex = parentCol;

							for (var i = 1; i < node.parent.children.length; i++) {
								if (node.parent.children[i] === node) {
									colIndex = parentCol + ++newColOffset;
									if (!cols[colIndex]) cols[colIndex] = {};
									cols[colIndex].start = parentRow;
								}
							}
						}

						if (!cols[colIndex]) cols[colIndex] = { start: index };
						cols[colIndex].end = index;

						node.index = {
							row: index,
							col: colIndex,
							parentRow: parentRow,
							parentCol: parentCol
						};
						if (node.data.id === 'blind')
							blindIndex = node.index;
					});

					var colCount = Object.keys(cols).length + (blindIndex.col === blindIndex.parentCol ? 1 : 0);
					var list = [];

					root.each(function (node) {
						var isBlind = false;
						// init cells
						var cells = [];
						for (var i = 0; i < colCount; i++)
							cells.push([]);

						// add node and incoming line
						isBlind = node.data.id === 'blind';
						cells[node.index.col].push({ type: 'node', css: node.data.id === 'root' ? 'bg-root' : isBlind ? 'bg-blind' : 'bg-' + node.index.col % 5 });
						if (node.data.id !== 'root') cells[node.index.col].push({ type: 'downtick', css: isBlind ? 'line-blind' : 'line-' + node.index.col % 5 });

						// add outgoing lines for children
						var children = node.children || [];
						children.forEach(function (c) {
							isBlind = c.data.id === 'blind';
							if (node.index.col === c.index.col)
								cells[node.index.col].push({ type: 'uptick', css: isBlind ? 'line-blind' : 'line-' + c.index.col % 5 });
							else {
								cells[node.index.col].push({ type: 'sidetick', css: isBlind ? 'line-blind' : 'line-' + c.index.col % 5 });
								cells[c.index.col].push({ type: 'corner', css: isBlind ? 'line-blind' : 'line-' + c.index.col % 5 });
								for (var i = node.index.col + 1; i < c.index.col; i++)
									cells[i].push({ type: 'hline', css: isBlind ? 'line-blind' : 'line-' + c.index.col % 5 });
							}
						});

						// fill other rows with vertical lines
						for (var key in cols) {
							if (+key === node.index.col) continue;
							if (node.index.row > cols[key].start && node.index.row < cols[key].end) {
								isBlind = blindIndex.col === +key && blindIndex.parentRow < node.index.row;
								cells[key].push({type: 'vline', css: isBlind ? 'line-blind' : 'line-' + key % 5});
							}
						}

						// write data into lists for view
						list.push({
							data: node.data,
							order: node.data.created.date || 0,
							parent: node.parent,
							children: node.children,
							index: node.index,
							cells: cells
						});
					});
					
					scope.versions = list;
				}

				// activate clicked version
				scope.select = function (vers) {
					$log.debug(vers);
					if (vers.id === 'blind') {
						$state.go('.upload.model', { parent: activeVersion });
						return;
					}

					if (activeVersion) activeVersion.active = false;
					activeVersion = vers;
					activeVersion.active = true;

					buildGraph(versions);
					modelVersionActive(vers);
				};

				/**
				 * Event that gets fired, when version has been selected/activated.
				 * @ngdoc event
				 * @name versionGraph#modelVersionActive
				 * @eventType broadcast on $rootScope
				 * @param vers {ModelVersion} The selected/activated version.
				 */
				function modelVersionActive(vers) {
					$rootScope.$broadcast('modelVersionActive', vers);
				}

			}
		}

	}
])

/**
 * Directive displaying details of a version.
 * @ngdoc directive
 * @name versionDetail
 * @module dokuvis.models
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires DigitalObject
 * @requires Utilities
 * @requires https://docs.angularjs.org/api/ng/service/$log $log
 * @restrict E
 * @scope
 */
.directive('versionDetail', ['$rootScope', 'DigitalObject', 'Utilities', '$log',
	function ($rootScope, DigitalObject, Utilities, $log) {

		return {
			templateUrl: 'components/dokuvis.models/versionDetail.tpl.html',
			restrict: 'E',
			scope: {},
			link: function (scope) {

				scope.version = null;

				// listen to modelVersionActive event
				scope.$on('modelVersionActive', function (event, version) {
					scope.version = version;
				});

				// query 3D objects of active version
				scope.load = function () {
					if (!scope.version && scope.version.id === 'root') return;

					DigitalObject.query({ versionId: scope.version.id }).$promise
						.then(function (results) {
							$log.debug(results);
							modelQuerySuccess(results);
						})
						.catch(function (reason) {
							Utilities.throwApiException('#DigitalObject.query', reason);
						});
				};

				/**
				 * Event that gets fired, when all models/3D object entries has been successfully retrieved from the database.
				 * @ngdoc event
				 * @name versionDetail#modelQuerySuccess
				 * @eventType broadcast on $rootScope
				 * @param entries {DigitalObject[]} Entries returned from the database as array (in hierachical order).
				 */
				function modelQuerySuccess(entries) {
					$rootScope.$broadcast('modelQuerySuccess', entries);
				}

			}
		}

	}
]);
