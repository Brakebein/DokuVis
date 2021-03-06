/**
 * Components to integrate comments.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 * * [angularMoment](https://github.com/urish/angular-moment)
 *
 * ### Requirements
 * Add `comments.js` and `comments.css` to your `index.html` and add `dokuvis.comments` as dependency.
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
.directive('commentSection', ['$rootScope', 'Comment', 'Utilities', '$log',
	function ($rootScope, Comment, Utilities, $log) {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.comments/commentSection.tpl.html',
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
							$log.debug(result);
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
							scope.newCommentInput = '';
							if (newComment) {
								newComment.answers = [];
								scope.comments.push(newComment);
							}
							commentsUpdate(newComment);
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
							commentsUpdate(newAnswer);
						})
						.catch(function (err) {
							Utilities.throwApiException('#Comment.save', err);
						});
				};

				// TODO: Kommentare/Antworten editieren und löschen

				function commentsUpdate(comment) {
					$rootScope.$broadcast('commentsUpdate', comment);
				}
			}
		};

	}
])

.directive('commentList', ['$rootScope', 'Comment', 'Utilities', '$log',
	function ($rootScope, Comment, Utilities, $log) {

		return {
			templateUrl: 'components/dokuvis.comments/commentList.tpl.html',
			restrict: 'E',
			link: function (scope) {

				scope.options = {
					activeTab: ''
				};

				scope.elements = [];

				function queryComments() {
					Comment.query().$promise
						.then(function (results) {
							$log.debug('comments:', results);
							scope.elements = results;
						})
						.catch(function (reason) {
							Utilities.throwApiException('Comment.query', reason);
						});
				}

				// init
				queryComments();

				// listen to commentsUpdate
				scope.$on('commentsUpdate', function () {
					queryComments();
				});

				scope.openComment = function (comment) {
					commentActive(comment);
				};

				scope.setScreenshotView = function (comment, event) {
					event.stopPropagation();
					if (comment.screenshots.length)
						snapshotViewStart(comment.screenshots[0]);
				};

				function snapshotViewStart(data) {
					$rootScope.$broadcast('snapshotViewStart', data);
				}

				function commentActive(comment) {
					$rootScope.$broadcast('commentActive', comment);
				}

			}
		}

	}
])

.directive('commentDetail', ['$rootScope', 'Comment', 'Utilities', '$log',
	function ($rootScope, Comment, Utilities, $log) {

		return {
			templateUrl: 'components/dokuvis.comments/commentDetail.tpl.html',
			restrict: 'E',
			scope: {
				id: '='
			},
			link: function (scope) {

				scope.comment = null;
				scope.newAnswerInput = '';
				scope.isAnswering = false;

				scope.$watch('id', getComment);

				function getComment(id) {
					if (!id) return;

					Comment.get({ id: id }).$promise
						.then(function (result) {
							$log.debug(result);
							scope.comment = result;
						})
						.catch(function (reason) {
							Utilities.throwApiException('Comment.get', reason);
						});
				}

				scope.setScreenshotView = function () {
					if (scope.comment.screenshots.length)
						snapshotViewStart(scope.comment.screenshots[0]);
				};

				function snapshotViewStart(data) {
					$rootScope.$broadcast('snapshotViewStart', data);
				}

				scope.showSnapshot = function () {
					snapshotViewScreen(scope.comment.screenshots[0], scope.comment.pins);
				};

				function snapshotViewScreen(screen, pins) {
					$rootScope.$broadcast('snapshotViewScreen', screen, pins);
				}

				// Save a new comment of type `answer`.
				scope.postAnswer = function () {
					if (!scope.comment) return;
					if (scope.newAnswerInput.length < 1) return;

					Comment.save({
						type: 'answer',
						text: scope.newAnswerInput,
						targets: scope.comment.id
					}).$promise
						.then(function (newAnswer) {
							console.log(newAnswer);
							scope.newAnswerInput = '';
							scope.isAnswering = false;
							if (newAnswer)
								scope.comment.answers.push(newAnswer);
							commentsUpdate(newAnswer);
						})
						.catch(function (err) {
							Utilities.throwApiException('#Comment.save', err);
						});
				};

				function commentsUpdate(comment) {
					$rootScope.$broadcast('commentsUpdate', comment);
				}

			}
		};

	}
])

.directive('snapshotForm', ['$rootScope', 'Comment', 'Utilities', '$log',
	function ($rootScope, Comment, Utilities, $log) {

		return {
			templateUrl: 'components/dokuvis.comments/snapshotForm.tpl.html',
			restrict: 'E',
			scope: true,
			link: function (scope) {

				scope.comment = '';
				scope.refObj = [];
				scope.refSrc = [];

				scope.isSaving = false;

				var viewportAPI;

				// waiting for initializing sync event from viewportSnapshot
				scope.$on('snapshotSyncViewport', function (event, args) {
					console.log(args);
					viewportAPI = args;
					scope.screenshot = viewportAPI.getScreenshot();
				});

				scope.$on('snapshotPinSuccess', function (event, object, pinMatrix) {
					if (!scope.refObj.find(function (obj) { return obj.object === object; }))
						scope.refObj.push({
							object: object,
							pinMatrix: pinMatrix
						});
				});

				scope.$on('snapshotReference', function (event, ref) {
					if (scope.refSrc.indexOf(ref) === -1)
						scope.refSrc.push(ref);
				});

				scope.removeObject = function (obj) {
					scope.refObj.splice(scope.refObj.indexOf(obj), 1);
					viewportAPI.removeObjectFromMarked(obj.object);
				};

				scope.removeSource = function (src) {
					scope.refSrc.splice(scope.refSrc.indexOf(src), 1);
				};

				scope.save = function () {
					if (!scope.comment.length) {
						Utilities.dangerAlert('Bitte geben Sie einen Text ein!'); return;
					}
					if (!scope.refObj.length) {
						Utilities.dangerAlert('Markiere mindestens ein Objekt, über das dieser Kommentar handelt.');
						return;
					}
					if (!scope.screenshot) {
						Utilities.dangerAlert('No screenshot available!');
						return;
					}

					scope.screenshot.pData = viewportAPI.getPainting();

					$log.debug(scope.comment, scope.refObj, scope.refSrc, scope.screenshot);
					scope.isSaving = true;

					Comment.save({
						type: 'model',
						text: scope.comment,
						targets: scope.refObj.map(function (t) { return { object: t.object.name, pinMatrix: t.pinMatrix }; }),
						refs: scope.refSrc.map(function (t) { return t.id; }),
						screenshots: [scope.screenshot]
					}).$promise
						.then(function (result) {
							$log.debug(result);
							snapshotEnd();
							commentsUpdate(result);
						})
						.catch(function (reason) {
							Utilities.throwApiException('Comment.save', reason);
							scope.isSaving = false;
						});
				};

				scope.abort = function () {
					snapshotEnd();
				};

				function snapshotEnd() {
					$rootScope.$broadcast('snapshotEnd');
				}

				function commentsUpdate(comment) {
					$rootScope.$broadcast('commentsUpdate', comment);
				}

			}
		};

	}
]);
