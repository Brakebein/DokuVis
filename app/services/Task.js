angular.module('dokuvisApp').factory('Task', ['$resource', 'API', '$stateParams', 'moment',
	function ($resource, API, $stateParams, moment) {

		return $resource(API + 'auth/project/:project/task/:id', {
			project: function () {
				return $stateParams.project;
			},
			id: '@id'
		}, {
			/**
			 * Creates a new task.
			 * ```
			 * Task.save({
			 *   title: <string>,
			 *   description: <string>,
			 *   from: <string>,        // formatted date, 'YYYY-MM-DDTHH:mm:ssZ'
			 *   to: <string>,          // formatted date
			 *   priority: <number>,    // (optional) defaults to 0
			 *   editors: <Array>       // list of ids of editors
			 *   parent: <id>           // id of parent task or subproject
			 * }).$promise.then(...);
			 * ```
			 */
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
