/**
 * $resource for comments.
 * @ngdoc factory
 * @name Comment
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ngResource/service/$resource $resource
 * @requires API
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Utilities
 * @requires https://momentjs.com/ moment
 */
angular.module('dokuvisApp').factory('Comment', ['$resource', 'API', '$stateParams', 'Utilities', 'moment',
	function($resource, API, $stateParams, Utilities, moment) {
		
		return $resource(API + 'auth/project/:project/:subproject/comment/:id', {
			project: function () {
				return $stateParams.project;
			},
			subproject: function () {
				return $stateParams.subproject;
			},
			id: '@eid'
		}, {
			/**
			 * Save a new comment with following post parameters.
			 * ```
			 * Comment.save({
			 *   type: 'model'|'source'|'answer'|'task',
			 *   text: <string>,
			 *   title: <string>,               // (optional)
			 *   targets: <id>|<Array>,         // ids of the items the comment is attached to
			 *   refs: <id>|<Array>,            // ids of any references (optional)
			 *   screenshots: <Object>|<Array>  // screenshots and user drawings (optional)
			 * }).$promise.then(...);
			 * ```
			 * @ngdoc method
			 * @name Comment#save
			 * @param data {Object} Object with data
			 */
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
			 * Get all comments of an element specified by its id.
			 * ```
			 * Comment.queryTarget({ targetId: <id> }).$promise.then(...);
			 * ```
			 * @ngdoc method
			 * @name Comment#queryTarget
			 * @param targetId {Object} Object with targetId
			 */
			queryTarget: {
				method: 'GET',
				url: API + 'auth/project/:project/:subproject/comment/target/:targetId',
				isArray: true
			}
		});

		/**
		 * Get all comments within the current project/subproject.
		 * ```
		 * Comment.query().$promise.then(function (comments) {...});
		 * ```
		 * @ngdoc method
		 * @name Comment#query
		 */

		/**
		 * Get a specific comment by id.
		 * ```
		 * Comment.get({ id: <id> }).$promise.then(...);
		 * ```
		 * @ngdoc method
		 * @name Comment#get
		 * @param id {Object} Object with comment id
		 */

		// TODO: #Comment Answer comments to $resource
		// TODO: #Comment update
		
	}]);
