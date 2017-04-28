/**
 * $resource for Category. A category can have multiple attributes ({@link CategoryAttribute}), which can be assigned to models.<br/>
 * API url: `api/auth/project/:project/category/:id`
 * @ngdoc factory
 * @name Category
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires CategoryAttribute
 */
angular.module('dokuvisApp').factory('Category', ['$resource', 'API', '$stateParams', 'CategoryAttribute',
	function ($resource, API, $stateParams, CategoryAttribute) {
		
		function setAttributeResource(json) {
			var data = angular.fromJson(json);

			for(var i=0; i<data.length; i++) {
				for(var j=0; j<data[i].attributes.length; j++) {
					data[i].attributes[j] = new CategoryAttribute(data[i].attributes[j]);
					data[i].attributes[j].cid = data[i].id;
				}
			}

			return data;
		}

		return $resource(API + 'auth/project/:project/category/:id', {
			project: function () {
				return $stateParams.project;
			},
			id: '@id'
		}, {
			/**
			 * Get all categories and their attributes. Attributes are transformed to instances of {@link CategoryAttribute}.
			 * ```
			 * Category.query().$promise.then(...);
			 * ```
			 * @ngdoc method
			 * @name Category#query
			 */
			query: {
				method: 'GET',
				isArray: true,
				transformResponse: setAttributeResource
			},
			/**
			 * Saves changes to the name and the color.
			 * ```
			 * category.$update().then(...);
			 * ```
			 * @ngdoc method
			 * @name Category#$update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Create a new (empty) category.
		 * ```
		 * Category.save({
			 *   value: <string>  // name of the new category
			 * }).$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name Category#save
		 * @param data {Object} Object with data
		 */
		
		/**
		 * Deletes this category and its attributes.
		 * ```
		 * category.$delete().then(...);
		 * ```
		 * @ngdoc method
		 * @name Category#$delete
		 */

	}]);
