/**
 * $resource for CategoryAttribute, that can be assigned to models. Usually in combination with {@link Category}.<br/>
 * API url: `api/auth/project/:project/category/:cid/attribute/:aid`
 * @ngdoc factory
 * @name CategoryAttribute
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 */
angular.module('dokuvisApp').factory('CategoryAttribute', ['$resource', 'API', '$stateParams',
	function ($resource, API, $stateParams) {
		
		return $resource(API + 'auth/project/:project/category/:cid/attribute/:aid', {
			project: function () {
				return $stateParams.project;
			},
			cid: '@cid',
			aid: '@id'
		}, {
			/**
			 * Saves changes to the name.
			 * ```
			 * attribute.$update().then(...);
			 * ```
			 * @ngdoc method
			 * @name CategoryAttribute#$update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Saves a new attribute.
		 * ```
		 * CategoryAttribute.save({
			 *   cid: <id>,       // id of the category, the attribute should be part of
			 *   value: <string>, // name of the new attribute
			 *   color: <string>  // hexadecimal, e.g. '#ffdd44'
			 * }).$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name CategoryAttribute#save
		 * @param data {Object} Object with data
		 */

		/**
		 * Deletes this attribute.
		 * ```
		 * attribute.$delete().then(...);
		 * ```
		 * @ngdoc method
		 * @name CategoryAttribute#$delete
		 */

	}]);
