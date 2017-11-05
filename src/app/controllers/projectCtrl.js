angular.module('dokuvisApp').controller('projectCtrl', ['$scope', '$state', '$stateParams', '$window', 'UserAuthFactory',
    function($scope, $state, $stateParams, $window, UserAuthFactory) {

        $scope.project = $stateParams.project;

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

        // language
        $scope.languagePopover = {
            title: 'Sprache',
            templateUrl: 'partials/popovers/languageConfig.html',
            html: true
        };

    }]);
