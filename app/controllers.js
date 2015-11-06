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
	
webglControllers.controller('projectlistCtrl', ['$scope', '$http', 'phpRequest', 'mysqlRequest', 'neo4jRequest', 'Utilities',
	function($scope, $http, phpRequest, mysqlRequest, neo4jRequest, Utilities) {
		
		// Initialisierung von Variablen
		$scope.projects = [];
				
		$scope.newProject = new Object();
		$scope.newProject.name = '';
		$scope.newProject.nameError = false;
		$scope.newProject.description = '';
		
		$scope.getAllProjects = function() {
			mysqlRequest.getAllProjects().success(function(obj, status){
					console.log(obj);
					$scope.projects = obj.data;
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
			
			phpRequest.createProjectFolders(prj).success(function(answer, status){
				
				if(answer != 'SUCCESS') {
					console.error(answer);
					return;
				}
				
				neo4jRequest.createInitProjectNodes(prj).success(function(answer, status){
					console.log(answer);	
					mysqlRequest.newProjectEntry(prj, $scope.newProject.name, $scope.newProject.description).success(function(answer, status){
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
						$scope.newProject.name = '';
						$scope.newProject.description = '';
						$scope.getAllProjects();
					});
				});
			});
		};
		
		$scope.deleteProject = function(prj) {
			neo4jRequest.deleteAllProjectNodes(prj).success(function(answer, status){
				console.log(answer);
				phpRequest.deleteProjectFolders(prj).success(function(answer, status){
					if(answer != 'SUCCESS') {
						console.error(answer);
						return;
					}
					mysqlRequest.removeProjectEntry(prj).success(function(answer, status){
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
						console.error('Projekt gelöscht');
						$scope.getAllProjects();
					});
				});
			});
		};
		
		$scope.updateProjectDescription = function(data,id) {
			mysqlRequest.updateProjectDescription(data,id).success(function(answer, status){
				
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
			});
			
			$scope.getAllProjects();
		}
		
		
		
		
		// oninit Funktionsaufrufe
		$scope.getAllProjects();
		
		
	}]);

webglControllers.controller('projectCtrl', ['$scope', '$stateParams',
	function($scope, $stateParams) {
	
		console.log('projectCtrl init');
	
		$scope.project = $stateParams.project;
		
		
		//$scope.modalParams
		
		// Überprüfen, ob Nutzer Zugriff auf Projekt hat
		// Zugriffsrechte und Rolle auslesen
		
	}]);
	
webglControllers.controller('explorerCtrl', ['$scope', '$stateParams', '$timeout', '$sce', 'neo4jRequest', 'phpRequest', 'mysqlRequest', 'FileUploader', 'Utilities', 'webglInterface', '$modal',
	function($scope, $stateParams, $timeout, $sce, neo4jRequest, phpRequest, mysqlRequest, FileUploader, Utilities, webglInterface, $modal) {

		//$scope.selected = [];
		/*$scope.consel = function(id) {
			$scope.selected = id;
		}*/
		
		/*$scope.showhide = function(id, bool) {
			$scope.setVisible = {id: id, visible: bool};
		}*/
		
		
		
		
		// Initialisierung von Variablen
		$scope.project = $stateParams.project;
		
		$scope.wi = webglInterface;
		
		$scope.views = new Object();
		$scope.views.activeMain = '3dview';
		//$scope.views.activeSide = 'objlist';
		$scope.views.activeSide = 'comments';
		
		//Mitarbeiter
		/*$scope.staff = [];*/
						
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
		$scope.listSettings = 'layers';
		
		// Screenshots
		$scope.screenshots = [];
		
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
	
		// Uploader für Quellen
		$scope.sourcesUploader = new FileUploader();
		
		$scope.sourcesUploader.filters.push({
			name: 'imageFilter',
			fn: function(item, options) {
				var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|tiff|'.indexOf(type) !== -1;
			}
		});
        $scope.sourcesUploader.onWhenAddingFileFailed = function(item, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
			$scope.alert.message = 'Nicht unterstütztes Dateiformat';
			$scope.alert.showing = true;
        };
        $scope.sourcesUploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
			fileItem.tid = new Utilities.Base62().encode(new Date().getTime());
			fileItem.newFileName = fileItem.tid + '_' + fileItem.file.name.replace(/ /g, "_");
			sleep(1);
        };
        $scope.sourcesUploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
			//$scope.openSourceTypeDialog();
			$scope.openInsertForm('source');
        };
		
		// Modal öffnen
		$scope.openInsertForm = function(type, attach) {			
			$scope.modalParams = {
				modalType: 'large',
				type: type,
				attachTo: attach || undefined,
				queue: $scope.sourcesUploader.queue
			};
			$modal({
				title: 'Plan einfügen',
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
		$scope.openScreenshotDetail = function(path, filename, data) {
			$scope.modalParams = {
				modalType: 'xlarge',
				path: path,
				filename: filename,
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
		
		$scope.openAddStaff = function(type) {
			$scope.overlayParams.url = 'partials/addStaff.html';
		};
		
		// close overlayPanel
		$scope.closeOverlayPanel = function(update) {
			var doUpdate = update || false;
			if(doUpdate && ['picture', 'plan', 'source'].indexOf($scope.overlayParams.type) > -1)
				$scope.getAllDocuments();
			if(doUpdate && $scope.overlayParams.url == 'partials/screenshot_detail.html')
				$scope.getScreenshots();
			if(doUpdate && ['staff'].indexOf($scope.overlayParams.type) > -1)
				$scope.getAllStaff();
			
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
		
		$scope.getAllDocuments = function() {
			//neo4jRequest.getPlanFromObject('G_marhanna').success(function(data, status){
			neo4jRequest.getAllDocuments($scope.project).success(function(data, status){
				
				//console.log($scope.models);
				console.log(data, status);
				if(!data) { console.error('neo4jRequest failed'); return; }
				$scope.sourceResults = cleanData(data, true);
				console.log($scope.sourceResults);
				
				/*for(var i=0; i<files.length; i++) {
					$scope.callDirFunc.loadPlanIntoScene('data/Proj_Muristan/plans/models/', files[i].file);
				}*/
			});
		};
		
		$scope.open3DPlan = function(e31id, e36id) {
			neo4jRequest.getAttached3DPlan($scope.project, e31id, e36id).success(function(data, status){
				
				//console.log($scope.models);
				//console.log(data, status);
				if(!data) { console.error('neo4jRequest failed'); return; }
				var edata = extractData(data)[0];
				console.log(edata);
				
				$scope.callDirFunc.loadCTMPlanIntoScene(edata.object, edata.file);
				
				/*for(var i=0; i<files.length; i++) {
					$scope.callDirFunc.loadPlanIntoScene('data/Proj_Muristan/plans/models/', files[i].file);
				}*/
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
			neo4jRequest.getModelsWithChildren($scope.project).success(function(data, status){
				//console.log(data);
				var root = createHierarchy(data)[0];
				console.log(root);
				
				function getNodes(nodes, parent) {
					for(var i=0; i<nodes.length; i++) {
						$scope.callDirFunc.loadCTMIntoScene(nodes[i].obj, nodes[i].file, parent);
						getNodes(nodes[i].children, nodes[i].obj.content);
					}
				}
				if(root)
					getNodes(root.children, 0);
				
			});
		};
		
		$scope.logModels = function() {
			console.log($scope.hierarchList);
			console.log($scope.layerList);
			/*var time = new Date().getTime();
			console.log(time);
			console.log(new Base62().encode(time));*/
		};
		
		$scope.makeScreenshot = function() {
			var tid = new Base62().encode(new Date().getTime());
			var path = 'data/' + $scope.project + '/screenshots/';
			var filename = tid + '_screenshot.jpg';
			
			var data = $scope.callDirFunc.getScreenshot();
			//console.log(dataUrl);
			
			$scope.openScreenshotDetail(path, filename, data);
			/*
			phpRequest.saveBase64Image(path, filename, screenData.dataUrl).success(function(data, status){
				console.log(data, 'ready for neo4j');
				$scope.openScreenshotDetail(path, filename, data);
			});*/
		};
		
		$scope.getScreenshots = function() {
			neo4jRequest.getScreenshotsWithMarkers($scope.project).success(function(data, status){
				
				$scope.screenshots = cleanData(data);
				console.log(data, $scope.screenshots);
			});
		};
		
		
		$scope.callDirFunc = {};
		
		//Ein- und Ausklappen des COnatiners am rechten Rand
		$scope.expandPanelContainer = function(e) {
			var btn = $(e.delegateTarget);
			//console.log(btn.parent().css('right'));
			if(btn.parent().css('right') == '0px') {
				btn.children('span').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-left');
				btn.parent().animate({ right: '-280px' }, 500);
			}
			else {
				btn.children('span').removeClass('glyphicon-chevron-left').addClass('glyphicon-chevron-right');
				btn.parent().animate({ right: '0' }, 500);
			}
		};
		
		// Ein- und Ausklappen der ViewportControlPanels (rechter Rand)
		$scope.expandVpCtrlPanel = function(e) {
			var btn = $(e.target);
			var body = btn.parent().parent().parent().find('.ctrlPanel-body');
			if(body.is(':visible')) {
				btn.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
			}
			else {
				btn.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
				btn.parent().parent().removeClass('hiddenBody');
			}
			
			body.slideToggle(300, function() {
			});
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
		
		$scope.$watch('selected', function(value) {
			
			if(value) {
				console.log('watch', value);
				if($.isEmptyObject(value)) return;
				//$('#listScroll').scrollTo('500px');
				document.getElementById(value.name).scrollIntoView();
			}
		});
		
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
		
		
		// wenn Controller zerstört wird
		$scope.$on('$destroy', function(event) {
			webglInterface.clearLists();
		});
		
	}]);

webglControllers.controller('addNewStaffCtrl', ['$scope', '$timeout', '$sce', 'phpRequest', 'mysqlRequest', 
	function($scope, $timeout, $sce, phpRequest, mysqlRequest) {
		
		/*$scope.newStaff = new Object();
		
		$scope.newStaff.name = '';
		$scope.newStaff.surname = '';
		$scope.newStaff.mail = '';
		$scope.newStaff.role = '';
		$scope.newStaff.projects = '';
		
		$scope.addNewStaff = function() {
						
			mysqlRequest.addNewStaff($scope.newStaff.name, $scope.newStaff.surname, $scope.newStaff.mail, $scope.newStaff.role).success(function(answer, status){
					//alert(answer);
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
			});
		$scope.getAllStaff();
		
		}*/
		
		
		
		}]);
webglControllers.controller('insertSourceCtrl', ['$scope', 'FileUploader', 'neo4jRequest', '$timeout',
	function($scope, FileUploader, neo4jRequest, $timeout) {
		
		
		// init
		var isInserting = false;
		
		//$scope.insert = $scope.$parent.overlayParams;
		//$scope.insert.project = $scope.$parent.project;
		$scope.insert = {params: {type: 'plan', attachTo: undefined}};
		$scope.insert.phpurl = '';
		$scope.insert.uploadType = '';
		$scope.insert.formTitle = '';
		//console.log($scope.insert, $scope.$parent.project);
		
		console.log($scope);
		
		switch($scope.insert.params.type) {
			case 'source':
				$scope.insert.phpurl = 'php/upload.php';
				$scope.insert.uploadType = 'image';
				$scope.insert.formTitle = 'Quelle hinzufügen';
				$scope.insert.type = 'plan';
				break;
			case 'plan':
				$scope.insert.phpurl = 'php/upload.php';
				$scope.insert.uploadType = 'image';
				$scope.insert.formTitle = 'Pläne hinzufügen';
				break;
			case 'picture':
				$scope.insert.phpurl = 'php/upload.php';
				$scope.insert.uploadType = 'image';
				$scope.insert.formTitle = 'Bilder hinzufügen';
				break;
			case 'model':
				$scope.insert.phpurl = 'php/processDAE.php';
				$scope.insert.uploadType = 'model';
				$scope.insert.formTitle = '3D-Modell hochladen';
				$scope.insert.type = $scope.insert.params.type;
				break;
			case 'chooseSign':
				$scope.insert.phpurl = 'php/getSigns.php';
				$scope.insert.formTitle = 'Steinmetzzeichen auswählen';
				$scope.insert.type = $scope.insert.params.type;
				break;
			case 'plans/model':
				$scope.insert.phpurl = 'php/planmodelFromZip.php';
				$scope.insert.uploadType = 'zip';
				$scope.insert.formTitle = '3D-Plan hochladen';
				$scope.insert.type = $scope.insert.params.type;
				break;
			default: break;
		}
		
		$scope.globals = {};
		$scope.globals.type = $scope.insert.params.type;
		$scope.globals.author = '';
		$scope.globals.useAuthor = false;
		$scope.globals.creationDate = '';
		$scope.globals.useCreationDate = false;
		$scope.globals.creationPlace = '';
		$scope.globals.useCreationPlace = false;
		
		$scope.suggestions = [];
		
		
		var uploader = $scope.uploader = new FileUploader({
            url: $scope.insert.phpurl
        });
		//uploader.queue = $scope.insert.params.queue;

        // FILTERS
		
		if($scope.insert.uploadType == 'image') {
			uploader.filters.push({
				name: 'imageFilter',
				fn: function(item /*{File|FileLikeObject}*/, options) {
					var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
					return '|jpg|png|jpeg|bmp|gif|tiff|'.indexOf(type) !== -1;
				}
			});
		}
		else if($scope.insert.uploadType == 'model') {
			uploader.filters.push({
				name: 'modelFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|dae|DAE|obj|'.indexOf(type) !== -1;
				}
			});
		}
		else if($scope.insert.uploadType == 'zip') {
			uploader.filters.push({
				name: 'zipFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|zip|ZIP|'.indexOf(type) !== -1;
				}
			});
		}
		
		// CALLBACKS

        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
			$scope.$parent.alert.message = 'Nicht unterstütztes Format!';
			$scope.$parent.alert.showing = true;
        };
        uploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
			fileItem.tid = new Base62().encode(new Date().getTime());
			fileItem.newFileName = fileItem.tid + '_' + fileItem.file.name.replace(/ /g, "_");
			sleep(1);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
			
			var formData = {
				title: item.title,
				archive: item.archive,
				author: ($scope.globals.useAuthor) ? $scope.globals.author : item.author,
				creationDate: ($scope.globals.useCreationDate) ? $scope.globals.creationDate : item.creationDate,
				creationPlace: ($scope.globals.useCreationPlace) ? $scope.globals.creationPlace : item.creationPlace,
				comment: item.comment,
				oldFileName: item.file.name,
				newFileName: item.newFileName,
				fileType: item.file.name.split(".").pop(),
				pureNewFileName: item.newFileName.slice(0, item.newFileName.lastIndexOf(".")),
				path: 'data/'+$scope.$parent.project+'/'+item.sourceType+'s/',
				sourceType: item.sourceType,
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
			
			//neo4jRequest.testInputsForExistingNodes(testObjects).success(function(data, status){*/
			if($scope.insert.uploadType == 'image') {
				waitfor(function(){return isInserting;}, false, 50, {}, function(params) {
					isInserting = true;
					neo4jRequest.insertDocument($scope.$parent.project, fileItem.formData[0]).success(function(data, status){
						//var res = cleanData(data);
						console.log('insertDocument', data);
						isInserting = false;
					});
				});
			}
			
			else if($scope.insert.uploadType == 'model') {
				
				function neo4jinsertNode(prj, formData, params) {
					//var obj = $.extend(true, {}, objData);
					neo4jRequest.insertModel(prj, formData, params.obj).success(function(data, status){
						//var res = cleanData(data);
						console.log('insertModel', data);
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
						fileItem.isInserting = true;
						fileItem.anzInserting++;
						waitfor(function(){return isInserting;}, false, 50, {obj: nodes[i]}, function(params) {
							isInserting = true;
							//fileItem.isInserting = true;
							neo4jinsertNode($scope.$parent.project, fileItem.formData[0], params);
							/*neo4jRequest.insertModel($scope.$parent.project, fileItem.formData[0], nodes[i]).success(function(data, status){
								//var res = cleanData(data);
								console.log('insertModel', data);
								isInserting = false;
								insertNodes(nodes[i].children);
							});*/
						});
					}
				}
				insertNodes(response);
			}
			
			else if($scope.insert.uploadType == 'zip') {
				console.log('everythin done - start cypher query');
				isInserting = true;
				neo4jRequest.attach3DPlan($scope.$parent.project, fileItem.formData[0], response, $scope.insert.params.attachTo).success(function(data, status){
					//var res = cleanData(data);
					console.log('attach3DPlan', data);
					isInserting = false;
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
		
		/*for(var i=0; i<$scope.insert.params.queue.length; i++) {
			uploader.addToQueue($scope.insert.params.queue[i]._file);
		}*/
		
		$scope.initItem = function(item) {
			item.sourceType = $scope.insert.type;
			item.title = '';
			item.titleError = false;
			item.author = '';
			item.archive = '';
			item.creationDate = '';
			item.creationPlace = '';
			item.comment = '';
			item.isInputError = false;
			item.isProcessing = false;
			item.isInserting = false;
			item.anzInserting = 0;
			item.anzInserted = 0;
		}
		
		$scope.checkAndUploadAll = function() {
			// wait for responses and validate inputs
			setTimeout(function() {
				if($scope.insert.uploadType == 'image') {
					for(var i=0, l=uploader.queue.length; i<l; i++) {
						if(uploader.queue[i].title == '' || uploader.queue[i].titleError)
							uploader.queue[i].isInputError = true;
						else
							uploader.queue[i].isInputError = false;
					}
				}
				uploader.uploadAll();
			}, 1000);
		}
		
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
				angular.element(event.target).find('input').trigger('click');
			});
		};
		
	}]);
	
webglControllers.controller('sourceTypeCtrl', ['$scope',
	function($scope) {
		
		console.log('sourceTypeCtrl init');
		
		
		
	}]);
	
webglControllers.controller('sourceDetailCtrl', ['$scope',
	function($scope) {
		
		console.log('sourceDetailCtrl init');
		
		$scope.horizontalImage = false;
		
		var items = $scope.$parent.filteredSourceResults;
		$scope.itemindex = $scope.$parent.modalParams.index;
		
		$scope.nextItem = function(incr) {
			$scope.itemindex = (($scope.itemindex + incr) % items.length + items.length) % items.length;
			$scope.item = items[$scope.itemindex];
			var img = new Image();
			img.onload = function() {
				if(this.width/this.height > 2)
					$scope.horizontalImage = true;
				else
					$scope.horizontalImage = false;
				$scope.$apply();
			}
			img.src = $scope.item.file.path+$scope.item.file.name;
		};
		
		$scope.nextItem(0);
		
	}]);
	
webglControllers.controller('screenshotDetailCtrl', ['$scope', 'phpRequest', 'neo4jRequest', 'Utilities', '$timeout',
	function($scope, phpRequest, neo4jRequest, Utilities, $timeout) {
		
		console.log('screenshotDetailCtrl init');
		
		$scope.params = $scope.$parent.modalParams;
		console.log($scope.params);
		
		$scope.scMode = 'marker';
		
		$scope.paintOptions = {
			width: $scope.params.data.width,
			height: $scope.params.data.height,
			opacity: 0,
			color: '#ff0',
			backgroundColor: 'rgba(255,255,255,0.0)',
			lineWidth: 3,
			undo: true
		};
		
		$scope.markers = [];
		var isExisting = false;
		
		if(!$scope.params.data.dataUrl) {
			$scope.params.data.dataUrl = $scope.params.path + $scope.params.filename; 
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
					styleMarker: {'width': 30, 'height': 30, 'left': m.u*$scope.params.data.width-15, 'top': m.v*$scope.params.data.height-30}
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
				u: offsetX / $scope.params.data.width,
				v: offsetY / $scope.params.data.height,
				styleMarker: {'width': 30, 'height': 30, 'left': offsetX-16, 'top': offsetY-30},
				comment: '',
				isInserted: false
			});
			
			console.log($scope.markers);
			$timeout(function() {
				$scope.setFocusOnComment($scope.markers.length-1);
			});
			
		};
		
		$scope.saveScreenshot = function () {
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
				neo4jRequest.insertScreenshotMarkers($scope.$parent.project, $scope.params, newMarkers).success(function(data, status){
					console.log(data, 'neo4j done');
					if(data.exception == 'SyntaxException') {
						console.error('ERROR: Neo4j SyntaxException');
					}
					else
						$scope.$parent.closeOverlayPanel(true);
				});
			}
			else {
				// speichere Screenshot und füge komplett neue Nodes ein
				phpRequest.saveBase64Image($scope.params.path, $scope.params.filename, $scope.params.data.dataUrl).success(function(answer, status){
					if(answer != 'SUCCESS') {
						console.error(answer);
						return;
					}
					neo4jRequest.insertScreenshot($scope.$parent.project, $scope.params, $scope.markers).success(function(data, status){
						console.log(data, 'neo4j done');
						if(data.exception == 'SyntaxException') {
							console.error('ERROR: Neo4j SyntaxException');
						}
						else
							$scope.$parent.$hide();
					});
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
				marker.u = (position.left + 15) / $scope.params.data.width;
				marker.v = (position.top + 30) / $scope.params.data.height;
				
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
		
	}]);
	
webglControllers.controller('tasksCtrl', ['$scope','$stateParams', '$timeout', '$sce', 'phpRequest', 'mysqlRequest', 'neo4jRequest', '$http', 'Utilities',
	function($scope, $stateParams, $timeout, $sce, phpRequest, mysqlRequest, neo4jRequest, $http, Utilities) {
	
		$scope.project = $stateParams.project;
		
		/*Mitarbeiter*/
		$scope.newStaff = new Object();
		
		$scope.newStaff.sid = '';
		$scope.newStaff.name = '';
		$scope.newStaff.surname = '';
		$scope.newStaff.mail = '';
		$scope.newStaff.role = '';
		$scope.newStaff.projects = '';
		
		/*Tasks*/
		$scope.staff = [];
		$scope.nameFound = false;
		
		$scope.newTask = new Object();
		$scope.newTask.staff = '';
		$scope.newTask.task = '';
		$scope.newTask.from = '';
		$scope.newTask.to = '';
		
		/*Views*/
		
		$scope.views = new Object();
		$scope.views.activeSide = 'staff';
		
		$scope.data = [
		{name: 'Milestones', isStaff: 'true', classes: 'gantt-row-milestone'},
		
    	{name: 'Jonas', isStaff: 'true'},
    
    	{name: 'Martin', isStaff: 'true'},
    
    	{name: 'test1', parent: 'Martin', status: 'erledigt',priority: '2', hasData: 'true',  tasks: [
                            {name: 'test1', color: '#F1C232', from: new Date(2015, 09, 21, 8, 0, 0), to: new Date(2015, 10, 25, 15, 0, 0), data: "Lorem Ipsum"}
                        ]},
    {name: 'test2', parent: 'test1', status: 'erledigt',priority: '3', hasData: 'false', tasks: [
                            {name: 'test2', color: '#F1C232', from: new Date(2015, 09, 28, 8, 0, 0), to: new Date(2015, 10, 1, 15, 0, 0)}
                        ]},
   
   {name: 'test5',parent: 'Jonas', status: 'zu bearbeiten', priority: '1', tasks: [
                            {name: 'test4', color: '#F1C232', from: new Date(2015, 09, 21, 8, 0, 0), to: new Date(2015, 10, 25, 15, 0, 0), progress: 25}
                        ]},
    {name: 'test4',parent: 'Jonas', status: 'zu bearbeiten', tasks: [
                            {name: 'test5', color: '#F1C232', from: new Date(2015, 10, 3, 8, 0, 0), to: new Date(2015, 10, 4, 15, 0, 0) }
                        ]},
    {name: 'test6',parent: 'Jonas', status: 'zu bearbeiten', tasks: [
                            {name: 'test6', color: '#F1C232', from: new Date(2015, 10, 4, 8, 0, 0), to: new Date(2015, 10, 10, 15, 0, 0)}
                        ]},
         
]		
		$scope.options = {
			allowSideResizing: true,
			fromDate: getFormattedDate(new Date()),
			toDate: getFormattedDate(addDays(new Date(),30)),
			columns: ['model.priority','from', 'to', 'model.status'],
			treeTableColumns: ['from', 'to', 'status'],
			columnsHeaders: {'model.priority': 'Priorität', 'from': 'von', 'to': 'bis', 'model.status': 'Status'},
			columnsClasses: {'model.name' : 'gantt-column-name', 'from': 'gantt-column-from', 'to': 'gantt-column-to', 'model.status': 'gantt-column-status'},
			columnsFormatters: {
					                'from': function(from) {
					                    return from !== undefined ? from.format("DD.MM.YYYY") : undefined;
					                },
					                'to': function(to) {
					                    return to !== undefined ? to.format("DD.MM.YYYY") : undefined;
					                }
					            },
            
            /*treeHeaderContent: '<i class="fa fa-align-justify"></i> {{getHeader()}}',*/
          columnsContents: { 
          'from': '<div bs-datepicker>{{getValue()}}</div>',
          'model.priority': '{{getValue()}}',
          'model.status': '<i ng-class="getValue() == \'erledigt\' ? \'glyphicon glyphicon-ok\' : \'glyphicon glyphicon-cog\'" ng-click="scope.changeStatus(row.model.name)"></i>',
            },
            filterTask: '',
            filterRow: '',
            contentTooltips: '{{task.model.data}}',
            scale: 'day',
            sortMode: undefined,
            maxHeight: true,
            width: true,
            rowContent: '<i ng-hide = "row.model.isStaff" ng-class="row.model.hasData == \'true\' ?  \'fa fa-commenting-o\' : \'fa fa-pencil\'" ng-click="scope.showComments()"></i><a href="#" /*ng-if= "row.model.isParent == \'false\'" ? */ editable-text ="row.model.name" e-style="width: 60px; height: 20px" buttons = "no" onaftersave="scope.editTask($data,row.model)"> {{row.model.name}}</a> <i class= "fa fa-plus" ng-click ="scope.addNewTask(row.model)"></i>',
            taskContent: '{{task.model.name}}</a><i class="fa fa-times" ng-click="scope.deleteTask(task.model,row.model)"></i>',
            zoom: 1           
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

		
		/*Tasks*/
		
		$scope.addNewTask = function (rowModel){
			console.log(rowModel);
			
				$scope.data.push({name: 'neue Aufgabe', parent: rowModel.name , priority: '1', status: 'zu bearbeiten', tasks: [{name: 'neue Aufgabe', color: 'red', from: getFormattedDate(new Date()), to: getFormattedDate(addDays(new Date(),5))}]});
			
			
			
		}
		
		/*$scope.addNewTask = function(newTask) {
			$.each($scope.data,function(index){
				if(newTask.staff == $scope.data[index].name){
					
					
					$scope.data.push({name: newTask.task, parent: newTask.staff,tasks: [{name: newTask.task, color: '#F1C232', from: newTask.from, to: newTask.to}]});
					$scope.nameFound = true;
					return false;
				}		
			});
			
			if($scope.nameFound == false){
				$scope.data.push({name: newTask.staff});
					$scope.data.push({	name: newTask.task, parent: newTask.staff,tasks: [{name: newTask.task, color: '#F1C232', from: newTask.from, to: newTask.to}]
						
					});
					console.log($scope.data);
			}
			$scope.nameFound = false;	
			
		
		}*/
		
		$scope.drawTaskFactory = function() {
		   
		   var newTask = {
		      id: 5,
		        name: 'New Task',
		        color: '#F1C232'
		    }

   			 return newTask;
		}
		

		$scope.editTask = function(data, rowModel){
			console.log(data);
			console.log(rowModel);
			rowModel.name = data;
			rowModel.tasks[0].name= data;
			console.log(rowModel);
		}

		$scope.showComments = function() {
			$scope.views.activeSide = 'comments';
		}
		
		$scope.changeStatus = function(rowName){
			
			$.each($scope.data,function(index){
				if(rowName == $scope.data[index].name){
					
					if($scope.data[index].status == 'zu bearbeiten'){
						if(confirm("Ist die Aufgabe wirklich erledigt?")){
							$scope.data[index].status = 'erledigt';
							$scope.data[index].tasks[0].color = 'green';
						}
						else{
							$scope.data[index].status = 'zu bearbeiten';
							$scope.data[index].tasks[0].color = 'red';
						}
						return false;
							
					}
					
					if($scope.data[index].status == 'erledigt'){
						$scope.data[index].status = 'zu bearbeiten';
						$scope.data[index].tasks[0].color = 'red';
						return false;				
					}
				}
			});
		};
		
		
		$scope.deleteTask = function(taskModel,rowModel){	
			/*console.log(taskModel);
			console.log(rowModel);*/
			var length = $scope.data.length
			/*alles children löschen*/
			
			if(confirm("Wollen Sie diese Aufgabe wirklich löschen?")){
				for (i= 0; i < length-1; i++) {
					if(taskModel.name == $scope.data[i].parent){
					console.log("gefunden" + $scope.data[i].name + $scope.data[i].parent);
					$scope.data.splice(i,1);
					length--;
					}
				};
				
				/*parent löschen*/
				for (j= 0; j < length-1; j++) {				
					if(taskModel.name == $scope.data[j].name){
					$scope.data.splice(j,1);
					}
				};
			}
		};
				
	/*Mitarbeiter*/
		
		$scope.getAllStaff = function() {
			mysqlRequest.getAllStaff().success(function(obj, status){
					
					$scope.staff = obj.data;
					console.log($scope.staff);
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
		
	
		
		$scope.addNewStaff = function() {
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
	
	//initiiere Staff
	$scope.getAllStaff();
	
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

