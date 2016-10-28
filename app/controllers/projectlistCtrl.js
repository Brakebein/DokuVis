angular.module('dokuvisApp').controller('projectlistCtrl', ['$scope', '$state', '$window', 'Utilities', 'Project', 'ConfirmService',
	/**
	 * Controller for view to list and organize all projects
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name projectlistCtrl
	 * @author Brakebein
	 * @param $scope {$scope} controller scope
	 * @param $state {$state} ui.router state
	 * @param $window {$window} Angular window service
	 * @param Utilities {Utilities} Utilities
	 * @param Project {Project} Project resource
	 * @param ConfirmService {ConfirmService} confirm dialog
	 */
	function($scope, $state, $window, Utilities, Project, ConfirmService) {
		
		// Initialisierung von Variablen
		/**
		 * Array of all available projects
		 * @var {Array} projects
		 * @memberof projectlistCtrl
		 */
		$scope.projects = [];
		
		function getAllProjects() {
			Project.query().$promise.then(function (result) {
				console.log(result);
				if(result instanceof Array)
					$scope.projects = result;
				else
					$scope.projects = [];
			}, function (err) {
				Utilities.throwApiException('on Project.query()', err);
			})
		}

		/**
		 * Open project in new tab
		 * @memberof projectlistCtrl
		 * @function openProject
		 * @param prj {string} project ID
		 */
		$scope.openProject = function (prj) {
			var url = $state.href('project.home', { project: prj, subproject: 'master'});
			$window.open(url, '_blank');
		};

		/**
		 * Initiate project deletion by confirming user interaction and calling API
		 * @memberof projectlistCtrl
		 * @function deleteProject
		 * @param p {Object} project details (id, name, etc.)
		 */
		$scope.deleteProject = function(p) {
			
			console.log('delete ', p);

			ConfirmService.showAlert({
				headerText: 'Projekt löschen',
				bodyText: 'Soll das Projekt <strong>' + p.name + '</strong> wirklich gelöscht werden? Sämtliche Daten gehen dabei verloren!'
			}).then(function () {
				p.$delete().then(function(response) {
					console.log(response);
					getAllProjects();
				}, function(err) {
					Utilities.throwApiException('on Project.delete()', err);
				});
			});
		};
		
		// oninit Funktionsaufrufe
		getAllProjects();

		$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
			if(fromState.name === 'projectlist.project.new' || fromState.name === 'projectlist.project.edit')
				getAllProjects();
		});
		
	}]);
