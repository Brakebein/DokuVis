angular.module('dokuvisApp').factory('Model', ['$http', 'API', '$stateParams',
	function($http, API, $stateParams) {
		
		return {
			
			getModels: function() {
				return $http.get(API + 'auth/project/'+$stateParams.project+'/'+$stateParams.subproject+'/models');
			},

			insert: function(formData, objDatas) {
				return $http.post(API + 'auth/project/'+$stateParams.project+'/'+$stateParams.subproject+'/models', { formData: formData, objDatas: objDatas });
			},

			getConnections: function(id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/' + $stateParams.subproject + '/model/' + id +'/connect');
			},
			
			get: function (id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/model/' + id);
			},
			
			update: function (data) {
				return $http.put(API + 'auth/project/' + $stateParams.project + '/model/' + data.obj.content, data);
			}
			
		};
		
	}]);
