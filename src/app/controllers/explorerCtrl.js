/**
 * Controller for main explorer view.
 * @ngdoc controller
 * @name explorerCtrl
 * @module dokuvisApp
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$sce $sce
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$q $q
 * @requires APIRequest
 * @requires neo4jRequest
 * @requires Utilities
 * @requires webglInterface
 * @requires http://mgcrea.github.io/angular-strap/#/modals $modalProvider
 * @requires Source
 * @requires Model
 * @requires Comment
 * @requires Category
 * 
 */
angular.module('dokuvisApp').controller('explorerCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$sce', '$q', 'APIRequest', 'neo4jRequest', 'Utilities', 'webglInterface', '$modal', 'Source', 'Model', 'Comment', 'Category',
	function($scope, $rootScope, $state, $stateParams, $timeout, $sce, $q, APIRequest, neo4jRequest, Utilities, webglInterface, $modal, Source, Model, Comment, Category) {

		// Initialisierung von Variablen
		$scope.project = $stateParams.project;
		
		$scope.wi = webglInterface;
		
		$scope.views = {
			activeMain: '3dview',
			activeSide: 'versions'
		};


		
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
		
		// $scope.sliceSettings = {};
		// $scope.sliceSettings.enabled = false;
		// $scope.sliceSettings.axisAlign = 'z-axis';
		// $scope.sliceSettings.planePosition = 50;
		// $scope.sliceSettings.showPlane = true;
		// $scope.sliceSettings.showSliceFaces = true;
		
		
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
		// $scope.baulk = {};
		// $scope.baulk.minAge = 1250;
		// $scope.baulk.maxAge = 1750;
		
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
		$scope.activeVersion = null;
		$scope.selectedObjects = [];

		if ($stateParams.initialComment) {
			$scope.views.activeSide = 'comments';
			$scope.activeCommentId = $stateParams.initialComment;
		}

		// listen to modelVersionActive event
		$scope.$on('modelVersionActive', function (event, version) {
			$scope.activeVersion = version;
		});

		// listen to viewportSelectionChange
		$scope.$on('viewportSelectionChange', function (event, selected) {
			$scope.selectedObjects = selected;
		});

		$scope.startModelComment = function () {
			snapshotStart();
			$scope.enableSnapshotForm = true;
		};

		function snapshotStart() {
			$rootScope.$broadcast('snapshotStart');
		}

		$scope.$on('snapshotEnd', function () {
			$scope.enableSnapshotForm = false;
		});

		$scope.$on('commentActive', function (event, comment) {
			if (!comment) return;
			if (typeof comment === 'string')
				$scope.activeCommentId = comment;
			else
				$scope.activeCommentId = comment.id;
		});

		$scope.closeCommentDetail = function () {
			$scope.activeCommentId = undefined;
			snapsotViewClose();
		};

		function snapsotViewClose() {
			$rootScope.$broadcast('snapshotViewClose');
		}


		/**
		 * @deprecated
		 */
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

		/**
		 * @deprecated
		 * @param id
		 * @param pinObj
		 * @param event
		 */
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
		/**
		 * @deprecated
		 * @param id
		 */
		$scope.removePin = function (id) {
			$scope.line = null;
			$scope.path = null;
			webglInterface.callFunc.removePin(id);
		};
		
		// TODO: "Pin-Linie" muss sich bei Focus-Animation mitbewegen oder ausgeblendet werden
		// TODO: abfragen, ob Pin sich überhaupt innerhalb des Viewports befindet

		/**
		 * @deprecated
		 * @param plan
		 */
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
		 * @deprecated
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
		 * @deprecated
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

		/**
		 * @deprecated
		 * @param obj
		 */
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


		// deprecated
		$scope.callDirFunc = {};
		
		//ein- und ausklappen des unteren Containers // DEPRECATED ?
		// $scope.expandPanelContainerHorizontal = function(e) {
		// 	var btn = $(e.delegateTarget);
		// 	//console.log(btn.parent().css('right'));
		// 	if(btn.parent().css('bottom') == '-85px') {
		// 		btn.children('span').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
		// 		btn.parent().animate({ bottom: '0px' }, 500);
		// 	}
		// 	else {
		// 		btn.children('span').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
		// 		btn.parent().animate({ bottom: '-85px' }, 500);
		// 	}
		// };
		
		//ein- und ausklappen des unsicheren Wissens
		// $scope.expandPanelContainerPhases = function(e) {
		// 	var btn = $(e.delegateTarget);
		// 	console.log(btn.siblings(".timeSlider").css('top'));
		//
		// 	if(btn.siblings(".timeSlider").css('top') == '20px') {
		// 		btn.children('span').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
		// 		console.log(btn.siblings(".row2").css('visibility'));
		// 		btn.siblings(".timeSlider").animate({ top: '43px' }, 500);
		// 		btn.siblings(".row2").animate({opacity: '1.0'},500) ;
		//
		// 	}
		// 	else {
		// 		btn.children('span').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
		// 		btn.siblings(".timeSlider").animate({ top: '20px' }, 500);
		// 		btn.siblings(".row2").css({opacity: '0.0'},500);
		//
		// 	}
		// };

		/**
		 * @deprecated
		 * @param event
		 */
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



		///// CATEGORIES

		/**
		 * Query categories
		 * @deprecated
		 */
		// function getAllCategories() {
		// 	Category.query().$promise.then(function (result) {
		// 		var cats = result;
		// 		for(var i=0; i<cats.length; i++) {
		// 			cats[i].attributes.push({id: 0, value: '<Nicht zugewiesen>'});
		// 			cats[i].attributes.push({id: -1, value: '<Beibehalten>'});
		// 			if(webglInterface.activeCategory && webglInterface.activeCategory.id === cats[i].id)
		// 				webglInterface.activeCategory = cats[i];
		// 		}
		// 		webglInterface.categories = cats;
		// 		if(webglInterface.activeCategory)
		// 			//webglInterface.visualizeCategory(webglInterface.activeCategory);
		// 			webglInterface.callFunc.colorByCategory(webglInterface.activeCategory);
		// 		console.log('Categories:', webglInterface.categories);
		// 	}, function(err) {
		// 		Utilities.throwApiException('on getAllCategories()', err);
		// 	});
		// }

		/**
		 * Assign new categorie to selection
		 * @param c
		 * @deprecated
		 */
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

		/**
		 * Watch selected and show assigned categories of the objects
		 */
		// $scope.$watch('wi.selected', function(newValue) {
		// 	if(newValue.length) {
		// 		for(var i=0; i<newValue.length; i++) {
		// 			var selObj = newValue[i];
		// 			if(selObj.type === 'plan') continue;
		// 			for(var j=0; j<webglInterface.categories.length; j++) {
		// 				if(i === 0) {
		// 					if(selObj.categories[webglInterface.categories[j].id])
		// 						webglInterface.categories[j].selected = selObj.categories[webglInterface.categories[j].id].attrId;
		// 					else {
		// 						webglInterface.categories[j].selected = 0;
		// 					}
		// 				}
		// 				else {
		// 					if( selObj.categories[webglInterface.categories[j].id] &&
		// 						selObj.categories[webglInterface.categories[j].id].attrId !== webglInterface.categories[j].selected ||
		// 						!selObj.categories[webglInterface.categories[j].id] &&
		// 						webglInterface.categories[j].selected !== 0 )
		// 						webglInterface.categories[j].selected = -1;
		// 				}
		// 			}
		// 		}
		// 	}
		// 	else {
		// 		for(var i=0; i<webglInterface.categories.length; i++) {
		// 			webglInterface.categories[i].selected = null;
		// 		}
		// 	}
		// }, true);


		// oninit Funktionsaufrufe
		// $timeout(function() {
			// $scope.queryDocuments().then(function () {
			// 	$scope.queryComments();
			// });
			//$scope.getScreenshots();
			//$scope.loadModelsWithChildren();
		// }, 500);

		// wenn Controller zerstört wird
		$scope.$on('$destroy', function() {
			//webglInterface.clearLists();
			// webglInterface.callFunc.removePins();
			console.log('destroy explorerCtrl');
		});
		
	}]);
