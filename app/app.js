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
	'gantt',
	'gantt.table',
	'gantt.tree',
	'gantt.groups',
	'gantt.movable',
	'gantt.tooltips',
	'gantt.sortable',
	'gantt.drawtask',
	'gantt.progress',
	'gantt.overlap',
	'gantt.resizeSensor',

	'mm.acl',
	'pascalprecht.translate'
]);

/**
 * Constant defining the base url to API. It is injectable like any other service.
 *
 * @ngdoc object
 * @name API
 * @module dokuvisApp
 */
dokuvisApp.constant('API', 'api/');
	
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
	
dokuvisApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$translateProvider', '$translatePartialLoaderProvider', '$modalProvider', '$alertProvider', '$tooltipProvider',
	function($stateProvider, $urlRouterProvider, $httpProvider, $translateProvider, $translatePartialLoaderProvider, $modalProvider, $alertProvider, $tooltipProvider) {
		
		// add interceptors
		$httpProvider.interceptors.push('TokenInterceptor');
		
		$urlRouterProvider.otherwise('/home');

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
				url: '/project',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'partials/modals/projectModal.html',
						controller: 'projectModalCtrl',
						show: true
					})
				}],
				params: {
					prj: null
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
				url: '/subproject',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'partials/modals/projectModal.html',
						controller: 'newSubprojectModalCtrl',
						show: true
					});
				}],
				params: {
					sub: null
				}
			})
			.state('project.home.projinfo', {
				url: '/projinfo',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalLargeTpl.html',
						contentTemplate: 'partials/modals/newProjInfoModal.html',
						controller: 'newProjInfoModalCtrl',
						show: true
					});
				}],
				params: {
					note: null
				}
			})
			.state('project.explorer', {
				url: '/explorer',
				templateUrl: 'partials/explorer.html',
				controller: 'explorerCtrl',
				css: [
					'style/explorer.css',
					'style/panelContainer.css',
					'style/snapshot.css',
					'style/spatialize.css',
					'style/modals/screenshotDetail.min.css',
					'style/modals/indexEdit.min.css',
					'style/modals/categoryEdit.css'
				]
			})
			.state('project.explorer.source', {
				url: '/source',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalLargeTpl.html',
						contentTemplate: 'partials/modals/sourceDetailModal.html',
						controller: 'sourceDetailCtrl',
						show: true
					});
				}],
				css: 'style/modals/sourceDetail.css',
				abstract: true,
				reloadOnSearch: false
			})
			.state('project.explorer.source.id', {
				url: '/:sourceId',
				params: {
					selection: []
				}
			})
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
			.state('project.explorer.upload', {
				url: '/upload',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalLargeTpl.html',
						contentTemplate: 'partials/modals/uploadModal.html',
						controller: 'uploadCtrl',
						show: true
					});
				}],
				css: 'style/modals/upload.css',
				abstract: true
			})
			.state('project.explorer.upload.type', {
				url: '/:uploadType',
				params: {
					attachTo: null
				}
			})
			.state('project.explorer.upload.type.archive', {
				url: '/archive',
				onEnter: ['$modal', '$translatePartialLoader', function ($modal, $translatePartialLoader) {
					$translatePartialLoader.addPart('archive');
					$modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'partials/modals/newArchiveModal.html',
						controller: 'newArchiveModalCtrl',
						show: true
					});
				}]
			})
			.state('project.explorer.categoryedit', {
				url: '/categoryedit',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'partials/modals/categoryEditModal.html',
						controller: 'categoryEditModalCtrl',
						show: true
					})
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
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'partials/modals/taskModal.html',
						controller: 'taskModalCtrl',
						show: true
					})
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
				url: '/resources',
				templateUrl: 'partials/resources.html',
				controller: 'resourcesCtrl',
				css: 'style/resources.css'
			})
			.state('project.config', {
				url: '/config',
				templateUrl: 'partials/config.html',
				controller: 'configCtrl',
				css: 'style/config.css'
			})
			.state('project.config.staffedit', {
				url: '/staffedit',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'partials/modals/staffModal.html',
						controller: 'staffModalCtrl',
						show: true
					});
				}]
			});


		// translate
		$translateProvider
			.useSanitizeValueStrategy('sanitize')
			.useLoader('$translatePartialLoader', {
				urlTemplate: '/i18n/{lang}/{part}.json'
			})
			// .preferredLanguage('de-DE')
			.preferredLanguage('en-US')
			.fallbackLanguage('de-DE')
			.registerAvailableLanguageKeys(['en-US', 'de-DE'], {
				'en_*': 'en-US',
				'de_*': 'de-DE'
			});
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

		amMoment.changeLocale('de');
		// amMoment.changeLocale('en');
		editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

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
