/**
 * $resource for archives.
 * @ngdoc factory
 * @name Archive
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Utilities
 */
angular.module('dokuvisApp').factory('Archive', ['$resource', 'API', '$stateParams', 'Utilities',
	function($resource, API, $stateParams, Utilities) {
		
		return $resource(API + 'auth/project/:project/archive', {
			project: function () {
				return $stateParams.project;
			}
		}, {
			/**
			 * Save a new arvhive.
			 * ```
			 * Archive.save({
			 *   name: <string>  // archive name
			 *   abbr: <string>  // abbreviation (optional)
			 *   coll: <string>  // collection name
			 * }).$promise.then(...);
			 * ```
			 * @ngdoc method
			 * @name Archive#save
			 * @param data {Object} Object with data
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, { tid: Utilities.getUniqueId() }));
				}
			}
		});

		/**
		 * Get all archives.
		 * ```
		 * Archive.query().$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name Archive#query
		 */

		// TODO: #Archive update, delete

	}]);
