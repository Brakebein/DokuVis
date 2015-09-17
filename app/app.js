var webglApp = angular.module('webglApp', ['ngRoute', 'webglControllers', 'webglDirectives', 'webglServices', 'autocomplete', 'truncate']);

webglApp.config(['$routeProvider', '$locationProvider',
	function($routeProvider, $locationProvider) {
		$routeProvider.
			when('/intro', {
				templateUrl: 'partials/intro.html',
				controller: 'introCtrl'
			}).
			when('/webgl', {
				templateUrl: 'partials/webgl.html',
				controller: 'webglCtrl'
			}).
			when('/explorer/:project', {
				templateUrl: 'partials/explorer.html',
				controller: 'explorerCtrl'
			}).
			when('/explorer', {
				redirectTo: '/projects'
			}).
			when('/projects', {
				templateUrl: 'partials/projects.html',
				controller: 'projectsCtrl'
			}).
			otherwise({
				redirectTo: '/intro'
			});
		
		//$locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
	}]);

