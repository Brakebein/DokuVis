angular.module('dokuvisApp').controller('configCtrl', ['$scope', '$stateParams', 'Staff', 'Utilities', '$translatePartialLoader',
    function($scope, $stateParams, Staff, Utilities, $translatePartialLoader) {

        $translatePartialLoader.addPart('config');

        $scope.staff = [];

        function queryStaff() {
            Staff.query().$promise.then(function (result) {
                $scope.staff = result;
                console.log(result);
            }, function (err) {
                Utilities.throwApiException('on Staff.query()', err); 
            });
        }
        
        $scope.removeStaff = function () {
            console.log('Nothing happens yet');
        };
        
        // TODO: Rolle des Mitarbeiters ändern
        
        // init
        queryStaff();

        $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
            if(fromState.name === 'project.config.staffedit')
                queryStaff();
        });

    }]);
