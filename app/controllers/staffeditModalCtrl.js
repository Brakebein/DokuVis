angular.module('dokuvisApp').controller('staffeditModalCtrl', ['$scope', '$state', 'Staff', 'Utilities',
	function ($scope, $state, Staff, Utilities) {

		$scope.title = 'Mitarbeiter/Beobachter hinzufügen';
		
		$scope.user = '';
		$scope.role = 'visitor';
		
		$scope.save = function () {

			if(!$scope.user.length) {
				Utilities.dangerAlert('Geben sie dem Projekt einen Namen!');
				return;
			}
			
			Staff.save({ user: $scope.user, role: $scope.role }).$promise.then(function (result) {
				console.log(result);
				$scope.close();
			}, function(err) {
				if(err.data && typeof err.data.originalErr === 'string') var message = err.data.originalErr;
				else message = 'on Staff.save()';
				Utilities.throwApiException(message, err);
			});
			
		};
		
		function queryRoles() {
			Staff.queryRoles().$promise.then(function (results) {
				$scope.roles = results;
			}, function (err) {
				Utilities.throwApiException('on Staff.queryRoles()', err);
			});
		}

		// init
		queryRoles();

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		});

		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^');
		};
		
	}]);
