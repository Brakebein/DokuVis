(function () {
	'use strict';

/**
 * @namespace dokuvisApp
 */

var dokuvisApp = angular.module('dokuvisApp', [
	'ui.router',
	'ui.router.css',
	'ct.ui.router.extras.sticky',
	'ct.ui.router.extras.previous',
	'ngResource',
	'ngAnimate',
	'ngSanitize',
	'debounce',
	'truncate',
	'xeditable',
	'mgcrea.ngStrap',
	'angularMoment',
	'ngScrollbars',
	'ngDragDrop',
	'textAngular',
	'ngTagsInput',
	'minicolors',
	'urish',
	'uiSlider',
	'angularFileUpload',
	'pw.canvas-painter',
	'gantt',
	'gantt.table',
	'gantt.movable',
	'gantt.tooltips',
	'gantt.labels',
	'gantt.sortable',
	'gantt.drawtask',
	'gantt.bounds',
	'gantt.progress',
	'gantt.tree',
	'gantt.groups',
	'gantt.overlap',
	'gantt.resizeSensor',
	'ang-drag-drop',
	'mm.acl',
	'pascalprecht.translate'
]);

dokuvisApp.constant('API', 'api/');

dokuvisApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$translateProvider', '$translatePartialLoaderProvider', '$modalProvider', '$alertProvider', '$tooltipProvider',
	/**
	 * Configures ui.router states, state resolve functions, and some defaults
	 * @memberof dokuvisApp
	 * @ngdoc config
	 * @name config
	 * @author Brakebein
	 * @param $stateProvider {$stateProvider} provider to configure states
	 * @param $urlRouterProvider {$urlRouterProvider} Watches $location and provides interface to default state
	 * @param $httpProvider {$httpProvider} Used to push new interceptors
	 * @param $translateProvider {$translateProvider} provider to configure translate settings
	 * @param $translatePartialLoaderProvider {$translatePartialLoaderProvider} provider to configure translatePartialLoader settings
	 * @param $modalProvider {$modalProvider} provider to configure defaults
	 * @param $alertProvider {$alertProvider} provider to configure defaults
	 * @param $tooltipProvider {$tooltipProvider} provider to configure defaults
	 */
	function($stateProvider, $urlRouterProvider, $httpProvider, $translateProvider, $translatePartialLoaderProvider, $modalProvider, $alertProvider, $tooltipProvider) {
		
		// add interceptors
		$httpProvider.interceptors.push('TokenInterceptor');
		
		$urlRouterProvider.otherwise('/home');

		// states
		$stateProvider
			.state('home', {
				url: '/home',
				templateUrl: 'partials/home.html',
				controller: 'homeCtrl'
			})
			.state('register', {
				url: '/register',
				templateUrl: 'partials/register.html',
				controller: 'registerCtrl'
			})
			.state('projectlist', {
				url: '/list',
				templateUrl: 'partials/projects.html',
				controller: 'projectlistCtrl',
				resolve: {
					authenticate: ['$q', '$state', '$window', '$timeout', 'AuthenticationFactory', 'UserAuthFactory', 'AclService', authenticate]
				}
			})
			.state('projectlist.project', {
				url: '/project',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalTpl.html',
						contentTemplate: 'partials/modals/newProjectModal.html',
						controller: 'newProjectModalCtrl',
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
					authenticate: ['$q', '$state', '$window', '$timeout', 'AuthenticationFactory', 'UserAuthFactory', 'AclService', authenticate],
					checkProject: ['$q', '$state', '$stateParams', '$rootScope', 'Project', 'AclService', checkProject],
					checkSubproject: ['$q', '$state', '$stateParams', 'Subproject', checkSubproject]
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
						contentTemplate: 'partials/modals/newProjectModal.html',
						controller: 'subprojectModalCtrl',
						show: true
					});
				}],
				abstract: true
			})
			.state('project.home.subproject.new', {
				url: '/new'
			})
			.state('project.home.subproject.edit', {
				url: '/edit',
				params: {
					name: '',
					desc: '',
					subId: ''
				}
			})
			.state('project.home.infoedit', {
				url: '/infoedit',
				onEnter: ['$modal', function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalLargeTpl.html',
						contentTemplate: 'partials/modals/infoeditModal.html',
						controller: 'infoeditModalCtrl',
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
				css: 'style/modals/sourceDetail.min.css',
				abstract: true,
				reloadOnSearch: false
			})
			.state('project.explorer.source.id', {
				url: '/:sourceId',
				params: {
					selection: []
				}
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
				css: 'style/modals/upload.min.css',
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
				onEnter: ['$modal', function ($modal) {
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
			.state('project.tasks', {
				url: '/tasks',
				templateUrl: 'partials/tasks.html',
				controller: 'tasksCtrl',
				css: 'style/tasks.css'
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
						contentTemplate: 'partials/modals/staffeditModal.html',
						controller: 'staffeditModalCtrl',
						show: true
					});
				}]
			});

		// translate
		$translateProvider.useLoader('$translatePartialLoader', {
			urlTemplate: '/i18n/{lang}/{part}.json'
		});
		//$translateProvider.preferredLanguage('de-DE');
		$translateProvider.preferredLanguage('en-US');
		$translateProvider.fallbackLanguage('de-DE');
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

		// resolver functions
		/**
		 * Resolve function to authenticate user / check, if user is logged in
		 * @memberof config
		 * @private
		 * @param $q {$q} Angular promise service
		 * @param $state {$state} ui.router state service
		 * @param $window {$window} Angular window service
		 * @param $timeout {timeout} Angular timeout
		 * @param AuthenticationFactory {AuthenticationFactory} [AuthenticationFactory]{@link dokuvisApp.AuthenticationFactory.html}
		 * @param UserAuthFactory {UserAuthFactory} [UserAuthFactory]{@link dokuvisApp.UserAuthFactory.html}
		 * @param AclService {service} Access Control List service
		 * @returns {Promise} Resolves, if user has been authenticated
		 */
		function authenticate($q, $state, $window, $timeout, AuthenticationFactory, UserAuthFactory, AclService) {

			if(AuthenticationFactory.isLogged) {

				return UserAuthFactory.checkJWT().then(function(response) {
					console.log(response);
					// check if user object exists else fetch it. this is incase of a page refresh
					if(!AuthenticationFactory.user) AuthenticationFactory.user = $window.localStorage.user;
					if(!AuthenticationFactory.userName) AuthenticationFactory.userName = $window.localStorage.userName;
					//if(!AuthenticationFactory.userRole) AuthenticationFactory.userRole = $window.localStorage.userRole;

					AclService.flushRoles();
					AclService.attachRole('member');

					return $q.when();
				}, function(reason) {
					console.log(reason);
					if(reason.status === 400) {
						UserAuthFactory.logout();
						$timeout(function() {
							$state.go('home');
						});
						return $q.reject();
					}
				});
			}
			else {

				$timeout(function() {
					$state.go('home');
				});
				return $q.reject();

			}

		}

		/**
		 * Resolve function to check, if project exists
		 * @memberof config
		 * @private
		 * @param $q {$q} Angular promise service
		 * @param $state {$state} ui.router state service
		 * @param $stateParams {$stateParams} ui.router state parameter
		 * @param $rootScope {$rootScope} Angular rootScope
		 * @param Project {Project} Project http
		 * @param AclService {service} Access Control List service
		 * @returns {Promise} Resolves, if project exists
		 */
		function checkProject($q, $state, $stateParams, $rootScope, Project, AclService) {

			return Project.get({ id: $stateParams.project }).$promise.then(function(result){

				console.log(result, $stateParams);

				if(result.status === 'NO ENTRY') {

					$state.go('projectlist');
					return $q.reject();

				}

				$rootScope.userRole = result.role;

				AclService.attachRole('visitor');
				if (result.role === 'superadmin') {
					AclService.attachRole('superadmin');
					AclService.attachRole('admin');
					AclService.attachRole('historian');
					AclService.attachRole('modeler');
				}
				else if(result.role === 'admin')
					AclService.attachRole('admin');
				else if(result.role === 'historian')
					AclService.attachRole('historian');
				else if(result.role === 'modeler')
					AclService.attachRole('modeler');

				console.log(AclService.getRoles());
			}, function (err) {
				console.error('API Exception on Project.get()', err);
				return $q.reject();
			});

		}

		/**
		 * Resolve function to check, if the subproject exists
		 * @memberof config
		 * @private
		 * @param $q {$q} Angular promise service
		 * @param $state {$state} ui.router state service
		 * @param $stateParams {$stateParams} ui.router state parameter
		 * @param Subproject {Subproject} Subproject http
		 * @returns {Promise} A promise that will either be resolved or rejected, if the subproject couldn't be found (or an error occured)
		 */
		function checkSubproject($q, $state, $stateParams, Subproject) {

			if($stateParams.subproject === 'master')
				return $q.resolve();
			else {
				//console.log('before', $stateParams);
				return Subproject.check($stateParams.project, $stateParams.subproject).then(function (response) {

					//console.log('after', response);
					if(!response.data.length) {
						$state.go('project.home', { project: $stateParams.project, subproject: 'master' });
						return $q.reject();
					}

				}, function (err) {
					console.error('API Exception on Subproject.check()', err);
					//Utilities.throwApiException('on Subproject.check()', err);
					return $q.reject();
				});
			}

		}

		//$locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
	}]);
	
dokuvisApp.run(['$rootScope', '$state', '$previousState', 'AuthenticationFactory', 'AclService', '$translate', 'amMoment', 'editableOptions', 'TypeaheadRequest',
	function($rootScope, $state, $previousState, AuthenticationFactory, AclService, $translate, amMoment, editableOptions, TypeaheadRequest) {
		// when the page refreshes, check if the user is already logged in
		AuthenticationFactory.check();

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

		$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
			$rootScope.isLogged = AuthenticationFactory.isLogged;
			$rootScope.userName = AuthenticationFactory.userName;
			//$rootScope.role = AuthenticationFactory.userRole;
			// if the user is already logged in, take him to the home page
			if(AuthenticationFactory.isLogged && $state.is('register')) {
				$state.go('home');
			}
		});

		amMoment.changeLocale('de');
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
	
dokuvisApp.filter('filterEditor', function(){
	return function(items, search) {
		if(!search) return items;
		return items.filter(function(element, index, array) {
			return element.editors.indexOf(search) !== -1;
		});
	}
});

})();
