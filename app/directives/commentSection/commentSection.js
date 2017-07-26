/**
 * Directive to show comments of the specified target, to add new comments, or answer to existing ones.
 *
 * @ngdoc directive
 * @name commentSection
 * @module dokuvisApp
 * @author Brakebein
 * @requires Comment
 * @requires Utilities
 * @restrict E
 * @scope
 * @param target {string} Id of the target instance (e.g. id of document/task)
 * @param type {string} Type of the target instance, respectively the type of the comment (e.g. 'task', 'picture', 'source')
 */
angular.module('dokuvisApp').directive('commentSection', ['Comment', 'Utilities',
	function (Comment, Utilities) {

		return {
			restrict: 'E',
			templateUrl: 'app/directives/commentSection/commentSection.html',
			scope: {
				target: '=target',
				type: '=type'
			},
			link: function (scope) {

				scope.commentInput = "";

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

	}]);
