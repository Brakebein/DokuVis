angular.module('dokuvisApp').controller('projectlistCtrl', ['$scope', 'mysqlRequest', 'Utilities', 'AuthenticationFactory', 'Project',
	function($scope, mysqlRequest, Utilities, AuthenticationFactory, Project) {
		
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
		
		$scope.deleteProject = function(prj) {
			
			console.log('delete '+prj);
			
			Project.delete(prj).then(function(response) {
				console.log(response);
				$scope.getAllProjects();
			}, function(err) {
				Utilities.throwApiException('on deleteProject()', err);
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