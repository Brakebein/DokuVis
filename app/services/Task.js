angular.module('dokuvisApp').factory('Task', ['$resource', 'API', '$stateParams', 'moment',
	function ($resource, API, $stateParams, moment) {

		return $resource(API + 'auth/project/:project/task', {
			project: function () {
				return $stateParams.project;
			}
		}, {
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						date: moment().format()
					}));
				}
			}
		});

	}]);
