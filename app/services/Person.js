angular.module('dokuvisApp').factory('Person', ['$http', 'API', '$stateParams',
	function($http, API, $stateParams) {

		return {

			getAll: function () {
				return $http.get(API + 'auth/project/'+$stateParams.project+'/persons');
			},

			create: function () {

			}

		};

	}]);
