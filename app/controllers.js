var webglControllers = angular.module('webglControllers', ['uiSlider', 'angularFileUpload', 'pw.canvas-painter',
	'gantt',
	'gantt.table',
	'gantt.movable', 
	'gantt.tooltips',
	'gantt.sortable',
    'gantt.drawtask',
    'gantt.bounds',
    'gantt.progress',
    'gantt.tree',
    'gantt.groups',
    'gantt.overlap',
    'gantt.resizeSensor'
]);

app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});



webglControllers.controller('introCtrl', ['$scope', '$http',
	function($scope, $http) {
		
	}]);
	
webglControllers.controller('projectlistCtrl', ['$scope', '$http', '$q', 'phpRequest', 'mysqlRequest', 'neo4jRequest', 'Utilities',
	function($scope, $http, $q, phpRequest, mysqlRequest, neo4jRequest, Utilities) {
		
		// TODO: index.config und blacklist.txt in Projektordner verschieben beim Anlegen
		
		// Initialisierung von Variablen
		$scope.projects = [];
				
		$scope.newProject = new Object();
		$scope.newProject.name = '';
		$scope.newProject.nameError = false;
		$scope.newProject.description = '';
		
		$scope.getAllProjects = function() {
			mysqlRequest.getAllProjects().then(function(response){
				if(!response.data) { console.error('mysqlRequest failed on getAllProjects()', response); return; }
				console.log(response);
				$scope.projects = response.data;
			});
		};
		
		$scope.createNewProject = function() {
			if($scope.newProject.name == '') {
				$scope.newProject.nameError = true;
				return;
			}
			else
				$scope.newProject.nameError = false;
				
			var tid = Utilities.getUniqueId();
			var prj = 'Proj_' + tid;
			console.log('create '+prj);
			
			phpRequest.createProjectFolders(prj)
				.then(function(response){
					if(response.data !== 'SUCCESS') {
						console.error(response.data);
						return $q.reject();
					}
					return neo4jRequest.createInitProjectNodes(prj);
				})
				.then(function(response){
					console.log(response.data);
					return neo4jRequest.createProjectConstraint(prj);
				})
				.then(function(response){
					console.log(response.data);
					return mysqlRequest.newProjectEntry(prj, $scope.newProject.name, $scope.newProject.description);
				})
				.then(function(response){
					if(response.data !== 'SUCCESS') {
						console.error(response.data);
						return $q.reject();
					}
					$scope.newProject.name = '';
					$scope.newProject.description = '';
					$scope.getAllProjects();
				});
		};
		
		$scope.deleteProject = function(prj) {
			neo4jRequest.deleteAllProjectNodes(prj)
				.then(function(response){
					console.log(response.data);
					return neo4jRequest.dropProjectConstraint(prj);
				})
				.then(function(response){
					console.log(response.data);
					return phpRequest.deleteProjectFolders(prj);
				})
				.then(function(response){
					if(response.data !== 'SUCCESS') {
						console.error(response.data);
						return $q.reject();
					}
					return mysqlRequest.removeProjectEntry(prj);
				})
				.then(function(response){
					if(response.data !== 'SUCCESS') {
						console.error(response.data);
						return $q.reject();
					}
					console.warn('Projekt gelöscht');
					$scope.getAllProjects();
				});
		};
		
		$scope.updateProjectDescription = function(data,id) {
			mysqlRequest.updateProjectDescription(data,id)
				.then(function(response){
					if(response.data != 'SUCCESS') {
						console.error(response.data);
						return;
					}
					$scope.getAllProjects();
				});
		};
		
		// oninit Funktionsaufrufe
		$scope.getAllProjects();
		
		
	}]);

webglControllers.controller('projectCtrl', ['$scope', '$stateParams', '$document', '$timeout',
	function($scope, $stateParams, $document, $timeout) {
	
		console.log('projectCtrl init');
		
		console.log($stateParams);
	
		$scope.project = $stateParams.project;
		
		
		// TODO: Überprüfen, ob Nutzer Zugriff auf Projekt hat
		// Zugriffsrechte und Rolle auslesen
		
		// TODO: test if subproject exists, otherwise redirect to master
		
		$scope.$on('modal.show', function(){
			console.log('modal show')
			var zIndex = 1040 + (10 * $('.modal:visible').length);
			$(this).css('z-index', zIndex);
			$('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
		});
		
	}]);
	
webglControllers.controller('projHomeCtrl', ['$scope', '$stateParams', 'mysqlRequest', 'neo4jRequest', 'Utilities',
	function($scope, $stateParams, mysqlRequest, neo4jRequest, Utilities) {
		
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
			mysqlRequest.getProjectEntry($stateParams.project).then(function(response) {
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
	
webglControllers.controller('explorerCtrl', ['$scope', '$stateParams', '$timeout', '$sce', '$q', 'neo4jRequest', 'phpRequest', 'mysqlRequest', 'FileUploader', 'Utilities', 'webglInterface', '$modal',
	function($scope, $stateParams, $timeout, $sce, $q, neo4jRequest, phpRequest, mysqlRequest, FileUploader, Utilities, webglInterface, $modal) {

		// Initialisierung von Variablen
		$scope.project = $stateParams.project;
		
		$scope.wi = webglInterface;
		
		$scope.views = new Object();
		$scope.views.activeMain = '3dview';
		$scope.views.activeSide = 'objlist';
		// $scope.views.activeSide = 'comments';
		$scope.views.enhancedOptions = {};
		$scope.views.enhancedOptions.show = false;
		$scope.views.enhancedOptions.tab = 'display';
		
		$scope.overlayParams = {url: '', params: {}};
		
		$scope.alert = new Object();
		$scope.alert.showing = false;
		$scope.alert.message = '';
		
		// Einstellungen für Quellenanzeige
		$scope.sourcesSettings = new Object();
		$scope.sourcesSettings.listSize = 'normal';
		$scope.sourcesSettings.orderBy = 'title';
		$scope.sourcesSettings.reverse = false;
		$scope.sourcesSettings.filterBy = '';
		$scope.sourcesSettings.activeTab = '';
		
		$scope.sourceResults = [];
		
		// Liste mit Objekten (Outliner)
		$scope.listTabs = 'objects';
		//$scope.listSettings = 'layers';
		$scope.listSettings = 'hierarchy';
		
		// Screenshots, Aufgaben,KOmmentare
		$scope.screenshots = [];
		$scope.screenshotPins = {isVisible: false};
		$scope.comments = [];
		$scope.tasks = [];
		$scope.staff= [];
		$scope.markerNotes = '';
		$scope.editorsAndTasksArr = [];
		
		
		// webgl zeugs
		$scope.toggleSlice = false;
		$scope.toggleCut = false;
		
		$scope.unsafeSettings = new Object();
		$scope.unsafeSettings.opacity = 50;
		$scope.unsafeSettings.edges = true;
		$scope.unsafeSettings.autoTransparent = false;
		
		$scope.viewportSettings = new Object();
		
		$scope.sliceSettings = new Object();
		$scope.sliceSettings.enabled = false;
		$scope.sliceSettings.axisAlign = 'z-axis';
		$scope.sliceSettings.planePosition = 50;
		$scope.sliceSettings.showPlane = true;
		$scope.sliceSettings.showSliceFaces = true;
		
		
		$scope.coords = new Object();
		$scope.coords.x = $scope.coords.y = $scope.coords.z = 0;
		$scope.coords.xError = $scope.coords.yError = $scope.coords.zError = false;
		$scope.coords.enabled = false;
		
		$scope.constructionPhases = new Object();
		$scope.constructionPhases.select = 0;
		
		$scope.fellYear = new Object();
		$scope.fellYear = 0;
		
		$scope.position = new Object();
		$scope.position.minAge = 1250;
		$scope.position.maxAge = 1750;
		
		// scroll settings
		$scope.scrollConfig = {
			theme: 'dark',
			axis: 'y',
			scrollInertia: 500,
			advanced: { updateOnContentResize: false }
		};
		
		//Balken
		$scope.baulk = new Object();
		$scope.baulk.minAge = 1250;
		$scope.baulk.maxAge = 1750;
		
		//controls slider
		/*$scope.top = 35;
		$scope.left = 20;
		$scope.step = 50;
		$scope.width = 950;
		$scope.range = $scope.position.maxAge - $scope.position.minAge;*/
		
		$scope.colorMarkerArray = [];
		$scope.ramp = {
			start: [49,29,5],
			end: [249,226,189]
		};
		
		$scope.markerID = 0;
		
		$scope.lineThickness = {
			value : 5
			};
		
		$scope.lineColor = {
			value: "#ff0000"	
		};
		
		$scope.marksOpacity = 50;

		phpRequest.getSvgContent('img/plus-sign.svg').success(function(data, status) {
			console.log(data);
			$scope.plusSign = $sce.trustAsHtml(data);
		});
	
		//Aufgaben und Bearbeiter holen
		$scope.getStaffFromGraph = function(){
			neo4jRequest.getStaffFromProject ($stateParams.project).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on getAllTasks()', response.data); return; }
					 if(response.data){
						$scope.staff = Utilities.cleanNeo4jData(response.data)
						 console.log($scope.staff);
					 }
			});
			
		}
		$scope.getStaffFromGraph();
		
		$scope.getTasksFromGraph = function() {
			neo4jRequest.getAllTasks($stateParams.project).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on getAllTasks()', response.data); return; }
					 if(response.data){
						$scope.tasks = Utilities.cleanNeo4jData(response.data)
						 console.log($scope.tasks);
					 }
			});
		}
		$scope.getTasksFromGraph();
		
		$scope.getTasksFromEditors = function(markerObject,tasksFromEditor) {
			 markerObject.tid= '';
			 if(markerObject.editor != ''){
				  neo4jRequest.getTasksFromEditor ($stateParams.project,markerObject.editor).then(function(response){
						if(response.data.exception) {console.error('neo4jRequest Exception on getTasksfromStaff()', response.data); return; }
							 if(response.data){ 
								console.log(markerObject.editor); 
								$scope.tasksFromEditor = Utilities.cleanNeo4jData(response.data);
								console.log($scope.tasksFromEditor);
							 }
					})
			} 
		}

		/* $scope.editorsAndTasks = function(){
			console.log($scope.staff);
			$.each($scope.staff,function(indexS){
				
				getTasksFromEditors($scope.staff[indexS]);
				console.log($scope.staff[indexS]);
				$scope.editorsAndTasksArr.push({editor: $scope.staff[indexS], tasks: $scope.tasksFromEditor})
			})
			console.log($scope.editorsAndTasksArr);
		}
		$scope.editorsAndTasks(); */
		
		// Uploader für Quellen
		$scope.sourcesUploader = new FileUploader();
		
		$scope.sourcesUploader.filters.push({
			name: 'sourceFilter',
			fn: function(item, options) {
				var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|tiff|pdf|'.indexOf(type) !== -1;
			}
		});
        $scope.sourcesUploader.onWhenAddingFileFailed = function(item, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
			$scope.alert.message = 'Nicht unterstütztes Dateiformat';
			$scope.alert.showing = true;
        };
        $scope.sourcesUploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
			//$scope.openSourceTypeDialog();
			$scope.openInsertForm('source');
        };
		
		// Modal öffnen
		$scope.openInsertForm = function(type, attach) {
			var title;
			if(type === 'source') title = 'Quelle einfügen';
			else if(type === 'model') title = 'Modell einfügen';
			else if(type === 'zip') title = '3D-Plan hinzufügen';
			$scope.modalParams = {
				modalType: 'large',
				type: type,
				attachTo: attach || undefined,
				queue: $scope.sourcesUploader.queue
			};
			$modal({
				title: title,
				templateUrl: 'partials/modals/_modalTpl.html',
				contentTemplate: 'partials/modals/insertSourceModal.html',
				controller: 'insertSourceCtrl',
				scope: $scope,
				show: true
			});
		};
		$scope.openSourceTypeDialog = function() {
			$scope.overlayParams.url = 'partials/source_type.html';
		};
		$scope.openSourceDetail = function(index) {
			$scope.modalParams = {
				modalType: 'large',
				index: index
			};
			$modal({
				//title: 'Source Detail',
				templateUrl: 'partials/modals/_modalTpl.html',
				contentTemplate: 'partials/modals/sourceDetailModal.html',
				controller: 'sourceDetailCtrl',
				scope: $scope,
				show: true
			});
		};
		$scope.openScreenshotDetail = function(data) {
			alert('test');
			$scope.modalParams = {
				modalType: 'xlarge',
				data: data
			};
			$modal({
				//title: 'Source Detail',
				templateUrl: 'partials/modals/_modalTpl.html',
				contentTemplate: 'partials/modals/screenshotDetailModal.html',
				controller: 'screenshotDetailCtrl',
				scope: $scope,
				show: true
			});
		};
		$scope.openIndexEdit = function() {
			$scope.modalParams = {
				modalType: 'large'
			};
			$modal({
				title: 'Index editieren',
				templateUrl: 'partials/modals/_modalTpl.html',
				contentTemplate: 'partials/modals/indexEditModal.html',
				controller: 'indexEditCtrl',
				scope: $scope,
				show: true
			});
		};
				
		// close modal
		$scope.closeModal = function(update) {
			if(update === 'source')
				$scope.getAllDocuments();
			if(update === 'screenshot')
				$scope.getScreenshots();
			
			$scope.overlayParams.params = {}
			$scope.overlayParams.url = '';
			$scope.sourcesUploader.clearQueue();
		};
		$scope.updateList = function(type) {
			if(type == 'source')
				$scope.getAllDocuments();
			if(type == 'screenshot')
				$scope.getScreenshots();
		};
		
		$scope.loadMuristan = function() {
			neo4jRequest.getAllObj().success(function(data, status){
				
				var files = cleanData(data);
				//console.log(files);
				
				for(var i=0; i<files.length; i++) {
					$scope.callDirFunc.loadObjIntoScene('data/Proj_Muristan/models/', files[i].file);
				}
				//$scope.callDirFunc.loadObjIntoScene('data/Proj_Muristan/models/', '_komplett.obj');
			});
		}
		
		$scope.loadPlans = function() {
			neo4jRequest.getAllPlanObj().success(function(data, status){
			
				var files = cleanData(data);
				//console.log(files);
				
				for(var i=0; i<files.length; i++) {
					$scope.callDirFunc.loadPlanIntoScene('data/Proj_Muristan/plans/models/', files[i].file);
				}
			});
		}
		
		$scope.getAllPlans = function() {
			//neo4jRequest.getPlanFromObject('G_marhanna').success(function(data, status){
			neo4jRequest.getAllPlanData($scope.project).success(function(data, status){
				
				//console.log($scope.models);
				console.log(data, status);
				if(!data) { console.error('neo4jRequest failed'); return; }
				$scope.sourceResults = cleanData(data, true);
				console.log($scope.sourceResults);
				
				/*for(var i=0; i<files.length; i++) {
					$scope.callDirFunc.loadPlanIntoScene('data/Proj_Muristan/plans/models/', files[i].file);
				}*/
			});
		}
		
		// lädt alle Dokumente im Quellenbrowser
		$scope.getAllDocuments = function() {
			neo4jRequest.getAllDocuments($stateParams.project, $stateParams.subproject).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest failed on getAllDocuments()', response.data); return; }
				if(response.data) $scope.sourceResults = Utilities.cleanNeo4jData(response.data, true);
				console.log('Dokumente:', $scope.sourceResults);
			});
		};
		
		// lädt alle Screenshots in Liste
		$scope.getScreenshots = function() {
			neo4jRequest.getScreenshotsWithMarkers($scope.project).then(function(response){
				if(response.data.exception) { Utilities.throwNeo4jException('on getScreenshots()', response); return; }
				if(response.data) $scope.screenshots = Utilities.cleanNeo4jData(response.data);
				console.log('Screenshots:', $scope.screenshots);
			});
		};
		
		$scope.receiveScreenshot = function(data) {
			var tid = Utilities.getUniqueId();
			data.path = $stateParams.project + '/screenshots/';
			data.filename = tid + '_screenshot.jpg';
			
			//var data = $scope.callDirFunc.getScreenshot();
			
			$scope.openScreenshotDetail(data);
		};
		
		$scope.togglePins = function() {
			if($scope.screenshotPins.isVisible) {
				for(var i=0; i<$scope.screenshots.length; i++) {
					if($scope.screenshots[i].pin)
						webglInterface.callFunc.addPin($scope.screenshots[i].id, $scope.screenshots[i].pin);
				}
			}
			else
				webglInterface.callFunc.removePins();
		};
		
		$scope.open3DPlan = function(plan) {
			neo4jRequest.getAttached3DPlan($stateParams.project, plan.eid, plan.plan3d).success(function(data, status){
				
				//console.log($scope.models);
				//console.log(data, status);
				if(!data) { console.error('neo4jRequest failed'); return; }
				var edata = extractData(data)[0];
				console.log(edata);
				
				plan.plan3d = $scope.callDirFunc.loadCTMPlanIntoScene(plan.plan3d, edata.object, edata.file);
				console.log(plan);
			});
		};
		
		$scope.getPlansForObj = function() {
			neo4jRequest.getPlansFromObject($scope.selected.eid).success(function(data, status){
				
				$scope.sourceResults = cleanData(data);
				console.log($scope.sourceResults);
				
				/*for(var i=0; i<files.length; i++) {
					$scope.callDirFunc.loadPlanIntoScene('data/Proj_Muristan/plans/models/', files[i].file);
				}*/
			});
		}
		
		$scope.highlightObj = function(eid) {
			neo4jRequest.getObjFromPlan(eid).success(function(data, status){
			
				var files = cleanData(data);
				console.log(files);
				
				for(var i=0; i<files.length; i++) {
					$scope.callDirFunc.highlightObj(files[i].eid);
				}
			});
		}
		
		$scope.connectObjPlan = function() {
			var res = $scope.callDirFunc.getObjForPlans();
			console.log(res);
			for(var i=0; i<res.length; i++) {
				for(var j=0; j<res[i].objs.length; j++) {
					neo4jRequest.connectPlanToObj(res[i].plan, res[i].objs[j]).success(function(data, status){
						//console.log(data);
					});
				}
			}
		}
		
		$scope.insertObjects = function() {
			
			$.getJSON('data/Proj_Muristan/models/_list.json', function(data) {
				console.log(data);
				for(var i=0; i<data.length; i++) {
					neo4jRequest.insertObject(data[i]).success(function(data, status){
						console.log(data);
					});
				}
			});
		}
		
		$scope.insertPlans = function() {
			
			$.getJSON('data/Proj_Muristan/plans/models/_list2.json', function(data) {
				console.log(data);
				
				for(var i=0; i<data.length; i++) {
					neo4jRequest.insertPlan(data[i][0], data[i][1]).success(function(data, status){
						console.log(data);
					});
				}
			});
		}
		
		function multiplyMatrices(ae, be) {
			var te = [];
			te.length = 16;
		
			var a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
			var a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
			var a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
			var a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

			var b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
			var b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
			var b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
			var b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

			te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
			te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
			te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
			te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

			te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
			te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
			te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
			te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

			te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
			te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
			te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
			te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

			te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
			te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
			te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
			te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
			
			return te;
		};
		
		$scope.loadZwinger = function() {
			
			$.getJSON('data/Proj_Zwinger/models/_list.json', function(data) {
			//$.getJSON('data/test/_list.json', function(data) {
				console.log(data);
				
				function getNodes(nodes, parent) {
					for(var i=0; i<nodes.length; i++) {
						var scale = 1.0;
						if(nodes[i].unit == 'centimeter') scale = 0.1;
						if(nodes[i].children.length < 1) // mesh
							$scope.callDirFunc.loadCTMIntoScene('data/Proj_Zwinger/models/', nodes[i].name, parent, nodes[i].matrix, scale);
						else // group
							$scope.callDirFunc.loadCTMIntoScene(0, nodes[i].name, parent, nodes[i].matrix, scale);
						
						getNodes(nodes[i].children, nodes[i].name);
					}
				}
				//getNodes(data, 0, [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
				getNodes(data, 0);
				
				
				/*for(var i=0; i<data.length; i++) {
					//$scope.callDirFunc.loadCTMIntoScene('data/Proj_Zwinger/models/', data[i][0]+'.ctm', data[i][1]);
					$scope.callDirFunc.loadCTMIntoScene('data/test/', data[i][0]+'.ctm', data[i][1]);
				}*/
			});
		};
		
		$scope.loadModels = function() {
			neo4jRequest.getAllModels($scope.project).success(function(data, status){
				//console.log(data);
				var models = extractData(data);
				console.log(models);
				
				for(var i=0, l=models.length; i<l; i++) {
					$scope.callDirFunc.loadCTMIntoScene(models[i].object, models[i].file); 
				}
			});
		};
		
		$scope.loadModelsWithChildren = function() {
			neo4jRequest.getModelsWithChildren($stateParams.project, $stateParams.subproject).then(function(response){
				if(response.data.exception) { console.error('neo4j failed on getModelsWithChildren()', response.data); return; }
				console.log(response.data);
				var root = Utilities.createHierarchy(response.data, ['file','obj'], true)[0];
				console.log(root);
				
				function getNodes(nodes, parent, promise) {
					// for(var i=0; i<nodes.length; i++) {
						// $scope.callDirFunc.loadCTMIntoScene(nodes[i].obj, nodes[i].file, parent);
						// getNodes(nodes[i].children, nodes[i].obj.content);
					// }
					var cdefer = $q.defer();
					nodes.reduce(function(cur, next) {
						return cur.then(function() {
							var p = $scope.callDirFunc.loadCTMIntoScene(next.obj, next.file, parent);
							return getNodes(next.children, next.obj.content, p);
						});
					}, promise).then(function(){ cdefer.resolve(); });
					return cdefer.promise;
				}
				if(root)
					getNodes(root.children, 0, $q.resolve());
				
			});
		};
		
		$scope.logModels = function() {
			console.log($scope.hierarchList);
			console.log($scope.layerList);
			/*var time = new Date().getTime();
			console.log(time);
			console.log(new Base62().encode(time));*/
		};
		
		$scope.callDirFunc = {};
		
		// öffne oder schließe Tab im vpPanelContainer
		$scope.openVpPanelTab = function(tab) {
			if($scope.views.enhancedOptions.tab == tab)
				$scope.views.enhancedOptions.tab = '';
			else
				$scope.views.enhancedOptions.tab = tab;
		};
		
		
		
		//ein- und ausklappen des unteren Containers
		$scope.expandPanelContainerHorizontal = function(e) {
			var btn = $(e.delegateTarget);
			//console.log(btn.parent().css('right'));
			if(btn.parent().css('bottom') == '-85px') {
				btn.children('span').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
				btn.parent().animate({ bottom: '0px' }, 500);
			}
			else {
				btn.children('span').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
				btn.parent().animate({ bottom: '-85px' }, 500);
			}
		};
		
		//ein- und ausklappen des unsicheren Wissens
		$scope.expandPanelContainerPhases = function(e) {
			var btn = $(e.delegateTarget);
			console.log(btn.siblings(".timeSlider").css('top'));
			
			if(btn.siblings(".timeSlider").css('top') == '20px') {
				btn.children('span').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
				console.log(btn.siblings(".row2").css('visibility'));
				btn.siblings(".timeSlider").animate({ top: '43px' }, 500);
				btn.siblings(".row2").animate({opacity: '1.0'},500) ;
				
			}
			else {
				btn.children('span').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
				btn.siblings(".timeSlider").animate({ top: '20px' }, 500);
				btn.siblings(".row2").css({opacity: '0.0'},500);
				
			}
		};
		
		
		
		$scope.enterMenuItem = function(event) {
			var li = $(event.target);
			var ul = li.children('ul:first-child');
			ul.show();
			li.bind('mouseleave', function(event) {
				ul.hide();
				li.unbind('mouseleave');
			});
		};
		
		$scope.addSlider = function(event){
				//console.log(event);
								
				var t = event.offsetX / event.delegateTarget.offsetWidth;
				var newR = Math.round((1-t) * $scope.ramp.start[0] + t * $scope.ramp.end[0]);
				var newG = Math.round((1-t) * $scope.ramp.start[1] + t * $scope.ramp.end[1]);
				var newB = Math.round((1-t) * $scope.ramp.start[2] + t * $scope.ramp.end[2]);
				
				$scope.colorMarkerArray.push({
					position: event.offsetX,
					color: "rgb(" + newR + "," + newG + "," + newB + ")"
				});
				}
				
		$scope.onEnterField = function(event) {
			event.target.select();
		};
		
		$scope.clickdebug = function() {
			console.log('button clicked');
		};
		
		$scope.tooltip = function(event) {
			console.log(event);
		};
		
		$scope.selectResultItem = function(event, item) {
			//console.log(event, item);
			var btnbar = event.currentTarget.children[0].children[2];
			if(event.target.parentElement == btnbar || event.target.parentElement.parentElement == btnbar)
				return;
			if(event.ctrlKey) {
				if(event.currentTarget != event.target)
					item.selected = !item.selected;
			}
			else {
				for(var i=0, l=$scope.sourceResults.length; i<l; i++) {
					$scope.sourceResults[i].selected = false;
				}
				if(event.currentTarget != event.target)
					item.selected = true;
			}
		}
		
		//$scope.$watch('selected', function(value) {
			
			/*if(value) {
				console.log('watch', value);
				if($.isEmptyObject(value)) return;
				$('.sideContent').scrollTo('500px');
				//document.getElementById(value.name).scrollIntoView();
			}*/
		//});
		
		$scope.ctrlBtnClick = function(btn) {
			switch(btn) {
				case 'slice_toggle':
					$scope.toggleSlice = !$scope.toggleSlice;
					$scope.callDirFunc.ctrlBtnHandler(btn);
					if(!$scope.toggleSlice) {
						$scope.toggleCut = false;
						$scope.activeBtn = '';
						$scope.callDirFunc.ctrlBtnHandler('');
					}
					break;
				case 'slice_cut':
					$scope.toggleCut = !$scope.toggleCut;
					$scope.callDirFunc.ctrlBtnHandler(btn);
					break;	
				
				default:
					if($scope.activeBtn == btn) {
						$scope.activeBtn = '';
						$scope.callDirFunc.ctrlBtnHandler('');
					}
					else {
						$scope.activeBtn = btn;
						//console.log($scope.activeBtn);
						$scope.callDirFunc.ctrlBtnHandler(btn);
					}
			}
		};
		
		//$('#inputXCoord').bind('blur', coordInputHandler);
		//$('#inputYCoord').bind('blur', coordInputHandler);
		//$('#inputZCoord').bind('blur', coordInputHandler);
		
		$scope.validateCoord = function(coord, value, event) {
			console.log('validate');
			
			event = event || 0;
			if(event) {
				if(event.keyCode !== 13)
					return;
			}
			
			if(!value || value == '')
				value = 0;
			else
				value = value.replace(',', '.');
			
			var error = false;
			if(!isNaN(value))
				value = parseFloat(value).toFixed(2);
			else
				error = true;
			
			switch(coord) {
				case 'x': $scope.coords.x = value; $scope.coords.xError = error; break;
				case 'y': $scope.coords.y = value; $scope.coords.yError = error; break;
				case 'z': $scope.coords.z = value; $scope.coords.zError = error; break;
			}
			if(!error)
				$scope.callDirFunc.setCoordsFromInput($scope.coords);
			
			console.log($scope.coords);
		};
		
		$scope.$watch('filteredSourceResults', function(value) {
			console.log('filteredSourceResults', value);
		});
				
		// oninit Funktionsaufrufe
		$timeout(function() {
			$scope.getAllDocuments();
			$scope.getScreenshots();
			//$scope.loadModelsWithChildren();
		}, 500);
		
		$scope.getIndex = function() {
			phpRequest.getIndex($stateParams.project).then(function(response){
				console.log(response.data);
			});
		};
		$scope.indexDocuments = function() {
			phpRequest.indexDocuments($stateParams.project).then(function(response){
				console.log(response.data);
			});
		};
		$scope.searchText = function(searchTerm) {
			phpRequest.searchText($stateParams.project, searchTerm).then(function(response){
				console.log(response.data);
			});
			
			Utilities.throwNeo4jException('on insertDocument()', {exception: 'SyntaxException'});
		};
		
		// wenn Controller zerstört wird
		$scope.$on('$destroy', function(event) {
			//webglInterface.clearLists();
			console.log('destroy explorerCtrl');
		});
		
		
		
	}]);

webglControllers.controller('indexEditCtrl', ['$scope', '$stateParams', 'phpRequest', 
	function($scope, $stateParams, phpRequest) {
		
		$scope.blacklist = [];
		$scope.whitelist = [];
		
		var currBlacklist = [];
		var currWhitelist = [];
		
		function getIndex() {
			phpRequest.getWhitelist($stateParams.project)
				.then(function(response){
					$scope.whitelist = response.data.split(" ");
					console.log($scope.whitelist);
					return phpRequest.getIndex($stateParams.project);
				})
				.then(function(response){
					$scope.blacklist = response.data.replace(/(\r\n|\n|\r)/gm,"").split(" ");
					$scope.blacklist.splice(0,4);
					console.log($scope.blacklist);
					for(var i=0; i<$scope.whitelist.length; i++) {
						var index = $scope.blacklist.indexOf($scope.whitelist[i]);
						if(index > -1) $scope.blacklist.splice(index, 1);
					}
				});
		}
		function getBlacklist() {
			phpRequest.getBlacklist($stateParams.project).then(function(response){
				console.log(response);
				currBlacklist = response.data.split(" ");
				console.log(currBlacklist);
			});
		}
		
		getIndex();
		getBlacklist();
		
		$scope.addToWhitelist = function(entry) {
			$scope.blacklist.splice($scope.blacklist.indexOf(entry), 1);
			$scope.whitelist.push(entry);
		};
		
		$scope.removeFromWhitelist = function(entry) {
			$scope.whitelist.splice($scope.whitelist.indexOf(entry), 1);
			$scope.blacklist.push(entry);
		};
		
		$scope.updateIndex = function() {
			phpRequest.setNewBlacklist($stateParams.project, currBlacklist.concat($scope.blacklist))
				.then(function(response){
					if(response.data !== 'SUCCESS') {
						console.error('setNewBlacklist failed');
					}
					return phpRequest.setNewWhitelist($stateParams.project, $scope.whitelist);
				})
				.then(function(response){
					if(response.data !== 'SUCCESS') {
						console.error('setNewWhitelist failed');
					}
					return phpRequest.indexDocuments($stateParams.project);
				}).then(function(response){
					console.log(response.data);
					getIndex();
					getBlacklist();
				});
		};
		
	}]);


webglControllers.controller('insertSourceCtrl', ['$scope', '$stateParams', 'FileUploader', 'neo4jRequest', 'Utilities', '$timeout', '$modal',
	function($scope, $stateParams, FileUploader, neo4jRequest, Utilities, $timeout, $modal) {
		
		
		// init
		var isInserting = false;
		
		var imageTypes = ['jpg','png','jpeg','bmp','gif','tiff'];
		var textTypes = ['pdf'];
		
		//$scope.insert = $scope.$parent.overlayParams;
		//$scope.insert.project = $scope.$parent.project;
		$scope.insert = {params: {type: 'text', attachTo: undefined}};
		$scope.insert.phpurl = '';
		
		$scope.uploadType = $scope.$parent.$parent.modalParams.type;
		$scope.attachTo = $scope.$parent.$parent.modalParams.attachTo;
		
		console.log('attach', $scope.attachTo);
		
		$scope.insert.formTitle = '';
		//console.log($scope.insert, $scope.$parent.project);
		
		$scope.globals = {};
		$scope.globals.type = $scope.insert.params.type;
		$scope.globals.author = '';
		$scope.globals.useAuthor = false;
		$scope.globals.creationDate = '';
		$scope.globals.useCreationDate = false;
		$scope.globals.creationPlace = '';
		$scope.globals.useCreationPlace = false;
		
		$scope.suggestions = [];
		$scope.archives = [];
		
		
		var uploader = $scope.uploader = new FileUploader({
            url: $scope.insert.phpurl
        });
		//uploader.queue = $scope.insert.params.queue;

        // FILTERS
		
		if($scope.uploadType == 'source') {
			uploader.filters.push({
				name: 'sourceFilter',
				fn: function(item, options) {
					var type = item.type.slice(item.type.lastIndexOf('/') + 1);
					return imageTypes.concat(textTypes).indexOf(type) !== -1;
				}
			});
		}
		else if($scope.uploadType == 'model') {
			uploader.filters.push({
				name: 'modelFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|dae|DAE|obj|'.indexOf(type) !== -1;
				}
			});
		}
		else if($scope.uploadType == 'zip') {
			uploader.filters.push({
				name: 'zipFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|zip|ZIP|'.indexOf(type) !== -1;
				}
			});
		}
		/*
		else if($scope.insert.uploadType == 'text') {
			uploader.filters.push({
				name: 'textFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|pdf|PDF|doc|docx|jpg|png|jpeg|'.indexOf(type) !== -1;
				}
			});
		}*/
		
		// CALLBACKS

        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
			$scope.$parent.alert.message = 'Nicht unterstütztes Format!';
			$scope.$parent.alert.showing = true;
        };
        uploader.onAfterAddingFile = function(item) {
            console.info('onAfterAddingFile', item);
			
			item.tid = new Utilities.Base62().encode(new Date().getTime());
			item.newFileName = item.tid + '_' + item.file.name.replace(/ /g, "_");
			
			if($scope.uploadType === 'source') {
				var type = item.file.type.slice(item.file.type.lastIndexOf('/') + 1);
				if(imageTypes.indexOf(type) !== -1) {
					item.sourceType = 'plan';
					item.url = 'php/uploadImage.php';
				}
				else if(textTypes.indexOf(type) !== -1) {
					item.sourceType = 'text';
					item.language = 'de';
					item.url = 'php/processText.php';
				}
				
				item.title = '';
				item.titleError = false;
				item.author = '';
				item.creationDate = '';
				item.comment = '';
				item.formExtend = false;
				item.archive = '';
				item.archiveNr = '';
				item.creationPlace = '';
				item.ocr = false;
				item.resample = false;
				item.primary = true;
				item.tags = [];
			}
			else if($scope.uploadType === 'model') {
				item.sourceType = 'model';
				item.url = 'php/processDAE.php';
			}
			else if($scope.uploadType === 'zip') {
				item.sourceType = 'plans/model';
				item.url = 'php/planmodelFromZip.php';
			}
			
			item.isInputError = false;
			item.isProcessing = false;
			item.isInserting = false;
			item.anzInserting = 0;
			item.anzInserted = 0;
			
			Utilities.sleep(1);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
			
			uploader.url = item.url;
			
			var formData = {
				sourceType: item.sourceType,
				
				title: item.title,
				author: ($scope.globals.useAuthor) ? $scope.globals.author : item.author,
				creationDate: ($scope.globals.useCreationDate) ? $scope.globals.creationDate : item.creationDate,
				comment: item.comment,
				
				archive: item.archive,
				archiveNr: item.archiveNr,
				creationPlace: ($scope.globals.useCreationPlace) ? $scope.globals.creationPlace : item.creationPlace,
				language: item.language,
				ocr: item.ocr,
				resample: item.resample,
				primary: item.primary,
				tags: item.tags,
				
				oldFileName: item.file.name,
				newFileName: item.newFileName,
				fileType: item.file.name.split(".").pop(),
				pureNewFileName: item.newFileName.slice(0, item.newFileName.lastIndexOf(".")),
				path: $stateParams.project+'/'+item.sourceType+'s/',
				tid: item.tid
			};
			item.formData.push(formData);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            console.info('onProgressItem', fileItem, progress);
			if(progress == 100)
				fileItem.isProcessing = true;
        };
        uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);
			
			fileItem.isProcessing = false;
			
			if(!(response instanceof Object)) {
				console.error(response);
				fileItem.isSuccess = false;
				fileItem.isError = true;
				return;
			}
			
			console.log(response);
			if(response.data && response.data.pages) {
				fileItem.formData[0].pages = response.data.pages;
			}
			
			fileItem.isInserting = true;
			
			if($scope.uploadType == 'source') {
				Utilities.waitfor(function(){return isInserting;}, false, 20, {}, function(params) {
					isInserting = true;
					neo4jRequest.insertDocument($stateParams.project, $stateParams.subproject, fileItem.formData[0]).then(function(response){
						if(response.data.exception) { console.error('neo4j failed on insertDocument()', response.data); return; }
						if(response.data.data.length > 0 ) console.log('insertDocument', response.data);
						else {
							console.error('no document inserted', response.data);
							fileItem.isSuccess = false;
							fileItem.isError = true;
						}
						isInserting = false;
						fileItem.isInserting = false;
					});
				});
			}
			
			else if($scope.uploadType == 'model') {
				
				/*function neo4jinsertNode(formData, params) {
					neo4jRequest.insertModel($stateParams.project, $stateParams.subproject, formData, params.obj).then(function(response){
						if(response.data.exception) { console.error('neo4j failed on insertModel()', response.data); return; }
						console.log('insertModel', response.data);
						//isInserting = false;
						fileItem.anzInserted++;
						console.log(fileItem.anzInserted, fileItem.anzInserting);
						if(fileItem.anzInserted == fileItem.anzInserting)
							fileItem.isInserting = false;
					});
					insertNodes(params.obj.children);
				}*/
				function insertNodes(nodes) {
					for(var i=0, l=nodes.length; i<l; i++) {
						fileItem.anzInserting++;
						neo4jRequest.insertModel($stateParams.project, $stateParams.subproject, fileItem.formData[0], nodes[i]).then(function(response){
							if(response.data.exception) { console.error('neo4j failed on insertModel()', response.data); return; }
							console.log('insertModel', response.data);
							//isInserting = false;
							fileItem.anzInserted++;
							console.log(fileItem.anzInserted, fileItem.anzInserting);
							if(fileItem.anzInserted == fileItem.anzInserting)
								fileItem.isInserting = false;
						});
						insertNodes(nodes[i].children);
					}
				}
				
				/*function neo4jinsertNode(formData, params) {
					//var obj = $.extend(true, {}, objData);
					neo4jRequest.insertModel($stateParams.project, $stateParams.subproject, formData, params.obj).then(function(response){
						if(response.data.exception) { console.error('neo4j failed on insertModel()', response.data); return; }
						console.log('insertModel', response.data);
						isInserting = false;
						
						insertNodes(params.obj.children);
						
						fileItem.anzInserted++;
						//console.log(params.index, params.length);
						console.log(fileItem.anzInserted, fileItem.anzInserting);
						if(fileItem.anzInserted == fileItem.anzInserting)
							fileItem.isInserting = false;
					});
				}
				
				function insertNodes(nodes) {
					for(var i=0, l=nodes.length; i<l; i++) {
						//if(nodes[i].type != 'object') continue;
						
						fileItem.anzInserting++;
						Utilities.waitfor(function(){return isInserting;}, false, 20, {obj: nodes[i]}, function(params) {
							isInserting = true;
							//fileItem.isInserting = true;
							neo4jinsertNode(fileItem.formData[0], params);
							/*neo4jRequest.insertModel($scope.$parent.project, fileItem.formData[0], nodes[i]).success(function(data, status){
								//var res = cleanData(data);
								console.log('insertModel', data);
								isInserting = false;
								insertNodes(nodes[i].children);
							});*
						});
					}
				}*/
				insertNodes(response);
			}
			
			else if($scope.uploadType == 'zip') {
				console.log('everything done - start cypher query');
				isInserting = true;
				neo4jRequest.attach3DPlan($stateParams.project, fileItem.formData[0], response, $scope.attachTo).then(function(response){
					if(response.data.exception) { console.error('neo4j failed on attach3DPlan()', response.data); return; }
					console.log('attach3DPlan', response.data);
					isInserting = false;
					fileItem.isInserting = false;
				});
			}
			
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            console.info('onCancelItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            //console.info('onCompleteItem', fileItem, response, status, headers);
        };
        uploader.onCompleteAll = function() {
            console.info('onCompleteAll');
        };
		
		console.info('uploader', uploader);
		
		for(var i=0; i<$scope.$parent.$parent.modalParams.queue.length; i++) {
			uploader.addToQueue($scope.$parent.$parent.modalParams.queue[i]._file);
		}
		
		// vor dem Hochladen Pflichtfelder überprüfen
		$scope.checkAndUploadAll = function() {
			// wait for responses and validate inputs
			$timeout(function() {
				if($scope.uploadType == 'source') {
					for(var i=0, l=uploader.queue.length; i<l; i++) {
						if(uploader.queue[i].title == '' || uploader.queue[i].titleError) {
							uploader.queue[i].isInputError = true;
							uploader.queue[i].titleError = true;
						}
						else
							uploader.queue[i].isInputError = false;
					}
				}
				uploader.uploadAll();
			}, 1000);
		}
		
		$scope.getArchives = function() {
			neo4jRequest.getArchives($scope.$parent.project).then(function(response){
				if(response.data.exception) { console.error('neo4j failed on getArchives()', response); return; }
				if(response.data) $scope.archives = Utilities.cleanNeo4jData(response.data);
				console.log('Archives:', $scope.archives);
			});
		}
		$scope.getArchives();
		
		$scope.addArchive = function() {
			var newscope = $scope.$new(false);
			newscope.modalParams = {
				modalType: 'small'
			};
			$modal({
				title: 'Archiv hinzufügen',
				templateUrl: 'partials/modals/_modalTpl.html',
				contentTemplate: 'partials/modals/addArchiveModal.html',
				controller: 'addArchiveCtrl',
				scope: newscope,
				show: true
			});
		};
		
		// typeahead input callbacks
		$scope.setTypeaheadArray = function(label, prop) {
			if(!label) return;
			neo4jRequest.getAllLabelProps($scope.$parent.project, label, prop).then(function(response){
				if(response.data.exception) { console.error('neo4j failed on setTypeaheadArray()', response); return; }
				$scope.suggestions = Utilities.cleanNeo4jData(response.data);
				//console.log($scope.suggestions);
			});
		};
		$scope.validateInput2 = function(item, params) {
			//console.log('blur', item, params);
			$scope.suggestions = [];
			
			if(params) {
				item.titleError = false;
				for(var i=0, l=uploader.queue.length; i<l; i++) {
					if(params.index == i) continue;
					if(uploader.queue[i][params.prop] == item[params.prop])
						item.titleError = true;
				}
				if(!item.titleError) {
					neo4jRequest.findNodeWithSpecificContent($scope.$parent.project, params.label, item[params.prop]).success(function(data, status){
						//console.log(data);
						if(data.data.length > 0)
							item.titleError = true;
					});
				}
			}
		};
		
		// autocomplete input callbacks
		$scope.getSuggestions = function(search, params) {
			//console.log(search, params);
			if(search < 1) return;
			
			neo4jRequest.searchForExistingNodes($scope.$parent.project, params.label, search).success(function(data, status){
				$scope.suggestions = cleanData(data);
				//console.log($scope.suggestions);
			});
		};
		$scope.selectSuggestion = function(search, params){
			//console.log('select', search, params);
		};
		$scope.validateInput = function(search, item, params) {
			//console.log('blur', search, params);
			$scope.suggestions = [];
			
			if(params.unique) {
				item.titleError = false;
				for(var i=0, l=uploader.queue.length; i<l; i++) {
					if(params.index == i) continue;
					if(uploader.queue[i][params.uniqueProp] == search)
						item.titleError = true;
				}
				if(!item.titleError) {
					neo4jRequest.findNodeWithSpecificContent($scope.$parent.project, params.label, search).success(function(data, status){
						//console.log(data);
						if(data.data.length > 0)
							item.titleError = true;
					});
				}
			}
		};
		
		$scope.validateInputs = function() {
			console.log($scope.inputs);
		};
		
		$scope.openFileDialog = function(event) {
			$timeout(function() {
				angular.element(event.delegateTarget).find('input').trigger('click');
			});
		};
		
		// tag input callbacks
		$scope.onTagAdded = function(tag) {
			tag.text = tag.text.toLowerCase();
		};
		$scope.getTags = function(query) {
			return neo4jRequest.searchTags($stateParams.project, query).then(function(response) {
				if(response.data.exception) { console.error('neo4j failed on getAllTags()', response.data); return; }
				return Utilities.extractArrayFromNeo4jData(response.data);
			});
		};
	}]);
	
webglControllers.controller('sourceTypeCtrl', ['$scope',
	function($scope) {
		
		console.log('sourceTypeCtrl init');
		
		
		
	}]);
webglControllers.controller('addArchiveCtrl', ['$scope', '$stateParams', 'neo4jRequest',
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
	
webglControllers.controller('sourceDetailCtrl', ['$scope', '$http',
	function($scope, $http) {
		
		console.log('sourceDetailCtrl init');
		
		$scope.horizontalImage = false;
		$scope.pageNr = 0;
		
		var items = $scope.$parent.filteredSourceResults;
		$scope.itemindex = $scope.$parent.modalParams.index;
		
		$scope.nextItem = function(incr) {
			$scope.itemindex = (($scope.itemindex + incr) % items.length + items.length) % items.length;
			$scope.item = items[$scope.itemindex];
			
			if($scope.item.type =='picture' || $scope.item.type =='plan') {
				var img = new Image();
				img.onload = function() {
					if(this.width/this.height > 2)
						$scope.horizontalImage = true;
					else
						$scope.horizontalImage = false;
					$scope.$apply();
				}
				img.src = 'data/'+$scope.item.file.path+ ($scope.item.file.display || $scope.item.file.name);
			}
			else {
				$scope.horizontalImage = false;
				$scope.pageNr = 0;
			}
		};
		
		$scope.nextPage = function(incr) {
			$scope.pageNr = (($scope.pageNr + incr) % $scope.item.file.display.length + $scope.item.file.display.length) % $scope.item.file.display.length;
		};
		
		$scope.nextItem(0);
		
		$scope.highlight = function(event) {
			if(event.target.className !== 'ocrx_word') return;
			
			var values = $('.displayText').find('.ocr_page')[0].attributes.title.value.match(/bbox (\d+) (\d+) (\d+) (\d+);/);
			var global = [values[1], values[2], values[3], values[4]];
			
			values = event.target.attributes.title.value.match(/^bbox (\d+) (\d+) (\d+) (\d+); x_wconf (\d+)$/);
			var bbox = [values[1], values[2], values[3], values[4]];
			
			var img = $('.displayText').find('img');
			
			var left = Math.floor( bbox[0] * img.width() / global[2] );
			var width = Math.ceil( bbox[2] * img.width() / global[2] ) - left + 1;
			var top = Math.floor( bbox[1] * img.height() / global[3] );
			var height = Math.ceil( bbox[3] * img.height() / global[3] ) - top + 1;
			
			//console.log(left, width, top, height);
			
			$('#wordRect').css({
				left: left+'px',
				top: top+'px',
				width: width+'px',
				height: height+'px'
			});
		};
		
		$scope.toggleConfidence = function() {
			$scope.showConfidence = !$scope.showConfidence;
			
			var words = $('.displayText').find('.ocrx_word');
			for(var i=0, l=words.length; i<l; i++) {
				if($scope.showConfidence) {
					var values = words[i].attributes.title.value.match(/^bbox (\d+) (\d+) (\d+) (\d+); x_wconf (\d+)$/);
					var wconf = values[5];
					var hue = Math.floor((wconf-50)/50 * 120);
					$(words[i]).css('background', 'hsl('+hue+',100%,85%)');
				}
				else
					$(words[i]).css('background', 'none');
			}
		};
		
		$scope.editText = function() {
			//$scope.textEdit = !$scope.textEdit;
			
			$http.get('data/' + $scope.item.file.path + $scope.item.file.display[$scope.pageNr]).then(function(response) {
				console.log(response);
				$scope.editorInput = response.data;
				$scope.textEdit = true;
			});
			
		};
		
		$scope.saveText = function() {
			console.log($scope.editorInput);
		};
		
	}]);
	
webglControllers.controller('screenshotDetailCtrl', ['$scope', '$stateParams', '$q', 'phpRequest', 'neo4jRequest', 'Utilities', '$timeout', '$alert',
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
		
		$scope.changeMarkerStatus = function (id, status){
			$.each($scope.markers, function(indexM){
				if($scope.markers[indexM].id==id ){
					$scope.markers[indexM].activeBtn = status;
					return false;
				}
			})
		}
		
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
					if(reponse.data.exception) { Utilities.throwNeo4jException('on insertScreenshotMarkers()', response); return; }
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
				
				phpRequest.saveBase64Image($scope.params.path, $scope.params.filename, $scope.params.data.dataUrl, true)
					.then(function(response){
						if(response.data !== 'SUCCESS') {
							Utilities.throwException('PHP Exception', 'on saveBase64Image() Screenshot', response);
							return $q.reject();
						}
						return phpRequest.saveBase64Image($scope.params.path, paintFilename, paintDataUrl, false);
					})
					.then(function(response){
						if(response.data !== 'SUCCESS') {
							Utilities.throwException('PHP Exception', 'on saveBase64Image() Painting', response);
							return $q.reject();
						}
						return neo4jRequest.insertScreenshot($stateParams.project, $stateParams.subproject, $scope.params, $scope.markers, $scope.screenshotTitle, paintFilename);
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
									console.log($scope.markers[indexN].activeBtn);
									neo4jRequest.addTask($stateParams.project, $scope.markers[indexN].taskID, tid, $scope.markers[indexN].taskName, $scope.markers[indexN].comment,$scope.markers[indexN].editor
														, Utilities.getFormattedDate($scope.markers[indexN].from), Utilities.getFormattedDate($scope.markers[indexN].to),'priority_high', 'status_todo')
											.then(function(response){
											console.log(response.data);
											})
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
	
webglControllers.controller('testCtrl', ['$scope', '$stateParams',
	function($scope, $stateParams) {
		
		$scope.members = [
			{name: 'Martin', tasks: []},
			{name: 'Jonas', tasks: []},
			{name: 'Markus', tasks: []}
		];
		
		$scope.tasks = [
			{name: 'task1', parent: null, children: [], editors: []},
			{name: 'task2', parent: null, children: [], editors: []},
			{name: 'task3', parent: 'task1', from: new Date(2015,11,12,8,0,0), to: new Date(2015,11,30,15,0,0), children: [], editors: ['Martin']},
			{name: 'task4', parent: 'task1', children: [], editors: []},
			{name: 'task5', parent: 'task2', children: [], editors: ['Markus']},
			{name: 'task6', parent: 'task4', children: [], editors: ['Martin']},
			{name: 'task7', parent: 'task4', children: [], editors: ['Jonas']}
		];
		
		$scope.data = [];
		
		function sortTasks() {
			for(var i=0; i<$scope.tasks.length; i++) {
				for(var j=0; j<$scope.tasks[i].editors.length; j++) {
					$scope.tasks[i].editors[j] = getMember($scope.tasks[i].editors[j]);
					$scope.tasks[i].editors[j].tasks.push($scope.tasks[i]);
				}
			}
			for(var i=0; i<$scope.tasks.length; i++) {
				if($scope.tasks[i].parent == null) continue;
				var p = getElementInHierarchy($scope.tasks[i], 'parent', $scope.tasks, 'name');
				//console.log(p);
				p.children.push($scope.tasks[i]);
				$scope.tasks[i].parent = p;
				for(var k=0; k<$scope.tasks[i].editors.length; k++) {
					pushToParents(p, $scope.tasks[i].editors[k]);
				}
				$scope.tasks.splice(i,1);
				i--;
			}
			
		}
		
		function pushToParents(p, e) {
			if(p == null) return;
			if(p.editors.indexOf(e) === -1)
				p.editors.push(e);
			pushToParents(p.parent, e);
		}
		
		function getElementInHierarchy(node, key, list, listkey) {
			for(var i=0; i<list.length; i++) {
				if(node[key] == list[i][listkey]) return list[i];
				var obj = getElementInHierarchy(node, key, list[i].children, listkey);
				if(obj !== undefined) return obj;
			}
			return undefined;
		}
		
		function getMember(name) {
			for(var i=0; i<$scope.members.length; i++) {
				if(name == $scope.members[i].name) return $scope.members[i];
			}
		}
		
		function generateRows() {
			var newid = 0;
			
			$.each($scope.members, function(i) {
				var member = $scope.members[i];
				var row = {
					id: newid,
					name: member.name,
					memberRef: member,
					isStaff: true,
					groups: false,
					children: [],
					tasks: []
				};
				$scope.data.push(row);
				newid++;
				
				$.each($scope.tasks, function(j) {
					if($scope.tasks[j].editors.indexOf(member) === -1)
						return true;
					var task = $scope.tasks[j]; //task ist Referenz auf Objekt in $scope.tasks[j]
					var rowTask = {
						id: newid,
						name: task.name,
						taskRef: task,
						parent: row.id,
						children: [],
						tasks: task.from ? [{name: task.name, from: task.from, to: task.to}] : []
					};
					$scope.data.push(rowTask); // übergibt auch Referrenz
					newid++;
					
					function pushChildTasks(parentTask, parentRow) {
						$.each(parentTask.children, function(k) {
							var childTask = parentTask.children[k];
							parentRow.children.push(newid);
							var childRow = {
								id: newid,
								name: childTask.name,
								taskRef: childTask,
								children: [],
								tasks: childTask.from ? [{name: childTask.name, from: childTask.from, to: childTask.to}] : []
							};
							$scope.data.push(childRow);
							newid++;
							pushChildTasks(childTask, childRow);
							console.log('task pushed');
						});
					}
					pushChildTasks(task, rowTask)
					
				});
			});
			
		}
		
		/*sortTasks();*/
		generateRows();
		console.log('members', $scope.members);
		console.log('tasks', $scope.tasks);
		console.log('data', $scope.data);
		
	}]);
	
webglControllers.controller('tasksCtrl', ['$scope','$stateParams', '$timeout', '$sce', 'phpRequest', 'mysqlRequest', 'neo4jRequest', '$http', 'Utilities','$aside', 
	function($scope, $stateParams, $timeout, $sce, phpRequest, mysqlRequest, neo4jRequest, $http, Utilities, $aside) {
	
		$scope.project = $stateParams.project;
		$scope.sortby = 'staff';
		$scope.parentIsStaff= 'false';
		$scope.staffArray = [];
		$scope.tasksArray= []; //extra tasksArray um unique zu nutzen
		$scope.tasksWithEditors=[];
		
		/*Mitarbeiter*/
		$scope.newStaff = new Object();
		
		$scope.newStaff.sid = '';
		$scope.newStaff.name = '';
		$scope.newStaff.surname = '';
		$scope.newStaff.mail = '';
		$scope.newStaff.role = '';
		$scope.newStaff.projects = '';
		$scope.staffExists= false;
		
		/*Tasks*/
		
		$scope.newTask = new Object();
		$scope.newTask.ids = new Object();
		$scope.newTask.ids.gantt = '';
		$scope.newTask.ids.graph = '';
		$scope.newTask.staff = '';
		$scope.newTask.isStaff = '';
		$scope.newTask.clickedElement = '';
		$scope.newTask.task = '';
		$scope.newTask.from = '';
		$scope.newTask.to = '';
		$scope.newTask.desc = '';
		
		$scope.staff = [];
		$scope.nameFound = false;
		$scope.taskExists = false;
		
		// Kommentare
		$scope.taskNameForComment;
		$scope.taskIdForComment;
		$scope.commentIndex;
		$scope.comments = [];
		
		
		
		/*Views*/
		
		$scope.views = new Object();
		$scope.views.activeSide = 'staff';
		
		$scope.newComment = new Object();
		$scope.newComment.text = '';
		
		/*Aufgaben umsortieren*/
 		 
 		 $scope.changeOrder = 'false';
 		 
		/*IndexDnd*/
		$scope.indexDnD;

		/*Children zählen*/
		$scope.childCounter = 0;
		
		$scope.dataTasks = [];
		
		/* $scope.data=[
		{"id":1,"name":"Jonas","isStaff":true,"groups":false,"children":[],"tasks":[],"highlight":false},
		{"id":2,"name":"Martin","isStaff":true,"groups":false,"children":[],"tasks":[],"highlight":false},
		{"id":3,"name":"test1","taskRef":[],"isStaff":false,"parent":1,"children":[5],"status":"erledigt","priority":"2","hasData":"false","editors":[1],"tasks":[],"highlight":false},
		{"id":4,"name":"test1","taskRef":[],"isStaff":false,"parent":2,"children":[6,12,"pvKejD7","pvKekso","pvKelri"],"status":"erledigt","priority":"2","hasData":"false","editors":[2],"tasks":[],"highlight":false},
		{"id":5,"name":"test2","isStaff":false,"status":"erledigt","children":[],"priority":"3","hasData":"false","editors":[1],"tasks":[{"name":"test2","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"3dd20ab4-e25a-e19d-1dbb-266c12960b06"}],"highlight":false},
		{"id":6,"name":"test2","isStaff":false,"status":"erledigt","children":[],"priority":"3","hasData":"false","editors":[2],"tasks":[{"name":"test2","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"65b11b16-c36e-14b7-2666-69874c92efc4"}],"highlight":false},
		{"id":7,"name":"test7","isStaff":false,"parent":2,"children":[8],"status":"erledigt","priority":"2","hasData":"false","editors":[2],"tasks":[],"highlight":false},{"id":8,"name":"test8","isStaff":false,"status":"erledigt","children":[],"priority":"3","hasData":"false","editors":[2],"tasks":[{"name":"test8","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"b348fae6-e426-b15a-0f70-72eba739901b"}],"highlight":false},
		{"id":9,"name":"test4","isStaff":false,"parent":1,"children":[],"status":"zu bearbeiten","priority":"1","editors":[1],"hasData":"false","tasks":[{"name":"test4","color":"#F1C232","from":"2015-12-21T07:00:00.000Z","to":"2015-12-25T14:00:00.000Z","progress":25,"id":"7b9ba63f-cb13-a1e6-acb2-0d066c17bf77"}],"highlight":false},
		{"id":10,"name":"test5","isStaff":false,"parent":1,"children":[],"status":"zu bearbeiten","priority":"2","editors":[1],"hasData":"false","tasks":[{"name":"test5","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"ecdeb010-480a-e0bc-0c99-7d92e4332275"}],"highlight":false},
		{"id":11,"name":"test6","isStaff":false,"parent":1,"children":[],"status":"zu bearbeiten","hasData":"true","editors":[1],"priority":"1","tasks":[{"name":"test6","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"0b0e9d7f-699c-345c-c496-8adbc22f7065"}],"highlight":false},
		{"id":12,"name":"test3","isStaff":false,"children":[],"status":"zu bearbeiten","hasData":"true","priority":"1","editors":[1],"tasks":[{"name":"test3","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"1ed2c928-67aa-3e63-fd0f-e79b2c388fc8"}],"highlight":false},
		{"id":"pvKejD7","name":"neue Unteraufgabe1","isStaff":false,"children":[],"priority":"1","status":"zu bearbeiten","tasks":[{"name":"neue Unteraufgabe1","color":"#F1C232","from":"2015-12-02T20:45:30.000Z","to":"2015-12-07T20:45:30.000Z","id":"841a06ba-e444-af11-1e1a-3b560b3c4c1b"}],"highlight":false},
		{"id":"pvKekso","name":"neue Unteraufgabe2","isStaff":false,"children":[],"priority":"1","status":"zu bearbeiten","tasks":[{"name":"neue Unteraufgabe2","color":"#F1C232","from":"2015-12-02T20:45:34.000Z","to":"2015-12-07T20:45:34.000Z","id":"18b116fe-5bef-e105-2770-d0089e493299"}],"highlight":false},
		{"id":"pvKelri","name":"neue Unteraufgabe3","isStaff":false,"children":[],"priority":"1","status":"zu bearbeiten","tasks":[{"name":"neue Unteraufgabe3","color":"#F1C232","from":"2015-12-02T20:45:37.000Z","to":"2015-12-07T20:45:37.000Z","id":"bf4a7bb7-6742-8c65-0dce-69240944b025"}],"highlight":false}];
		 */
	/* 	$scope.data = [ //falsche Reihenfolge!! --> aus dem Rechner
		{"name":"test4"					,"children":[],"editors":["Jonas"],"id":9,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"false","tasks":[{"name":"test4","color":"#F1C232","from":"2015-12-21T07:00:00.000Z","to":"2015-12-25T14:00:00.000Z","progress":25,"id":"7d011325-7a4a-cd10-9e84-6d225c380e16"}]},
		{"name":"neue Unteraufgabe3"	,"children":[],"editors":[""],"id":"pvK7G3P","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe3","color":"#F1C232","from":"2015-12-02T20:19:08.000Z","to":"2015-12-07T20:19:08.000Z","id":"c008c02f-a306-e573-3643-e1ea1d79fe25"}],"highlight":false},
		{"name":"test5"					,"children":[],"editors":["Jonas"],"id":10,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"2","hasData":"false","tasks":[{"name":"test5","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"2ad31c8a-0b14-4272-bc08-0db7225d35bc"}]},
		{"name":"test1"					,"children":[6,12,"pvK7DT1","pvK7Fay","pvK7G3P"],"editors":["Jonas","Martin"],"id":4,"isStaff":false,"parent":"","status":"erledigt","priority":"2","hasData":"false","tasks":[]},
		{"name":"neue Unteraufgabe2"	,"children":[],"editors":[""],"id":"pvK7Fay","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe2","color":"#F1C232","from":"2015-12-02T20:19:05.000Z","to":"2015-12-07T20:19:05.000Z","id":"694d70b7-959a-832e-1aec-3d7f2dfa2e57"}],"highlight":false},
		{"name":"neue Unteraufgabe1"	,"children":[],"editors":[""],"id":"pvK7DT1","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe1","color":"#F1C232","from":"2015-12-02T20:19:00.000Z","to":"2015-12-07T20:19:00.000Z","id":"f259a724-ec24-7d73-9a61-fe31c9868182"}],"highlight":false},
		{"name":"test3"				,"children":[],"editors":["Jonas"],"id":12,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"true","tasks":[{"name":"test3","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"46f16d23-8a8e-7b0a-c06a-cb653855aa7b"}],"highlight":false},
		{"name":"test6"				,"children":[],"editors":["Jonas"],"id":11,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"true","tasks":[{"name":"test6","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"883c0090-c35b-d341-c1ac-7a0647dc2a1a"}],"highlight":false},
		{"name":"test2"				,"children":[],"editors":["Jonas","Martin"],"id":6,"isStaff":false,"parent":"","status":"erledigt","priority":"3","hasData":"false","tasks":[{"name":"test2","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"4e696f72-248e-a7ad-6464-a9199a5caa0d"}],"highlight":false},
		{"name":"test7"				,"children":[8],"editors":["Martin"],"id":7,"isStaff":false,"parent":"","status":"erledigt","priority":"2","hasData":"false","tasks":[],"highlight":false},{"name":"test8","children":[],"editors":["Martin"],"id":8,"isStaff":false,"parent":"","status":"erledigt","priority":"3","hasData":"false","tasks":[{"name":"test8","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"ca0d8e5e-17fa-d097-f17a-57ce50f35292"}],"highlight":false}
		]; */
		
		/* $scope.data = [ //richtige Reihenfolge
		{"name":"test4"					,"children":[],"editors":["Jonas"],"id":9,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"false","tasks":[{"name":"test4","color":"#F1C232","from":"2015-12-21T07:00:00.000Z","to":"2015-12-25T14:00:00.000Z","progress":25,"id":"7d011325-7a4a-cd10-9e84-6d225c380e16"}]},
		{"name":"test5"					,"children":[],"editors":["Jonas"],"id":10,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"2","hasData":"false","tasks":[{"name":"test5","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"2ad31c8a-0b14-4272-bc08-0db7225d35bc"}]},
		{"name":"test1"					,"children":[6,12,"pvK7DT1","pvK7Fay","pvK7G3P"],"editors":["Jonas","Martin"],"id":4,"isStaff":false,"parent":"","status":"erledigt","priority":"2","hasData":"false","tasks":[]},
		{"name":"test6"					,"children":[],"editors":["Jonas"],"id":11,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"true","tasks":[{"name":"test6","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"883c0090-c35b-d341-c1ac-7a0647dc2a1a"}],"highlight":false},
		{"name":"test2"					,"children":[],"editors":["Jonas","Martin"],"id":6,"isStaff":false,"parent":"","status":"erledigt","priority":"3","hasData":"false","tasks":[{"name":"test2","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"4e696f72-248e-a7ad-6464-a9199a5caa0d"}],"highlight":false},
		{"name":"test3"					,"children":[],"editors":["Jonas"],"id":12,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"true","tasks":[{"name":"test3","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"46f16d23-8a8e-7b0a-c06a-cb653855aa7b"}],"highlight":false},
		{"name":"neue Unteraufgabe1"	,"children":[],"editors":[""],"id":"pvK7DT1","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe1","color":"#F1C232","from":"2015-12-02T20:19:00.000Z","to":"2015-12-07T20:19:00.000Z","id":"f259a724-ec24-7d73-9a61-fe31c9868182"}],"highlight":false},
		{"name":"neue Unteraufgabe2"	,"children":[],"editors":[""],"id":"pvK7Fay","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe2","color":"#F1C232","from":"2015-12-02T20:19:05.000Z","to":"2015-12-07T20:19:05.000Z","id":"694d70b7-959a-832e-1aec-3d7f2dfa2e57"}],"highlight":false},
		{"name":"neue Unteraufgabe3"	,"children":[],"editors":[""],"id":"pvK7G3P","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe3","color":"#F1C232","from":"2015-12-02T20:19:08.000Z","to":"2015-12-07T20:19:08.000Z","id":"c008c02f-a306-e573-3643-e1ea1d79fe25"}],"highlight":false},
		{"name":"test7"					,"children":[8],"editors":["Martin"],"id":7,"isStaff":false,"parent":"","status":"erledigt","priority":"2","hasData":"false","tasks":[],"highlight":false},{"name":"test8","children":[],"editors":["Martin"],"id":8,"isStaff":false,"parent":"","status":"erledigt","priority":"3","hasData":"false","tasks":[{"name":"test8","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"ca0d8e5e-17fa-d097-f17a-57ce50f35292"}],"highlight":false}
		];  */
		
	/*  $scope.data = [		  
    	{id: 1, name: 'Jonas', isStaff: true, 'groups': false, children: [], tasks: [] }, //Zeitstempel für Kommentar
    
    	{id: 2,name: 'Martin', isStaff: true, 'groups': false, children: [], tasks: []},
    	
    	{id: 3,name: 'test1', isStaff: false,  parent: 1, children: [5], status: 'erledigt',priority: '2', hasData: 'false', editors: [1], tasks: []},
    
    	{id: 4,name: 'test1', isStaff: false,  parent: 2, children: [6,12], status: 'erledigt',priority: '2', hasData: 'false', editors: [2], tasks: []},
		
		{id: 5,name: 'test2',  isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: 'false', editors: [1], tasks: [
		                            {name: 'test2', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
		{id: 6,name: 'test2', isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: 'false', editors: [2], tasks: [
		                            {name: 'test2', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
		                        
		{id: 7,name: 'test7',isStaff: false, parent: 2,children: [8],  status: 'erledigt',priority: '2', hasData: 'false', editors: [2],  tasks: []},
		
		{id: 8,name: 'test8', isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: 'false', editors: [2], tasks: [
		                            {name: 'test8', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]}, 
		   
		{id: 9, name: 'test4', isStaff: false, parent: 1, children: [], status: 'zu bearbeiten', priority: '1', editors: [1], hasData: 'false', tasks: [
		                            {name: 'test4', color: '#F1C232', from: new Date(2015, 11, 21, 8, 0, 0), to: new Date(2015, 11, 25, 15, 0, 0)}
		                        ]},
		 {id: 10,name: 'test5', isStaff: false, parent: 1, children: [], status: 'zu bearbeiten',priority: '2', editors: [1], hasData: 'false', tasks: [
		                            {name: 'test5', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
		{id: 11,name: 'test6', isStaff: false, parent: 1, children: [], status: 'zu bearbeiten', hasData: 'true', editors: [1], priority: '1', tasks: [
		                            {name: 'test6', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0), data: [{message: 'Lorem Ipsum', author:'Martin'},{message: '123', author:'Martin'}]}]},
		                            
		{id: 12,name: 'test3', isStaff: false, children: [], status: 'zu bearbeiten', hasData: 'true', priority: '1', editors: [1], tasks: [
			{name: 'test3', color: '#F1C232',from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0), data: [{message: 'Lorem Ipsum', author:'Martin'},{message: '123', author:'Martin'}]}]},
		];  */
		 
		$scope.data = [		
		/* {id: 1, name: 'Jonas', isStaff: true, 'groups': false, children: [], tasks: []},
    
    	{id: 2, name: 'Martin', isStaff: true,'groups': false, children: [], tasks: []},
    
    	{graphId: 3, name: 'test1', isStaff: false, parent: 1, children: [4], status: 'erledigt',priority: '2', hasData: false, editors: [1],data: [], tasks: []},
                            
	
		{graphId: 4, name: 'test2', isStaff: false, children: [], status: 'erledigt',priority: '3', hasData: false,editors: [1], data: [], tasks: [
		                            {name: 'test2', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
			
		{graphId: 5,name: 'test1', isStaff: false,  parent: 2, children: [6,12], status: 'erledigt',priority: '2', hasData: false, editors: [2], data: [], tasks: []},
		
		{graphId: 6,name: 'test2', isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: false, editors: [2], data: [], tasks: [
		                            {name: 'test2', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
		 
		{graphId: 7, name: 'test4', isStaff: false,parent: 1,children: [], status: 'zu bearbeiten', priority: '1',hasData: false,editors: [1], data: [],tasks: [
		                            {name: 'test4', color: '#F1C232', from: new Date(2015, 09, 21, 8, 0, 0), to: new Date(2015, 10, 25, 15, 0, 0), progress: 25}
		                        ]},
		{graphId: 8, name: 'test5', isStaff: false,parent: 2, children: [], status: 'zu bearbeiten',priority: '2',hasData: false, editors: [2], data: [], tasks: [
		                            {name: 'test5', color: '#F1C232', from: new Date(2015, 10, 12, 8, 0, 0), to: new Date(2015, 10, 30, 15, 0, 0)}
		                        ]},
		{graphId: 9, name: 'test6', isStaff: false, parent: 2, children: [], status: 'zu bearbeiten',priority: '1',hasData: true, editors: [2],data: [{message: 'Lorem Ipsum', author:'Martin'},{message: '123', author:'Martin'}],  tasks: [
		                            {name: 'test6', color: '#F1C232', from: new Date(2015, 10, 12, 8, 0, 0), to: new Date(2015, 10, 30, 15, 0, 0)}]},
		
		{graphId: 10,name: 'test7',isStaff: false, parent: 2,children: [11],  status: 'erledigt',priority: '2', hasData: false, editors: [2], data: [], tasks: []},
		
		{graphId: 11,name: 'test8', isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: false, editors: [2], data: [], tasks: [
		                            {name: 'test8', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0), }
		                        ]},  */
]		
		
		$scope.options = {
			useData: $scope.data,
			allowSideResizing: true,
			fromDate:  getFormattedDate(new Date()),
			toDate: getFormattedDate(addDays(new Date(),30)),
			columns: ['trash', 'model.priority', 'model.status'],
			treeTableColumns: [ 'status'],
			columnsHeaders: {'trash': 'Löschen', 'model.priority': 'Priorität',  'model.status': 'Status', 'model.editors': 'Bearbeiter'},
			
			columnsClasses: {'model.name' : 'gantt-column-name', 'from': 'gantt-column-from', 'to': 'gantt-column-to', 'model.status': 'gantt-column-status'},
			columnsFormatters: {
					                'from': function(from) {
					                    return from !== undefined ? from.format("DD.MM") : undefined;
					                },
					                'to': function(to) {
					                    return to !== undefined ? to.format("DD.MM") : undefined;
					                }
					            },
            
            
            columnsHeaderContents: {
            	'model.editors': '<i class="fa fa-users"></i>',
            	'trash': '<i class="glyphicon glyphicon-trash"></i>',
                'model.priority': '<i class="fa fa-exclamation"></i>',
                'model.status': '<i  class="fa fa-flag"></i>'
            },
           labelsEnabled: true,
           columnsContents: {
          'model.editors': '<div>{{getValue()}}</div>',
          'trash': '<i class="glyphicon glyphicon-trash" ng-click = "scope.deleteTask(row)" ></i>',      
          'model.priority': '<i ng-switch= "getValue()" ng-click="scope.changePriority(row)"><i ng-switch-when="priority_low" class="fa fa-flag" id="lowPriority"></i><i ng-switch-when="priority_medium" class="fa fa-flag" id="mediumPriority"></i><i ng-switch-when="priority_high" class="fa fa-flag" id="highPriority"></i></i>',
          'model.status': '<i ng-class="getValue() == \'status_done\' ? \'glyphicon glyphicon-ok\' : \'glyphicon glyphicon-cog\'" ng-click="scope.changeStatus(row)"></i>',
            },
            filterTask: '',
            filterRow: '',
            contentTooltips: 'von: {{task.model.from.format("DD.MM")}}	 bis: {{task.model.to.format("DD.MM")}}',
            scale: 'day',
            sortMode: undefined,
            maxHeight: true,
            width: true,
            rowContent: '<i ng-hide ="row.model.isStaff" ng-class="row.model.hasData == true ?  \'fa fa-commenting-o\' : \'fa fa-pencil\'" \
							ng-click="scope.showAsideForComment(row)"></i>\
							<i ng-class = "row.model.isStaff == true ? \'parent\': \'child\' " ng-click= "scope.showAsideForComment(row)"> \
							{{row.model.name}}</i> <i class= "fa fa-plus" ng-click="scope.showAsideForTask(row)"></i> ',
							/*<i class="glyphicon glyphicon-trash" ng-click="scope.deleteTask(row.model)"></i>*/
            taskContent: '{{task.model.name}}', 
            zoom: 1.3,
             api: function(api) {
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

	              api.core.on.ready($scope, function(){
	              	api.core.on.ready($scope, logReadyEvent);
	              	/* api.data.on.change($scope.dataTasks, $scope.data); */
					api.data.on.remove($scope, addEventName('data.on.remove', logDataEvent));
	     	              
	              if (api.tasks.on.moveBegin) {
                        api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', changeTask));
                        api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', changeTask));
                    }
                    
	              });
                }
           };
		
		function getFormattedDate(date) {
    		var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes				() + ":" + date.getSeconds();
		    return str;
		}

		function addDays(date, days) {
		    var result = new Date(date);
		    result.setDate(date.getDate() + days);
		    return result;
		}

		
		$scope.canAutoWidth = function(scale) {
            if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
                return false;
            }
            return true;
        };

        $scope.getColumnWidth = function(widthEnabled, scale, zoom) {
            if (!widthEnabled && $scope.canAutoWidth(scale)) {

				return undefined;
            }

            if (scale.match(/.*?week.*?/)) {
				
                return 150 * zoom;
            }

            if (scale.match(/.*?month.*?/)) {
				
                return 300 * zoom;
            }

            if (scale.match(/.*?quarter.*?/)) {
				
                return 500 * zoom;
            }

            if (scale.match(/.*?year.*?/)) {
				
                return 800 * zoom;
            }
			
            return 40 * zoom;
        };

		$scope.getStaffInGantt = function(){
			//alle Bearbeiter suchen
			$.each($scope.options.useData,function(index){
					if($scope.options.useData[index].isStaff == true){
						$scope.staffArray.push($scope.data[index].graphId);
						/* console.log('push'); */
					}	
				});
		}
		/*Tasks*/
		
		
		$scope.fillDataObject = function(){
			//Mitarbeiter einfügen
			neo4jRequest.getStaffFromProject($stateParams.project).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on getTasksFromProject()', response.data); return; }
					 if(response.data){
						$scope.editors = Utilities.cleanNeo4jData(response.data);
						}
						return neo4jRequest.getTasksFromSubproject($stateParams.project,$stateParams.subproject)
			}).then(function(response){ //Aufgaben holen
				if(response.data.exception) { console.error('neo4jRequest Exception on getTasksFromSubproject()', response.data); return; }
					 if(response.data){
						 // console.log(response.data.data); 
						 $scope.root = Utilities.createHierarchy(response.data,['name','desc','priority','status','editors','from','to'], false)[0];
					 }
					 
					
				
				//Bearbeiter hinzufügen
				$.each($scope.editors, function(index){
					var eId = Utilities.getUniqueId();
					var currentEditor = $scope.editors[index].editorId;
							//console.log({name: Utilities.cleanNeo4jData(response.data)[index].editorName});
							$scope.data.push({id: eId,
											graphId: $scope.editors[index].editorId,
											name: $scope.editors[index].editorName,
											isStaff: true,
											'groups': false,
											children: [],
											tasks: []
											});
							
							
							
				//Aufgabenstruktur hinzufügen
				 
						 $.each($scope.root.children, function(indexC) {
							 
							 if($scope.root.children[indexC].editors.indexOf(currentEditor) != -1){
								 //console.log('gefunden');
								var id = Utilities.getUniqueId();
								var rowTask = {
									id: id,
									graphId: $scope.root.children[indexC].content,
									name: $scope.root.children[indexC].name,
									isStaff: false,
									parent: eId,
									children: [],
									status: $scope.root.children[indexC].status,
									priority: $scope.root.children[indexC].priority,
									data: [],
									editors: $scope.root.children[indexC].editors,
									tasks: [{graphId:$scope.root.children[indexC].content,
											name: $scope.root.children[indexC].name,
											color: $scope.root.children[indexC].status == 'status_todo' ? '#F1C232' : '#24ff6b',
											from: $scope.root.children[indexC].from,
											to: $scope.root.children[indexC].to}] 
									};
								
								$scope.data.push(rowTask);

								if($scope.root.children[indexC].children.length>0){ //wenn Kindobjekte vorhanden sind
									pushChildren($scope.root.children[indexC].children, rowTask);
								}
							 }
						 
						 function pushChildren(children, parentRow) {
							
							$.each(children,function(indexR){
								
								 if(children[indexR].editors.indexOf(currentEditor) != -1){
									var id = Utilities.getUniqueId();
									console.log(children[indexR]); 
									
									parentRow.children.push(id);
									//console.log(parentRow);
									
									if(children[indexR].editors.length == 1){
										var newRow = {	id: id,
														graphId: children[indexR].content,
														name: children[indexR].name,
														isStaff: false,
														parent: [],
														children: [],
														status: children[indexR].status,
														priority: children[indexR].priority,
														data: [],
														editors: children[indexR].editors,
														tasks: [{name: children[indexR].name,
																color: '#F1C232',
																from: children[indexR].from,
																to: children[indexR].to}] 
														};
										$scope.data.push(newRow);
										pushChildren(children[indexR].children, newRow); 
									}
								}
							});	
							
						}	
						});
						/* console.log($scope.root);*/
						console.log($scope.data); 
					});
				});	
		}
				
		$scope.addNewTask = function (newTask){	
			var gid = Utilities.getUniqueId();
			var tid = Utilities.getUniqueId();
			var hier= $scope.api.tree.getHierarchy();
			/* console.log(hier.ancestors(row)[hier.ancestors(row).length-1].model.name); */
			
			if($scope.sortby == 'staff'){
				$.each($scope.data,function(index){
					
					if($scope.data[index].name == $scope.newTask.task){
						$scope.taskExists = 'true';
						return false;
					}
				});	
				
					if($scope.taskExists == 'true'){ //wenn Aufgabe schon existiert
						if(confirm('Diese Aufgabe existiert schon! Wollen Sie die Aufgaben verknüpfen?')){
							neo4jRequest.getTaskDates($stateParams.project, $scope.newTask.task)//Daten aus Aufgabe in DB holen und einfügen
								.then(function(response) {
								var response = Utilities.cleanNeo4jData(response.data);//neue Aufgabe in Gantt einfügen, aber ohne id!!
										//Unterscheidung ob bei Bearbeiter oder aufgabe einzufügen //TODO
										$scope.data.push({graphId: response[0].graphId, name: response[0].name, isStaff: false, parent: $scope.newTask.staff, children: [], editors: [response[0].editors], priority: response[0].priority, status: response[0].status, data: [],
												  tasks: [{graphId: response[0].graphId, name: response[0].name, color: '#F1C232', from: response[0].from, to: response[0].to}]});
												  console.log(response);
									return neo4jRequest.connectTasks($stateParams.project, $stateParams.subproject, response[0].graphId, $scope.newTask.ids.graph) //Aufgabe mit neuem Bearbeiter verbinden
								})
								.then(function(response){ 
										console.log($scope.newTask.ids.graph);
										console.log(response);
										$scope.newTask.ids.graph = '';
										$scope.newTask.ids.gantt = '';
										$scope.newTask.staff = '';
										$scope.newTask.isStaff = '';
										$scope.newTask.clickedElement = '';
										$scope.newTask.task = '';
										$scope.newTask.from = '';
										$scope.newTask.to = '';
										$scope.newTask.desc = '';
										console.log($scope.newTask.task);
								});
							
						}
						$scope.taskExists = false;
					}
					
					else{
							if($scope.newTask.isStaff == true){ //wenn auf Bearbeiter geklickt wurde
								$scope.data.push({id: tid, graphId: gid, name: $scope.newTask.task, isStaff: false, parent: $scope.newTask.ids.gantt, children: [], editors: $scope.newTask.ids.gantt, priority: 'priority_high', status: 'status_todo', data: [],
												  tasks: [{id: tid, graphId: gid, name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});
								console.log($scope.newTask.staffID);
								//anhängen an Subprojekt -->$stateParams.subproject
									neo4jRequest.addTask($stateParams.project, $stateParams.subproject, gid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.ids.graph
														,getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
										.then(function(response){
										console.log(response.data);
								});
							}
								
							 else{ // wenn auf Aufgabe oder Unteraufgabe geklickt wurde
							 	//hinzufügen der Unteraufgabe
								$scope.data.push({id: tid, graphId: gid, name: $scope.newTask.task,isStaff: false, children: [], editors: $scope.newTask.ids.gantt, priority: 'priority_high', status: 'status_todo',data: [],
												  tasks: [{id: tid, graphId: gid, name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});
								//als child zu übergeordnetem Element hinzufügen
								console.log($scope.newTask.clickedElement.model);
								$scope.newTask.clickedElement.model.children.push(tid);
								//anhängen an parenttask --> statt $stateParams.subproject --> clickedElement
								
								
								 neo4jRequest.addTask($stateParams.project, $scope.newTask.clickedElement.model.graphId, gid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.ids.graph
													, getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
										.then(function(response){
										console.log(response.data);
										})
			
								
								$scope.newTask.clickedElement.tasks = []; //daten aus parent für gruppierung löschen
								console.log($scope.newTask.clickedElement.model.graphId);
								
								 neo4jRequest.deleteTaskDates($stateParams.project, $scope.newTask.clickedElement.model.graphId)
										.then(function(response){
										console.log('element gelöscht')
										console.log(response.data);
									});
								 
								
								$scope.taskExists = false;

								}
						}
				
					
				}
		else{
			alert('Bitte ändern Sie die Sortierung!');
			}
		}
				
		
		$scope.getIndex = function(event, ui, indexStaff){
			/*console.log(indexStaff);*/
			$scope.indexDnD = indexStaff;
		}
		
		$scope.addNewStaffToGantt = function(){
			/*Mitarbeiter existiert bereits?*/	
		if($scope.sortby == 'staff'){
			$.each($scope.data,function(index){
					if($scope.staff[$scope.indexDnD].name == $scope.data[index].name){
						$scope.staffExists = true;
						return false;
					}
				});
					
				if($scope.staffExists == true){
					alert('Nutzer existiert leider schon!');
					$scope.staffExists = false;
				}
				else{
					$scope.data.push({graphId: $scope.staff[$scope.indexDnD].sid, name: $scope.staff[$scope.indexDnD].name, isStaff: true, 'groups': false, children: [], tasks:[]});
					$scope.staffArray.push($scope.staff[$scope.indexDnD].sid);
					
					
					neo4jRequest.addStaffToGraph($stateParams.project, $scope.staff[$scope.indexDnD].sid, $scope.staff[$scope.indexDnD].name) .then(function(response){
					if(response.data.exception) { console.error('neo4jRequest Exception on addStaffToGraph()', response.data); return; }
					 if(response.data){
						 console.log('Bearbeiter hinzugefügt');
						}
						
					}); 
					
					$scope.staffExists = false;
					console.log($scope.data);
				}
			}
			
			else{
				alert('Bitte ändern Sie die Sortierung!');
			}
		
		}
		
		$scope.editTask = function(data, row){
			
			var isChanged = false;
			var found = false;
				//name in linker und rechter Spalte ändern
				$.each($scope.options.useData,function(index){ //prüfen, ob bereits vorhandene Aufgabe leer ist
					console.log($scope.options.useData[index].name);
					if($scope.options.useData[index].name == data && isChanged == false){
						console.log('gefunden');
						if(confirm('Diese Aufgabe existiert bereits, wollen Sie die Daten übernehmen?') ){
							row.model.name = data;
							row.model.tasks[0].name = $scope.options.useData[index].tasks[0].name;
							row.model.tasks[0].from = $scope.options.useData[index].tasks[0].from;
							row.model.tasks[0].to = $scope.options.useData[index].tasks[0].to;
							isChanged = true; //nur einmal fragen
							found = true;
						}
					}
				});
				
				if(!found){
					row.model.name = data;
					row.model.tasks[0].name = data;
				}
		}
		
		$scope.sortByTasks = function(){	
	
			if($scope.sortby == 'staff'){
			/* $.each($scope.data,function(index){ // Array mit Aufgaben anlegen
					if($scope.data[index].isStaff == false/* && $scope.parentIsStaff($scope.data[index].parent)*/){// ist Oberaufgabe
						$scope.tasksArray.push($scope.data[index].name);
					}
				});
			
			console.log($scope.tasksArray);
			$scope.tasksArray = $.unique($scope.tasksArray);	
			$scope.tasksArray.reverse();
			console.log($scope.tasksArray);
			
			
			//array mit tasks und editors bauen
				//tasksArray einträge werden aufgabenobjekte
				$.each($scope.tasksArray,function(indexT){
					$scope.dataTasks.push({name: $scope.tasksArray[indexT], children: [], editors: []});
					
				});
				
				console.log($scope.dataTasks);
				
				//aufgabenobjekte bekommen editors
				/*	console.log($scope.data);*/
			$.each($scope.dataTasks,function(indexT){
				$.each($scope.data,function(indexD){ 
				//Oberaufgaben bekommen als Editor Parentobjekte
					if($scope.dataTasks[indexT].name == $scope.data[indexD].name /* && $scope.parentIsStaff($scope.data[indexD].parent) */){
						$scope.dataTasks[indexT].id= $scope.data[indexD].id;
						$scope.dataTasks[indexT].isStaff= $scope.data[indexD].isStaff;
						$scope.dataTasks[indexT].parent= '';
						$scope.dataTasks[indexT].children = $scope.dataTasks[indexT].children.concat($scope.data[indexD].children);
						$scope.dataTasks[indexT].status= $scope.data[indexD].status;
						$scope.dataTasks[indexT].priority= $scope.data[indexD].priority;
						$scope.dataTasks[indexT].hasData= $scope.data[indexD].hasData;
						$scope.dataTasks[indexT].tasks = $scope.data[indexD].tasks;
						$scope.dataTasks[indexT].editors = $scope.dataTasks[indexT].editors.concat($scope.getStaffById($scope.data[indexD].editors));
					}
				});
			});	
			//children auf dopplungen prüfen
			$.each($scope.dataTasks,function(indexD){
				$scope.removeDoubleChildren($scope.dataTasks[indexD].children);
			});
			
			console.log($scope.dataTasks);
			//Datenarray umschalten, Spalte hinzufügen
			$scope.options.columns.push('model.editors');
			$scope.options.useData = $scope.dataTasks;
			$scope.sortby = 'task';
			console.log($scope.dataTasks); */
			};
		}
		
		$scope.sortByStaff = function(){
			if($scope.sortby == 'task'){
				$scope.tasksArray= [];
				$scope.tasksWithEditors= [];
				$scope.dataTasks= [];
				$scope.options.useData = $scope.data;
				$scope.options.columns.splice($scope.options.columns.length-1,1);
				$scope.sortby = 'staff';
			};
		}

		$scope.getStaffById= function(pid){
			/*console.log('pid' + pid);*/
			var tmp = '';
				$.each($scope.data, function(indexD){
					if(pid == $scope.data[indexD].id){
						tmp = $scope.data[indexD].name;
						/*console.log(tmp);*/
					}
			});	
			return tmp;
		}

		$scope.removeDoubleChildren = function(children){ 
			//existiert childid in Datenobjekt, wenn nicht entfernen
			//Länge anpassen
			var length = children.length;
			for(i = 0; i<length-1; i++){
					if(!$scope.childExists(children[i])){
						children.splice(i,1);
						length--;
						}
			};
		}
		
		$scope.childExists = function(childID){
			found = false;
			$.each($scope.dataTasks, function(index){
				if(childID == $scope.dataTasks[index].id){
					found = true;
				}
			});
			
			return found;
		}

		/* $scope.getChildrensEditor = function(id){
			var editors = [];
	
				$.each($scope.data,function(indexD){
						//jedes childrenobjekt mit id vergleichen
						if($scope.data[indexD].children.indexOf(id) !== -1){
						//console.log('child gefunden');
						editors.push($scope.getParentById($scope.data[indexD].parent)); //$scope.getParentById($scope.data[indexD].parent)
						//console.log('editors ' + editors);
					 	}
				});	
			
			//rückgabe array aller bearbeiter
			return editors;
		} */
		
		$scope.parentIsStaff = function(pid){ 
				if($scope.staffArray.indexOf(pid)!== -1){
				return true;
			}	
			else{
				return false;
			}
				
			
		}
		
		$scope.changeStatus = function(row){
			if($scope.sortby == 'staff'){
				$.each($scope.data,function(index){
					if(row.model.id == $scope.data[index].id){
					console.log(row.model)
						if($scope.data[index].status == 'status_todo'){
							if(confirm("Ist die Aufgabe wirklich erledigt?")){
								$scope.data[index].status = 'status_done';
								$scope.data[index].tasks[0].color = '#24ff6b';
								
									neo4jRequest.changeStatus($stateParams.project, row.model.graphId, 'status_todo','status_done') .then(function(response){
										if(response.data.exception) { console.error('neo4jRequest Exception on changeStatus()', response.data); return; }
										if(response.data){
											console.log(response.data);
											}
									});
								}
							return false;
							}
						
						else{
							$scope.data[index].status = 'status_todo';
								$scope.data[index].tasks[0].color = '#F1C232';
								
								neo4jRequest.changeStatus($stateParams.project, row.model.graphId, 'status_done','status_todo') .then(function(response){
									if(response.data.exception) { console.error('neo4jRequest Exception on changeStatus()', response.data); return; }
									if(response.data){
										console.log(response.data);
										}
								});
							return false;
						}
						
					}
				});
			}
			else{
				alert('Bitte ändern Sie die Sortierung!');
			}
		};
		
		$scope.changePriority = function(row){
			
			if($scope.sortby == 'staff'){
				$.each($scope.data,function(index){
					if(row.model.id == $scope.data[index].id){
						
						if($scope.data[index].priority == 'priority_low'){
							$scope.data[index].priority = 'priority_medium';
							
							neo4jRequest.changePriority($stateParams.project, row.model.graphId, 'priority_low','priority_medium') .then(function(response){
								if(response.data.exception) { console.error('neo4jRequest Exception on changePriority()', response.data); return; }
								if(response.data){
									}
							});
							
							return false;
						}
						
						if($scope.data[index].priority == 'priority_medium'){
							$scope.data[index].priority = 'priority_high';
							
							neo4jRequest.changePriority($stateParams.project, row.model.graphId, 'priority_medium','priority_high') .then(function(response){
								if(response.data.exception) { console.error('neo4jRequest Exception on changePriority()', response.data); return; }
								if(response.data){
									}
							});
							return false;
						}
						
						if($scope.data[index].priority == 'priority_high'){
							$scope.data[index].priority = 'priority_low';
							
							neo4jRequest.changePriority($stateParams.project, row.model.graphId, 'priority_high','priority_low') .then(function(response){
								if(response.data.exception) { console.error('neo4jRequest Exception on changePriority()', response.data); return; }
								if(response.data){
									}
							});
							return false;
						}
					}
				});
			}
		else{
				alert('Bitte ändern Sie die Sortierung!');
			}
		};	
		
		$scope.deleteTask = function(row) {
			
			//console.log('data vorher');
			//console.log($scope.data);
			
			var removeFromGantt = [];
			var hier= $scope.api.tree.getHierarchy();
			var removeFromGraph = [];
			
			if(confirm("Wollen Sie diese Aufgabe wirklich löschen?")){
				
				if(hier.children(row)){ //wenn oberaufgabe gelöscht werden soll
					
					$.each(hier.descendants(row),function(indexC){ //alle childrenobjekte raussuchen und zum löschen übergeben
						removeFromGantt.push({'id': hier.descendants(row)[indexC].model.id});
						removeFromGraph.push({'gid': hier.descendants(row)[indexC].model.graphId});
					});
					removeFromGantt.splice(0,0,{'id': row.model.id}); //Elternobjekt zum löschen übergeben
					removeFromGraph.splice(0,0,{'gid': row.model.graphId});
					
				}
				else{
					if(hier.parent(row).model.children.length == 1){
						
						hier.parent(row).model.tasks.push({name: hier.parent(row).model.name, color: '#F1C232',from: row.model.tasks[0].from,to: row.model.tasks[0].to});
						
						neo4jRequest.setTaskDates($stateParams.project,hier.parent(row).model.graphId, row.model.tasks[0].from, row.model.tasks[0].to)
						.then(function(response){
							console.log(response.data);
						}); 
					}
					
					removeFromGantt.push({'id': row.model.id}); 
					removeFromGraph.push({'gid': row.model.graphId});
					if(hier.children(row)){
						hier.parent(row).model.children.splice(hier.parent(row).model.children.indexOf(row.model.id,1)); //childrenobjekt in parent löschen
					}
				}
				$scope.api.data.remove(removeFromGantt);
				
				
				
				$.each(removeFromGraph,function(indexD){
					neo4jRequest.deleteTask($stateParams.project,removeFromGraph[indexD].gid)
						.then(function(response){
							console.log($stateParams.project);
							console.log(removeFromGraph[indexD]);
						console.log(response.data);
						}); 
				});
				
				console.log('data nacher');
				console.log($scope.data);
			}
			
        };
		
		$scope.countChildren = function(row,length, hier){
			console.log(hier.parent(row).model.name);
				for (i= 0; i < length; i++) {
					if(hier.parent(row).model.name == $scope.data[i].parent){
						$scope.childCounter++;
						}
					}
			
		}
		
		$scope.showAsideForTask = function(row){
			var hier= $scope.api.tree.getHierarchy();
			if(row.model.isStaff == true){
				$scope.newTask.ids.gantt = row.model.id
				$scope.newTask.ids.graph= row.model.graphId; //klcik auf Bearbeiter speichert BearbeiterId direkt
				$scope.newTask.staff= row.model.name;
				$scope.newTask.isStaff = row.model.isStaff;
			}
			
			else{
				$scope.newTask.ids.gantt = hier.ancestors(row)[hier.ancestors(row).length-1].model.id
				$scope.newTask.ids.graph = hier.ancestors(row)[hier.ancestors(row).length-1].model.graphId ////klcik auf Aufgabe ermittelt root-Element -->Bearbeiter
				$scope.newTask.staff= hier.ancestors(row)[hier.ancestors(row).length-1].model.name;
				$scope.newTask.clickedElement= row;
				$scope.newTask.isStaff = row.model.isStaff;
			}
			//console.log($scope.newTask.clickedElement);
			var aside = $aside({scope: $scope, templateUrl: 'partials/aside/asideTasks.html', placement: 'right', animation: 'am-fade-and-slide-right', container: '.tasksLeft' , backdrop: false});
			aside.show();
		}
		
		$scope.showAsideForComment = function(row){
			$scope.taskNameForComment= row.model.name;
			$scope.taskIdForComment= row.model.graphId; //--> dient der Indexermittlung der Aufgabe
			/* console.log($scope.taskNameForComment);*/
			// console.log($scope.taskIdForComment); 
			
		/* 	$.each($scope.data,function(index){
				if($scope.data[index].id == $scope.taskIdForComment){ //-->in allen Aufgaben mit gleichem Namen steht Kommenta
					$scope.commentIndex = index;
					console.log($scope.commentIndex);
				}
			}); */
			
			neo4jRequest.getCommentsFromTask(row.model.graphId)
						.then(function(response){
							if(response.data.exception) { console.error('neo4jRequest Exception on getCommentFromTask()', response.data); return; }
							if(response.data){
								$scope.comments = Utilities.cleanNeo4jData(response.data);
								console.log($scope.comments);
								}
						});
			
			var aside = $aside({scope: $scope, templateUrl: 'partials/aside/asideComments.html', placement: 'right', animation: 'am-fade-and-slide-right', container: '.tasksLeft' , backdrop: false});
			aside.show();
		}
		
		$scope.addComment = function(){
			 /* $.each($scope.data,function(index){
				if($scope.data[index].name == $scope.taskNameForComment){ //-->in allen Aufgaben mit gleichem Namen steht Kommentar					
					$scope.data[index].data.push({desc: $scope.newComment.text,  date: new Date() });
					$scope.data[index].hasData = true;
					console.log($scope.data[index].data);
				} 
			}); */
				
				$scope.comments.push({desc: $scope.newComment.text,  date: new Date() });
				
				neo4jRequest.addCommentToTask($stateParams.project,$scope.taskIdForComment, $scope.newComment.text)
						.then(function(response){
											console.log(response.data);
										});
		
			/*$scope.views.activeSide = 'comments';*/	
		}
				
	/*Mitarbeiter*/
		
		$scope.getAllStaff = function() {
			mysqlRequest.getAllStaff().success(function(obj, status){
					$scope.staff = obj.data;
					//console.log($scope.staff);
			});
		};
		
		$scope.removeStaff = function(id) {
			mysqlRequest.removeStaff(id).success(function(answer, status){
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
						console.error('Mitarbeiter gelöscht');
						$scope.getAllStaff();
					});
		};
			
		$scope.addNewStaffToProject = function() {
			mysqlRequest.addNewStaff($scope.newStaff.name, $scope.newStaff.surname, $scope.newStaff.mail, $scope.newStaff.role).success(function(answer, status){
					//alert(answer);
						if(answer != 'SUCCESS') {
							console.error(answer);
							
							return;
						}
						$scope.getAllStaff();
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
		
		$scope.updateSurname = function(data,id) {
		
			mysqlRequest.updateSurname(data,id).success(function(answer, status){
				
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
		
		$scope.updateRole = function(data,id) {
			mysqlRequest.updateRole(data,id).success(function(answer, status){
				
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
				$scope.getAllStaff();
			});
		}

		var changeTask = function(eventName, task) {
		 	$.each($scope.options.useData,function(index){
				console.log($scope.options.useData[index].graphId);
				console.log(task.model);
					if($scope.options.useData[index].graphId == task.model.graphId){
							$scope.options.useData[index].tasks[0].from = task.model.from ;
							$scope.options.useData[index].tasks[0].to = task.model.to;
					}
				});
				
			neo4jRequest.setTaskDates($stateParams.project,task.model.graphId, task.model.from, task.model.to)
						.then(function(response){
							console.log(response.data);
						}); 
				
			$scope.api.groups.refresh();
        };
        
		var logReadyEvent = function() {
           // $log.info('[Event] core.on.ready');
        };
		var logDataEvent = function(eventName) {
           // console.log('[Event] ' + eventName);
        };

        
        // Event utility function
        var addEventName = function(eventName, func) {
            return function(data) {
                return func(eventName, data);
            };
        };
	
	//initiiere Staff
	$scope.getAllStaff();
	$scope.fillDataObject();
	$scope.getStaffInGantt();
	console.log($scope.data);
	}]);

function extractData(data) {
	var results = [];
	for(var i=0; i<data.data.length; i++) {
		var object = new Object();
		for(var j=0; j<data.columns.length; j++) {
			if(data.data[i][j] == null)
				//object[data.columns[j]] = 'unbekannt';
				object[data.columns[j]] = null;
			else
				object[data.columns[j]] = data.data[i][j].data;
				//object[data.columns[j]] = data.data[i][j].data.content;
		}
		results.push(object);
	}
	return results;
}

function cleanData(data, selected) {
	selected = selected || false;
	var results = [];
	for(var i=0; i<data.data.length; i++) {
		var obj = new Object();
		for(var j=0; j<data.columns.length; j++) {
			if(data.data[i][j] == null)
				//obj[data.columns[j]] = 'unbekannt';
				obj[data.columns[j]] = null;
			else
				obj[data.columns[j]] = data.data[i][j];
		}
		if(selected)
			obj.selected = false;
		results.push(obj);
	}
	return results;
}

function createHierarchy(data) {
	var results = [];
	for(var i=0, l=data.data.length; i<l; i++) {
		var parent = {};
		/*parent.file = data.data[i][0].file.data;
		parent.obj = data.data[i][0].obj.data;*/
		parent.content = data.data[i][0].parent.data.content;
		parent.children = [];
		for(var j=0, m=data.data[i][1].length; j<m; j++) {
			var child = {};
			child.file = data.data[i][1][j].file.data;
			child.obj = data.data[i][1][j].obj.data;
			child.content = data.data[i][1][j].child.data.content;
			child.children = [];
			parent.children.push(child);
		}
		results.push(parent);
	}
	for(var i=0; i<results.length; i++) {
		for(var j=0, m=results.length; j<m; j++) {
			if(i===j) continue;
			var p = getElementInHierarchy(results[j], results[i].content);
			if(p !== undefined) {
				p.children = results[i].children;
				results.splice(i,1);
				i--;
				break;
			}
		}
	}
	return results;
}
function getElementInHierarchy(node, content) {
	if(node.content === content) return node;
	for(var i=0, l=node.children.length; i<l; i++) {
		var obj = getElementInHierarchy(node.children[i], content);
		if(obj !== undefined) return obj;
	}
	return undefined;
}

