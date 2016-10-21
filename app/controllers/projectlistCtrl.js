angular.module('dokuvisApp').controller('projectlistCtrl', ['$scope', '$state', '$window', 'Utilities', 'AuthenticationFactory', 'Project', 'ConfirmService',
	/**
	 * Controller for view to list and organize all projects
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name projectlistCtrl
	 * @param $scope {$scope} controller scope
	 * @param $state {$state} ui.router state
	 * @param $window {$window} Angular window service
	 * @param Utilities {Utilities} Utilities
	 * @param AuthenticationFactory {AuthenticationFactory} AuthenticationFactory
	 * @param Project {Project} Project http
	 * @param ConfirmService {ConfirmService} confirm dialog
	 */
	function($scope, $state, $window, Utilities, AuthenticationFactory, Project, ConfirmService) {
		
		// Initialisierung von Variablen
		$scope.projects = [];
				
		$scope.newProject = {
			name: '',
			nameError: false,
			description: ''
		};
		
		function getAllProjects() {
			Project.getAll().then(function(response){
				console.log(response);
				if(response.data instanceof Array)
					$scope.projects = response.data;
				else
					$scope.projects = [];
			}, function(err) {
				Utilities.throwApiException('on getAllProjects()', err);
			});
		}

		/**
		 * Initiate project creation by checking input and calling API
		 * @memberof projectlistCtrl
		 * @function createNewProject
		 */
		$scope.createNewProject = function() {
			// Eingabe überprüfen
			if($scope.newProject.name.length < 1) {
				$scope.newProject.nameError = true;
				Utilities.dangerAlert('Geben sie dem Projekt einen Namen!');
				return;
			}
			else
				$scope.newProject.nameError = false;
				
			var tid = Utilities.getUniqueId();
			var prj = 'Proj_' + tid;
			
			console.log('create '+prj);
			
			Project.create(prj, $scope.newProject.name, $scope.newProject.description, AuthenticationFactory.user, AuthenticationFactory.userName).then(function(response) {
				console.log(response);
				$scope.newProject.name = '';
				$scope.newProject.description = '';
				getAllProjects();
			}, function(err) {
				Utilities.throwApiException('on createProject()', err);
			});
		};

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
				Project.delete(p.proj).then(function(response) {
					console.log(response);
					getAllProjects();
				}, function(err) {
					Utilities.throwApiException('on deleteProject()', err);
				});
			});
		};
		
		/*$scope.updateProjectDescription = function(data,id) {
			mysqlRequest.updateProjectDescription(data,id)
				.then(function(response){
					if(response.data != 'SUCCESS') {
						console.error(response.data);
						return;
					}
					getAllProjects();
				});
		};*/
		
		// oninit Funktionsaufrufe
		getAllProjects();

		$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
			if(fromState.name === 'projectlist.project.new' || fromState.name === 'projectlist.project.edit')
				getAllProjects();
		});
		
	}]);
