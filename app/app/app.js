(function () {
	'use strict';

/**
 * Dokuvis base module.
 *
 * @ngdoc module
 * @name dokuvisApp
 * @module dokuvisApp
 * @requires https://ui-router.github.io/ ui.router
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource ngResource
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngSanitize ngSanitize
 * @requires http://mgcrea.github.io/angular-strap/ AngularStrap
 * @requires https://github.com/nervgh/angular-file-upload angularFileUpload
 */

var dokuvisApp = angular.module('dokuvisApp', [
	'ui.router',
	'ui.router.css',
	'ct.ui.router.extras.sticky',
	'ct.ui.router.extras.previous',
	'ngResource',
	'ngAnimate',
	'ngSanitize',
	'ngDebounceThrottle',
	'truncate',
	'xeditable',
	'mgcrea.ngStrap',
	'angularMoment',
	'ngScrollbars',
	'textAngular',
	'ngTagsInput',
	'minicolors',
	'uiSlider',
	'angularFileUpload',
	'pw.canvas-painter',

	// 'gantt',
	// 'gantt.table',
	// 'gantt.tree',
	// 'gantt.groups',
	// 'gantt.movable',
	// 'gantt.tooltips',
	// 'gantt.sortable',
	// 'gantt.drawtask',
	// 'gantt.progress',
	// 'gantt.overlap',
	// 'gantt.resizeSensor',

	'mm.acl',
	'ngCookies',
	'pascalprecht.translate',

	'dokuvis.auth',
	'dokuvis.utils',
	'dokuvis.projects',
	'dokuvis.subprojects',
	'dokuvis.projinfos',
	'dokuvis.sources',
	'dokuvis.archives',
	'dokuvis.authors',
	'dokuvis.models',
	'dokuvis.comments',
	'dokuvis.categories',
	'dokuvis.tasks',
	'dokuvis.staff'
]);

/**
 * Constant defining the base url to API. It is injectable like any other service.
 *
 * @ngdoc object
 * @name API
 * @module dokuvisApp
 */
dokuvisApp.constant('API', 'api/');
dokuvisApp.constant('ApiBase', 'api/');
dokuvisApp.constant('ApiAuth', 'api/auth/');
dokuvisApp.constant('ApiProject',		'api/auth/project');
dokuvisApp.constant('ApiSubproject',	'api/auth/project/:project/subproject');
dokuvisApp.constant('ApiSource',		'api/auth/project/:project/:subproject/source');
dokuvisApp.constant('ApiComment',		'api/auth/project/:project/:subproject/comment');
dokuvisApp.constant('ApiProjinfo',		'api/auth/project/:project/:subproject/projinfo');
dokuvisApp.constant('ApiArchive',		'api/auth/project/:project/archive');
dokuvisApp.constant('ApiAuthor',		'api/auth/project/:project/author');
dokuvisApp.constant('ApiCategory',		'api/auth/project/:project/category');
dokuvisApp.constant('ApiTask',			'api/auth/project/:project/task');
dokuvisApp.constant('ApiStaff',			'api/auth/project/:project/staff');
dokuvisApp.constant('ApiRoles',			'api/roles');
dokuvisApp.constant('ApiModelVersion',	'api/auth/project/:project/:subproject/model/version');

dokuvisApp.factory('ApiParams', ['$stateParams', function ($stateParams) {
	return {
		project: function () {
			return $stateParams.project;
		},
		subproject: function () {
			return $stateParams.subproject;
		}
	}
}]);

dokuvisApp.constant('ComponentsPath', 'components');

/**
 * Configures ui.router states, state resolve functions, and some defaults.
 *
 * @ngdoc object
 * @name config
 * @module dokuvisApp
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateProvider $stateProvider
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.router.$urlRouterProvider $urlRouterProvider
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/provider/$httpProvider $httpProvider
 * @requires https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translateProvider $translateProvider
 * @requires https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translatePartialLoaderProvider $translatePartialLoaderProvider
 * @requires http://mgcrea.github.io/angular-strap/#/modals $modalProvider
 * @requires http://mgcrea.github.io/angular-strap/#/alerts $alertProvider
 * @requires http://mgcrea.github.io/angular-strap/#/tooltips $tooltipProvider
 */
dokuvisApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$translateProvider', '$translatePartialLoaderProvider', '$modalProvider', '$alertProvider', '$tooltipProvider', '$typeaheadProvider',
	function($stateProvider, $urlRouterProvider, $httpProvider, $translateProvider, $translatePartialLoaderProvider, $modalProvider, $alertProvider, $tooltipProvider, $typeaheadProvider) {
		
		// add interceptors
		$httpProvider.interceptors.push('TokenInterceptor');
		
		$urlRouterProvider.otherwise('/home');

		// state configs
		var archiveModalState = {
			url: '/archive/:archiveId',
			resolve: {
				archiveModalInstance: ['$modal', function ($modal) {
					return $modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'components/dokuvis.archives/archiveModal.tpl.html',
						controller: 'archiveModalCtrl',
						show: false
					});
				}]
			},
			onEnter: ['$translatePartialLoader', 'archiveModalInstance', function ($translatePartialLoader, archiveModalInstance) {
				$translatePartialLoader.addPart('archive');
				archiveModalInstance.$promise.then(archiveModalInstance.show);
			}],
			onExit: ['archiveModalInstance', function (archiveModalInstance) {
				archiveModalInstance.hide();
				archiveModalInstance.destroy();
			}],
			params: {
				archiveId: 'new'
			}
		};

		// states
		$stateProvider
			.state('home', {
				url: '/home',
				templateUrl: 'partials/home.html',
				controller: 'homeCtrl',
				resolve: {
					validate: ['ValidateResolve', function (ValidateResolve) {
						return ValidateResolve();
					}]
				}
			})
			.state('register', {
				url: '/register',
				templateUrl: 'partials/register.html',
				controller: 'registerCtrl',
				resolve: {
					skipIfLogged: ['SkipResolve', function (SkipResolve) {
						return SkipResolve();
					}]
				}
			})
			.state('projectlist', {
				url: '/list',
				templateUrl: 'partials/projects.html',
				controller: 'projectlistCtrl',
				resolve: {
					authenticate: ['AuthenticateResolve', function (AuthenticateResolve) {
						return AuthenticateResolve();
					}]
				},
				onEnter: ['$translatePartialLoader', function ($translatePartialLoader) {
					$translatePartialLoader.addPart('projects');
				}]
			})
			.state('projectlist.project', {
				url: '/project/:projectId',
				resolve: {
					projectModalInstance: ['$modal', function ($modal) {
						return $modal({
							templateUrl: 'partials/modals/_modalTpl.html',
							contentTemplate: 'components/dokuvis.projects/projectModal.tpl.html',
							controller: 'projectModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['projectModalInstance', function (projectModalInstance) {
					projectModalInstance.$promise.then(projectModalInstance.show);
				}],
				onExit: ['projectModalInstance', function (projectModalInstance) {
					projectModalInstance.hide();
					projectModalInstance.destroy();
				}],
				params: {
					projectId: 'new'
				}
			})
			.state('project', {
				url: '/:project/:subproject',
				templateUrl: 'partials/project.html',
				controller: 'projectCtrl',
				css: 'style/project.css',
				resolve: {
					authenticate: ['AuthenticateResolve', function (AuthenticateResolve) {
						return AuthenticateResolve();
					}],
					checkProject: ['$stateParams', 'ProjectResolve', function ($stateParams, ProjectResolve) {
						return ProjectResolve($stateParams);
					}],
					checkSubproject: ['$stateParams', 'SubprojectResolve', function ($stateParams, SubprojectResolve) {
						return SubprojectResolve($stateParams);
					}]
				},
				abstract: true
			})
			.state('project.home', {
				url: '/home',
				templateUrl: 'partials/projHome.html',
				controller: 'projHomeCtrl',
				css: 'style/projHome.css'
			})
			.state('project.home.subproject', {
				url: '/subproject/:subprojectId',
				resolve: {
					subprojectModalInstance: ['$modal', function ($modal) {
						return $modal({
							templateUrl: 'partials/modals/_modalTpl.html',
							contentTemplate: 'components/dokuvis.subprojects/subprojectModal.tpl.html',
							controller: 'subprojectModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['subprojectModalInstance', function (subprojectModalInstance) {
					subprojectModalInstance.$promise.then(subprojectModalInstance.show);
				}],
				onExit: ['subprojectModalInstance', function (subprojectModalInstance) {
					subprojectModalInstance.hide();
					subprojectModalInstance.destroy();
				}],
				params: {
					subprojectId: 'new'
				}
			})
			.state('project.home.projinfo', {
				url: '/projinfo/:infoId',
				resolve: {
					projinfoModalInstance: ['$modal', function ($modal) {
						return $modal({
							templateUrl: 'partials/modals/_modalLargeTpl.html',
							contentTemplate: 'components/dokuvis.projinfos/projinfoModal.tpl.html',
							controller: 'projinfoModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['projinfoModalInstance', function (projinfoModalInstance) {
					projinfoModalInstance.$promise.then(projinfoModalInstance.show);
				}],
				onExit: ['projinfoModalInstance', function (projinfoModalInstance) {
					projinfoModalInstance.hide();
					projinfoModalInstance.destroy();
				}],
				params: {
					infoId: 'new'
				}
			})
			.state('project.explorer', {
				url: '/explorer?camera',
				templateUrl: 'partials/explorer.html',
				controller: 'explorerCtrl',
				reloadOnSearch: false,
				css: [
					'style/explorer.css',
					'style/panelContainer.css',
					'style/snapshot.css',
					'style/spatialize.css',
					// 'style/modals/screenshotDetail.min.css',
					'style/modals/indexEdit.min.css'
					// 'style/modals/categoryEdit.css'
				],
				onEnter: ['$translatePartialLoader', function ($translatePartialLoader) {
					$translatePartialLoader.addPart('category');
				}]
			})
			// // modal showing source, metadata and comments
			.state('project.explorer.source', {
				url: '/source',
				resolve: {
					sourceDetailModalInstance: ['$translatePartialLoader', '$modal', function ($translatePartialLoader, $modal) {
						$translatePartialLoader.addPart('source');
						console.log('resolve');
						return $modal({
							templateUrl: 'partials/modals/_modalLargeTpl.html',
							contentTemplate: 'components/dokuvis.sources/sourceDetailModal.tpl.html',
							controller: 'sourceDetailModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['sourceDetailModalInstance', function (sourceDetailModalInstance) {
					console.log('onEnter');
					sourceDetailModalInstance.$promise.then(sourceDetailModalInstance.show);
				}],
				onExit: ['sourceDetailModalInstance', function (sourceDetailModalInstance) {
					console.log('onExit');
					sourceDetailModalInstance.hide();
					sourceDetailModalInstance.destroy();
				}],
				reloadOnSearch: false,
				abstract: true
			})
			.state('project.explorer.source.id', {
				url: '/:sourceId'
			})
			.state('project.explorer.source.id.edit', {
				url: '/edit',
				resolve: {
					sourceEditModalInstance: ['$modal', function ($modal) {
						return $modal({
							templateUrl: 'partials/modals/_modalTpl.html',
							contentTemplate: 'components/dokuvis.sources/sourceEditModal.tpl.html',
							controller: 'sourceEditModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['sourceEditModalInstance', function (sourceEditModalInstance) {
					sourceEditModalInstance.$promise.then(sourceEditModalInstance.show);
				}],
				onExit: ['sourceEditModalInstance', function (sourceEditModalInstance) {
					sourceEditModalInstance.hide();
					sourceEditModalInstance.destroy();
				}]
			})
			.state('project.explorer.source.id.edit.archive', angular.copy(archiveModalState))
			.state('project.explorer.model', {
				url: '/model',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'partials/modals/modelModal.html',
						controller: 'modelModalCtrl',
						show: true
					});
				}],
				abstract: true
			})
			.state('project.explorer.model.id', {
				url: '/:modelId'
			})
			// modal for uploading sources or modals
			.state('project.explorer.upload', {
				url: '/upload',
				abstract: true
			})
			// .state('project.explorer.upload.type', {
			// 	url: '/:uploadType',
			// 	params: {
			// 		attachTo: null
			// 	}
			// })
			.state('project.explorer.upload.model', {
				url: '/model',
				resolve: {
					modelUploadModalInstance: ['$translatePartialLoader', '$modal', function ($translatePartialLoader, $modal) {
						$translatePartialLoader.addPart('source');
						return $modal({
							templateUrl: 'partials/modals/_modalTpl.html',
							contentTemplate: 'components/dokuvis.models/modelUploadModal.tpl.html',
							controller: 'modelUploadModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['modelUploadModalInstance', function (modelUploadModalInstance) {
					modelUploadModalInstance.$promise.then(modelUploadModalInstance.show);
				}],
				onExit: ['modelUploadModalInstance', 'ModelUploader', function (modelUploadModalInstance, ModelUploader) {
					modelUploadModalInstance.hide();
					modelUploadModalInstance.destroy();
					ModelUploader.clearQueue();
				}],
				params: {
					parent: null
				}
			})
			.state('project.explorer.upload.source', {
				url: '/source',
				resolve: {
					sourceUploadModalInstance: ['$translatePartialLoader', '$modal', function ($translatePartialLoader, $modal) {
						$translatePartialLoader.addPart('source');
						return $modal({
							templateUrl: 'partials/modals/_modalLargeTpl.html',
							contentTemplate: 'components/dokuvis.sources/sourceUploadModal.tpl.html',
							controller: 'sourceUploadModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['sourceUploadModalInstance', function (sourceUploadModalInstance) {
					sourceUploadModalInstance.$promise.then(sourceUploadModalInstance.show);
				}],
				onExit: ['sourceUploadModalInstance', 'SourceUploader', function (sourceUploadModalInstance, SourceUploader) {
					sourceUploadModalInstance.hide();
					sourceUploadModalInstance.destroy();
					SourceUploader.clearQueue();
				}]
			})
			.state('project.explorer.upload.source.archive', angular.copy(archiveModalState))
			.state('project.explorer.category', {
				url: '/category',
				resolve: {
					categoryModalInstance: ['$modal', function ($modal) {
						return $modal({
							templateUrl: 'partials/modals/_modalTpl.html',
							contentTemplate: 'partials/modals/categoryConfigModal.html',
							controller: 'simpleModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['categoryModalInstance', function (categoryModalInstance) {
					categoryModalInstance.$promise.then(categoryModalInstance.show);
				}],
				onExit: ['categoryModalInstance', function (categoryModalInstance) {
					categoryModalInstance.hide();
					categoryModalInstance.destroy();
				}]
			})
			.state('project.explorer.spatialize', {
				url: '/spatialize',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalXLargeTpl.html',
						contentTemplate: 'partials/modals/spatializeModal.html',
						controller: 'spatializeModalCtrl',
						show: true
					})
				}],
				css: 'style/modals/spatializeModal.css',
				params: {
					source: null
				},
				resolve: {
					check: ['$q', '$state', '$stateParams', '$timeout', function ($q, $state, $stateParams, $timeout) {
						if($stateParams.source)
							return $q.resolve();
						else {
							$timeout(function () {
								$state.go('project.explorer', $stateParams);
							});
							return $q.reject();
						}
					}]
				}
			})
			.state('project.tasks', {
				url: '/tasks',
				templateUrl: 'partials/tasks.html',
				controller: 'tasksCtrl',
				css: 'style/tasks.css'
			})
			.state('project.tasks.detail', {
				url: '/:taskId',
				resolve: {
					taskModalInstance: ['$modal', function ($modal) {
						return $modal({
							templateUrl: 'partials/modals/_modalTpl.html',
							contentTemplate: 'components/dokuvis.tasks/taskModal.tpl.html',
							controller: 'taskModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['taskModalInstance', function (taskModalInstance) {
					taskModalInstance.$promise.then(taskModalInstance.show);
				}],
				onExit: ['taskModalInstance', function (taskModalInstance) {
					taskModalInstance.hide();
					taskModalInstance.destroy();
				}],
				params: {
					parent: null
				}
			})
			.state('project.graph', {
				url: '/graph',
				templateUrl: 'partials/graph.html'
			})
			.state('project.graph.node', {
				url: '/:startNode'
			})
			.state('project.graph.source', {
				url: '/source',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalLargeTpl.html',
						contentTemplate: 'partials/modals/sourceDetailModal.html',
						controller: 'sourceDetailCtrl',
						show: true
					});
				}],
				css: 'style/modals/sourceDetail.min.css',
				abstract: true
			})
			.state('project.graph.source.id', {
				url: '/:sourceId'
			})
			.state('project.resources', {
				url: '/resources?foo',
				templateUrl: 'partials/resources.html',
				controller: 'resourcesCtrl',
				css: 'style/resources.css',
				onEnter: ['$translatePartialLoader', function ($translatePartialLoader) {
					$translatePartialLoader.addPart('archive');
					$translatePartialLoader.addPart('author');
				}]
			})
			.state('project.resources.archive', archiveModalState)
			.state('project.resources.author', {
				url: '/author/:authorId',
				resolve: {
					authorModalInstance: ['$modal', function ($modal) {
						return $modal({
							templateUrl: 'partials/modals/_modalTpl.html',
							contentTemplate: 'components/dokuvis.authors/authorModal.tpl.html',
							controller: 'authorModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['authorModalInstance', function (authorModalInstance) {
					authorModalInstance.$promise.then(authorModalInstance.show);
				}],
				onExit: ['authorModalInstance', function (authorModalInstance) {
					authorModalInstance.hide();
					authorModalInstance.destroy();
				}],
				params: {
					authorId: 'new'
				}
			})
			.state('project.config', {
				url: '/config',
				templateUrl: 'partials/config.html',
				controller: 'configCtrl',
				css: 'style/config.css',
				onEnter: ['$translatePartialLoader', function ($translatePartialLoader) {
					$translatePartialLoader.addPart('config');
				}]
			})
			.state('project.config.staffedit', {
				url: '/staffedit',
				resolve: {
					staffModalInstance: ['$modal', function ($modal) {
						return $modal({
							templateUrl: 'partials/modals/_modalTpl.html',
							contentTemplate: 'components/dokuvis.staff/staffModal.tpl.html',
							controller: 'staffModalCtrl',
							show: false
						});
					}]
				},
				onEnter: ['staffModalInstance', function (staffModalInstance) {
					staffModalInstance.$promise.then(staffModalInstance.show);
				}],
				onExit: ['staffModalInstance', function (staffModalInstance) {
					staffModalInstance.hide();
					staffModalInstance.destroy();
				}]
			});


		// translate
		$translateProvider
			.useSanitizeValueStrategy('sanitize')
			.useLoader('$translatePartialLoader', {
				urlTemplate: '/i18n/{part}/{lang}.json'
			})
			// .preferredLanguage('de-DE')
			.preferredLanguage('en-US')
			.fallbackLanguage('de-DE')
			.registerAvailableLanguageKeys(['en-US', 'de-DE'], {
				'en_*': 'en-US',
				'de_*': 'de-DE'
			});
		$translateProvider.useLocalStorage();
		//.determinePreferredLanguage();
		$translatePartialLoaderProvider.addPart('general');

		// defaults
		angular.extend($modalProvider.defaults, {
			backdrop: 'static',
			keyboard: false
		});
		angular.extend($alertProvider.defaults, {
			keyboard: false
		});
		angular.extend($tooltipProvider.defaults, {
			placement: 'right',
			delay: {show: 500, hide: 100}
		});
		angular.extend($typeaheadProvider.defaults, {
			delay: {show: 500, hide: 0},
			minLength: 3
		});

		//$locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
	}]);

/**
 * Code execution after bootstrapping AngularJS.
 *
 * @ngdoc object
 * @name run
 * @module dokuvisApp
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://christopherthielen.github.io/ui-router-extras/#/previous $previousState
 * @requires AuthenticationFactory
 * @requires https://github.com/mikemclin/angular-acl AclService
 * @requires https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translate $translate
 * @requires https://github.com/urish/angular-moment amMoment
 * @requires https://vitalets.github.io/angular-xeditable/#ref-options editableOptions
 * @requires TypeaheadRequest
 */
dokuvisApp.run(['$rootScope', '$state', '$previousState', 'AuthenticationFactory', 'AclService', '$translate', 'amMoment', 'editableOptions', 'TypeaheadRequest',
	function($rootScope, $state, $previousState, AuthenticationFactory, AclService, $translate, amMoment, editableOptions, TypeaheadRequest) {

		// ACL data
		var aclData = {
			guest: ['login', 'register'],
			member: ['logout', 'create_project'],
			visitor: [],
			historian: ['upload_source'],
			modeler: ['upload_model'],
			admin: ['manage_content', 'edit_subproject', 'edit_staff'],
			superadmin: ['edit_project']
		};
		AclService.setAbilities(aclData);
		AclService.attachRole('guest');

		$rootScope.can = AclService.can;

		$rootScope.$on('$translatePartialLoaderStructureChanged', function () {
			$translate.refresh();
		});

		$rootScope.$on('$stateChangeSuccess', function() {
			$rootScope.isLogged = AuthenticationFactory.isLogged;
			$rootScope.userName = AuthenticationFactory.userName;
			//$rootScope.role = AuthenticationFactory.userRole;
		});

		editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'


		// localization
		$rootScope.availableLanguages = [
			{ key: 'en-US', shortKey: 'en', label: 'English' },
			{ key: 'de-DE', shortKey: 'de', label: 'Deutsch' }
		];

		$rootScope.currentLanguage = $rootScope.availableLanguages.find(function (lang) {
			return lang.key === $translate.proposedLanguage();
		});
		amMoment.changeLocale($rootScope.currentLanguage.shortKey);

		$rootScope.setLanguage = function () {
			$translate.use($rootScope.currentLanguage.key);
			amMoment.changeLocale($rootScope.currentLanguage.shortKey);
		};

		// typeahead
		$rootScope.setTypeahead = function (label, from, prop) {
			TypeaheadRequest.query(label, from, prop).then(function (response) {
				$rootScope.typeaheads = response.data;
				console.log('typeahead', $rootScope.typeaheads);
			}, function (err) {
				
			});
		};

	}]);

})();
