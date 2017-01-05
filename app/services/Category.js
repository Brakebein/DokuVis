angular.module('dokuvisApp').factory('Category', ['$resource', 'API', '$stateParams', 'Utilities', 'CategoryAttribute',
	/**
	 * $resource for Category. A category can have multiple attributes ([CategoryAttribute]{@link dokuvisApp.CategoryAttribute.html}), which can be assigned to models.<br/>
	 * API url: `api/auth/project/:project/category/:id`
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Category
	 * @author Brakebein
	 */
	function ($resource, API, $stateParams, Utilities, CategoryAttribute) {
		
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
			 * Get all categories and their attributes. Attributes are transformed to instances of [CategoryAttribute]{@link dokuvisApp.CategoryAttribute.html}.
			 * ```
			 * Category.query().$promise.then(...);
			 * ```
			 * @memberof Category
			 * @method query
			 */
			query: {
				method: 'GET',
				isArray: true,
				transformResponse: setAttributeResource
			},
			/**
			 * Create a new (empty) category.
			 * ```
			 * Category.save({
			 *   value: <string>  // name of the new category
			 * }).$promise.then(...);
			 * ```
			 * @memberof Category
			 * @method save
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, { id: Utilities.getUniqueId() + '_category' }));
				}
			},
			/**
			 * Saves changes to the name and the color.
			 * ```
			 * category.$update().then(...);
			 * ```
			 * @memberof Category
			 * @method update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Deletes this category and its attributes.
		 * ```
		 * category.$delete().then(...);
		 * ```
		 * @memberof Category
		 * @method delete
		 */

	}]);
