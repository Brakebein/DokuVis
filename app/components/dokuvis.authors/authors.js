/**
 * Components to integrate authors.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 * * [pascalprecht.translate](https://angular-translate.github.io/)
 *
 *
 * @ngdoc module
 * @name dokuvis.authors
 * @module dokuvis.authors
 */
angular.module('dokuvis.authors', [
	'ngResource',
	'pascalprecht.translate'
])

/**
 * $resource for authors.
 * @ngdoc factory
 * @name Author
 * @module dokuvis.authors
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiAuthor
 */
.factory('Author', ['$resource', 'ApiParams', 'ApiAuthor',
	function ($resource, ApiParams, ApiAuthor) {

		return $resource(ApiAuthor + '/:id', angular.extend({ id: '@id' }, ApiParams), {
			/**
			 * Save name changes.
			 * ```
			 * author.$update
			 *   .then(function (author) {...});
			 * ```
			 * @ngdoc method
			 * @name Author#$update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all authors.
		 * ```
		 * Author.query().$promise
		 *   .then(function (authors) {...});
		 * ```
		 * @ngdoc method
		 * @name Author#query
		 */

		/**
		 * Get author by id.
		 * ```
		 * Author.get({ id: <id> }).$promise
		 *   .then(function (author) {...});
		 * ```
		 * @ngdoc method
		 * @name Author#get
		 * @param data {Object} Data object with `id` property
		 */

		/**
		 * Save a new author.
		 * ```
		 * Author.save({ name: <string> }).$promise
		 *   .then(function (author) {...});
		 * ```
		 * @ngdoc method
		 * @name Author#save
		 * @param data {Object} Data object with `name` property
		 */

		/**
		 * Delete author.
		 * ```
		 * author.$delete()
		 *   .then(function () {...});
		 * ```
		 * @ngdoc method
		 * @name Author#$delete
		 */

	}
])

/**
 * Directive listing all authors in a table.
 * @ngdoc directive
 * @name authorList
 * @module dokuvis.authors
 * @requires Author
 * @requires Utilities
 * @restrict E
 * @scope
 */
.directive('authorList', ['Author', 'Utilities',
	function (Author, Utilities) {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.authors/authorList.tpl.html',
			scope: {},
			link: function (scope) {

				scope.authors = [];

				function queryAuthors() {
					Author.query().$promise
						.then(function (results) {
							scope.authors = results;
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Author.query', reason);
						});
				}

				// init
				queryAuthors();

				// listen to authorsUpdate event
				scope.$on('authorsUpdate', function () {
					queryAuthors();
				});

			}
		};

	}
])

/**
 * Controller for the modal to add, edit or delete an author.
 * @ngdoc controller
 * @name authorModalCtrl
 * @module dokuvis.authors
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Author
 * @requires Utilities
 * @requires ConfirmDialog
 */
.controller('authorModalCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'Author', 'Utilities', 'ConfirmDialog',
	function ($scope, $rootScope, $state, $stateParams, Author, Utilities, ConfirmDialog) {

		$scope.name = '';

		var author = null;

		function getAuthor() {
			Author.get({ id: $stateParams.authorId }).$promise
				.then(function (result) {
					$scope.name = result.name;
					author = result;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Author.get', reason);
				});
		}

		// init
		if ($stateParams.authorId === 'new') {
			$scope.title = 'author_new';
			$scope.new = true;
		}
		else {
			$scope.title = 'author_delete';
			$scope.new = false;
			getAuthor();
		}

		/**
		 * Save new author or save updates of existing one.
		 * @ngdoc method
		 * @name authorModalCtrl#save
		 */
		$scope.save = function () {
			if (!$scope.name.length) {
				Utilities.dangerAlert('Geben Sie dem Author einen Namen!');
				return;
			}

			if (!$scope.new) {
				author.name = $scope.name;
				author.$update()
					.then(function () {
						authorsUpdate(author);
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Author.update', reason);
					});
			}
			else {
				Author.save({ name: $scope.name }).$promise
					.then(function (result) {
						authorsUpdate(result);
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Author.save', reason);
					});
			}
		};

		/**
		 * Delete the author. (`ConfirmDialog` will be triggered.)
		 * @ngdoc method
		 * @name authorModalCtrl#delete
		 */
		$scope.delete = function () {
			ConfirmDialog({
				headerText: 'author_delete',
				bodyText: 'author_delete_confirm',
				translationData: {
					name: author.name
				}
			}).then(function () {
				author.$delete()
					.then(function (response) {
						console.log(response);
						authorsUpdate();
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Author.delete', reason);
					});
			})
		};

		/**
		 * Event that gets fired, when an author has been added, edited, or deleted.
		 * @ngdoc event
		 * @name authorModalCtrl#authorsUpdate
		 * @eventType broadcast on $rootScope
		 * @param author {Author=} Added or edited author
		 */
		function authorsUpdate(author) {
			$rootScope.$broadcast('authorsUpdate', author);
		}

		/**
		 * Close modal and go to parent state.
		 * @ngdoc method
		 * @name authorModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^');
		};

	}
]);
