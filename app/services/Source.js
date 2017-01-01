angular.module('dokuvisApp').factory('Source', ['$resource', 'API', '$stateParams',
	/**
	 * $resource for sources/documents.
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Source
	 * @author Brakebein
	 */
	function($resource, API, $stateParams) {
		
		return $resource(API + 'auth/project/:project/:subproject/source/:id', {
			project: function () {
				return $stateParams.project;
			},
			subproject: function () {
				return $stateParams.subproject;
			},
			id: '@eid'
		}, {
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						tid: Utilities.getUniqueId(),
						date: moment().format()
					}));
				}
			},
			/**
			 * Link this source to specific items.
			 * ```
			 * source.$link({ targets: <id>|<Array> }).then(...);
			 * ```
			 * @memberof Source
			 * @method link
			 */
			link: {
				method: 'POST',
				url: API + 'auth/project/:project/:subproject/source/:id/connect'
			},
			/**
			 * Get all items this source is connected to.
			 * ```
			 * source.$getLinks().then(...);
			 * ```
			 * @memberof Source
			 * @method getLinks
			 */
			getLinks: {
				method: 'GET',
				url: API + 'auth/project/:project/:subproject/source/:id/connect',
				isArray: true
			}
		});

		/**
		 * Get all sources/documents of this project/subproject.
		 * ```
		 * Source.query().$promise.then(...);
		 * ```
		 * @memberof Source
		 * @method query
		 */

		/**
		 * Get a specific source by id.
		 * ```
		 * Source.get({ id: <id> }).$promise.then(...);
		 * ```
		 * @memberof Source
		 * @method get
		 */

		// TODO: #Source update
		// TODO: #Source save

	}]);
