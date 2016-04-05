angular.module('dokuvisApp').controller('projHomeCtrl', ['$scope', '$stateParams', 'APIRequest', 'neo4jRequest', 'Utilities',
    function($scope, $stateParams, APIRequest, neo4jRequest, Utilities) {

        $scope.isMaster = $stateParams.subproject === 'master' ? true : false;

        $scope.projInfo = {};

        $scope.editor = {};
        $scope.editor.input = '';
        $scope.editor.show = false;
        $scope.editor.edit = false;
        $scope.editor.editId = '';

        $scope.subprojects = [];

        $scope.newSubproj = {};
        $scope.newSubproj.title = '';
        $scope.newSubproj.desc = '';
        $scope.newSubproj.show = false;

        // init
        if($stateParams.subproject === 'master') {
            getProjectInfoFromTable();
            getAllSubprojects();
        }
        else
            getSubprojectInfo();
        getProjectInfoFromNodes();

        function getProjectInfoFromTable() {
            APIRequest.getProjectEntry($stateParams.project).then(function(response) {
                if(!response.data) { console.error('mysqlRequest failed on getProjectEntry()', response); return; }
                $scope.projInfo.name = response.data.name;
                $scope.projInfo.description = response.data.description;
            });
        }
        function getProjectInfoFromNodes() {
            neo4jRequest.getProjInfos($stateParams.project, $stateParams.subproject).then(function(response) {
                if(response.data.exception) { console.error('neo4jRequest Exception on getProjInfos()', response.data); return; }
                if(response.data) $scope.projInfo.notes = Utilities.cleanNeo4jData(response.data);
                console.log($scope.projInfo);
            });
        }
        function getSubprojectInfo() {
            neo4jRequest.getSubprojectInfo($stateParams.project, $stateParams.subproject).then(function(response) {
                if(response.data.exception) { console.error('neo4jRequest Exception on getSubprojectInfo()', response.data); return; }
                var cdata = Utilities.cleanNeo4jData(response.data)[0];
                $scope.projInfo.name = cdata.name;
                $scope.projInfo.description = cdata.desc;
                console.log(response.data);
            });
        }
        function getAllSubprojects() {
            neo4jRequest.getAllSubprojects($stateParams.project).then(function(response) {
                if(response.data.exception) { console.error('neo4jRequest Exception on getAllSubprojects()', response.data); return; }
                if(response.data) $scope.subprojects = Utilities.cleanNeo4jData(response.data);
                console.log($scope.subprojects);
            });
        }

        $scope.addProjInfo = function() {
            if($scope.editor.input.length === 0) return;
            neo4jRequest.addProjInfo($stateParams.project, $stateParams.subproject, $scope.editor.input).then(function(response){
                if(response.data.exception) { console.error('neo4jRequest Exception on addProjInfo()', response.data); return; }
                console.log(response.data);
                $scope.closeEditor();
                getProjectInfoFromNodes();
            });
        };
        $scope.editProjInfo = function() {
            neo4jRequest.editProjInfo($stateParams.project, $stateParams.subproject, $scope.editor.editId, $scope.editor.input).then(function(response){
                if(response.data.exception) { console.error('neo4jRequest Exception on editProjInfo()', response.data); return; }
                console.log(response.data);
                $scope.closeEditor();
                getProjectInfoFromNodes();
            });
        };
        $scope.removeProjInfo = function(id) {
            neo4jRequest.removeProjInfo($stateParams.project, $stateParams.subproject, id).then(function(response){
                if(response.data.exception) { console.error('neo4jRequest Exception on removeProjInfo()', response.data); return; }
                getProjectInfoFromNodes();
            });
        };

        $scope.swapInfoOrder = function(oldIndex, newIndex) {
            neo4jRequest.swapProjInfoOrder($stateParams.project, $stateParams.subproject, $scope.filteredInfos[oldIndex].id, $scope.filteredInfos[newIndex].id).then(function(response){
                if(response.data.exception) { console.error('neo4jRequest Exception on swapProjInfoOrder()', response.data); return; }
                getProjectInfoFromNodes();
            });
        };

        $scope.openEditor = function(editId, html) {
            if(editId) {
                $scope.editor.editId = editId;
                $scope.editor.edit = true;
                $scope.editor.input = html;
            }
            $scope.editor.show = true;
        };

        $scope.closeEditor = function() {
            $scope.editor.input = '';
            $scope.editor.show = false;
            $scope.editor.edit = false;
            $scope.editor.editId = '';
        };

        $scope.closeNewSubproj = function() {
            $scope.newSubproj.title = '';
            $scope.newSubproj.desc = '';
            $scope.newSubproj.show = false;
        };

        $scope.outputInput = function() {
            console.log($scope.editor.input);
        };

        // subprojects
        $scope.createSubproject = function() {
            if($scope.newSubproj.title.length === 0) return;
            neo4jRequest.createSubproject($stateParams.project, $scope.newSubproj.title, $scope.newSubproj.desc).then(function(response){
                if(response.data.exception) { console.error('neo4jRequest Exception on createSubproject()', response.data); return; }
                console.log(response.data);
                $scope.closeNewSubproj();
                getAllSubprojects();
            });
        };

    }]);