/**
 * This controller handles the modal to enter a new archive to the system.
 *
 * @ngdoc controller
 * @name newArchiveModalCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires Archive
 * @requires Utilities
 */
angular.module('dokuvisApp').controller('newArchiveModalCtrl', ['$scope', '$state', '$timeout', 'Archive', 'Utilities',
    function ($scope, $state, $timeout, Archive, Utilities) {

		/**
         * Title translation id
         * @ngdoc property
         * @name newArchiveModalCtrl#title
         * @type {string}
         */
        $scope.title = 'archive_modal_title';
		/**
         * Model for input fields
         * ```
         * {
         *   institution: 'string',
         *   institutionAbbr: 'string',
         *   collection: 'string'
         * }
         * ```
         * @ngdoc property
         * @name newArchiveModalCtrl#archive
         * @type {Object}
         */
        $scope.archive = {
            institution: '',
            institutionAbbr: '',
            collection: ''
        };

        /**
         * Saves the input data by either creating new or updating nodes.
         * @ngdoc method
         * @name newArchiveModalCtrl#save
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
         * Closes the modal and destroys the scope.
         * @ngdoc method
         * @name newArchiveModalCtrl#close
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
