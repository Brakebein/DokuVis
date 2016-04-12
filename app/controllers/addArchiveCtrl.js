angular.module('dokuvisApp').controller('addArchiveCtrl', ['$scope', '$stateParams', 'neo4jRequest',
    function($scope, $stateParams, neo4jRequest) {

        console.log('addArchiveCtrl init', $scope);

        $scope.archive = {};
        $scope.archive.institution = '';
        $scope.archive.institutionAbbr = '';
        $scope.archive.collection = '';

        $scope.addArchive = function() {

            if($scope.archive.institution.length < 1) {
                console.log('inst einfügen')
                return;
            }
            if($scope.archive.collection.length < 1) {
                console.log('coll einfügen')
                return;
            }

            neo4jRequest.addArchive($stateParams.project, $scope.archive.collection, $scope.archive.institution, $scope.archive.institutionAbbr).then(function(response){
                if(response.data.exception) { console.error('neo4j failed on addArchive()', response); return; }
                $scope.$parent.$parent.$parent.getArchives();
                $scope.$parent.$hide();
            });
        };
    }]);