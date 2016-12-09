angular.module('dokuvisApp').factory('Source', ['$resource', 'API', '$stateParams',
	/**
	 *
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Source
	 * @author Brakebein
	 * @param $resource {$resource} Angular $resource service
	 * @param API {API} API url constant
	 * @param $stateParams {$stateParams} ui.router state parameter
	 * @returns {*}
	 */
	function($resource, API, $stateParams) {
		
		return $resource(API + 'auth/project/:project/:subproject/source/:id', {
			project: function () {
				return $stateParams.project;
			},
			subproject: function () {
				return $stateParams.subproject;
			},
			id: '@id'
		}, {
			connect: {
				method: 'PUT',
				url: API + 'auth/project/:project/:subproject/source/:id/connect'
			},
			queryConnections: {
				method: 'GET',
				url: API + 'auth/project/:project/:subproject/source/:id/connect',
				isArray: true
			}
		});
		
		// return {
		//	
		// 	// results: {
		// 	// 	all: [],
		// 	// 	filtered: []
		// 	// },
		//	
		// 	getAll: function() {
		// 		return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/source');
		// 	},
		//
		// 	get: function(id) {
		// 		return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/source/' + id);
		// 	},
		//
		// 	createConnections: function(id, targets) {
		// 		return $http.post(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/source/' + id +'/connect', { targets: targets });
		// 	},
		//
		// 	getConnections: function(id) {
		// 		return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/source/' + id +'/connect');
		// 	}
		//	
		// };
		//
	}]);