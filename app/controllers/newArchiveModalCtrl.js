angular.module('dokuvisApp').controller('newArchiveModalCtrl', ['$scope', '$state', 'Archive', 'Utilities', '$translatePartialLoader',
	/**
     * This controller handles the modal to enter a new archive to the system.
     * @memberof dokuvisApp
     * @ngdoc controller
     * @name newArchiveModalCtrl
     * @author Brakebein
     * @param $scope {$scope} controller scope
     * @param $state {$state} ui.router state
     * @param Archive {Archive} $resource Archive
     * @param Utilities {Utilities} Utilities
     * @param $translatePartialLoader {$translatePartialLoader} service to load translations
     */
    function($scope, $state, Archive, Utilities, $translatePartialLoader) {

        $translatePartialLoader.addPart('archive');

        $scope.title = 'archive_modal_title';
        $scope.archive = {
            institution: '',
            institutionAbbr: '',
            collection: ''
        };

        /**
         * Saves the input data by either creating new (or updating) nodes
         * @memberof newArchiveModalCtrl
         * @function save
         */
        $scope.save = function() {

            if(!$scope.archive.institution.length) {
                Utilities.dangerAlert('Geben Sie der Institution einen Namen!');
                return;
            }
            if(!$scope.archive.collection.length) {
                Utilities.dangerAlert('Geben Sie der Kollektion einen Namen!');
                return;
            }
            
            Archive.save({
                name: $scope.archive.institution,
                abbr: $scope.archive.institutionAbbr,
                coll: $scope.archive.collection
            }).$promise.then(function () {
                $scope.close();
            }, function (err) {
                Utilities.throwApiException('on Archive.save()', err);
            });
            
        };

        /**
         * Closes the modal and destroys the scope
         * @memberof newArchiveModalCtrl
         * @function close
         */
        $scope.close = function () {
            this.$hide();
            this.$destroy();
            $state.go('^');
        };

        $scope.$on('$stateChangeSuccess', function () {
            $timeout(function () {
                $scope.$hide();
                $scope.$destroy();
            });
        });
        
    }]);
