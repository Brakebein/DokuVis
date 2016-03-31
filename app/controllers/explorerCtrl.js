angular.module('dokuvisApp').controller('explorerCtrl', ['$scope', '$stateParams', '$timeout', '$sce', '$q', 'APIRequest', 'neo4jRequest', 'phpRequest', 'mysqlRequest', 'FileUploader', 'Utilities', 'webglInterface', '$modal', 'Source', 'Model',
	function($scope, $stateParams, $timeout, $sce, $q, APIRequest, neo4jRequest, phpRequest, mysqlRequest, FileUploader, Utilities, webglInterface, $modal, Source, Model) {

		// Initialisierung von Variablen
		$scope.project = $stateParams.project;
		
		$scope.wi = webglInterface;
		
		$scope.views = new Object();
		$scope.views.activeMain = '3dview';
		$scope.views.activeSide = 'objproperties';
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
		
		// Screenshots
		$scope.screenshots = [];
		$scope.screenshotPins = {isVisible: false};
		
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
		
		// Properties
		$scope.categories = [];
		$scope.activeCategory = null;
	
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
		$scope.openCategoryEdit = function() {
			$scope.modalParams = {};
			$modal({
				title: 'Kategorien verwalten',
				templateUrl: 'partials/modals/_modalTpl.html',
				contentTemplate: 'partials/modals/categoryEditModal.html',
				controller: 'categoryEditCtrl',
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
			if(update === 'category')
				getAllCategories();
			
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
			Source.getAll().then(function(response){
				$scope.sourceResults = response.data;
				console.log('Dokumente:', $scope.sourceResults);
			}, function(err) {
				Utilities.throwApiException('on Source.getAll()', err);
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
			// neo4jRequest.getModelsWithChildren($stateParams.project, $stateParams.subproject).then(function(response){
				// if(response.data.exception) { console.error('neo4j failed on getModelsWithChildren()', response.data); return; }
				// console.log(response.data);
			Model.getModels().then(function(response) {
				console.log(response.data);
				var root = Utilities.createHierarchy(response.data, ['file','obj','categories'], true)[0];
				console.log(root);
				
				function getNodes(nodes, parent, promise) {
					var cdefer = $q.defer();
					nodes.reduce(function(cur, next) {
						return cur.then(function() {
							var p = $scope.callDirFunc.loadCTMIntoScene(next, parent);
							return getNodes(next.children, next.obj.content, p);
						});
					}, promise).then(function(){ cdefer.resolve(); });
					return cdefer.promise;
				}

			if(root)
					getNodes(root.children, 0, $q.resolve());
				
			}, function(err) {
				Utilities.throwApiException('on getModels()', err);
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
		
		// Kategorien
		function getAllCategories() {
			APIRequest.getAllCategories().then(function(response) {
				var cats = Utilities.cleanNeo4jData(response.data);
				for(var i=0; i<cats.length; i++) {
					cats[i].attributes.push({id: 0, value: '<Nicht zugewiesen>'});
					cats[i].attributes.push({id: -1, value: '<Beibehalten>'});
					if(webglInterface.activeCategory && webglInterface.activeCategory.id === cats[i].id)
						webglInterface.activeCategory = cats[i];
				}
				webglInterface.categories = cats;
				if(webglInterface.activeCategory)
					webglInterface.visualizeCategory(webglInterface.activeCategory);
				console.log('Categories:', webglInterface.categories);
			}, function(err) {
				Utilities.throwApiException('on getAllCategories()', err);
			});
		};
		
		// weise neue Kategorie zu
		$scope.updateCategoryAttr = function(c) {
			if(c.selectec === -1) return;
			
			var e73ids = [];
			for(var i=0; i<webglInterface.selected.length; i++) {
				e73ids.push(webglInterface.selected[i].eid);
			}
			
			APIRequest.assignCategoryToObjects(e73ids, c.selected).then(function(response) {
				for(var i=0; i<webglInterface.selected.length; i++) {
					if(c.selected)
						webglInterface.selected[i].categories[c.id] = {
							catId: c.id,
							catValue: c.value,
							attrId: c.selected
						};
					else
						delete webglInterface.selected[i].categories[c.id];
				}
				if(webglInterface.activeCategory === c)
					webglInterface.visualizeCategory(c);
			}, function(err) {
				Utilities.throwApiException('on assignCategoryToObjects()', err);
			});
		};
		
		// zeige Kategoriezuweisung an je nach Auswahl der Objekte
		$scope.$watch('wi.selected', function(newValue) {
			if(newValue.length) {
				for(var i=0; i<newValue.length; i++) {
					var selObj = newValue[i];
					if(selObj.type === 'plan') continue;
					for(var j=0; j<webglInterface.categories.length; j++) {
						if(i === 0) {
							if(selObj.categories[webglInterface.categories[j].id])
								webglInterface.categories[j].selected = selObj.categories[webglInterface.categories[j].id].attrId;
							else {
								webglInterface.categories[j].selected = 0;
							}
						}
						else {
							if( selObj.categories[webglInterface.categories[j].id] && 
								selObj.categories[webglInterface.categories[j].id].attrId !== webglInterface.categories[j].selected || 
								!selObj.categories[webglInterface.categories[j].id] &&
								webglInterface.categories[j].selected !== 0 )
								webglInterface.categories[j].selected = -1;
						}
					}
				}
			}
			else {
				for(var i=0; i<webglInterface.categories.length; i++) {
					webglInterface.categories[i].selected = null;
				}
			}
		}, true);
		
		// oninit Funktionsaufrufe
		$timeout(function() {
			$scope.getAllDocuments();
			$scope.getScreenshots();
			getAllCategories();
			//$scope.loadModelsWithChildren();
		}, 500);
		
		// wenn Controller zerstört wird
		$scope.$on('$destroy', function(event) {
			//webglInterface.clearLists();
			webglInterface.callFunc.removePins();
			console.log('destroy explorerCtrl');
		});
		
	}]);