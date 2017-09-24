/**
 * Components to integrate project information pieces.
 * 
 * @ngdoc module
 * @name dokuvis.projinfos
 * @module dokuvis.projinfos
 */
angular.module('dokuvis.projinfos', [
	'ngResource',
	'ui.router'
])

/**
 * $resource for ProjInfo.
 * @ngdoc factory
 * @name ProjInfo
 * @module dokuvis.projinfos
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiProjinfo
 */
.factory('ProjInfo', ['$resource', 'ApiParams', 'ApiProjinfo',
	function ($resource, ApiParams, ApiProjinfo) {

		return $resource(ApiProjinfo + '/:id', angular.extend({ id: '@id' }, ApiParams), {
			/**
			 * Save any changes to name or description.
			 * ```
			 * info.$update()
			 *   .then(function (info) {...});
			 * ```
			 * @ngdoc method
			 * @name ProjInfo#$update
			 */
			update: { method: 'PUT' },
			/**
			 * Swap the order of two info items.
			 * ```
			 * ProjInfo.swap({
			 *   from: <id>,
			 *   to: <id>
			 * }).$promise.then(...);
			 * ```
			 * @ngdoc method
			 * @name ProjInfo#swap
			 * @param data {Object} Object with data
			 */
			swap: { method: 'PUT' }
		});

		/**
		 * Get all info items of the current subproject.
		 * ```
		 * ProjInfo.query().$promise
		 *   .then(function (infos) {...});
		 * ```
		 * @ngdoc method
		 * @name ProjInfo#query
		 */

		/**
		 * Get info item by id.
		 * ```
		 * ProjInfo.get({ id: <id> }).$promise
		 *   .then(function (info) {...});
		 * ```
		 * @ngdoc method
		 * @name ProjInfo#query
		 */

		/**
		 * Save a new info item.
		 * ```
		 * ProjInfo.save({ value: <string> }).$promise
		 *   .then(function (info) {...});
		 * ```
		 * @ngdoc method
		 * @name ProjInfo#save
		 * @param data {Object} Object with data
		 */

		/**
		 * Delete the item.
		 * ```
		 * info.$delete()
		 *   .then(function () {...});
		 * ```
		 * @ngdoc method
		 * @name ProjInfo#$delete
		 */
	
	}
])

/**
 * Directive displaying all project information assets of the project/subproject.
 * @ngdoc directive
 * @name projinfoList
 * @module dokuvis.projinfos
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires ComponentsPath
 * @requires ProjInfo
 * @requires Utilities
 * @requires ConfirmDialog
 */
.directive('projinfoList', ['$rootScope', 'ComponentsPath', 'ProjInfo', 'Utilities', 'ConfirmDialog',
	function ($rootScope, ComponentsPath, ProjInfo, Utilities, ConfirmDialog) {

		return {
			restrict: 'E',
			templateUrl: ComponentsPath + '/dokuvis.projinfos/projinfoList.tpl.html',
			scope: {},
			link: function (scope) {

				scope.infos = [];
				scope.filteredInfos = [];

				function queryProjInfos() {
					ProjInfo.query().$promise
						.then(function (results) {
							scope.infos = results;
						})
						.catch(function (reason) {
							Utilities.throwApiException('#ProjInfo.query', reason);
						});
				}

				// init
				queryProjInfos();

				scope.removeProjInfo = function(info) {
					ConfirmDialog({
						headerText: 'Info löschen',
						bodyText: 'Soll die Info gelöscht werden?'
					}).then(function () {
						info.$delete()
							.then(function () {
								projinfosUpdate();
							})
							.catch(function (err) {
								Utilities.throwApiException('#ProjInfo.delete', err);
							});
					});
				};

				scope.swapInfoOrder = function(oldIndex, newIndex) {
					ProjInfo.swap({
						from: scope.filteredInfos[oldIndex].id,
						to: scope.filteredInfos[newIndex].id
					}).$promise
						.then(function (result) {
							console.log(result);
							projinfosUpdate();
						})
						.catch(function (err) {
							Utilities.throwApiException('#ProjInfo.swap', err);
						});
				};

				/**
				 * Event that gets fired, when project information has been created, edited, or deleted.
				 * @ngdoc event
				 * @name projinfoList#projinfosUpdate
				 * @eventType broadcast on $rootScope
				 * @param info {ProjInfo=} New/edited project information
				 */
				function projinfosUpdate(info) {
					$rootScope.$broadcast('projinfosUpdate', info);
				}

				// listen to projinfosUpdate event
				scope.$on('projinfosUpdate', function () {
					queryProjInfos();
				});

			}
		}

	}
])

/**
 * Modal controller for creating or editing information assets ({@link ProjInfo}) of projects/subprojects.
 * @ngdoc controller
 * @name projinfoModalCtrl
 * @module dokuvis.projinfos
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires ProjInfo
 * @requires Utilities
 */
.controller('projinfoModalCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'ProjInfo', 'Utilities',
	function ($scope, $rootScope, $state, $stateParams, ProjInfo, Utilities) {

		/**
		 * Model for the textarea field
		 * @ngdoc property
		 * @name projinfoModalCtrl#input
		 * @type {string}
		 */
		$scope.input = '';

		var info = null;

		function getProjInfo() {
			ProjInfo.get({ id: $stateParams.infoId }).$promise
				.then(function (result) {
					info = result;
					$scope.input = result.value;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#ProjInfo.get', reason);
				});
		}

		// init
		if ($stateParams.infoId === 'new')
			$scope.title = 'Neue Info';
		else {
			$scope.title = 'Info bearbeiten';
			getProjInfo();
		}

		/**
		 * Saves the input data by either creating new or updating nodes.
		 * @ngdoc method
		 * @name projinfoModalCtrl#save
		 */
		$scope.save = function () {
			if (!$scope.input.length) {
				Utilities.dangerAlert('Bitte geben Sie Text ein!');
				return;
			}

			if (info) {
				info.value = $scope.input;
				info.$update()
					.then(function () {
						projinfosUpdate();
						$scope.close();
					})
					.catch(function (err) {
						Utilities.throwApiException('#ProjInfo.update', err);
					});
			}
			else {
				ProjInfo.save({	value: $scope.input }).$promise
					.then(function () {
						projinfosUpdate();
						$scope.close();
					})
					.catch(function (err) {
						Utilities.throwApiException('#ProjInfo.save', err);
					});
			}
		};

		/**
		 * Event that gets fired, when project information has been created, edited, or deleted.
		 * @ngdoc event
		 * @name projinfoModalCtrl#projinfosUpdate
		 * @eventType broadcast on $rootScope
		 * @param info {ProjInfo=} New/edited project information
		 */
		function projinfosUpdate(info) {
			$rootScope.$broadcast('projinfosUpdate', info);
		}

		/**
		 * Close the modal and go to parent state.
		 * @ngdoc method
		 * @name projinfoModalCtrl#close
		 */
		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^');
		};

	}
]);
