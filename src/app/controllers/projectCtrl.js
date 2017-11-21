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

        $scope.$on('modal.show', function(){
            console.log('modal show');
            var zIndex = 1040 + (10 * $('.modal:visible').length);
            $(this).css('z-index', zIndex);
            $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
        });

        $scope.$on('$stateChangeSuccess', function (event, toState) {
            if (/^project.home/.test(toState.name))
                $scope.pageName = 'Home';
            else if (/^project.explorer/.test(toState.name))
                $scope.pageName = 'Explorer';
            else if (/^project.tasks/.test(toState.name))
                $scope.pageName = 'Aufgaben';
            else if (/^project.resources/.test(toState.name))
                $scope.pageName = 'Ressourcen';
            else if (/^project.config/.test(toState.name))
                $scope.pageName = 'Einstellungen';
            else
                $scope.pageName = '?';
		});

        // language
        $scope.languagePopover = {
            title: 'Sprache',
            templateUrl: 'partials/popovers/languageConfig.html',
            html: true
        };

    }]);
