angular.module('dokuvisApp').controller('projectModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Utilities', 'Project',
	/**
	 * Modal controller for creating or editing projects
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name projectModalCtrl
	 * @author Brakebein
	 * @param $scope {$scope} controller scope
	 * @param $state {$state} ui.router state
	 * @param $stateParams {$stateParams} ui.router stateParams
	 * @param $timeout {$timeout} Angular timeout
	 * @param Utilities {Utilities} Utilities
	 * @param Project {Project} Project http
	 */
	function ($scope, $state, $stateParams, $timeout, Utilities, Project) {

		if($state.includes('project.home.subproject.edit')) $scope.title = 'Projekt editieren';
		else $scope.title = 'Neues Projekt';
		$scope.name = $stateParams.name || '';
		$scope.desc = $stateParams.desc || '';

		$scope.save = function () {
			if(!$scope.name.length) {
				Utilities.dangerAlert('Geben sie dem Projekt einen Namen!');
				return;
			}
			
			if($stateParams.pId) {
				Project.update($stateParams.pId, $scope.name, $scope.desc).then(function () {
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Project.update()', err);
				});
			}
			else {
				Project.create($scope.name, $scope.desc).then(function() {
					$scope.close();
				}, function(err) {
					Utilities.throwApiException('on Project.create()', err);
				});
			}
		};

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		});

		// closing
		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^.^');
		};
		
	}]);
