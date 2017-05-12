angular.module('dokuvisApp').factory('Staff', ['$resource', 'API', '$stateParams',
	function ($resource, API, $stateParams) {
		
		return $resource(API + 'auth/project/:project/staff/:id', {
			project: function () {
				return $stateParams.project;
			}
		}, {
			id: '@email'
		}, {
			queryRoles: {
				url: API + 'roles',
				method: 'GET',
				isArray: true
			}
		});
		
	}]);
