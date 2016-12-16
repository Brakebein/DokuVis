angular.module('dokuvisApp').factory('Subproject', ['$resource', 'API', '$stateParams', 'Utilities',
	/**
	 * $http methods for subproject related tasks
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Subproject
	 * @author Brakebein
	 */
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
			 * @memberof Subproject
			 * @method get
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
			 * @memberof Subproject
			 * @method save
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
			 * @memberof Subproject
			 * @method update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all subprojects.
		 * ```
		 * Subproject.query().$promise.then(...);
		 * ```
		 * @memberof Subproject
		 * @method query
		 */
		
	}]);
