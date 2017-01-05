angular.module('dokuvisApp').controller('explorerCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$sce', '$q', 'APIRequest', 'neo4jRequest', 'FileUploader', 'Uploader', 'Utilities', 'webglInterface', '$modal', 'Source', 'Model', 'Comment', 'Category',
	function($scope, $state, $stateParams, $timeout, $sce, $q, APIRequest, neo4jRequest, FileUploader, Uploader, Utilities, webglInterface, $modal, Source, Model, Comment, Category) {

		// Initialisierung von Variablen
		$scope.project = $stateParams.project;
		
		$scope.wi = webglInterface;
		
		$scope.views = {};
		$scope.views.activeMain = '3dview';
		//$scope.views.activeSide = 'objproperties';
		$scope.views.activeSide = 'comments';
								
		$scope.overlayParams = {url: '', params: {}};
		
		$scope.alert = {};
		$scope.alert.showing = false;
		$scope.alert.message = '';
		
		// Einstellungen für Quellenanzeige
		$scope.sourcesSettings = {};
		$scope.sourcesSettings.listSize = 'normal';
		$scope.sourcesSettings.orderBy = 'title';
		$scope.sourcesSettings.reverse = false;
		$scope.sourcesSettings.filterBy = '';
		$scope.sourcesSettings.filterSelected = false;
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
		
		$scope.unsafeSettings = {};
		$scope.unsafeSettings.opacity = 50;
		$scope.unsafeSettings.edges = true;
		$scope.unsafeSettings.autoTransparent = false;
		
		$scope.viewportSettings = {};
		
		$scope.sliceSettings = {};
		$scope.sliceSettings.enabled = false;
		$scope.sliceSettings.axisAlign = 'z-axis';
		$scope.sliceSettings.planePosition = 50;
		$scope.sliceSettings.showPlane = true;
		$scope.sliceSettings.showSliceFaces = true;
		
		
		$scope.coords = {};
		$scope.coords.x = $scope.coords.y = $scope.coords.z = 0;
		$scope.coords.xError = $scope.coords.yError = $scope.coords.zError = false;
		$scope.coords.enabled = false;
		
		$scope.constructionPhases = {};
		$scope.constructionPhases.select = 0;
		
		$scope.fellYear = {};
		$scope.fellYear = 0;
		
		$scope.position = {};
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
		$scope.baulk = {};
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
			Utilities.dangerAlert('Nicht unterstütztes Format!');
        };
        $scope.sourcesUploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
			//$scope.openSourceTypeDialog();
			$scope.openInsertForm('source');
        };
		
		// Modal öffnen
		$scope.openInsertForm = function(type, attach) {
			
			//console.log($scope.sourcesUploader);

			$state.go('project.explorer.upload.type', { uploadType: type, attachTo: attach || undefined });

			$timeout(function () {
				for(var i=0; i<$scope.sourcesUploader.queue.length; i++)
					Uploader.addToQueue($scope.sourcesUploader.queue[i]._file);
				console.log('files', Uploader);
				$scope.sourcesUploader.clearQueue();
			},500);
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
				controller: 'screenshotCtrl',
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
		// $scope.openCategoryEdit = function() {
		// 	$scope.modalParams = {};
		// 	$modal({
		// 		title: 'Kategorien verwalten',
		// 		templateUrl: 'partials/modals/_modalTpl.html',
		// 		contentTemplate: 'partials/modals/categoryEditModal.html',
		// 		controller: 'categoryEditCtrl',
		// 		scope: $scope,
		// 		show: true 
		// 	});
		// };
				
		// close modal
		$scope.closeModal = function(update) {
			if(update === 'source')
				$scope.queryDocuments();
			if(update === 'screenshot')
				$scope.getScreenshots();
			if(update === 'category')
				getAllCategories();
			
			$scope.overlayParams.params = {};
			$scope.overlayParams.url = '';
			$scope.sourcesUploader.clearQueue();
		};
		$scope.updateList = function(type) {
			if(type == 'source')
				$scope.queryDocuments();
			if(type == 'screenshot')
				$scope.getScreenshots();
		};

		/**
		 * get all sources/documents
		 */
		$scope.queryDocuments = function() {
			return Source.query().$promise.then(function (data) {
				$scope.sourceResults = data;
				for(var i=0; i<$scope.sourceResults.length; i++) {
					$scope.sourceResults[i].selected = false;
				}
				console.log('Dokuments:', $scope.sourceResults);
			}, function (err) {
				Utilities.throwApiException('on Source.query()', err);
			})
		};

		$scope.$watch('filteredSourceResults', function (newVal) {
			console.log('filteredSourceResults', newVal);
			if($state.includes('project.explorer.source')) {
				$state.go('.', { selection: newVal });
			}

		});
		
		// lädt alle Screenshots in Liste
		$scope.getScreenshots = function() {
			neo4jRequest.getScreenshotsWithMarkers($scope.project).then(function(response){
				if(response.data.exception) { Utilities.throwNeo4jException('on getScreenshots()', response); return; }
				if(response.data) $scope.screenshots = Utilities.cleanNeo4jData(response.data);
				console.log('Screenshots:', $scope.screenshots);
			});
		};

		// lädt alle Kommentare
		$scope.queryComments = function () {
			Comment.query().$promise.then(function (data) {
				// target reference
				for(var i=0; i<data.length; i++) {
					if(data[i].type !== 'commentSource') continue;
					for(var j=0; j<data[i].targets.length; j++) {
						for(var k=0; k<$scope.sourceResults.length; k++) {
							if(data[i].targets[j] === $scope.sourceResults[k].eid) {
								data[i].targets[j] = $scope.sourceResults[k];
								break;
							}
						}
					}
				}
				$scope.comments = data;
				console.log('Comments:', $scope.comments);
			}, function (err) {
				Utilities.throwApiException('on Comment.query()', err);
			});
		};
		
		webglInterface.callFunc.updateComments = function () {
			$scope.queryComments();
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
					if($scope.screenshots[i].pin.matrix)
						webglInterface.callFunc.addPin($scope.screenshots[i].id, $scope.screenshots[i].pin);
				}
			}
			else
				webglInterface.callFunc.removePins();
		};
		
		$scope.addPin = function (id, pinObj, event) {
			//console.log(pinObj, event);
			var targetHeight = $(event.delegateTarget).height();
			var target = $(event.delegateTarget).offset();
			//console.log(target);
			var canvas = $('#svgViz').offset();
			//console.log(canvas);
			target.left -= canvas.left;
			target.top -= canvas.top;
			var screenXY = webglInterface.callFunc.addPin(id, pinObj);
			//console.log(screenXY);
			//$scope.line = { x1: screenXY.x, y1: screenXY.y, x2: target.left, y2: target.top };
			var d = ['M' + target.left,
				target.top,
				'Q',
				screenXY.x + 0.75 * Math.abs(screenXY.x - target.left),
				(screenXY.y + target.top + targetHeight / 2) / 2 + ',',
				screenXY.x,
				screenXY.y,
				'Q',
				screenXY.x + 0.75 * Math.abs(screenXY.x - target.left),
				(screenXY.y + target.top + targetHeight / 2) / 2 + ',',
				target.left,
				target.top+100
			];
			$scope.path = d.join(' ');
		};
		$scope.removePin = function (id) {
			$scope.line = null;
			$scope.path = null;
			webglInterface.callFunc.removePin(id);
		};
		
		// TODO: "Pin-Linie" muss sich bei Focus-Animation mitbewegen oder ausgeblendet werden
		// TODO: abfragen, ob Pin sich überhaupt innerhalb des Viewports befindet
		
		$scope.open3DPlan = function(plan) {
			neo4jRequest.getAttached3DPlan($stateParams.project, plan.eid, plan.plan3d).success(function(data, status){
				
				//console.log($scope.models);
				//console.log(data, status);
				if(!data) { console.error('neo4jRequest failed'); return; }
				var edata = Utilities.extractNeo4jData(data)[0];
				console.log(edata);
				
				plan.plan3d = $scope.callDirFunc.loadCTMPlanIntoScene(plan.plan3d, edata.object, edata.file);
				console.log(plan);
			});
		};

		/**
		 * @deprecated
		 */
		$scope.getPlansForObj = function() {
			neo4jRequest.getPlansFromObject($scope.selected.eid).success(function(data, status){
				
				$scope.sourceResults = Utilities.cleanNeo4jData(data);
				console.log($scope.sourceResults);
				
				/*for(var i=0; i<files.length; i++) {
					$scope.callDirFunc.loadPlanIntoScene('data/Proj_Muristan/plans/models/', files[i].file);
				}*/
			});
		};

		/**
		 * highlight all objects linked to the plan
		 * @param plan
         */
		$scope.highlightObj = function(plan) {
			console.log(plan);
			//plan.$getLinks().then(function (objIds) {
			Source.getLinks({ id: plan.eid }).$promise.then(function (objIds) {
				console.log(plan, objIds);
				webglInterface.callFunc.highlightObjects(objIds);
			}, function (err) {
				Utilities.throwApiException('on Source.getLinks()', err);
			});
		};

		/**
		 * check, which objects are intersected by plan and connect them within the database
		 * @param plan
         */
		$scope.connectPlanToObj = function(plan) {
			var res = webglInterface.callFunc.getObjForPlans(plan.plan3d.meshId);
			console.log(res);
			plan.$link({ targets: res.objs }).then (function (response) {
				console.log('plan connected', response);
			}, function (err) {
				Utilities.throwApiException('on Source.links()', err);
			});
			// TODO: #Source $getLinks() value.push is not a function
		};
		
		webglInterface.callFunc.highlightSources = function (obj) {
			Model.getConnections(obj.name).then(function (response) {
				console.log(response);
				for(var i=0; i<$scope.sourceResults.length; i++) {
					$scope.sourceResults[i].selected = false;
					for (var j = 0; j < response.data.length; j++) {
						if ($scope.sourceResults[i].eid === response.data[j].sourceId) {
							$scope.sourceResults[i].selected = true;
							$scope.sourcesSettings.filterSelected = true;
							continue;
						}
					}
				}
			}, function (err) {
				Utilities.throwApiException('on Model.getConnections()', err);
			});
		};

		$scope.loadModelsWithChildren = function() {
			Model.getModels().then(function(response) {
				console.log(response.data);
				var root = Utilities.createHierarchy(response.data, ['file','obj','categories'], true)[0];
				console.log(root);
				
				function getNodes(nodes, parent, promise) {
					var cdefer = $q.defer();
					nodes.reduce(function(cur, next) {
						return cur.then(function() {
							var p = webglInterface.callFunc.loadCTMIntoScene(next, parent);
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
		
		$scope.reloadModels = function () {
			webglInterface.callFunc.resetScene();
			$scope.loadModelsWithChildren();
		};
		
		$scope.logModels = function() {
			console.log($scope.hierarchList);
			console.log($scope.layerList);
		};
		
		$scope.callDirFunc = {};
		
		//ein- und ausklappen des unteren Containers // DEPRECATED ?
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
		};
		
		$scope.tooltip = function(event) {
			console.log(event);
		};

		//old
		$scope.selectResultItem = function(event, item) {
			//console.log(event, item);
			var btnbar = event.currentTarget.children[0].children[2];
			if(event.target.parentElement == btnbar || event.target.parentElement.parentElement == btnbar)
				return;
			
			if(webglInterface.snapshot.active) {
				if(webglInterface.snapshot.refSrc.indexOf(item) === -1)
					webglInterface.snapshot.refSrc.push(item);
				console.log(webglInterface.snapshot.refSrc);
				return;
			}
			
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
			$scope.sourcesSettings.filterSelected = false;
		};
		
		$scope.filterSelected = function (value) {
			if($scope.sourcesSettings.filterSelected)
				return value.selected;
			else
				return true;
		};
		
		//$scope.$watch('selected', function(value) {
			
			/*if(value) {
				console.log('watch', value);
				if($.isEmptyObject(value)) return;
				$('.sideContent').scrollTo('500px');
				//document.getElementById(value.name).scrollIntoView();
			}*/
		//});
		
		/**
		 * @deprecated
		 * @param btn
		 */
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
		
		// Kategorien
		function getAllCategories() {
			Category.query().$promise.then(function (result) {
				var cats = result;
				for(var i=0; i<cats.length; i++) {
					cats[i].attributes.push({id: 0, value: '<Nicht zugewiesen>'});
					cats[i].attributes.push({id: -1, value: '<Beibehalten>'});
					if(webglInterface.activeCategory && webglInterface.activeCategory.id === cats[i].id)
						webglInterface.activeCategory = cats[i];
				}
				webglInterface.categories = cats;
				if(webglInterface.activeCategory)
					//webglInterface.visualizeCategory(webglInterface.activeCategory);
					webglInterface.callFunc.colorByCategory(webglInterface.activeCategory);
				console.log('Categories:', webglInterface.categories);
			}, function(err) {
				Utilities.throwApiException('on getAllCategories()', err);
			});
		}
		
		// weise neue Kategorie zu
		$scope.updateCategoryAttr = function(c) {
			if(c.selected === -1) return;
			
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
					//webglInterface.visualizeCategory(c);
					webglInterface.callFunc.colorByCategory(webglInterface.activeCategory);
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
			$scope.queryDocuments().then(function () {
				$scope.queryComments();
			});
			$scope.getScreenshots();
			getAllCategories();
			//$scope.loadModelsWithChildren();
		}, 500);

		// nach Upload aktualisieren
		$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
			//console.log('stateChange', fromState, fromParams);
			if(fromState.name === 'project.explorer.upload.type' && fromParams.uploadType === 'source')
				$scope.queryDocuments();
			else if(fromState.name === 'project.explorer.categoryedit')
				getAllCategories();
		});
		
		// wenn Controller zerstört wird
		$scope.$on('$destroy', function() {
			//webglInterface.clearLists();
			webglInterface.callFunc.removePins();
			console.log('destroy explorerCtrl');
		});
		
	}]);
