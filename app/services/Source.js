angular.module('dokuvisApp').factory('Source', ['$http', 'API', '$stateParams',
	function($http, API, $stateParams) {
		
		return {
			
			getAll: function() {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/sources');
			}
			
		};
		
	}]);