/**
 * Controller for view to list and organize all projects.
 *
 * @ngdoc controller
 * @name projectlistCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$window $window
 * @requires Utilities
 * @requires Project
 * @requires ConfirmService
 * @requires https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translate $translate
 */
angular.module('dokuvisApp').controller('projectlistCtrl', ['$scope', '$state', '$window', 'Utilities', 'Project', 'ConfirmService', '$translate',
	function ($scope, $state, $window, Utilities, Project, ConfirmService, $translate) {

		/**
		 * Array of all available projects.
		 * @ngdoc property
		 * @name projectlistCtrl#projects
		 * @type {Array}
		 */
		$scope.projects = [];

		function queryProjects() {
			Project.query().$promise
				.then(function (result) {
					console.log(result);
					if(result instanceof Array)
						$scope.projects = result;
					else
						$scope.projects = [];
				})
				.catch(function (err) {
					Utilities.throwApiException('Project#query', err);
				});
		}

		/**
		 * Open project in new tab.
		 * @ngdoc method
		 * @name projectlistCtrl#openProject
		 * @param prj {string} Project ID
		 */
		$scope.openProject = function (prj) {
			var url = $state.href('project.home', { project: prj, subproject: 'master'});
			$window.open(url, '_blank');
		};

		/**
		 * Initiate project deletion by confirming user interaction and calling API.
		 * @ngdoc method
		 * @name projectlistCtrl#deleteProject
		 * @param p {Object} Project Resource object
		 */
		$scope.deleteProject = function(p) {
			
			console.log('delete ', p);

			ConfirmService({
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

		// listening to events
		$scope.$on('projectsUpdate', function () {
			queryProjects();
		});
		
	}]);
