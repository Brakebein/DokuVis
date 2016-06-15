angular.module('dokuvisApp').controller('projectlistCtrl', ['$scope', '$state', '$window', 'mysqlRequest', 'Utilities', 'AuthenticationFactory', 'Project', 'ConfirmService',
	function($scope, $state, $window, mysqlRequest, Utilities, AuthenticationFactory, Project, ConfirmService) {
		
		// TODO: index.config und blacklist.txt in Projektordner verschieben beim Anlegen
		
		// Initialisierung von Variablen
		$scope.projects = [];
				
		$scope.newProject = new Object();
		$scope.newProject.name = '';
		$scope.newProject.nameError = false;
		$scope.newProject.description = '';
		
		$scope.getAllProjects = function() {
			Project.getAll().then(function(response){
				console.log(response);
				if(response.data instanceof Array)
					$scope.projects = response.data;
				else
					$scope.projects = [];
			}, function(err) {
				Utilities.throwApiException('on getAllProjects()', err);
			});
		};
		
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
				$scope.getAllProjects();
			}, function(err) {
				Utilities.throwApiException('on createProject()', err);
			});
		};
		
		$scope.openProject = function (prj) {
			var url = $state.href('project.home', { project: prj, subproject: 'master'});
			$window.open(url, '_blank');
		};
		
		$scope.deleteProject = function(p) {
			
			console.log('delete ', p);

			ConfirmService.showAlert({
				headerText: 'Projekt löschen',
				bodyText: 'Soll das Projekt <strong>' + p.name + '</strong> wirklich gelöscht werden? Sämtliche Daten gehen dabei verloren!'
			}).then(function () {
				Project.delete(p.proj).then(function(response) {
					console.log(response);
					$scope.getAllProjects();
				}, function(err) {
					Utilities.throwApiException('on deleteProject()', err);
				});
			});
		};
		
		$scope.updateProjectDescription = function(data,id) {
			mysqlRequest.updateProjectDescription(data,id)
				.then(function(response){
					if(response.data != 'SUCCESS') {
						console.error(response.data);
						return;
					}
					$scope.getAllProjects();
				});
		};
		
		// oninit Funktionsaufrufe
		$scope.getAllProjects();
		
		
	}]);