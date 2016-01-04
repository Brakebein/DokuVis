var dokuvisApp = angular.module('dokuvisApp', [
	'webglControllers',
	'webglDirectives',
	'webglServices',
	'ui.router',
	'ui.router.css',
	'ngAnimate',
	'ngSanitize',
	'autocomplete',
	'truncate',
	'xeditable',
	'mgcrea.ngStrap',
	'angularMoment',
	'ngScrollbars',
	'ngDragDrop',
	'textAngular',
	'ngTagsInput'
]);
dokuvisApp.constant('API', 'api/');
dokuvisApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$modalProvider', '$alertProvider', '$tooltipProvider',
	function($stateProvider, $urlRouterProvider, $httpProvider, $modalProvider, $alertProvider, $tooltipProvider) {
		
		$httpProvider.interceptors.push('TokenInterceptor');
		
		$urlRouterProvider.otherwise('/home');
		
		// TODO: resolve functions
		//    -> check user login
		//    -> check if user is part of project
		
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
					checkProject: function($state, $stateParams, $q, mysqlRequest) {
						return mysqlRequest.getProjectEntry($stateParams.project).then(function(response){
							//console.log(response, $stateParams);
							if(response.data === 'NO ENTRY') {
								$state.go('projectlist');
								return $q.reject();
							}
						});
					},
					checkSubproject: function($state, $stateParams, $q, neo4jRequest) {
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
				}
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
					'style/modals/insertSource.css',
					'style/modals/sourceDetail.min.css',
					'style/modals/screenshotDetail.min.css',
					'style/modals/indexEdit.css'
				]
			})
			.state('project.tasks', {
				url: '/tasks',
				templateUrl: 'partials/tasks.html',
				controller: 'tasksCtrl',
				css: 'style/tasks.css'
			})
			.state('project.test', {
				url: '/test',
				templateUrl: 'partials/test.html',
				controller: 'testCtrl',
				css: 'style/test.css'
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
		
		
		function authenticate($q, $state, $window, $timeout, AuthenticationFactory) {
			if(AuthenticationFactory.isLogged) {
				// check if user object exists else fetch it. this is incase of a page refresh
				if(!AuthenticationFactory.user) AuthenticationFactory.user = $window.localStorage.user;
				if(!AuthenticationFactory.userName) AuthenticationFactory.userName = $window.localStorage.userName;
				if(!AuthenticationFactory.userRole) AuthenticationFactory.userRole = $window.localStorage.userRole;
				$q.when();
			}
			else {
				$timeout(function() {
					$state.go('home');
				});
				$q.reject();
			}
		}
		
		//$locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
	}]);
	
dokuvisApp.run(function($rootScope, $state, AuthenticationFactory) {
	// when the page refreshes, check if the user is already logged in
	AuthenticationFactory.check();
	
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
		$rootScope.isLogged = AuthenticationFactory.isLogged;
		$rootScope.userName = AuthenticationFactory.userName;
		$rootScope.role = AuthenticationFactory.userRole;
		// if the user is already logged in, take him to the home page
		if(AuthenticationFactory.isLogged && $state.is('login')) {
			console.log('change2');
			$state.go('home');
		}
	});
});
	
dokuvisApp.filter('filterEditor', function(){
	return function(items, search) {
		if(!search) return items;
		return items.filter(function(element, index, array) {
			return element.editors.indexOf(search) !== -1;
		});
	}
});
