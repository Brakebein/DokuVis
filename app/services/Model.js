angular.module('dokuvisApp').factory('Model', ['$http', 'API', '$stateParams',
	function($http, API, $stateParams) {
		
		return {
			
			getModels: function() {
				return $http.get(API + 'auth/project/'+$stateParams.project+'/'+$stateParams.subproject+'/models');
			},

			insert: function(formData, objDatas) {
				return $http.post(API + 'auth/project/'+$stateParams.project+'/'+$stateParams.subproject+'/models', { formData: formData, objDatas: objDatas });
			}
			
		};
		
	}]);