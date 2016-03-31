var webglApp = angular.module('webglApp', [
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
	'ngTagsInput',
]);
webglApp.constant('API', 'api/');
webglApp.config(['$stateProvider', '$urlRouterProvider', '$modalProvider', '$alertProvider', '$tooltipProvider',
	function($stateProvider, $urlRouterProvider, $modalProvider, $alertProvider, $tooltipProvider) {
		
		$urlRouterProvider.otherwise('/intro');
		
		// TODO: resolve functions
		//    -> check user login
		//    -> check if user is part of project
		
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
				url: '/:project/:subproject',
				templateUrl: 'partials/project.html',
				controller: 'projectCtrl',
				css: 'style/project.css',
				resolve: {
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
		
		
		
		//$locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
	}]);

webglApp.filter('filterEditor', function(){
	return function(items, search) {
		if(!search) return items;
		return items.filter(function(element, index, array) {
			return element.editors.indexOf(search) !== -1;
		});
	}
});
