angular.module('dokuvisApp').factory('Project', ['$resource', 'API', 'Utilities',
	/**
	 * $resource for project related tasks
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Project
	 * @author Brakebein
	 * @param $resource {service} ngResource
	 * @param API {API} API url constant
	 * @param Utilities {Utilities} Utilities
	 * @returns {Object} Project resource
	 */
	function ($resource, API, Utilities) {

		function extendWithId(data) {
			return angular.toJson(angular.extend(data, { proj: 'Proj_' + Utilities.getUniqueId() }));
		}
		
		return $resource(API + 'auth/project/:id', {
			id: '@proj'
		}, {
			save: {
				method: 'POST',
				transformRequest: extendWithId
			},
			update: { method: 'PUT' }
		});
		
	}]);
