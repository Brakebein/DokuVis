angular.module('dokuvisApp').controller('projectCtrl', ['$scope', '$state', '$window', 'UserAuthFactory',
    function($scope, $state, $window, UserAuthFactory) {

        $scope.toProjectList = function() {
            var url = $state.href('root.projectlist');
            $window.open(url, '_blank');
        };

		$scope.logout = function() {
			UserAuthFactory.logout();
			$state.go('root.home', {}, { reload: true });
		};

        $scope.$on('$stateChangeSuccess', function (event, toState) {
            if (/^project.home/.test(toState.name))
                $scope.pageName = 'menu_home';
            else if (/^project.explorer/.test(toState.name))
                $scope.pageName = 'menu_explorer';
            else if (/^project.tasks/.test(toState.name))
                $scope.pageName = 'menu_tasks';
            else if (/^project.resources/.test(toState.name))
                $scope.pageName = 'menu_resources';
            else if (/^project.config/.test(toState.name))
                $scope.pageName = 'menu_config';
            else
                $scope.pageName = '?';
		});

    }]);
