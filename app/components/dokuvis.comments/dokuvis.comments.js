/**
 * Components to integrate comments.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 * * [angularMoment](https://github.com/urish/angular-moment)
 *
 * ### Requirements
 * Add `dokuvis.comments.js` and `dokuvis.comments.css` to your `index.html` and add `dokuvis.comments` as dependency.
 *
 * In your application, define a constant named `ApiComment` to specify the REST-API url. The url will be extended by `/:id`. Don't forget to set your {@link ApiParams}.
 * ```
 * // example
 * var myApp = angular.module('myApp', ['dokuvis.comments']);
 * myApp.constant('ApiComment', 'api/auth/project/:project/:subproject/comment');
 * ```
 *
 * @ngdoc module
 * @name dokuvis.comments
 * @module dokuvis.comments
 */
angular.module('dokuvis.comments', [
	'ngResource',
	'angularMoment'
])

/**
 * $resource for comments.
 * @ngdoc factory
 * @name Comment
 * @module dokuvis.comments
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiComment
 * @requires Utilities
 * @requires https://github.com/urish/angular-moment moment
 */
.factory('Comment', ['$resource', 'ApiParams', 'ApiComment', 'moment',
	function ($resource, ApiParams, ApiComment, moment) {

		return $resource(ApiComment + '/:id', angular.extend({ id: '@id' }, ApiParams), {
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
				url: ApiComment + '/target/:targetId',
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
		// TODO: #Comment update, delete

	}
])

/**
 * Directive to show comments of the specified target, to add new comments, or answer to existing ones.
 *
 * @ngdoc directive
 * @name commentSection
 * @module dokuvis.comments
 * @author Brakebein
 * @requires Comment
 * @requires Utilities
 * @restrict E
 * @scope
 * @param target {string} Id of the target instance (e.g. id of document/task)
 * @param type {string} Type of the target instance, respectively the type of the comment (e.g. 'task', 'picture', 'source')
 */
.directive('commentSection', ['ComponentsPath', 'Comment', 'Utilities',
	function (ComponentsPath, Comment, Utilities) {

		return {
			restrict: 'E',
			templateUrl: ComponentsPath + '/dokuvis.comments/commentSection.tpl.html',
			scope: {
				target: '=',
				type: '='
			},
			link: function (scope) {

				scope.commentInput = "";

				// watch for target id
				scope.$watch('target', loadComments);

				function loadComments(target) {
					if (!target) return;
					if (!scope.type) return;

					Comment.queryTarget({ targetId: target }).$promise
						.then(function (result) {
							console.log(result);
							scope.comments = result;
						})
						.catch(function(err) {
							Utilities.throwApiException('#Comment.queryTarget', err);
						});
				}

				// Save a new comment to the target.
				scope.postComment = function () {
					if (scope.newCommentInput.length < 1) return;

					var type = scope.type;
					if (['picture', 'plan', 'text'].indexOf(type) !== -1)
						type = 'source';

					Comment.save({
						type: type,
						text: scope.newCommentInput,
						targets: scope.target
					}).$promise
						.then(function (newComment) {
							console.log('newComment', newComment);
							scope.newCommentInput = '';
							if (newComment) {
								newComment.answers = [];
								scope.comments.push(newComment);
							}
						})
						.catch(function (err) {
							Utilities.throwApiException('#Comment.save', err);
						});
				};

				// Save a new comment of type `answer`.
				scope.postAnswer = function (comment) {
					if (comment.newAnswerInput.length < 1) return;

					Comment.save({
						type: 'answer',
						text: comment.newAnswerInput,
						targets: comment.id
					}).$promise
						.then(function (newAnswer) {
							comment.newAnswerInput = '';
							comment.answering = false;
							if (newAnswer)
								comment.answers.push(newAnswer);
						})
						.catch(function (err) {
							Utilities.throwApiException('#Comment.save', err);
						});
				};

				// TODO: Kommentare/Antworten editieren und löschen

			}
		};

	}
]);
