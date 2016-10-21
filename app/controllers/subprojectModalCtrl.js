angular.module('dokuvisApp').controller('subprojectModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Utilities', 'Subproject',
	/**
	 * Modal controller for creating or editing subprojects
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name subprojectModalCtrl
	 * @author Brakebein
	 * @param $scope {$scope} controller scope
	 * @param $state {$state} ui.router state
	 * @param $stateParams {$stateParams} ui.router stateParams
	 * @param $timeout {$timeout} Angular timeout
	 * @param Utilities {Utilities} Utilities
	 * @param Subproject {Subproject} Subproject http
	 */
	function($scope, $state, $stateParams, $timeout, Utilities, Subproject) {

		//console.log($state);
		if($state.includes('project.home.subproject.edit')) $scope.title = 'Unterprojekt editieren';
		else $scope.title = 'Neues Unterprojekt';
		$scope.name = $stateParams.name || '';
		$scope.desc = $stateParams.desc || '';
		
		$scope.save = function () {
			if(!$scope.name.length) {
				Utilities.dangerAlert('Keinen Namen angegeben!');
				return;
			}

			if($stateParams.subId) {
				Subproject.update($stateParams.subId, $scope.name, $scope.desc).then(function () {
					//console.log('subproject changed');
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Subproject.change()', err);
				});
			}
			else {
				Subproject.create($scope.name, $scope.desc).then(function () {
					//console.log('subproject created');
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Subproject.create()', err);
				});
			}
		};
		
		$scope.$on('$stateChangeSuccess', function (event, toState, toParams) {
			//console.log('source state changed', toParams);
			$timeout(function () {
				//$scope.close();
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
