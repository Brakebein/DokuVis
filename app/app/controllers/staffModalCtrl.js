angular.module('dokuvisApp').controller('staffModalCtrl', ['$scope', '$state', '$timeout', 'Staff', 'Utilities',
	function ($scope, $state, $timeout, Staff, Utilities) {

		$scope.title = 'Mitarbeiter/Beobachter hinzufügen';
		
		$scope.user = '';
		$scope.role = 'visitor';
		
		$scope.save = function () {

			if (!$scope.user.length) {
				Utilities.dangerAlert('Geben sie dem Projekt einen Namen!');
				return;
			}
			
			Staff.save({ user: $scope.user, role: $scope.role }).$promise
				.then(function (result) {
					console.log(result);
					staffUpdate();
					$scope.close();
				})
				.catch(function (err) {
					if (err.data && typeof err.data.originalErr === 'string') var message = err.data.originalErr;
					else message = '#Staff.save';
					Utilities.throwApiException(message, err);
				});
			
		};
		
		function queryRoles() {
			Staff.queryRoles().$promise
				.then(function (results) {
					$scope.roles = results;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Staff.queryRoles', err);
				});
		}

		// init
		queryRoles();

		function staffUpdate() {
			$scope.$root.$broadcast('staffUpdate');
		}

		$scope.close = function () {
			$state.go('^');
		};

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		});
		
	}]);
