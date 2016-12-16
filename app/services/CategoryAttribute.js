angular.module('dokuvisApp').factory('CategoryAttribute', ['$resource', 'API', '$stateParams', 'Utilities',
	function ($resource, API, $stateParams, Utilities) {
		
		return $resource(API + 'auth/project/:project/category/:cid/attribute/:aid', {
			project: function () {
				return $stateParams.project;
			},
			cid: '@cid',
			aid: '@id'
		}, {
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, { id: Utilities.getUniqueId() + '_categoryAttr' }));
				}
			},
			update: { method: 'PUT' }
		});

	}]);
