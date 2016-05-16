angular.module('dokuvisApp').controller('configCtrl', ['$scope', '$stateParams', 'mysqlRequest', 'Utilities', 'neo4jRequest',
    function($scope, $stateParams, mysqlRequest, Utilities, neo4jRequest) {

        /*Mitarbeiter*/
        $scope.staffInGantt = [];
        $scope.newStaff = new Object();
        $scope.newStaff.sid = '';
        $scope.newStaff.name = '';
        $scope.newStaff.surname = '';
        $scope.newStaff.mail = '';
        $scope.newStaff.role = '';
        $scope.newStaff.projects = '';
        $scope.staffExists= false;
        $scope.staff = [];
        $scope.roles = [];


        $scope.getPid = function(){
            mysqlRequest.getProjectEntry($stateParams.project).then(function(response) {
                if(!response.data) { console.error('mysqlRequest failed on getProjectEntry()', response); return; }
                $scope.pid = response.data.pid;
                $scope.getAllStaff($scope.pid);
                console.log(response);
            });
        }

        $scope.getAllStaff = function(pid) {

            mysqlRequest.getAllStaff(pid).then(function(response){
                if(!response.data) { console.error('mysqlRequest failed on getAllStaff()', response); return; }
                $scope.staff = response.data;
                console.log($scope.staff);
            });
        };

        $scope.removeStaff = function(staffId,roleId) {
            mysqlRequest.removeStaff(staffId,roleId,$scope.pid).then(function(response){
                if(response.data != 'SUCCESS') {
                    console.error(response);
                    return;
                }
                console.log('Mitarbeiter gelöscht');
                $scope.getAllStaff($scope.pid);
            });
        };

        $scope.addNewStaffToProject = function() {
            var id = Utilities.getUniqueId();
            mysqlRequest.addNewStaff(id, $scope.newStaff.name, $scope.newStaff.surname, $scope.newStaff.mail, $scope.newStaff.role, $scope.pid).then(function(response){
                if(response.data != 'SUCCESS') {
                    console.error(response);
                    return;
                }
                $scope.getAllStaff($scope.pid);

                neo4jRequest.addStaffToGraph($stateParams.project, id, $scope.newStaff.name) .then(function(response){
                    console.log($scope.newStaff.name);
                    if(response.data.exception) { console.error('neo4jRequest Exception on addStaffToGraph()', response.data); return; }
                    if(response.data){
                        console.log('Bearbeiter hinzugefügt');
                        $scope.newStaff.name = '';
                        $scope.newStaff.surname = '';
                        $scope.newStaff.mail = '';
                        $scope.newStaff.role = '';
                    }

                });

                console.log($scope.staff);
            });
        }

        $scope.updateName = function(data,id) {
            mysqlRequest.updateName(data,id).success(function(answer, status){
                if(answer != 'SUCCESS') {
                    console.error(answer);
                    return;
                }
                $scope.getAllStaff();
            });
        }

        $scope.updateMail = function(data,id) {
            mysqlRequest.updateMail(data,id).success(function(answer, status){

                if(answer != 'SUCCESS') {
                    console.error(answer);
                    return;
                }
                $scope.getAllStaff();
            });
        }

        $scope.getAllRoles = function() {
            mysqlRequest.getAllRoles().then(function(response){
                if(!response.data) { console.error('mysqlRequest failed on getAllRoles()', response); return; }
                $scope.roles = response.data;
                console.log($scope.roles);
            });
        }

        $scope.getPid();
        $scope.getAllRoles();
        console.log($scope.staff);

    }]);