angular.module('dokuvis.models', [
	'ui.router',
	'angularFileUpload'
])

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
		var modelTypes = ['dae','obj','zip'];

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
			if (filter.name === 'queueLimit') {
				uploader.clearQueue();
				uploader.addToQueue(item);
			}
			else if (filter.name === 'modelFilter') {
				Utilities.dangerAlert('Nicht unterstütztes Format!');
			}
			else {
				console.warn('onWhenAddingFileFailed', item, filter, options);
				Utilities.dangerAlert('Unknown failure while adding file. See console for details.');
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
				title: item.commit.title,
				note: item.commit.note,
				software: item.commit.software,
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

		uploader.onCancelItem = function(fileItem, response, status, headers) {
			console.warn('onCancelItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
		};

		// broadcast event
		function modelUploadSuccess(response) {
			$rootScope.$broadcast('modelUploadSuccess', response);
		}

		function modelUploadError(response) {
			$rootScope.$broadcast('modelUploadError', response);
		}

		return uploader;

	}
])

.controller('modelUploadModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'ModelUploader', 'Utilities',
	function ($scope, $state, $stateParams, $timeout, ModelUploader, Utilities) {

		/**
		 * Instance of `{@link https://github.com/nervgh/angular-file-upload FileUploader}` provided by `ModelUploader` factory.
		 * @ngdoc property
		 * @name modelUploadModalCtrl#uploader
		 * @type {FileUploader}
		 */
		$scope.uploader = ModelUploader;

		$scope.commit = {
			title: '',
			note: '',
			software: ''
		};

		$scope.parent = $stateParams.parent;

		// watch first queue item and assign to $scope
		$scope.$watch(function () {
			return ModelUploader.queue[0];
		}, function (item) {
			console.log(item);
			if (item)
				$scope.fileitem = ModelUploader.queue[0];
			else
				$scope.fileitem = null;
		});

		// start upload
		$scope.checkAndUpload = function () {
			if (!$scope.fileitem) return;
			if (!$scope.commit.title.length) {
				Utilities.dangerAlert('Geben Sie mindestens einen Titel ein!');
				return;
			}

			$scope.fileitem.commit = $scope.commit;
			$scope.fileitem.commit.parent = $scope.parent ? $scope.parent.id : null;
			$scope.fileitem.upload();
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

.directive('modelTree', ['Model',
	function (Model) {

	}
])

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

		var resource =  $resource(ApiModelVersion + '/:eventId/object/:id', angular.extend({ id: '@id', eventId: '@eventId' }, ApiParams), {
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

.factory('ModelVersion', ['$resource', 'ApiParams', 'ApiModelVersion',
	function ($resource, ApiParams, ApiModelVersion) {

		return $resource(ApiModelVersion + '/:id', angular.extend({ id: '@id' }, ApiParams), {
			queryModels: {
				url: ApiModelVersion + '/:id/object',
				methed: 'GET',
				isArray: true
			}
		});

	}
])

.directive('versionList', ['$rootScope', 'ComponentsPath', 'ModelVersion', 'DigitalObject', 'Utilities', 'ModelUploader',
	function ($rootScope, ComponentsPath, ModelVersion, DigitalObject, Utilities, ModelUploader) {

		return {
			templateUrl: ComponentsPath + '/dokuvis.models/versionList.tpl.html',
			restrict: 'E',
			scope: {},
			link: function (scope) {

				scope.uploader = ModelUploader;

				scope.verions = [];

				function queryVersions() {
					ModelVersion.query().$promise
						.then(function (results) {
							console.log('versions:', results);
							scope.versions = results;
						})
						.catch(function (reason) {
							Utilities.throwApiException('#ModelVersion.query', reason);
						});
				}

				// init
				queryVersions();

				scope.loadModels = function (vers) {
					console.log(vers);
					DigitalObject.query({ eventId: vers.id }).$promise
						.then(function (results) {
							console.log(results);
							modelQuerySuccess(results);
						})
						.catch(function (reason) {
							Utilities.throwApiException('#ModelVersion.loadModels', reason);
						});
				};

				function modelQuerySuccess(entries) {
					$rootScope.$broadcast('modelQuerySuccess', entries);
				}

				// listen to modelUploadSuccess event
				scope.$on('modelUploadSuccess', function () {
					queryVersions();
				});
			}
		}

	}
])

.directive('versionGraph', ['$rootScope', 'ComponentsPath', 'ModelVersion', 'DigitalObject', 'Utilities', 'moment',
	function ($rootScope, ComponentsPath, ModelVersion, DigitalObject, Utilities, moment) {

		return {
			templateUrl: ComponentsPath + '/dokuvis.models/versionGraph.tpl.html',
			restrict: 'E',
			scope: {},
			link: function (scope, element) {

				var versions = null,
					activeVersion = null;

				function queryVersions() {
					ModelVersion.query().$promise
						.then(function (results) {
							console.log('versions:', results);
							versions = results;
							buildGraph(results);
						})
						.catch(function (reason) {
							Utilities.throwApiException('#ModelVersion.query', reason);
						});
				}

				// init
				queryVersions();

				function buildGraph(data) {
					var tmpData = [].concat(data);
					// add root
					tmpData.unshift({ id: 'root', predecessor: null, title: 'root', created: {} });
					// add blind version
					tmpData.push({ id: 'blind', predecessor: activeVersion ? activeVersion.id : data[data.length - 1].id, title: 'New', created: { date: moment().format() } });

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
					var blindIndex;

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
						cells[node.index.col].push({ type: 'node', css: isBlind ? 'bg-blind' : 'bg-' + node.index.col });
						if (node.data.id !== 'root') cells[node.index.col].push({ type: 'downtick', css: isBlind ? 'line-blind' : 'line-' + node.index.col });

						// add outgoing lines for children
						var children = node.children || [];
						children.forEach(function (c) {
							isBlind = c.data.id === 'blind';
							if (node.index.col === c.index.col)
								cells[node.index.col].push({ type: 'uptick', css: isBlind ? 'line-blind' : 'line-' + c.index.col });
							else {
								cells[node.index.col].push({ type: 'sidetick', css: isBlind ? 'line-blind' : 'line-' + c.index.col });
								cells[c.index.col].push({ type: 'corner', css: isBlind ? 'line-blind' : 'line-' + c.index.col });
								for (var i = node.index.col + 1; i < c.index.col; i++)
									cells[i].push({ type: 'hline', css: isBlind ? 'line-blind' : 'line-' + c.index.col });
							}
						});

						// fill other rows with vertical lines
						for (var key in cols) {
							if (+key === node.index.col) continue;
							if (node.index.row > cols[key].start && node.index.row < cols[key].end) {
								isBlind = blindIndex.col === +key && blindIndex.parentRow < node.index.row;
								cells[key].push({type: 'vline', css: isBlind ? 'line-blind' : 'line-' + key});
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

				scope.select = function (vers) {
					console.log(vers);
					if (vers.id === 'blind') return;
					if (activeVersion) activeVersion.active = false;
					activeVersion = vers;
					activeVersion.active = true;
					buildGraph(versions);
				}

			}
		}

	}
]);
