/**
 * $resource for ProjInfo.
 * @ngdoc factory
 * @name ProjInfo
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Utilities
 */
angular.module('dokuvisApp').factory('ProjInfo', ['$resource', 'API', '$stateParams', 'Utilities',
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
			 * @ngdoc method
			 * @name ProjInfo#save
			 * @param data {Object} Object with data
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
			 * @ngdoc method
			 * @name ProjInfo#$update
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
			 * @ngdoc method
			 * @name ProjInfo#swap
			 * @param data {Object} Object with data
			 */
			swap: { method: 'PUT' }
		});

		/**
		 * Get all info items of the current subproject.
		 * ```
		 * ProjInfo.query().$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name ProjInfo#query
		 */

		/**
		 * Delete the item.
		 * ```
		 * info.$delete().then(...);
		 * ```
		 * @ngdoc method
		 * @name ProjInfo#$delete
		 */
		
	}]);
