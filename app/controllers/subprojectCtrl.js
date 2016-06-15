angular.module('dokuvisApp').controller('subprojectCtrl', ['$scope', '$state', '$stateParams', 'Utilities', '$timeout', 'Subproject',
	function($scope, $state, $stateParams, Utilities, $timeout, Subproject) {

		console.log($state);
		$scope.name = $stateParams.name || '';
		$scope.desc = $stateParams.desc || '';
		
		$scope.save = function () {
			if(!$scope.name.length) {
				Utilities.dangerAlert('Keinen Namen angegeben!');
				return;
			}

			if($stateParams.subId) {
				Subproject.change($stateParams.subId, $scope.name, $scope.desc).then(function () {
					console.log('subproject changed');
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Subproject.change()', err);
				});
			}
			else {
				Subproject.create($scope.name, $scope.desc).then(function () {
					console.log('subproject created');
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
