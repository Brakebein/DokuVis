angular.module('dokuvisApp').controller('projectCtrl', ['$scope', '$state', '$stateParams', '$window',
    function($scope, $state, $stateParams, $window) {

        console.log('projectCtrl init');

        console.log($stateParams);

        $scope.project = $stateParams.project;

        $scope.toProjectList = function() {
            var url = $state.href('projectlist');
            $window.open(url, '_blank');
        };

        $scope.$on('modal.show', function(){
            console.log('modal show')
            var zIndex = 1040 + (10 * $('.modal:visible').length);
            $(this).css('z-index', zIndex);
            $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
        });

    }]);