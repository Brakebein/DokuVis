angular.module('dokuvisApp').factory('Project', ['$resource', 'API', 'Utilities',
	/**
	 * $resource for project related tasks.
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Project
	 * @author Brakebein
	 */
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
			 * @memberof Project
			 * @method save
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
			 * @memberof Project
			 * @method update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all projects the current user is involved to.
		 * ```
		 * Project.query().$promise.then(...);
		 * ```
		 * @memberof Project
		 * @method query
		 */
		
		/**
		 * Get project by id.
		 * ```
		 * Project.get({ id: <id> }).$promise.then(...);
		 * ```
		 * @memberof Project
		 * @method get
		 */

	}]);
