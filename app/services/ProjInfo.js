angular.module('dokuvisApp').factory('ProjInfo', ['$resource', 'API', '$stateParams', 'Utilities',
	function ($resource, API, $stateParams, Utilities) {

		function extendWithId(data) {
			return angular.toJson(angular.extend(data, { tid: Utilities.getUniqueId() + '_' + $stateParams.subproject }));
		}

		return $resource(API + 'auth/project/:project/:subproject/projinfo/:id', {
			project: function () {
				return $stateParams.project;
			},
			subproject: function () {
				return $stateParams.subproject;
			},
			id: '@id'
		}, {
			save: {
				method: 'POST',
				transformRequest: extendWithId
			},
			update: { method: 'PUT' },
			swap: { method: 'PUT' }
		});
		
	}]);
