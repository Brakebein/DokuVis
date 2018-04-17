/**
 * Components to integrate archive/repositorie information.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 * * [ui.router](https://ui-router.github.io/ng1/docs/0.3.2/#/api)
 *
 * ### Requirements
 * In your application, define a constant named `ApiArchive` to specify the REST-API url.
 * ```
 * app.constant('ApiArchive', 'api/auth/project/:project/archive');
 * ```
 *
 * ### Archive object
 * ```
 * {
 *   collection: {
 *     id: <id>,
 *     name: <string>,       // name of the collection
 *     nodeId: <integer>     // internal Neo4j id
 *   },
 *   institution: {
 *     abbr: <string|null>,  // abbreviation of the institution
 *     id: <id>,
 *     name: <string>        // name if the institution
 *   }
 * }
 * ```
 *
 * @ngdoc module
 * @name dokuvis.archives
 * @module dokuvis.archives
 */
angular.module('dokuvis.archives', [
	'ngResource',
	'ui.router'
])

/**
 * $resource for archives.
 * @ngdoc factory
 * @name Archive
 * @module dokuvis.archives
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiArchive
 */
.factory('Archive', ['$resource', 'ApiParams', 'ApiArchive',
	function ($resource, ApiParams, ApiArchive) {

		return $resource(ApiArchive + '/:id', angular.extend({ id: '@collection.id' }, ApiParams), {
			/**
			 * Save changes of archive.
			 * ```
			 * archive.$update()
			 *   .then(function (archive) {...});
			 * ```
			 * @ngdoc method
			 * @name Archive#$update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all archives.
		 * ```
		 * Archive.query().$promise
		 *   .then(function (archives) {...});
		 * ```
		 * @ngdoc method
		 * @name Archive#query
		 */

		/**
		 * Get archive by id.
		 * ```
		 * Archive.get({ id: <id> }).$promise
		 *   .then(function (archive) {...});
		 * ```
		 * @ngdoc method
		 * @name Archive#get
		 * @param data {Object} Object with property `id`
		 */

		/**
		 * Save a new arvhive.
		 * ```
		 * Archive.save({
		 *   institution: <string>  // archive/instiution name
		 *   abbr: <string>         // abbreviation of the institution (optional)
		 *   collection: <string>   // collection name
		 * }).$promise
		 *   .then(function (archive) {...});
		 * ```
		 * @ngdoc method
		 * @name Archive#save
		 * @param data {Object} Object with data
		 */

		/**
		 * Delete archive. All relationships to sources will be lost.
		 * ```
		 * archive.$delete
		 *   .then(function () {...});
		 * ```
		 * @ngdoc method
		 * @name Archive#$delete
		 */

	}
])

/**
 * This controller handles the modal to enter a new archive to the system.
 *
 * @ngdoc controller
 * @name archiveModalCtrl
 * @module dokuvis.archives
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Archive
 * @requires Utilities
 * @requires ConfirmDialog
 * @requires https://docs.angularjs.org/api/ng/service/$log $log
 */
.controller('archiveModalCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'Archive', 'Utilities', 'ConfirmDialog', '$log',
	function ($scope, $rootScope, $state, $stateParams, Archive, Utilities, ConfirmDialog, $log) {

		$scope.isSaving = false;

		$scope.archive = {
			institution: '',
			abbr: '',
			collection: ''
		};

		var archive = null;

		function getArchive() {
			Archive.get({ id: $stateParams.archiveId }).$promise
				.then(function (result) {
					$log.debug(result);
					$scope.archive.institution = result.institution.name;
					$scope.archive.abbr = result.institution.abbr;
					$scope.archive.collection = result.collection.name;
					archive = result;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Archive.get', reason);
				});
		}

		// init
		if ($stateParams.archiveId === 'new') {
			$scope.title = 'archive_new';
			$scope.new = true;
		}
		else {
			$scope.title = 'archive_edit';
			$scope.new = false;
			getArchive();
		}

		/**
		 * Saves the input data by either creating new or updating nodes.
		 * @ngdoc method
		 * @name archiveModalCtrl#save
		 */
		$scope.save = function() {
			if (!$scope.archive.institution.length) {
				Utilities.dangerAlert('Geben Sie der Institution einen Namen!');
				return;
			}
			if (!$scope.archive.collection.length) {
				Utilities.dangerAlert('Geben Sie der Kollektion einen Namen!');
				return;
			}

			$scope.isSaving = true;

			if ($stateParams.archiveId !== 'new') {
				archive.institution.name = $scope.archive.institution;
				archive.institution.abbr = $scope.archive.abbr;
				archive.collection.name = $scope.archive.collection;

				archive.$update()
					.then(function () {
						archivesUpdate(archive);
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Archive.update', reason);
						$scope.isSaving = false;
					});
			}
			else {
				Archive.save($scope.archive).$promise
					.then(function (archive) {
						archivesUpdate(archive);
						$scope.close();
					})
					.catch(function (err) {
						Utilities.throwApiException('#Archive.save', err);
						$scope.isSaving = false;
					});
			}
		};

		$scope.delete = function () {
			ConfirmDialog({
				headerText: 'archive_delete',
				bodyText: 'archive_delete_question'
			}).then(function () {
				$scope.isSaving = true;
				archive.$delete()
					.then(function (response) {
						$log.debug(response);
						archivesUpdate();
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Archive.delete', reason);
						$scope.isSaving = false;
					});
			});
		};

		/**
		 * Close the modal and go to parent state.
		 * @ngdoc method
		 * @name archiveModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^');
		};

		/**
		 * Event that gets fired, when a new archive has been created or an exiting one has been updated.
		 * @ngdoc event
		 * @name archiveModalCtrl#archivesUpdate
		 * @eventType broadcast on $rootScope
		 * @param {Archive=} archive New or updated archive.
		 */
		function archivesUpdate(archive) {
			$rootScope.$broadcast('archivesUpdate', archive);
		}

	}
])

/**
 * List of all archives and their detailed information.
 * @ngdoc directive
 * @name archivesList
 * @module dokuvis.archives
 * @author Brakebein
 * @requires Archive
 * @requires Utilities
 * @restrict E
 * @scope
 */
.component('archivesList', {
	bindings: {},
	templateUrl: 'components/dokuvis.archives/archivesList.tpl.html',
	controller: ['$scope', 'Archive', 'Utilities',
		function ($scope, Archive, Utilities) {

			$scope.archives = [];

			function queryArchives() {
				Archive.query().$promise
					.then(function (results) {
						$scope.archives = results;
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Archive.query', reason);
					});
			}

			this.$onInit = function () {
				queryArchives();
			};

			$scope.$on('archivesUpdate', function () {
				queryArchives();
			});

		}
	]
});
// .directive('archivesList', ['Archive', 'Utilities',
// 	function (Archive, Utilities) {
//
// 		return {
// 			template: '<div class="panel panel-default">\n\t<div class="panel-heading">Archives</div>\n\t<div class="panel-body">\n\t\t<ul class="list-group">\n\t\t\t<li class="list-group-item" ng-repeat="archive in archives">\n\t\t\t\t<table class="table">\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td><strong>Institution:</strong></td>\n\t\t\t\t\t\t<td>{{ archive.institutionName }} ({{ archive.institutionAbbr }})</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td><strong>Sammlung:</strong></td>\n\t\t\t\t\t\t<td>{{ archive.collectionName }}</td>\n\t\t\t\t\t</tr>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td><a ui-sref="project.graph.node({ startNode: archive.collectionId })">Graphensuche</a></td>\n\t\t\t\t\t</tr>\n\t\t\t\t</table>\n\t\t\t</li>\n\t\t</ul>\n\t</div>\n</div>',
//
// 			restrict: 'E',
// 			scope: {
// 				graphEntry: '='
// 			},
// 			link: function (scope) {
//
// 				scope.archives = [];
//
// 				function queryArchives() {
// 					Archive.query().$promise
// 						.then(function (archives) {
// 							scope.archives = archives;
// 						})
// 						.catch(function (reason) {
// 							Utilities.throwApiException('#Archive.query', reason);
// 						});
// 				}
//
// 				queryArchives();
//
// 				scope.$on('archivesUpdate', function () {
// 					queryArchives();
// 				});
//
// 			}
// 		};
//
// 	}
// ]);
