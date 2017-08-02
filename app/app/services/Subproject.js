/**
 * $resource for subprojects to interact with RESTful server-side data sources.
 * @ngdoc factory
 * @name Subproject
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 */
angular.module('dokuvisApp').factory('Subproject', ['$resource', 'API', '$stateParams',
	function($resource, API, $stateParams) {

		return $resource(API + 'auth/project/:project/subproject/:id', {
			project: function () {
				return $stateParams.project;
			},
			id: '@id'
		}, {
			/**
			 * Get subproject by id.
			 * ```
			 * Subproject.save({ id: <id> }).$promise
			 *   .then(function (subproject) {...});
			 * ```
			 * @ngdoc method
			 * @name Subproject#get
			 * @param id {Object} Object with subproject id
			 * @return {Resource} Subprojet as Resource object.
			 */
			get: {
				method: 'GET',
				cache: true
			},
			/**
			 * Saves any changes to name or description.
			 * ```
			 * subproject.$update().then(...);
			 * ```
			 * @ngdoc method
			 * @name Subproject#$update
			 * @return {Promise} Promise that resolves, if the request was succesful.
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all subprojects.
		 * ```
		 * Subproject.query().$promise
		 *   .then(function (subprojects) {...});
		 * ```
		 * @ngdoc method
		 * @name Subproject#query
		 * @return {Array<Resource>} Array of all subprojects, each a Resource object.
		 */

		/**
		 * Save a new subroject.
		 * ```
		 * Subproject.save({
			 *   name: <string>,
			 *   description: <string>  // (optional)
			 * }).$promise
		 *   .then(function (subproject) {...});
		 * ```
		 * @ngdoc method
		 * @name Subproject#save
		 * @param data {Object} Object with data
		 * @return {Resource} Saved subproject as Resource object.
		 */

	}]);
