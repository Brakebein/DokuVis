/**
 * $resource for tasks to interact with RESTful server-side data sources.
 * @ngdoc factory
 * @name Task
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://github.com/urish/angular-moment moment
 */
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
			 * }).$promise
			 *   .then(function (task) {...});
			 * ```
			 * @ngdoc method
			 * @name Task#save
			 * @param data {Object} Object with data
			 * @return {Resource} Saved task as Resource object.
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						date: moment().format()
					}));
				}
			},
			/**
			 * Save any changes of the task.
			 * ```
			 * task.$update().then(...);
			 * ```
			 * @ngdoc method
			 * @name Task#$update
			 * @return {Promise} Promise that resolves, if the request was succesful.
			 */
			update: {
				method: 'PUT',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						date: moment().format()
					}));
				}
			}
		});

		/**
		 * Get all tasks.
		 * ```
		 * Task.query().$promise
		 *   .then(function (tasks) {...});
		 * ```
		 * @ngdoc method
		 * @name Task#query
		 * @return {Array<Resource>} Array of all tasks, each a Resource object.
		 */

		/**
		 * Get task by id.
		 * ```
		 * Task.get({ id: <id> }).$promise
		 *   .then(function (task) {...});
		 * ```
		 * @ngdoc method
		 * @name Task#get
		 * @param id {Object} Object with task id
		 * @return {Resource} Task as Resouce object.
		 */

		/**
		 * Delete task. If there are any subtasks, they will be direct children of the parent task/subproject.
		 * ```
		 * task.$delete().then(...);
		 * ```
		 * @ngdoc method
		 * @name Task#$delete
		 * @return {Promise} Promise that resolves, if the request was succesful.
		 */

	}]);
