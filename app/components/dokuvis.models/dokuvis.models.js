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

.factory('ModelUploader', ['$window', '$stateParams', 'ApiParams', 'ApiModelVersion', 'FileUploader', 'Utilities', 'moment',
	function ($window, $stateParams, ApiParams, ApiModelVersion, FileUploader, Utilities, moment) {

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
			// console.info('onAfterAddingFile', item);
			item.isProcessing = false;
		};

		uploader.onProgressItem = function(fileItem, progress) {
			if (progress === 100)
				fileItem.isProcessing = true;
		};

		uploader.onBeforeUploadItem = function (item) {
			// set POST request url
			// item.url =  API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/model/upload';
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
			console.log(item, response);
			item.isProcessing = false;

			if (!(response instanceof Object) || response.error) {
				console.error(response);
				item.isSuccess = false;
				item.isError = true;
				item.isUploaded = false;
			}
		};

		uploader.onErrorItem = function(fileItem, response, status, headers) {
			console.error('onErrorItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
			fileItem.isUploaded = false;
			Utilities.throwApiException('#ModelVersion.upload', response);
		};

		uploader.onCancelItem = function(fileItem, response, status, headers) {
			console.warn('onCancelItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
		};

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
			$scope.fileitem.commit.parent = $scope.parent.id;
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

.directive('versionList', ['$rootScope', 'ComponentsPath', 'ModelVersion', 'Utilities', 'ModelUploader',
	function ($rootScope, ComponentsPath, ModelVersion, Utilities, ModelUploader) {

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
					ModelVersion.queryModels({ id: vers.id }).$promise
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
			}
		}

	}
]);
