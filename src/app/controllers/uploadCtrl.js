/**
 * Controller of the Upload modal. The modal can be used to upload either a source with its metadata, or a 3D model.
 * @ngdoc controller
 * @name uploadCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://christopherthielen.github.io/ui-router-extras/#/previous $previousState
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires Uploader
 * @requires neo4jRequest
 * @requires API
 * @requires Archive
 * @requires Utilities
 */
angular.module('dokuvisApp').controller('uploadCtrl', ['$scope', '$state', '$stateParams', '$previousState', '$timeout', 'Uploader', 'neo4jRequest', 'API', 'Archive', 'Utilities',
	function ($scope, $state, $stateParams, $previousState, $timeout, Uploader, neo4jRequest, API, Archive, Utilities) {

        $previousState.memo('modalInvoker');

		// init
		var isInserting = false;

		var imageTypes = ['jpg','JPG','png','PNG','jpeg','bmp','gif','tiff'];
		var textTypes = ['pdf'];

		/**
		 * Current upload type (part of route/state url) `'source'|'model'|'zip'`
		 * @ngdoc property
		 * @name uploadCtrl#uploadType
		 * @type {string}
		 */
		$scope.uploadType = $stateParams.uploadType;
		$scope.attachTo = $stateParams.attachTo;

		/**
		 * List of available archives (to choose from source select form)
		 * @ngdoc property
		 * @name uploadCtrl#archives
		 * @type {Array}
		 */
		$scope.archives = [];

		var uploader = Uploader;

		// FILTERS

		if($scope.uploadType == 'source') {
			$scope.title = 'source_upload_title';
			uploader.filters.push({
				name: 'sourceFilter',
				fn: function(item) {
					var type = item.type.slice(item.type.lastIndexOf('/') + 1);
					return imageTypes.concat(textTypes).indexOf(type) !== -1;
				}
			});
		}
		else if($scope.uploadType == 'model') {
			$scope.title = 'Modell einfügen';
			uploader.filters.push({
				name: 'modelFilter',
				fn: function(item) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|dae|DAE|obj|zip|'.indexOf(type) !== -1;
				}
			});
		}
		else if($scope.uploadType == 'zip') {
			$scope.title = '3D-Plan hinzufügen';
			uploader.filters.push({
				name: 'zipFilter',
				fn: function(item) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|zip|ZIP|'.indexOf(type) !== -1;
				}
			});
		}

		// CALLBACKS

		uploader.onWhenAddingFileFailed = function(item, filter, options) {
			console.info('onWhenAddingFileFailed', item, filter, options);
			Utilities.dangerAlert('Nicht unterstütztes Format!');
		};
		uploader.onAfterAddingFile = function(item) {
			console.info('onAfterAddingFile', item);

			item.tid = Utilities.getUniqueId();

			if($scope.uploadType === 'source') {
				var type = item.file.type.slice(item.file.type.lastIndexOf('/') + 1);
				if(imageTypes.indexOf(type) !== -1) {
					item.sourceType = 'plan';
					//item.url = 'php/uploadImage.php';
					item.url = API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/source';
				}
				else if(textTypes.indexOf(type) !== -1) {
					item.sourceType = 'text';
					item.language = 'de';
					item.url = 'php/processText.php';
				}

				item.title = '';
				item.author = '';
				item.creationDate = '';
				item.repros = '';
				item.note = '';
				
				item.formExtend = false;
				item.creationPlace = '';
				item.archive = '';
				item.archiveNr = '';
				item.primary = false;
				item.tags = [];
				
				item.ocr = false;
				item.resample = false;
			}
			else if($scope.uploadType === 'model') {
				item.sourceType = 'model';
				//item.url = 'php/processDAE.php';
				item.url = API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/model/upload';
			}
			else if($scope.uploadType === 'zip') {
				item.sourceType = 'plans/model';
				item.url = 'php/planmodelFromZip.php';
			}

			item.errorInput = false;
			item.isProcessing = false;
			// item.isInserting = false;
			// item.anzInserting = 0;
			// item.anzInserted = 0;

			Utilities.sleep(1);
		};
		uploader.onAfterAddingAll = function(addedFileItems) {
			console.info('onAfterAddingAll', addedFileItems);
		};
		uploader.onBeforeUploadItem = function(item) {
			console.info('onBeforeUploadItem', item);

			// set POST request url
			uploader.url = item.url;
			
			// push data to request form data
			item.formData = [];

			if($scope.uploadType === 'source') {
				item.formData.push({
					sourceType: item.sourceType,
					tid: item.tid,
					date: moment().format(),

					title: item.title,
					author: item.author,
					creationDate: item.creationDate,
					repros: item.repros,
					note: item.note,

					creationPlace: item.creationPlace,
					archive: item.archive,
					archiveNr: item.archiveNr,
					primary: item.primary,
					tags: item.tags.map(function (t) {
						return t.text;
					}),

					language: item.language,
					ocr: item.ocr,
					resample: item.resample
				});
			}
			else if($scope.uploadType === 'model') {
				item.formData.push({
					sourceType: item.sourceType,
					tid: item.tid,
					date: moment().format()

				});
			}
		};
		uploader.onProgressItem = function(fileItem, progress) {
			//console.info('onProgressItem', fileItem, progress);
			if(progress === 100)
				fileItem.isProcessing = true;
		};
		uploader.onProgressAll = function(progress) {
			//console.info('onProgressAll', progress);
		};
		uploader.onSuccessItem = function(fileItem, response, status, headers) {
			console.info('onSuccessItem', fileItem, response, status, headers);

			fileItem.isProcessing = false;

			if(!(response instanceof Object) || response.error) {
				console.error(response);
				fileItem.isSuccess = false;
				fileItem.isError = true;
				fileItem.isUploaded = false;
				return;
			}

			//console.log(response);
			// if(response.data && response.data.pages) {
			// 	fileItem.formData[0].pages = response.data.pages;
			// }

			//return;
			//fileItem.isInserting = true;

			if($scope.uploadType == 'source') {
				console.log('done', response);

			}

			else if($scope.uploadType == 'model') {

				console.log('done', response);

			}

			else if($scope.uploadType == 'zip') {
				console.log('everything done - start cypher query');
				isInserting = true;
				neo4jRequest.attach3DPlan($stateParams.project, fileItem.formData[0], response, $scope.attachTo).then(function(response){
					if(response.data.exception) { console.error('neo4j failed on attach3DPlan()', response.data); return; }
					console.log('attach3DPlan', response.data);
					isInserting = false;
					fileItem.isInserting = false;
				});
			}

		};
		uploader.onErrorItem = function(fileItem, response, status, headers) {
			console.info('onErrorItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
			fileItem.isUploaded = false;
			if($scope.uploadType === 'source')
				Utilities.throwApiException('on source.create', response);
			else if($scope.uploadType === 'model')
				Utilities.throwApiException('on upload.model', response);

		};
		uploader.onCancelItem = function(fileItem, response, status, headers) {
			console.info('onCancelItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
		};
		uploader.onCompleteItem = function(fileItem, response, status, headers) {
			//console.info('onCompleteItem', fileItem, response, status, headers);
		};
		uploader.onCompleteAll = function() {
			console.info('onCompleteAll');
		};

		console.info('uploader', uploader);
        $scope.uploader = uploader;

		/**
		 * Check, if all relevant input fields are set, and upload each item.
		 * @ngdoc method
		 * @name uploadCtrl#checkAndUploadAll
		 */
		$scope.checkAndUploadAll = function() {
			// wait for responses and validate inputs
			$timeout(function() {
				if($scope.uploadType == 'source') {
					for(var i=0, l=uploader.queue.length; i<l; i++) {
						var item = uploader.queue[i];
						if(!item.title.length) {
							item.errorInput = true;
							Utilities.dangerAlert('Geben Sie mindestens einen Titel ein!');
						}
						else {
							item.errorInput = false;
							if(!item.isSuccess)
								item.upload();
						}
					}
				}
				else
					uploader.uploadAll();
			}, 1000);
		};

		/**
		 * Triggers click event on hidden files input field.
		 * @ngdoc method
		 * @name uploadCtrl#openFileDialog
		 * @param event {Object} Click event on parent html element
		 */
		$scope.openFileDialog = function(event) {
			$timeout(function() {
				angular.element(event.delegateTarget).find('input').trigger('click');
			});
		};

		/**
		 * Process tag after it has been added.
		 * @ngdoc method
		 * @name uploadCtrl#onTagAdded
		 * @param tag {Object} Reference to tag object
		 */
		$scope.onTagAdded = function(tag) {
			tag.text = tag.text.toLowerCase();
		};

		/**
		 * Query all tags that contain the search term.
		 * @ngdoc method
		 * @name uploadCtrl#getTags
		 * @param query {string} Search term
		 * @returns {Array} Array of tags
		 */
		$scope.getTags = function(query) {
			return neo4jRequest.searchTags($stateParams.project, query).then(function(response) {
				if(response.data.exception) { console.error('neo4j failed on getAllTags()', response.data); return; }
				//console.log(Utilities.extractArrayFromNeo4jData(response.data));
				return Utilities.extractArrayFromNeo4jData(response.data);
			});
		};

		function queryArchives() {
			Archive.query().$promise.then(function(response){
				$scope.archives = response;
				console.log('Archives:', $scope.archives);
			}, function (err) {
				Utilities.throwApiException('on Archive.query()', err);
			});
		}

		// init
		queryArchives();

		/**
		 * Closes the modal and destroys the controller instance.
		 * @ngdoc method
		 * @name uploadCtrl#close
		 */
		$scope.close = function () {
			this.$hide();
            Uploader.clearQueue();
			Uploader.filters.pop();
			this.$destroy();

			if($previousState.get('modalInvoker').state)
				$previousState.go('modalInvoker');
			else
				$state.go('project.explorer');
		};

		$scope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
			if(toState.name !== 'project.explorer.upload.type.archive' && fromState.name !== 'project.explorer.upload.type.archive') {
				$timeout(function () {
					$scope.close();
				});
			}
		});

		$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
			if(fromState.name === 'project.explorer.upload.type.archive')
				queryArchives();
		});

	}]);
