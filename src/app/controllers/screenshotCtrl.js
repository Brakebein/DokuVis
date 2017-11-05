angular.module('dokuvisApp').controller('screenshotCtrl', ['$scope', '$stateParams', '$q', 'phpRequest', 'neo4jRequest', 'Utilities', '$timeout', '$alert',
    function($scope, $stateParams, $q, phpRequest, neo4jRequest, Utilities, $timeout, $alert) {

        console.log('screenshotDetailCtrl init');

        $scope.params = $scope.$parent.$parent.modalParams;
        $scope.showInputfields = 'false';
        console.log($scope.params);

        $scope.activeBtn = 'comment';

        $scope.scMode = 'marker';

        $scope.screenshotTitle = '';

        $scope.imgWidth = $scope.params.data.width;
        $scope.imgHeight = $scope.params.data.height;
        $scope.borderSize = 2;

        $timeout(function() {
            resizeModal();
        });

        $scope.paintOptions = {
            width: $scope.params.data.drawing ? $scope.params.data.drawing.width : $scope.imgWidth,
            height: $scope.params.data.drawing ? $scope.params.data.drawing.height : $scope.imgHeight,
            opacity: 1.0,
            color: 'rgba(255,255,0,1.0)', //'#ff0',
            backgroundColor: 'rgba(255,255,255,0.0)',
            lineWidth: 3,
            undo: true,
            imageSrc: $scope.params.data.drawing ? 'data/' + $scope.params.data.drawing.path + $scope.params.data.drawing.file : false
        };

        $scope.markers = [];
        var isExisting = false;

        if(!$scope.params.data.dataUrl) {
            $scope.params.data.dataUrl = 'data/' + $scope.params.data.path + $scope.params.data.file;
            isExisting = true;
        }

        if($scope.params.data.markers) {
            for(var i=0; i<$scope.params.data.markers.length; i++) {
                var m = $scope.params.data.markers[i];
                $scope.markers.push({
                    id: m.id,
                    u: m.u,
                    v: m.v,
                    comment: m.comment,
                    subprj: m.subprj,
                    isInserted: true,
                    styleMarker: {'width': 30, 'height': 30, 'left': m.u*$scope.imgWidth-15, 'top': m.v*$scope.imgHeight-30}
                });
            }
        }


        $scope.setMarker = function(event) {
            //console.log(event);
            if(event.target != event.delegateTarget || event.button !== 0) return;

            var tid = Utilities.getUniqueId();
            var offsetX = event.offsetX || event.originalEvent.layerX;
            var offsetY = event.offsetY || event.originalEvent.layerY;

            $scope.markers.push({
                id: tid+'_screenshotMarker',
                u: offsetX / $scope.imgWidth,
                v: offsetY / $scope.imgHeight,
                styleMarker: {'width': 30, 'height': 30, 'left': offsetX-16, 'top': offsetY-30},
                comment: '',
                taskID: '',
                isInserted: false,
                activeBtn: 'comment',
                editor: '',
                to: '',
                from: '',
                taskName: '',
            });

            console.log($scope.markers);

            $timeout(function() {
                $scope.setFocusOnComment($scope.markers.length-1);
            });

        };

        /* $scope.changeMarkerStatus = function (id, status){
         $.each($scope.markers, function(indexM){
         if($scope.markers[indexM].id==id ){
         $scope.markers[indexM].activeBtn = status;
         return false;
         }
         })
         } */

        $scope.saveScreenshot = function () {
            var tid = Utilities.getUniqueId();
            if(isExisting) {
                // sammle neue Marker und füge sie dem Screenshot an
                var newMarkers = [];
                for(var i=0; i<$scope.markers.length; i++) {
                    if(!$scope.markers[i].isInserted)
                        newMarkers.push($scope.markers[i]);
                }
                if(newMarkers.length < 1) {
                    $scope.$parent.closeOverlayPanel();
                    return;
                }
                neo4jRequest.insertScreenshotMarkers($scope.$parent.project, $scope.params, newMarkers).then(function(response){
                    if(response.data.exception) { Utilities.throwNeo4jException('on insertScreenshotMarkers()', response); return; }
                    $scope.$parent.$parent.closeModal('screenshot');
                    $scope.$parent.$hide();
                });

            }
            else {
                // speichere Screenshot und füge komplett neue Nodes ein
                if($scope.screenshotTitle.length < 1) {
                    Utilities.dangerAlert('Geben sie dem Screenshot einen Titel!');
                    return;
                }

                var paintDataUrl = $('#pwCanvasMain')[0].toDataURL("image/png");
                var paintFilename = Utilities.getUniqueId() + '_paint.png';

                phpRequest.saveBase64Image($scope.params.data.path, $scope.params.data.filename, $scope.params.data.dataUrl, true)
                    .then(function(response){
                        if(response.data !== 'SUCCESS') {
                            Utilities.throwException('PHP Exception', 'on saveBase64Image() Screenshot', response);
                            return $q.reject();
                        }
                        return phpRequest.saveBase64Image($scope.params.data.path, paintFilename, paintDataUrl, false);
                    })
                    .then(function(response){
                        if(response.data !== 'SUCCESS') {
                            Utilities.throwException('PHP Exception', 'on saveBase64Image() Painting', response);
                            return $q.reject();
                        }
                        return neo4jRequest.insertScreenshot($stateParams.project, $stateParams.subproject, $scope.params.data, $scope.markers, $scope.screenshotTitle, paintFilename);
                    })
                    .then(function(response){
                        if(response.data.exception) { Utilities.throwNeo4jException('on insertScreenshot()', response); return; }
                        if(response.data.data.length === 0) {Utilities.throwNeo4jException('no screenshot inserted', response); return; }
                        console.log(response.data);
                        $scope.$parent.$parent.closeModal('screenshot');
                        $scope.$parent.$hide();
                    });


                $.each($scope.markers,function(indexN){ //marker durchgehen und entweder Kommentar an Aufgabe hängen oder neue Aufgabe einfügen
                    //Kommentar einfügen
                    console.log($scope.markers[indexN].taskID,$scope.markers[indexN].comment);

                    if($scope.markers[indexN].activeBtn == 'comment'){
                        if($scope.markers[indexN]!= ''){
                            neo4jRequest.addCommentToTask($scope.$parent.project,$scope.markers[indexN].taskID,$scope.markers[indexN].comment).success(function(data, status){
                                console.log(data, 'neo4j comment inserted');
                                if(data.exception == 'SyntaxException') {
                                    console.error('ERROR: Neo4j SyntaxException');
                                }
                            });
                        }
                    }

                    else{
                        //Aufgabe einfügen
                        console.log('taskID' + $scope.markers[indexN].taskID)
                        if($scope.markers[indexN].taskID == ''){
                            //Wenn Masterprojekt, Aufgabe an ausgewähltes Subprojekt anhängen

                            if($stateParams.subproject == 'master'){
                                neo4jRequest.addTask($stateParams.project, $scope.markers[indexN].subprj, tid, $scope.markers[indexN].taskName, $scope.markers[indexN].comment,$scope.markers[indexN].editor
                                    , Utilities.getFormattedDate($scope.markers[indexN].from), Utilities.getFormattedDate($scope.markers[indexN].to),'priority_high', 'status_todo')
                                    .then(function(response){
                                        console.log(response.data);
                                    })
                            }
                            //andernfalls an aktives Subprojekt
                            else{
                                neo4jRequest.addTask($stateParams.project, $stateParams.subproject, tid, $scope.markers[indexN].taskName, $scope.markers[indexN].comment,$scope.markers[indexN].editor
                                    , Utilities.getFormattedDate($scope.markers[indexN].from), Utilities.getFormattedDate($scope.markers[indexN].to),'priority_high', 'status_todo')
                                    .then(function(response){
                                        console.log(response.data);
                                    })
                            }
                        }
                        else{ //als Unteaufgabe an Aufgabe anhängen
                            neo4jRequest.addTask($stateParams.project, $scope.markers[indexN].taskID, tid, $scope.markers[indexN].taskName, $scope.markers[indexN].comment,$scope.markers[indexN].editor
                                , Utilities.getFormattedDate($scope.markers[indexN].from), Utilities.getFormattedDate($scope.markers[indexN].to),'priority_high', 'status_todo')
                                .then(function(response){
                                    console.log(response.data);
                                })
                        }

                    }
                });
            }
        };



        $scope.setFocusOnComment = function(m) {
            var index = (typeof m === 'number') ? m : $scope.markers.indexOf(m);
            if(index > -1)
                $('#markerComment'+index).focus();
        };

        $scope.updateMarker = function(position, marker) {
            //console.log('updateMarker', position, marker);
            if(marker) {
                marker.u = (position.left + 15) / $scope.imgWidth;
                marker.v = (position.top + 30) / $scope.imgHeight;
            }
        };

        $scope.deleteMarker = function(m) {
            var index = (typeof m === 'number') ? m : $scope.markers.indexOf(m);
            if(index > -1)
                $scope.markers.splice(index, 1);
            $scope.$apply();
        };

        $scope.undoPaint = function() {

            $scope.undoVersion--;
        };

        $scope.abort = function() {
            // TODO nur bei Änderungen fragen
            var scope = $scope.$new();
            scope.clickOk = function() { $scope.$parent.$hide(); };
            $alert({
                templateUrl: 'partials/alerts/abort.html',
                type: 'warning',
                title: 'Nicht gespeichert',
                content: 'Ohne speichern verlassen?',
                backdrop: 'static',
                scope: scope
            });
        };

        $(window).bind('resize', resizeModal);
        function resizeModal() {
            console.log('resizeModal');
            var mbody = $('.screenshotDetail')[0];

            $scope.imgWidth = $scope.params.data.width;
            $scope.imgHeight = $scope.params.data.height;

            if(mbody.offsetWidth - 30 - $scope.params.data.width < 400) {
                $scope.imgWidth = mbody.offsetWidth - 30 - 400;
                $scope.imgHeight = $scope.imgWidth * $scope.params.data.height / $scope.params.data.width;
            }
            if(mbody.offsetHeight - 30 - $scope.params.data.height < 75 && mbody.offsetHeight - 30 - $scope.imgHeight < 75) {
                $scope.imgHeight = mbody.offsetHeight - 30 - 75;
                $scope.imgWidth = $scope.imgHeight * $scope.params.data.width / $scope.params.data.height;
            }

            for(var i=0; i<$scope.markers.length; i++) {
                $scope.markers[i].styleMarker.left = $scope.markers[i].u * $scope.imgWidth - 15;
                $scope.markers[i].styleMarker.top = $scope.markers[i].v * $scope.imgHeight - 30;
            }
            $scope.$applyAsync();
        }

    }]);