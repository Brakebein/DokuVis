/**
 * $resource for sources/documents.
 * @ngdoc factory
 * @name Source
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Utilities
 * @requires https://momentjs.com/ moment
 */
angular.module('dokuvisApp').factory('Source', ['$resource', 'API', '$stateParams', 'Utilities', 'moment',
	function($resource, API, $stateParams, Utilities, moment) {
		
		return $resource(API + 'auth/project/:project/:subproject/source/:id', {
			project: function () {
				return $stateParams.project;
			},
			subproject: function () {
				return $stateParams.subproject;
			},
			id: '@eid',
			type: '@type'
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
			 * @ngdoc method
			 * @name Source#link
			 * @param targets {Object} Object with targets
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
			 * @ngdoc method
			 * @name Source#$getLinks
			 */
			getLinks: {
				method: 'GET',
				url: API + 'auth/project/:project/:subproject/source/:id/connect',
				isArray: true
			},
			spatialize: {
				method: 'PUT',
				url: API + 'auth/project/:project/:subproject/source/:id/:type/spatial'
			},
			getSpatial: {
				method: 'GET',
				url: API + 'auth/project/:project/:subproject/source/:id/:type/spatial'
			}
		});

		/**
		 * Get all sources/documents of this project/subproject.
		 * ```
		 * Source.query().$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name Source#query
		 */

		/**
		 * Get a specific source by id.
		 * ```
		 * Source.get({ id: <id> }).$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name Source#get
		 * @param id {Object} Object with source id
		 */

		// TODO: #Source update
		// TODO: #Source save

	}]);
