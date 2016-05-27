var dokuvisApp = angular.module('dokuvisApp', [
	'ui.router',
	'ui.router.css',
	'ct.ui.router.extras.sticky',
	'ct.ui.router.extras.previous',
	'ngAnimate',
	'ngSanitize',
	'debounce',
	'autocomplete',
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
	'ang-drag-drop'
]);

dokuvisApp.constant('API', 'api/');

dokuvisApp.config(['$stateProvider', '$stickyStateProvider', '$urlRouterProvider', '$httpProvider', '$modalProvider', '$alertProvider', '$tooltipProvider',
	function($stateProvider, $stickyStateProvider, $urlRouterProvider, $httpProvider, $modalProvider, $alertProvider, $tooltipProvider) {
		
		$httpProvider.interceptors.push('TokenInterceptor');
		
		$urlRouterProvider.otherwise('/home');

		//$stickyStateProvider.enableDebug(true);
		
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
				url: '/projects',
				templateUrl: 'partials/projects.html',
				controller: 'projectlistCtrl',
				resolve: {
					authenticate: authenticate
				}
			})
			.state('project', {
				url: '/:project/:subproject',
				templateUrl: 'partials/project.html',
				controller: 'projectCtrl',
				css: 'style/project.css',
				resolve: {
					authenticate: authenticate,
					checkProject: checkProject,
					checkSubproject: checkSubproject
				},
				abstract: true
			})
			.state('project.home', {
				url: '/home',
				templateUrl: 'partials/projHome.html',
				controller: 'projHomeCtrl',
				css: 'style/projHome.css'
			})
			.state('project.explorer', {
				url: '/explorer',
				templateUrl: 'partials/explorer.html',
				controller: 'explorerCtrl',
				css: [
					'style/explorer.css',
					'style/panelContainer.css',
					//'style/snapshot.css',
					'style/modals/screenshotDetail.min.css',
					'style/modals/indexEdit.min.css',
					'style/modals/categoryEdit.css'
				]
			})
			.state('project.explorer.source', {
				url: '/source',
				onEnter: function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalLargeTpl.html',
						contentTemplate: 'partials/modals/sourceDetailModal.html',
						controller: 'sourceDetailCtrl',
						show: true
					});
				},
				css: 'style/modals/sourceDetail.min.css',
				abstract: true
			})
			.state('project.explorer.source.id', {
				url: '/:sourceId'
			})
			.state('project.explorer.upload', {
				url: '/upload',
				onEnter: function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalLargeTpl.html',
						contentTemplate: 'partials/modals/uploadModal.html',
						controller: 'uploadCtrl',
						show: true
					});
				},
				css: 'style/modals/upload.min.css',
				abstract: true
			})
			.state('project.explorer.upload.type', {
				url: '/:uploadType',
				params: {
					attachTo: null
				}
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
				onEnter: function ($modal) {
					$modal({
						templateUrl: 'partials/modals/_modalLargeTpl.html',
						contentTemplate: 'partials/modals/sourceDetailModal.html',
						controller: 'sourceDetailCtrl',
						show: true
					});
				},
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
			});
		
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
		
		// resolve functions
		function authenticate($q, $state, $window, $timeout, AuthenticationFactory, UserAuthFactory) {
			if(AuthenticationFactory.isLogged) {
				return UserAuthFactory.checkJWT().then(function(response) {
					console.log(response);
					// check if user object exists else fetch it. this is incase of a page refresh
					if(!AuthenticationFactory.user) AuthenticationFactory.user = $window.localStorage.user;
					if(!AuthenticationFactory.userName) AuthenticationFactory.userName = $window.localStorage.userName;
					//if(!AuthenticationFactory.userRole) AuthenticationFactory.userRole = $window.localStorage.userRole;
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
		
		function checkProject($state, $stateParams, $q, $rootScope, Project) {
			return Project.get($stateParams.project).then(function(response){
				console.log(response, $stateParams);
				if(response.data === 'NO ENTRY') {
					$state.go('projectlist');
					return $q.reject();
				}
				$rootScope.userRole = response.data.role;
			});
		}
		
		function checkSubproject($state, $stateParams, $q, neo4jRequest) {
			if($stateParams.subproject === 'master')
				return $q.resolve();
			else {
				return neo4jRequest.getSubprojectInfo($stateParams.project, $stateParams.subproject).then(function(response){
					if(response.data.exception) {
						console.error('neo4jRequest Exception on getSubprojectInfo()', response.data);
						return $q.reject();
					}
					if(response.data.data.length === 0) {
						$state.go('project.home', {subproject: 'master'});
						return $q.reject();
					}
				});
			}
		}
		
		//$locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
	}]);
	
dokuvisApp.run(function($rootScope, $state, $previousState, AuthenticationFactory, amMoment, editableOptions) {
	// when the page refreshes, check if the user is already logged in
	AuthenticationFactory.check();
	
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
		$rootScope.isLogged = AuthenticationFactory.isLogged;
		$rootScope.userName = AuthenticationFactory.userName;
		//$rootScope.role = AuthenticationFactory.userRole;
		// if the user is already logged in, take him to the home page
		if(AuthenticationFactory.isLogged && $state.is('login')) {
			console.log('change2');
			$state.go('home');
		}
	});
	
	amMoment.changeLocale('de');
	editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});
	
dokuvisApp.filter('filterEditor', function(){
	return function(items, search) {
		if(!search) return items;
		return items.filter(function(element, index, array) {
			return element.editors.indexOf(search) !== -1;
		});
	}
});
