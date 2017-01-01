angular.module('dokuvisApp').factory('CategoryAttribute', ['$resource', 'API', '$stateParams', 'Utilities',
	/**
	 * $resource for CategoryAttribute, that can be assigned to models. Usually in combination with [Category]{@link dokuvisApp.Category.html}.<br/>
	 * API url: `api/auth/project/:project/category/:cid/attribute/:aid`
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name CategoryAttribute
	 * @author Brakebein
	 */
	function ($resource, API, $stateParams, Utilities) {
		
		return $resource(API + 'auth/project/:project/category/:cid/attribute/:aid', {
			project: function () {
				return $stateParams.project;
			},
			cid: '@cid',
			aid: '@id'
		}, {
			/**
			 * Saves a new attribute.
			 * ```
			 * CategoryAttribute.save({
			 *   cid: <id>        // id of the category, the attribute should be part of
			 *   value: <string>  // name of the new attribute
			 *   color: <string>  // hexadecimal, e.g. '#ffdd44'
			 * }).$promise.then(...);
			 * ```
			 * @memberof CategoryAttribute
			 * @method save
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, { id: Utilities.getUniqueId() + '_categoryAttr' }));
				}
			},
			/**
			 * Saves changes to the name.
			 * ```
			 * attribute.$update().then(...);
			 * ```
			 * @memberof CategoryAttribute
			 * @method update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Deletes this attribute.
		 * ```
		 * attribute.$delete().then(...);
		 * ```
		 * @memberof CategoryAttribute
		 * @method delete
		 */

	}]);
