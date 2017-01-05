angular.module('dokuvisApp').factory('Comment', ['$resource', 'API', '$stateParams', 'Utilities',
	/**
	 * $resource for comments.
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Comment
	 * @author Brakebein
	 */
	function($resource, API, $stateParams, Utilities) {
		
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
			 * @memberof Comment
			 * @method save
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
			 * @memberof Comment
			 * @method queryTarget
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
		 * @memberof Comment
		 * @method query
		 */

		/**
		 * Get a specific comment by id.
		 * ```
		 * Comment.get({ id: <id> }).$promise.then(...);
		 * ```
		 * @memberof Comment
		 * @method get
		 */

		// TODO: #Comment Answer comments to $resource
		// TODO: #Comment update
		
	}]);
