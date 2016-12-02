angular.module('dokuvisApp').factory('Archive', ['$resource', 'API', '$stateParams',
	function($resource, API, $stateParams) {

		function extendWithId(data) {
			return angular.toJson(angular.extend(data, { tid: Utilities.getUniqueId() }));
		}
		
		return $resource(API + 'auth/project/:project/archive', {
			project: function () {
				return $stateParams.project;
			}
		}, {
			save: {
				method: 'POST',
				transformRequest: extendWithId
			}
		});
		
	}]);
