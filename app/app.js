var webglApp = angular.module('webglApp', [
	'webglControllers',
	'webglDirectives',
	'webglServices',
	'ui.router',
	'ui.router.css',
	'ngAnimate',
	//'ngSanitize',
	'autocomplete',
	'truncate',
	'xeditable',
	'mgcrea.ngStrap',
	'angularMoment'
]);

webglApp.config(['$stateProvider', '$urlRouterProvider', '$modalProvider',
	function($stateProvider, $urlRouterProvider, $modalProvider) {
		
		$urlRouterProvider.otherwise('/intro');
		
		$stateProvider
			.state('intro', {
				url: '/intro',
				templateUrl: 'partials/intro.html',
				controller: 'introCtrl'
			})
			.state('projectlist', {
				url: '/projects',
				templateUrl: 'partials/projects.html',
				controller: 'projectlistCtrl'
			})
			.state('project', {
				url: '/:project',
				templateUrl: 'partials/project.html',
				controller: 'projectCtrl',
				css: 'style/project.css'
			})
			.state('project.explorer', {
				url: '/explorer',
				templateUrl: 'partials/explorer.html',
				controller: 'explorerCtrl',
				css: [
					'style/explorer.css',
					'style/panelContainer.css',
					'style/modals/insertSource.css',
					'style/modals/sourceDetail.css',
					'style/modals/screenshotDetail.css'
				]
			})
			.state('project.tasks', {
				url: '/tasks',
				templateUrl: 'partials/tasks.html',
				controller: 'tasksCtrl',
				css: 'style/tasks.css'					
			});
		
		angular.extend($modalProvider.defaults, {
			backdrop: 'static',
			keyboard: false
		});
		
		//$locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
	}]);

