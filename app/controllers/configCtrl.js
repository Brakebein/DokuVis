/**
 * Controller for configuration view.
 * @ngdoc controller
 * @module dokuvisApp
 * @name configCtrl
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires Staff
 * @requires Utilities
 * @requires https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translatePartialLoader $translatePartialLoader
 */
angular.module('dokuvisApp').controller('configCtrl', ['$scope', 'Staff', 'Utilities', '$translatePartialLoader',
    function($scope, Staff, Utilities, $translatePartialLoader) {

        $translatePartialLoader.addPart('config');

		/**
         * Array of all project participants.
         * @ngdoc property
         * @name configCtrl#staff
		 * @type {Array}
		 */
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

        // listening to events
        $scope.$on('$staffUpdate', function () {
            queryStaff();
        });

    }]);
