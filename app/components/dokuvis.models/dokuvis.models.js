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

.factory('ModelUploader', ['$window', '$stateParams', 'API', 'FileUploader', 'Utilities', 'moment',
	function ($window, $stateParams, API, FileUploader, Utilities, moment) {

		var headers = {};
		if ($window.localStorage.token) {
			headers['X-Access-Token'] = $window.localStorage.token;
			headers['X-Key'] = $window.localStorage.user;
		}

		var uploader = new FileUploader({
			headers: headers,
			alias: 'uploadModelFile'
		});

		// FILTER
		var modelTypes = ['dae', 'DAE', 'obj', 'zip'];

		// restrict to file types
		uploader.filters.push({
			name: 'modelFilter',
			fn: function(item) {
				var type = item.name.slice(item.name.lastIndexOf('.') + 1);
				return modelTypes.indexOf(type) !== -1;
			}
		});

		// CALLBACKS
		uploader.onWhenAddingFileFailed = function(item, filter, options) {
			console.warn('onWhenAddingFileFailed', item, filter, options);
			Utilities.dangerAlert('Nicht unterstütztes Format!');
		};

		uploader.onAfterAddingFile = function (item) {
			console.info('onAfterAddingFile', item);

			item.sourceType = 'model';

			item.isProcessing = false;
		};

		uploader.onProgressItem = function(fileItem, progress) {
			if (progress === 100)
				fileItem.isProcessing = true;
		};

		uploader.onBeforeUploadItem = function (item) {
			// set POST request url
			item.url =  API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/model/upload';

			// push data to request form data
			item.formData = [];
			item.formData.push({
				date: moment().format(),
				title: 'Versuch mit MultiMaterial',
				note: 'Weitere Anmerkungen',
				software: '3ds max',
				predecessor: 'd7_rylly5GZiZ'
			});
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
			Utilities.throwApiException('#source.create', response);

		};

		uploader.onCancelItem = function(fileItem, response, status, headers) {
			console.warn('onCancelItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
		};

		return uploader;

	}
])

.controller('modelUploadModalCtrl', ['$scope', '$state', '$timeout', 'ModelUploader',
	function ($scope, $state, $timeout, ModelUploader) {

		/**
		 * Instance of `{@link https://github.com/nervgh/angular-file-upload FileUploader}` provided by `ModelUploader` factory.
		 * @ngdoc property
		 * @name modelUploadModalCtrl#uploader
		 * @type {FileUploader}
		 */
		$scope.uploader = ModelUploader;

		/**
		 * Triggers click event on hidden files input field.
		 * @ngdoc method
		 * @name modelUploadModalCtrl#openFileDialog
		 * @param event {Object} Click event on parent html element
		 */
		$scope.openFileDialog = function (event) {
			$timeout(function () {
				angular.element(event.delegateTarget).find('input').trigger('click');
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

.directive('modelTree', ['Model',
	function (Model) {

	}
])

.factory('ModelVersion', ['$resource', 'ApiParams', 'ApiModelVersion',
	function ($resource, ApiParams, ApiModelVersion) {

		return $resource(ApiModelVersion + '/:id', angular.extend({ id: '@id' }, ApiParams));

	}
])

.directive('versionList', ['ComponentsPath', 'ModelVersion', 'Utilities', 'ModelUploader',
	function (ComponentsPath, ModelVersion, Utilities, ModelUploader) {

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

			}
		}

	}
]);
