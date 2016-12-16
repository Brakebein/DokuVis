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

		// return {
		//
		// 	/**
		// 	 * create comment
		// 	 * @param {string} type - type of comment
		// 	 * @param {string} text - user's comment text
		// 	 * @param {string} title - title of the comment
		// 	 * @param {(string|string[])} targets - ids of the items the comment is attached to
		// 	 * @param {(string|string[])} [refs] - ids of any references
		// 	 * @param {(Object|Object[])} [screenshots] - screenshots and user drawings
		// 	 * @returns {(HttpPromise|Promise)}
		// 	 */
		// 	create: function(type, text, title, targets, refs, screenshots) {
		// 		if(!targets)
		// 			targets = [];
		// 		if(!Array.isArray(targets))
		// 			targets = [targets];
		// 		if(!targets.length) {
		// 			Utilities.dangerAlert('Der Kommentar ist keinem Objekt zugewiesen!');
		// 			return $q.reject('No valid arguments');
		// 		}
		// 		if(!refs)
		// 			refs = [];
		// 		if(!screenshots) {
		// 			screenshots = [];
		// 		}
		//
		// 		return $http.post(API + 'auth/project/' + $stateParams.project + '/comment', {
		// 			id: Utilities.getUniqueId(),
		// 			targets: targets,
		// 			text: text,
		// 			type: type,
		// 			title: title,
		// 			user: AuthenticationFactory.user,
		// 			date: moment().format(),
		// 			refs: refs,
		// 			screenshots: screenshots,
		// 			path: $stateParams.project + '/screenshots/'
		// 		});
		// 	},
		//
		// };
		
	}]);
