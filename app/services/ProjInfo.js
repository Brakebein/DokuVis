angular.module('dokuvisApp').factory('ProjInfo', ['$resource', 'API', '$stateParams', 'Utilities',
	/**
	 * $resource for ProjInfo
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name ProjInfo
	 * @author Brakebein
	 */
	function ($resource, API, $stateParams, Utilities) {

		return $resource(API + 'auth/project/:project/:subproject/projinfo/:id', {
			project: function () {
				return $stateParams.project;
			},
			subproject: function () {
				return $stateParams.subproject;
			},
			id: '@id'
		}, {
			/**
			 * Save a new info item.
			 * ```
			 * ProjInfo.save({ info: <string> }).$promise.then(...);
			 * ```
			 * @memberof ProjInfo
			 * @method save
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, { tid: Utilities.getUniqueId() + '_' + $stateParams.subproject }));
				}
			},
			/**
			 * Save any changes to name or description.
			 * ```
			 * info.$update().then(...);
			 * ```
			 * @memberof ProjInfo
			 * @method update
			 */
			update: { method: 'PUT' },
			/**
			 * Swap the order of two info items.
			 * ```
			 * ProjInfo.swap({
			 *   from: <id>,
			 *   to: <id>
			 * }).$promise.then(...);
			 * ```
			 * @memberof ProjInfo
			 * @method swap
			 */
			swap: { method: 'PUT' }
		});

		/**
		 * Get all info items of the current subproject.
		 * ```
		 * ProjInfo.query().$promise.then(...);
		 * ```
		 * @memberof ProjInfo
		 * @method query
		 */
		
	}]);
