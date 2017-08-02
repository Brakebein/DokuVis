/**
 * $resource for projects to interact with RESTful server-side data sources.
 * @ngdoc factory
 * @name Project
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @example
 * ```
 * project.name = 'new name';
 * project.$update();
 * ```
 */
angular.module('dokuvisApp').factory('Project', ['$resource', 'API',
	function ($resource, API) {
		
		return $resource(API + 'auth/project/:id', {
			id: '@proj'
		}, {
			/**
			 * Saves any changes to name or description.
			 * ```
			 * project.$update().then(...);
			 * ```
			 * @ngdoc method
			 * @name Project#$update
			 * @return {Promise} Promise that resolves, if the request was succesful.
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all projects the current user is involved to.
		 * ```
		 * Project.query().$promise
		 *   .then(function (projects) {...});
		 * ```
		 * @ngdoc method
		 * @name Project#query
		 * @return {Array<Resource>} Array of all projects, each a Resource object.
		 */
		
		/**
		 * Get project by id.
		 * ```
		 * Project.get({ id: <id> }).$promise
		 *   .then(function (project) {...});
		 * ```
		 * @ngdoc method
		 * @name Project#get
		 * @param id {Object} Object with project id
		 * @return {Resource} Project as Resource object.
		 */

		/**
		 * Creates a new project.
		 * ```
		 * Project.save({
		 *   name: <string>,
		 *   description: <string>  // (optional)
		 * }).$promise
		 *   .then(function (project) {...});
		 * ```
		 * @ngdoc method
		 * @name Project#save
		 * @param data {Object} Object with data
		 * @return {Resource} Saved project as Resource object.
		 */

		/**
		 * Delete project and all its files and entries from database.
		 * ```
		 * project.$delete().then(...);
		 * ```
		 * @ngdoc method
		 * @name Project#$delete
		 * @return {Promise} Promise that resolves, if the request was succesful.
		 */

	}]);
