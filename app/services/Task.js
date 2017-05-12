angular.module('dokuvisApp').factory('Task', ['$resource', 'API', '$stateParams',
	function ($resource, API, $stateParams) {

		return $resource(API + 'auth/project/:project/task', {
			project: function () {
				return $stateParams.project;
			}
		});

	}]);
