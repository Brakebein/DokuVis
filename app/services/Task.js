angular.module('dokuvisApp').factory('Task', ['$resource', 'API', '$stateParams', 'moment',
	function ($resource, API, $stateParams, moment) {

		return $resource(API + 'auth/project/:project/task/:id', {
			project: function () {
				return $stateParams.project;
			},
			id: '@id'
		}, {
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						date: moment().format()
					}));
				}
			},
			update: {
				method: 'PUT',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						date: moment().format()
					}));
				}
			}
		});

	}]);
