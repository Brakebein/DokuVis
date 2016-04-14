angular.module('dokuvisApp').factory('Source', ['$http', 'API', '$stateParams',
	function($http, API, $stateParams) {
		
		return {
			
			results: {
				all: [],
				filtered: []
			},
			
			getAll: function() {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/sources');
			},

			get: function(id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/source/' + id);
			},

			createConnections: function(id, targets) {
				return $http.post(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/source/' + id +'/connect', { targets: targets });
			},

			getConnections: function(id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/source/' + id +'/connect');
			}
			
		};
		
	}]);