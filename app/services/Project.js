/**
 * $resource for project related tasks.
 * @ngdoc factory
 * @name Project
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires Utilities
 */
angular.module('dokuvisApp').factory('Project', ['$resource', 'API', 'Utilities',
	function ($resource, API, Utilities) {
		
		return $resource(API + 'auth/project/:id', {
			id: '@proj'
		}, {
			/**
			 * Creates a new project.
			 * ```
			 * Project.save({
			 *   name: <string>,
			 *   description: <string>  // (optional)
			 * }).$promise.then(...);
			 * ```
			 * @ngdoc method
			 * @name Project#save
			 * @param data {Object} Object with data
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, { proj: 'Proj_' + Utilities.getUniqueId() }));
				}
			},
			/**
			 * Saves any changes to name or description.
			 * ```
			 * project.$update().then(...);
			 * ```
			 * @example
			 * project.name = 'new name';
			 * project.$update();
			 * @ngdoc method
			 * @name Project#$update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all projects the current user is involved to.
		 * ```
		 * Project.query().$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name Project#query
		 */
		
		/**
		 * Get project by id.
		 * ```
		 * Project.get({ id: <id> }).$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name Project#get
		 * @param id {Object} Object with project id
		 */

		/**
		 * Delete project and all its files and entries from database.
		 * ```
		 * project.$delete().then(...);
		 * ```
		 * @ngdoc method
		 * @name Project#$delete
		 */

	}]);
