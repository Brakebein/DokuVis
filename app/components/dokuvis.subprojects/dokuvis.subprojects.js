/**
 * Components to integrate subprojects.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource)
 * * [mm.acl](https://github.com/mikemclin/angular-acl)
 *
 * @ngdoc module
 * @name dokuvis.subprojects
 * @module dokuvis.subprojects
 */
angular.module('dokuvis.subprojects', [
	'ngResource',
	'mm.acl'
])

/**
 * $resource for subprojects to interact with RESTful server-side data sources.
 * @ngdoc factory
 * @name Subproject
 * @module dokuvis.subprojects
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiSubproject
 */
.factory('Subproject', ['$resource', 'ApiParams', 'ApiSubproject',
	function ($resource, ApiParams, ApiSubproject) {

		return $resource(ApiSubproject + '/:id', angular.extend({ id: '@id'	}, ApiParams), {
			/**
			 * Get subproject by id.
			 * ```
			 * Subproject.get({ id: <id> }).$promise
			 *   .then(function (subproject) {...});
			 * ```
			 * @ngdoc method
			 * @name Subproject#get
			 * @param id {Object} Object with subproject id
			 * @return {Resource} Subprojet as Resource object.
			 */
			get: {
				method: 'GET',
				cache: true
			},
			/**
			 * Saves any changes to name or description.
			 * ```
			 * subproject.$update().then(...);
			 * ```
			 * @ngdoc method
			 * @name Subproject#$update
			 * @return {Promise} Promise that resolves, if the request was succesful.
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all subprojects.
		 * ```
		 * Subproject.query().$promise
		 *   .then(function (subprojects) {...});
		 * ```
		 * @ngdoc method
		 * @name Subproject#query
		 * @return {Array<Resource>} Array of all subprojects, each a Resource object.
		 */

		/**
		 * Save a new subroject.
		 * ```
		 * Subproject.save({
			 *   name: <string>,
			 *   description: <string>  // (optional)
			 * }).$promise
		 *   .then(function (subproject) {...});
		 * ```
		 * @ngdoc method
		 * @name Subproject#save
		 * @param data {Object} Object with data
		 * @return {Resource} Saved subproject as Resource object.
		 */

	}
])

/**
 * Directive displaying all subprojects.
 * @ngdoc directive
 * @name subprojectList
 * @module dokuvis.subprojects
 * @requires ComponentsPath
 * @requires Subproject
 * @requires Utilities
 * @requires https://github.com/mikemclin/angular-acl AclService
 * @restrict E
 */
.directive('subprojectList', ['ComponentsPath', 'Subproject', 'Utilities', 'AclService',
	function (ComponentsPath, Subproject, Utilities, AclService) {

		return {
			restrict: 'E',
			templateUrl: ComponentsPath + '/dokuvis.subprojects/subprojectList.tpl.html',
			scope: {},
			link: function (scope) {

				scope.can = AclService.can;
				
				scope.subprojects = [];

				function querySubprojects() {
					Subproject.query().$promise
						.then(function (results) {
							scope.subprojects = results;
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Subproject.query', reason);
						});
				}

				// init
				querySubprojects();

				// listen to subprojectsUpdate event
				scope.$on('subprojectsUpdate', function () {
					querySubprojects();
				});

			}
		};

	}
])

/**
 * Modal controller for creating or editing subprojects.
 * @ngdoc controller
 * @name subprojectModalCtrl
 * @module dokuvis.subprojects
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Subproject
 * @requires Utilities
 */
.controller('subprojectModalCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'Subproject', 'Utilities',
	function ($scope, $rootScope, $state, $stateParams, Subproject, Utilities) {

		$scope.subproject = {
			name: '',
			description: ''
		};

		function getSubproject() {
			Subproject.get({ id: $stateParams.subprojectId }).$promise
				.then(function (result) {
					$scope.subproject = result;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Subproject.get', reason);
				});
		}

		// init
		if ($stateParams.subprojectId === 'new')
			$scope.title = 'subproject_new';
		else {
			$scope.title = 'subproject_edit';
			getSubproject();
		}

		/**
		 * Saves the input data by either creating new subproject or updating nodes.
		 * @ngdoc method
		 * @name subprojectModalCtrl#save
		 */
		$scope.save = function () {
			if (!$scope.subproject.name.length) {
				Utilities.dangerAlert('Keinen Namen angegeben!');
				return;
			}

			if ($stateParams.subprojectId !== 'new') {
				$scope.subproject.$update()
					.then(function (result) {
						subprojectsUpdate(result);
						$scope.close();
					})
					.catch(function (err) {
						Utilities.throwApiException('#Subproject.update', err);
					});
			}
			else {
				Subproject.save( $scope.subproject ).$promise
					.then(function (result) {
						subprojectsUpdate(result);
						$scope.close();
					})
					.catch(function (err) {
						Utilities.throwApiException('#Subproject.save', err);
					});
			}
		};

		/**
		 * Event that gets fired when a subproject has been created or edited.
		 * @ngdoc event
		 * @name subprojectModalCtrl#subprojectsUpdate
		 * @eventType broadcast on $rootScope
		 * @param subproject {Subproject=} Created/edited subproject
		 */
		function subprojectsUpdate(subproject) {
			$rootScope.$broadcast('subprojectsUpdate', subproject);
		}

		/**
		 * Close the modal and go to parent state.
		 * @ngdoc method
		 * @name subprojectModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^');
		};

	}
])

/**
 * Resolver: Check, if subproject exists.
 *
 * @ngdoc factory
 * @name SubprojectResolve
 * @module dokuvis.subprojects
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires Subproject
 */
.factory('SubprojectResolve', ['$q', '$state', 'Subproject',
	function ($q, $state, Subproject) {
		return function (params) {

			if (params.subproject === 'master')
				return $q.resolve();
			else {
				return Subproject.get({ id: params.subproject, project: params.project }).$promise
					.then(function (result) {
						if (!result.id) {
							$state.go('project.home', {project: params.project, subproject: 'master'});
							return $q.reject('Subproject does not exist!');
						}
					})
					.catch(function (err) {
						console.error('API Exception on Subproject.check()', err);
						return $q.reject(err);
					});

			}
		};
	}
]);
