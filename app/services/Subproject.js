/**
 * $http methods for subproject related tasks
 * @ngdoc factory
 * @name Subproject
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Utilities
 */
angular.module('dokuvisApp').factory('Subproject', ['$resource', 'API', '$stateParams', 'Utilities',
	function($resource, API, $stateParams, Utilities) {

		return $resource(API + 'auth/project/:project/subproject/:id', {
			project: function () {
				return $stateParams.project;
			},
			id: '@id'
		}, {
			/**
			 * Get subproject by id.
			 * ```
			 * Subproject.save({ id: <id> }).$promise.then(...);
			 * ```
			 * @ngdoc method
			 * @name Subproject#get
			 * @param id {Object} Object with subproject id
			 */
			get: {
				method: 'GET',
				cache: true
			},
			/**
			 * Save a new subroject.
			 * ```
			 * Subproject.save({
			 *   name: <string>,
			 *   description: <string>  // (optional)
			 * }).$promise.then(...);
			 * ```
			 * @ngdoc method
			 * @name Subproject#save
			 * @param data {Object} Object with data
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, { tid: Utilities.getUniqueId() }));
				}
			},
			/**
			 * Saves any changes to name or description.
			 * ```
			 * subproject.$update().then(...);
			 * ```
			 * @ngdoc method
			 * @name Subproject#$update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all subprojects.
		 * ```
		 * Subproject.query().$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name Subproject#query
		 */
		
	}]);
