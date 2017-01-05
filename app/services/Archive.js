angular.module('dokuvisApp').factory('Archive', ['$resource', 'API', '$stateParams', 'Utilities',
	/**
	 * $resource for archives.
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Archive
	 * @author Brakebein
	 */
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
			 * @memberof Archive
			 * @method save
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
		 * @memberof Archive
		 * @method query
		 */

		// TODO: #Archive update, delete

	}]);
