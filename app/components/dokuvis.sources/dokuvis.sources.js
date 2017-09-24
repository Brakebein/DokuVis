/**
 * Components to integrate sources.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 * * [ui.router](https://ui-router.github.io/ng1/docs/0.3.2/#/api)
 * * [angularFileUpload](https://github.com/nervgh/angular-file-upload)
 * * [angularMoment](https://github.com/urish/angular-moment)
 * * {@link dokuvis.archives}
 *
 * ### Requirements
 * Add `dokuvis.sources.js` and `dokuvis.sources.css` to your `index.html` and add `dokuvis.sources` as dependency.
 *
 * In your application, define a constant named `ApiSource` to specify the REST-API url. The url will be extended by `/:id`. Don't forget to set your {@link ApiParams}.
 * ```
 * // example
 * var myApp = angular.module('myApp', ['dokuvis.sources']);
 * myApp.constant('ApiSource', 'api/auth/project/:project/:subproject/source');
 * ```
 *
 * ### Source object
 * Requesting a source from database via `Source` $resource factory should return an object:
 * ```
 * {
 *   archive: {                        // archive, from which the source is retrieved
 *     identifier: <string|null>,      // identification nummer of the source within the archive
 *     collection: <string|null>,      // name of the collection
 *     institution: <string|null>,     // name of the institution
 *     institutionAbbr: <string|null>  // abbreviation of the institution
 *   },
 *   author: <string|null>             // name of the author
 *   created: {                        // who uploaded the source?
 *     id: <id>,                       // user id
 *     name: <string>,                 // user name
 *     date: <sting>                   // upload date
 *   },
 *   date: <string|null>               // date, at which the source has been created
 *   file: {
 *     content: <id>                   // filename
 *     height: <integer>,              // height in pixel
 *     original: <string>,             // original filename
 *     path: <string>,                 // path to the file
 *     preview: <string>,              // file for preview (resized to max. 1024px)
 *     texture: <string>,              // resolution to nearest power of 2
 *     texturePreview: <string>,       // small sized texture
 *     thumb: <string>,                // thumbnail image
 *     type: <string>,                 // file type
 *     width: <integer>                // width in pixel
 *   },
 *   id: <id>,                         // id of the source (string)
 *   modified: {                       // who has modified the source?
 *     id: <id>,                       // user id
 *     name: <string>,                 // user name
 *     date: <sting>                   // modification date
 *   },
 *   nodeId: <integer>,                // internal Neo4j id
 *   note: <string|null>,              // additional information
 *   primary: <boolean>,               // whether the source is a primary source or not
 *   repros: <string|null>,            // repros
 *   tags: <Array<string>>,            // associated tags
 *   title: <string>,                  // title (should be always set
 *   type: <string>                    // source type
 * }
 * ```
 *
 * @ngdoc module
 * @name dokuvis.sources
 * @module dokuvis.sources
 */
angular.module('dokuvis.sources', [
	'ngResource',
	'ui.router',
	'angularFileUpload',
	'angularMoment',
	'dokuvis.archives'
])

/**
 * $resource for sources/documents.
 * @ngdoc factory
 * @name Source
 * @module dokuvis.sources
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiSource
 * @requires https://github.com/urish/angular-moment moment
 */
.factory('Source', ['$resource', 'ApiParams', 'ApiSource', 'moment',
	function ($resource, ApiParams, ApiSource, moment) {

		return $resource(ApiSource + '/:id', angular.extend({ id: '@id', type: '@type' }, ApiParams), {
			/**
			 * Upload and save a new source. Usually called via `SourceUploader`.
			 * @ngdoc method
			 * @name Source#$save
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						date: moment().format()
					}));
				}
			},
			/**
			 * Save changes of the source metadata.
			 * ```
			 * source.$update()
			 *   .then(function (source) {...});
			 * ```
			 * @ngdoc method
			 * @name Source#$update
			 */
			update: {
				method: 'PUT',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						modificationDate: moment().format()
					}));
				}
			},
			/**
			 * Link this source to specific items.
			 * ```
			 * source.$link({ targets: <id>|<Array> }).then(...);
			 * ```
			 * @ngdoc method
			 * @name Source#link
			 * @param targets {Object} Object with targets
			 */
			link: {
				method: 'POST',
				url: ApiSource + '/connect'
			},
			/**
			 * Get all items this source is connected to.
			 * ```
			 * source.$getLinks().then(...);
			 * ```
			 * @ngdoc method
			 * @name Source#$getLinks
			 */
			getLinks: {
				method: 'GET',
				url: ApiSource + '/connect',
				isArray: true
			},
			spatialize: {
				method: 'PUT',
				url: ApiSource + '/:type/spatial'
			},
			getSpatial: {
				method: 'GET',
				url: ApiSource + '/:type/spatial'
			}
		});

		/**
		 * Get all sources/documents of this project/subproject.
		 * ```
		 * Source.query().$promise
		 *   .then(function (sources) {...});
		 * ```
		 * @ngdoc method
		 * @name Source#query
		 */

		/**
		 * Get a specific source by id.
		 * ```
		 * Source.get({ id: <id> }).$promise
		 *   .then(function (source) {...});
		 * ```
		 * @ngdoc method
		 * @name Source#get
		 * @param id {Object} Object with source id
		 */

		/**
		 * Delete the source.
		 * ```
		 * source.$delete()
		 *   .then(function () {...});
		 * ```
		 * @ngdoc method
		 * @name Source#$delete
		 */

	}
])

/**
 * `FileUploader` instance for sources.
 * @ngdoc factory
 * @name SourceUploader
 * @module dokuvis.sources
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires ApiParams
 * @requires ApiSource
 * @requires https://github.com/nervgh/angular-file-upload FileUploader
 * @requires Utilities
 * @requires https://github.com/urish/angular-moment moment
 */
.factory('SourceUploader', ['$window', '$rootScope', 'ApiParams', 'ApiSource', 'FileUploader', 'Utilities', 'moment',
	function ($window, $rootScope, ApiParams, ApiSource, FileUploader, Utilities, moment) {

		var headers = {};
		if ($window.localStorage.token) {
			headers['X-Access-Token'] = $window.localStorage.token;
			headers['X-Key'] = $window.localStorage.user;
		}

		var uploader = new FileUploader({
			headers: headers,
			alias: 'uploadSourceFile'
		});

		// FILTER
		var imageTypes = ['jpg','JPG','png','PNG','jpeg','bmp','gif','tiff'];
		var textTypes = ['pdf'];

		// restrict to file types
		uploader.filters.push({
			name: 'sourceFilter',
			fn: function(item) {
				var type = item.type.slice(item.type.lastIndexOf('/') + 1);
				return imageTypes.concat(textTypes).indexOf(type) !== -1;
			}
		});

		// CALLBACKS
		uploader.onWhenAddingFileFailed = function(item, filter, options) {
			console.warn('onWhenAddingFileFailed', item, filter, options);
			Utilities.dangerAlert('Nicht unterstütztes Format!');
		};

		uploader.onAfterAddingFile = function (item) {
			console.info('onAfterAddingFile', item);

			var type = item.file.type.slice(item.file.type.lastIndexOf('/') + 1);
			if (imageTypes.indexOf(type) !== -1) {
				item.sourceType = 'plan';
			}
			else if (textTypes.indexOf(type) !== -1) {
				item.sourceType = 'text';
				item.language = 'de';
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

			item.errorInput = false;
			item.isProcessing = false;
		};

		uploader.onProgressItem = function(fileItem, progress) {
			if (progress === 100)
				fileItem.isProcessing = true;
		};

		uploader.onBeforeUploadItem = function (item) {
			// set POST request url
			item.url = Utilities.setUrlParams(ApiSource, ApiParams);

			// push data to request form data
			item.formData = [];
			item.formData.push({
				sourceType: item.sourceType,
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

		uploader.onCompleteAll = function () {
			sourcesUpdate();
		};

		/**
		 * Event that gets fired, when the upload process of all sources has finished.
		 * @ngdoc event
		 * @name SourceUploader#sourcesUpdate
		 * @eventType broadcast on $rootScope
		 */
		function sourcesUpdate() {
			$rootScope.$broadcast('sourcesUpdate');
		}

		return uploader;

	}
])

/**
 * Controller for the source upload modal.
 * @ngdoc controller
 * @name sourceUploadModalCtrl
 * @module dokuvis.sources
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires API
 * @requires SourceUploader
 * @requires Archive
 * @requires Utilities
 */
.controller('sourceUploadModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'API', 'SourceUploader', 'Archive', 'TypeaheadRequest', 'Utilities',
	function ($scope, $state, $stateParams, $timeout, API, SourceUploader, Archive, TypeaheadRequest, Utilities) {

		/**
		 * Instance of `{@link https://github.com/nervgh/angular-file-upload FileUploader}` provided by `SourceUploader` factory.
		 * @ngdoc property
		 * @name sourceUploadModalCtrl#uploader
		 * @type {FileUploader}
		 */
		var uploader = $scope.uploader = SourceUploader;
		
		/**
		 * Check, if all relevant input fields are set, and upload each item.
		 * @ngdoc method
		 * @name sourceUploadModalCtrl#checkAndUploadAll
		 */
		$scope.checkAndUploadAll = function () {
			// wait for responses and validate inputs
			$timeout(function () {
				for (var i = 0, l = uploader.queue.length; i < l; i++) {
					var item = uploader.queue[i];
					if (!item.title.length) {
						item.errorInput = true;
						Utilities.dangerAlert('Geben Sie mindestens einen Titel ein!');
					}
					else {
						item.errorInput = false;
						if (!item.isSuccess)
							item.upload();
					}
				}
			}, 1000);
		};

		/**
		 * Triggers click event on hidden files input field.
		 * @ngdoc method
		 * @name sourceUploadModalCtrl#openFileDialog
		 * @param event {Object} Click event on parent html element
		 */
		$scope.openFileDialog = function (event) {
			$timeout(function () {
				angular.element(event.delegateTarget).find('input').trigger('click');
			});
		};

		// Process tag after it has been added.
		$scope.onTagAdded = function (tag) {
			tag.text = tag.text.toLowerCase();
		};

		// Query all tags that contain the search term.
		$scope.getTags = function (query) {
			return TypeaheadRequest.queryTags(query)
				.then(function (tags) {
					return tags;
				})
				.catch(function (err) {
					Utilities.throwApiException('#TypeaheadRequest.queryTags', err);
				});
		};

		/**
		 * List of available archives (to choose from source select form).
		 * @ngdoc property
		 * @name sourceUploadModalCtrl#archives
		 * @type {Array}
		 */
		$scope.archives = [];

		function queryArchives() {
			Archive.query().$promise
				.then(function (archives) {
					$scope.archives = archives;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Archive.query', reason);
				});
		}

		// listen to archivesUpdate event
		$scope.$on('archivesUpdate', function () {
			queryArchives();
		});

		// init
		queryArchives();

		/**
		 * Close the modal.
		 * @ngdoc method
		 * @name sourceUploadModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^.^');
		};

	}
])

/**
 * List all sources as a collection of thumbnail items. A blank item is provided as an entry point to upload further sources.
 * @ngdoc directive
 * @name sourcesList
 * @module dokuvis.sources
 * @author Brakebein
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires ComponentsPath
 * @requires Source
 * @requires SourcesCache
 * @requires SourceUploader
 * @restrict E
 * @scope
 * @param showUpload {boolean=} Enable the blank source item as an entry point to upload sources.
 * @example
 * ```
 * <sources-list show-upload="can('historian')"></sources-list>
 * ```
  */
.directive('sourcesList', ['$state', 'ComponentsPath', 'Source', 'SourcesCache', 'SourceUploader',
	function ($state, ComponentsPath, Source, SourcesCache, SourceUploader) {
		// TODO: remove Source factory if unused
		return {
			templateUrl: ComponentsPath + '/dokuvis.sources/sourcesList.tpl.html',
			restrict: 'E',
			scope: {
				showUpload: '='
			},
			link: function (scope) {

				scope.options = {
					orderBy: 'title',
					filterBy: '',
					reverse: false,
					listSize: 'normal',
					activeTab: ''
				};

				scope.sc = SourcesCache;
				SourcesCache.reload();

				// source uploader
				scope.sourceUploader = SourceUploader;

				scope.sourceUploader.onAfterAddingAll = function () {
					if (!$state.includes('**.upload.source') && !$state.includes('**.source.edit'))
						$state.go('.upload.source');
				};

				// select source
				scope.selectSource = function (event, source) {
					var btnBar = angular.element(event.delegateTarget).find('.btn-bar');
					var target = angular.element(event.target);
					if (target.parent().is(btnBar) || target.parent().parent().is(btnBar))
						return;

					if (event.ctrlKey) {
						if (event.delegateTarget !== event.target)
							source.selected = !source.selected;
					}
					else {
						scope.sc.sources.forEach(function (t) {
							t.selected = false;
						});
						if (event.delegateTarget !== event.target)
							source.selected = true;
					}
				};

				// open source
				scope.openSource = function (event, source) {
					var btnBar = event.delegateTarget.children[4];
					if (event.target.parentElement === btnBar || event.target.parentElement.parentElement === btnBar)
						return;

					$state.go('.source.id', { sourceId: source.id });
				};

			}
		};

	}
])

/**
 * Factory that provides currently loaded sources and filtered sources.
 * @ngdoc factory
 * @name SourcesCache
 * @module dokuvis.sources
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires Source
 * @requires Utilities
  */
.factory('SourcesCache', ['$rootScope', 'Source', 'Utilities',
	function ($rootScope, Source, Utilities) {

		var sc = {};

		/**
		 * Currently loaded/cached sources.
		 * @ngdoc property
		 * @name SourcesCache#sources
		 * @type {Array}
		 */
		sc.sources = [];

		/**
		 * Filtered sources.
		 * @ngdoc property
		 * @name SourcesCache#filtered
		 * @type {Array}
		 */
		sc.filtered = [];

		/**
		 * Reload available sources from database.
		 * @ngdoc method
		 * @name SourcesCache#reload
		 */
		sc.reload = function () {
			Source.query().$promise
				.then(function (sources) {
					sources.forEach(function (s) {
						s.selected = false;
					});
					sc.sources = sources;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Source.query', reason);
				});
		};

		function getIndexByIncr(id, incr) {
			var length = sc.filtered.length;
			var index = 0;
			while (sc.filtered[index].id !== id) {
				index++;
				if (index === length) return undefined;
			}
			return ((index + incr) % length + length) % length;
		}

		/**
		 * Get the id of the predecessor in the filtered sources array.
		 * @ngdoc method
		 * @name SourcesCache#getPredecessorId
		 * @param id {string} Id of the current source
		 */
		sc.getPredecessorId = function (id) {
			return sc.filtered[getIndexByIncr(id, -1)].id;
		};

		/**
		 * Get the id of the successor in the filtered sources array.
		 * @ngdoc method
		 * @name SourcesCache#getSuccessorId
		 * @param id {string} Id of the current source
		 */
		sc.getSuccessorId = function (id) {
			return sc.filtered[getIndexByIncr(id, 1)].id;
		};

		$rootScope.$on('sourcesUpdate', function () {
			sc.reload();
		});

		return sc;
	}
])

/**
 * Controller of the modal showing metadata of the source and image viewer.
 * @ngdoc controller
 * @name sourceDetailModalCtrl
 * @module dokuvis.sources
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires https://docs.angularjs.org/api/ng/service/$http $http
 * @requires Source
 * @requires SourcesCache
 * @requires Utilities
 * @requires ConfirmDialog
 */
.controller('sourceDetailModalCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$http', 'Source', 'SourcesCache', 'Utilities', 'ConfirmDialog',
	function ($scope, $rootScope, $state, $stateParams, $timeout, $http, Source, SourcesCache, Utilities, ConfirmDialog) {

		/**
		 * Flag indicating if `Previous` and `Next` buttons should be displayed. Depends on the length of the filtered sources array.
		 * @ngdoc property
		 * @name sourceDetailModalCtrl#iterable
		 * @type {boolean}
		 */
		$scope.iterable = false;

		// load source by id
		function loadSource(id) {
			Source.get({ id: id }).$promise
				.then(function (data) {
					console.log(data);
					if(data.id) {
						$scope.item = data;

						$scope.pageNr = 0;
					}
					else
						$scope.close();
				})
				.catch(function(err) {
					Utilities.throwApiException('#Source.get', err);
				});
		}

		// watch source id and load source if id changed
		$scope.$watch(function () {
			return $stateParams.sourceId;
		}, function (value) {
			if (value)
				loadSource(value);
			else
				$timeout(function () {
					$scope.close();
				});
		});

		// watch the length of the filtered sources array
		$scope.$watch(function () {
			return SourcesCache.filtered.length;
		}, function (value) {
			$scope.iterable = $state.includes('project.explorer') && value > 1;
		});

		/**
		 * Go to previous source item.
		 * @ngdoc method
		 * @name sourceDetailModalCtrl#prev
		 */
		$scope.prev = function () {
			$state.go($state.current, { sourceId: SourcesCache.getPredecessorId($scope.item.id) }, { notify: false });
		};

		/**
		 * Go to next source item.
		 * @ngdoc method
		 * @name sourceDetailModalCtrl#next
		 */
		$scope.next = function () {
			$state.go($state.current, { sourceId: SourcesCache.getSuccessorId($scope.item.id) }, { notify: false });
		};

		// TODO: update text display

		$scope.pageNr = 0; // für Textdokumente

		$scope.nextPage = function(incr) {
			$scope.pageNr = (($scope.pageNr + incr) % $scope.item.file.preview.length + $scope.item.file.preview.length) % $scope.item.file.preview.length;
		};

		$scope.highlight = function(event) {
			if(event.target.className !== 'ocrx_word') return;

			var values = $('.displayText').find('.ocr_page')[0].attributes.title.value.match(/bbox (\d+) (\d+) (\d+) (\d+);/);
			var global = [values[1], values[2], values[3], values[4]];

			values = event.target.attributes.title.value.match(/^bbox (\d+) (\d+) (\d+) (\d+); x_wconf (\d+)$/);
			var bbox = [values[1], values[2], values[3], values[4]];

			var img = $('.displayText').find('img');

			var left = Math.floor( bbox[0] * img.width() / global[2] );
			var width = Math.ceil( bbox[2] * img.width() / global[2] ) - left + 1;
			var top = Math.floor( bbox[1] * img.height() / global[3] );
			var height = Math.ceil( bbox[3] * img.height() / global[3] ) - top + 1;

			//console.log(left, width, top, height);

			$('#wordRect').css({
				left: left+'px',
				top: top+'px',
				width: width+'px',
				height: height+'px'
			});
		};

		$scope.toggleConfidence = function() {
			$scope.showConfidence = !$scope.showConfidence;

			var words = $('.displayText').find('.ocrx_word');
			for(var i=0, l=words.length; i<l; i++) {
				if($scope.showConfidence) {
					var values = words[i].attributes.title.value.match(/^bbox (\d+) (\d+) (\d+) (\d+); x_wconf (\d+)$/);
					var wconf = values[5];
					var hue = Math.floor((wconf-50)/50 * 120);
					$(words[i]).css('background', 'hsl('+hue+',100%,85%)');
				}
				else
					$(words[i]).css('background', 'none');
			}
		};

		$scope.editText = function() {
			//$scope.textEdit = !$scope.textEdit;

			$http.get('data/' + $scope.item.file.path + $scope.item.file.preview[$scope.pageNr]).then(function(response) {
				console.log(response);
				$scope.editorInput = response.data;
				$scope.textEdit = true;
			});

		};

		$scope.saveText = function() {
			console.log($scope.editorInput);
		};

		$scope.delete = function () {
			ConfirmDialog({
				headerText: 'Quelle löschen',
				bodyText: 'Soll die Quelle wirklich gelöscht werden? Jegliche Metadaten, Referenzen und sich darauf beziehende Kommentare werden gelöscht.'
			}).then(function () {
				$scope.item.$delete()
					.then(function (response) {
						console.log(response);
						sourcesUpdate();
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Source.delete', reason);
					});
			});
		};

		/**
		 * Event that gets fired, when the changes to the source have been saved or source has been deleted.
		 * @ngdoc event
		 * @name sourceDetailModalCtrl#sourcesUpdate
		 * @eventType broadcast on $rootScope
		 * @param source {Source=} Updated source
		 */
		function sourcesUpdate(source) {
			$rootScope.$broadcast('sourcesUpdate', source);
		}

		// listen on sourcesUpdate event
		$scope.$on('sourcesUpdate', function (event, source) {
			if (source && $scope.item.id === source.id)
				loadSource(source.id);
		});

		/**
		 * Close the modal.
		 * @ngdoc method
		 * @name sourceDetailModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^.^');
		};

	}
])
	
.controller('sourceEditModalCtrl', ['$scope', '$rootScope', '$window', '$state', '$stateParams', '$timeout', 'FileUploader', 'moment', 'Source', 'Archive', 'ApiSource', 'ApiParams', 'Utilities',
	function ($scope, $rootScope, $window, $state, $stateParams, $timeout, FileUploader, moment, Source, Archive, ApiSource, ApiParams, Utilities) {

		var imageTypes = ['jpg','JPG','png','PNG','jpeg','bmp','gif','tiff'];
		var textTypes = ['pdf'];

		var uploader = $scope.uploader = new FileUploader({
			headers: {
				'X-Access-Token': $window.localStorage.token,
				'X-Key': $window.localStorage.user
			},
			alias: 'updateSourceFile',
			url: Utilities.setUrlParams(ApiSource, ApiParams) + '/' + $stateParams.sourceId + '/file',
			autoUpload: true,
			removeAfterUpload: true,
			queueLimit: 1,
			filters: [{
				name: 'sourceFilter',
				fn: function (item) {
					var type = item.type.slice(item.type.lastIndexOf('/') + 1);
					return imageTypes.concat(textTypes).indexOf(type) !== -1;
				}
			}],
			formData: [{
				date: moment().format()
			}]
		});

		// CALLBACKS
		uploader.onWhenAddingFileFailed = function(item, filter, options) {
			console.warn('onWhenAddingFileFailed', item, filter, options);
			Utilities.dangerAlert('Nicht unterstütztes Format!');
		};
		uploader.onSuccessItem = function (item, response) {
			$scope.item.file = response.file;
			sourcesUpdate({ id: $stateParams.sourceId });
		};
		uploader.onErrorItem = function (item, response) {
			Utilities.throwApiException('#Source.updateFile', response);
		};

		function getSource() {
			Source.get({ id: $stateParams.sourceId }).$promise
				.then(function (result) { 
					$scope.item = result;
				})
				.catch(function (reason) { 
					Utilities.throwApiException('#Source.get', reason);
				});
		}

		function queryArchives() {
			Archive.query().$promise
				.then(function (results) {
					console.log(results);
					$scope.archives = results;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Archive.query', reason);
				});
		}
		
		// init
		getSource();
		queryArchives();
		
		$scope.save = function () {
			console.log($scope.item);


			if (!$scope.item) return;
			if (!$scope.item.title.length) {
				Utilities.dangerAlert('Geben Sie der Quelle einen Titel');
				$scope.titleError = true;
				return;
			}
			else
				$scope.titleError = false;

			$scope.item.tags = $scope.item.tags.map(function (t) {
				return t.text;
			});

			$scope.item.$update()
				.then(function (source) {
					sourcesUpdate(source);
					$scope.close();
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Source.update', reason);
				});
		};

		// Trigger click event on hidden files input field.
		$scope.openFileDialog = function (event) {
			$timeout(function () {
				angular.element(event.delegateTarget).find('input').trigger('click');
			});
		};

		// Process tag after it has been added.
		$scope.onTagAdded = function (tag) {
			tag.text = tag.text.toLowerCase();
		};

		// Query all tags that contain the search term.
		$scope.getTags = function (query) {
			return TypeaheadRequest.queryTags(query)
				.then(function (tags) {
					return tags;
				})
				.catch(function (err) {
					Utilities.throwApiException('#TypeaheadRequest.queryTags', err);
				});
		};

		// listen to archivesUpdate event
		$scope.$on('archivesUpdate', function () {
			queryArchives();
		});

		/**
		 * Event that gets fired, when the changes to the source have been saved.
		 * @ngdoc event
		 * @name sourceEditModalCtrl#sourcesUpdate
		 * @eventType broadcast on $rootScope
		 * @param source {Source|Object=} Updated source
		 */
		function sourcesUpdate(source) {
			$rootScope.$broadcast('sourcesUpdate', source);
		}

		/**
		 * Close the modal.
		 * @ngdoc method
		 * @name sourceEditModalCtrl#close
		 */
		$scope.close = function () {
			uploader.clearQueue();
			$state.go('^');
		};
		
	}
])

.directive('sourceMetadata', [

]);
