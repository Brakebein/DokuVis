angular.module('dokuvisApp').factory('Archive', ['$http', 'API', '$stateParams',
	function($http, API, $stateParams) {
		
		return {
		  
			getAll: function () {
				return $http.get(API + 'auth/project/'+$stateParams.project+'/archives');
			},
			
			create: function () {
				
			}
			
		};
		
	}]);
