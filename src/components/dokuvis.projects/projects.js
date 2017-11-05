/**
 * Components to integrate projects.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource/service/$resource)
 * * [ui.router](https://ui-router.github.io/ng1/docs/0.3.2/#/api)
 * * [mm.acl](https://github.com/mikemclin/angular-acl)
 *
 * @ngdoc module
 * @name dokuvis.projects
 * @module dokuvis.projects
 */
angular.module('dokuvis.projects', [
	'ngResource',
	'ui.router',
	'mm.acl'
	// 'dokuvis.utils'
])

/**
 * $resource for projects to interact with RESTful server-side data sources.
 * @ngdoc factory
 * @name Project
 * @module dokuvis.projects
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires API
 * @example
 * ```
 * project.name = 'new name';
 * project.$update();
 * ```
 */
.factory('Project', ['$resource', 'ApiProject',
	function ($resource, ApiProject) {

		return $resource(ApiProject + '/:id', {
			id: '@proj'
		}, {
			/**
			 * Saves any changes to name or description.
			 * ```
			 * project.$update()
			 *   .then(function (project) {...});
			 * ```
			 * @ngdoc method
			 * @name Project#$update
			 * @return {Promise} Promise that resolves, if the request was succesful.
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Get all projects the current user is involved to.
		 * ```
		 * Project.query().$promise
		 *   .then(function (projects) {...});
		 * ```
		 * @ngdoc method
		 * @name Project#query
		 * @return {Array<Resource>} Array of all projects, each a Resource object.
		 */

		/**
		 * Get project by id.
		 * ```
		 * Project.get({ id: <id> }).$promise
		 *   .then(function (project) {...});
		 * ```
		 * @ngdoc method
		 * @name Project#get
		 * @param id {Object} Object with project id
		 * @return {Resource} Project as Resource object.
		 */

		/**
		 * Create a new project.
		 * ```
		 * Project.save({
		 *   name: <string>,
		 *   description: <string>  // (optional)
		 * }).$promise
		 *   .then(function (project) {...});
		 * ```
		 * @ngdoc method
		 * @name Project#save
		 * @param data {Object} Object with data
		 * @return {Resource} Saved project as Resource object.
		 */

		/**
		 * Delete project and all its files and entries from database.
		 * ```
		 * project.$delete().then(...);
		 * ```
		 * @ngdoc method
		 * @name Project#$delete
		 * @return {Promise} Promise that resolves, if the request was succesful.
		 */

	}
])

/**
 * Directive displaying all projects of the user.
 * @ngdoc directive
 * @name projectList
 * @module dokuvis.projects
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires Project
 * @requires Utilities
 * @requires ConfirmDialog
 */
.directive('projectList', ['$window', '$state', 'Project', 'Utilities', 'ConfirmDialog',
	function ($window, $state, Project, Utilities, ConfirmDialog) {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.projects/projectList.tpl.html',
			scope: {},
			link: function (scope) {

				scope.projects = [];

				function queryProjects() {
					Project.query().$promise
						.then(function (results) {
							scope.projects = results;
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Project.query', reason);
						});
				}

				scope.openProject = function (prj) {
					var url = $state.href('project.home', { project: prj, subproject: 'master'});
					$window.open(url, '_blank');
				};

				scope.deleteProject = function(p) {

					console.log('delete ', p);

					ConfirmDialog({
						// headerText: $translate('project_delete'),
						// bodyText: $translate('project_delete_question', { proj_name: p.name })
						headerText: 'Projekt löschen',
						bodyText: 'Soll Projekt ' + p.name + ' wirklich gelöscht werden?'
					}).then(function () {
						p.$delete()
							.then(function(response) {
								console.log(response);
								queryProjects();
							})
							.catch(function(err) {
								Utilities.throwApiException('Project#delete', err);
							});
					});
				};

				// init
				queryProjects();

				// listen to projectsUpdate event
				scope.$on('projectsUpdate', function () {
					queryProjects();
				});
			}
		};

	}
])

/**
 * Modal controller for creating or editing projects.
 * @ngdoc controller
 * @name projectModalCtrl
 * @module dokuvis.projects
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Project
 * @requires Utilities
 */
.controller('projectModalCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'Project', 'Utilities',
	function ($scope, $rootScope, $state, $stateParams, Project, Utilities) {

		$scope.project = {
			name: '',
			description: ''
		};

		function getProject() {
			Project.get({ id: $stateParams.projectId }).$promise
				.then(function (result) {
					$scope.project = result;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Project.get', reason);
				});
		}

		if ($stateParams.projectId === 'new')
			$scope.title = 'project_new';
		else {
			$scope.title = 'project_edit';
			getProject();
		}

		/**
		 * Saves input data by either creating a new project or updating database entries.
		 * @ngdoc method
		 * @name projectModalCtrl#save
		 */
		$scope.save = function () {
			if (!$scope.project.name.length) {
				Utilities.dangerAlert('Geben sie dem Projekt einen Namen!');
				return;
			}

			if ($stateParams.projectId !== 'new') {
				$scope.project.$update()
					.then(function () {
						projectsUpdate($scope.project);
						$scope.close();
					})
					.catch(function (err) {
						Utilities.throwApiException('#Project.update', err);
					});
			}
			else {
				Project.save( $scope.project ).$promise
					.then(function(result) {
						console.log(result);
						projectsUpdate(result);
						$scope.close();
					})
					.catch(function(err) {
						Utilities.throwApiException('#Project.save', err);
					});
			}
		};

		/**
		 * Event that gets fired, when a new project has been created, an exiting one has been updated, or a project has been deleted.
		 * @ngdoc event
		 * @name projectModalCtrl#projectsUpdate
		 * @eventType broadcast on $rootScope
		 * @param project {Project=} New or updated project entry.
		 */
		function projectsUpdate(project) {
			$rootScope.$broadcast('projectsUpdate', project);
		}

		/**
		 * Close the modal and go to parent state.
		 * @ngdoc method
		 * @name projectModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^');
		};

	}
])

/**
 * Resolver: Check, if project exists and user is granted to access.
 *
 * @ngdoc factory
 * @name ProjectResolve
 * @module dokuvis.projects
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires Project
 * @requires https://github.com/mikemclin/angular-acl AclService
 */
.factory('ProjectResolve', ['$q', '$state', '$rootScope', 'Project', 'AclService',
	function ($q, $state, $rootScope, Project, AclService) {
		return function (params) {

			return Project.get({ id: params.project }).$promise
				.then(function (result) {

					if (result.status === 'NO_ENTRY') {

						$state.go('projectlist');
						return $q.reject(result.status);

					}

					$rootScope.userRole = result.role;

					AclService.attachRole('visitor');
					if (result.role === 'superadmin') {
						AclService.attachRole('superadmin');
						AclService.attachRole('admin');
						AclService.attachRole('historian');
						AclService.attachRole('modeler');
					}
					else if (result.role === 'admin')
						AclService.attachRole('admin');
					else if (result.role === 'historian')
						AclService.attachRole('historian');
					else if (result.role === 'modeler')
						AclService.attachRole('modeler');

					console.log(AclService.getRoles());
				})
				.catch(function (err) {
					console.error('API Exception on Project.get()', err);
					return $q.reject(err);
				});

		};
	}
]);
