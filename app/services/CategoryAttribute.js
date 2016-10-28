angular.module('dokuvisApp').factory('CategoryAttribute', ['$resource', 'API', '$stateParams', 'Utilities',
	function ($resource, API, $stateParams, Utilities) {

		function extendWithId(data) {
			return angular.toJson(angular.extend(data, { id: Utilities.getUniqueId() + '_categoryAttr' }));
		}
		
		return $resource(API + 'auth/project/:project/category/:cid/attribute/:aid', {
			project: function () {
				return $stateParams.project;
			},
			cid: '@cid',
			aid: '@id'
		}, {
			save: {
				method: 'POST',
				transformRequest: extendWithId
			},
			update: { method: 'PUT' }
		});

	}]);
