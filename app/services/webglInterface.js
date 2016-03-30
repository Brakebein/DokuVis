// Schnittstelle zwischen Three.js-Scope und Seite
angular.module('dokuvisApp').factory('webglInterface',
	function($rootScope) {
		
		var wi = {};
		
		// Funktionsaufrufe vom Controller
		wi.callFunc = {};
		
		// Einstellungen
		wi.viewportSettings = {};
		wi.viewportSettings.shading = ['color', 'grey', 'transparent', 'onlyEdges', 'xray', 'Custom'];
		wi.viewportSettings.shadingSel = wi.viewportSettings.shading[0];
		wi.viewportSettings.edges = true;
		wi.viewportSettings.camera = ['Perspective', 'Top', 'Front', 'Back', 'Left', 'Right', 'Custom'];
		wi.viewportSettings.cameraSel = wi.viewportSettings.camera[0];
		
		wi.unsafeSettings = {};
		
		wi.categories = [];
		wi.activeCategory;
		
		wi.vizSettings = {};
		wi.vizSettings.opacitySelected = 100;
		wi.vizSettings.edges = true;
		wi.vizSettings.edgesOpacity = 100;
		wi.vizSettings.edgesColor = 100
		
		// Listen
		wi.objects = [];
		wi.layerList = [];
		wi.layers = [];
		wi.hierarchList = [];
		
		wi.selected = [];
		
		wi.plans = [];
		
		var layerDict = {};
		
		wi.insertIntoLists = function(item) {
			var objentry = new wi.ObjectEntry(item);
			insertIntoHierarchList(objentry);
			insertIntoLayerList(objentry);
			$rootScope.$applyAsync();
		};
		
		wi.insertIntoPlanlist = function(item) {
			item.visible = true;
			item.selected = false;
			item.opacity = 1.0;
			wi.plans.push(item);
			$rootScope.$applyAsync();
		};
		
		wi.clearLists = function() {
			console.log('clearList');
			wi.layerLists = [];
			wi.layers = [];
			wi.hierarchList = [];
			wi.plans = [];
		};
		
		wi.ObjectEntry = function(item) {
			this.id = item.id;
			this.name = item.name;
			this.title = item.title;
			this.type = item.type;
			this.layer = item.layer || 0;
			
			this.parent = item.parent || null;
			this.children = [];
			
			this.parentVisible = true;
			this.visible = true;
			this.selected = false;
			this.expand = false;
			this.opacity = 1.0;
			
			var scope = this;
			
			this.toggle = function() {
				scope.visible = !scope.visible;
				if(!scope.visible && scope.selected)
					wi.callFunc.selectObject(scope.id, false, true);
				wi.callFunc.toggleObject(scope, scope.visible);
			};
			this.select = function(event) {
				if(scope.visible && event)
					wi.callFunc.selectObject(scope.id, event.ctrlKey, false);
			};
			this.setOpacity = function(value) {
				wi.callFunc.setObjectOpacity(scope, value);
			};
			this.focus = function() {
				wi.callFunc.focusObject(scope.id);
			};
		};
		
		wi.PlanEntry = function(id, name, title, type) {
			this.id = id;
			this.name = name;
			this.title = title;
			this.type = type;
			this.visible = true;
			this.selected = false;
			this.opacity = 1.0;
			
			var scope = this;
			
			this.toggle = function() {
				scope.visible = !scope.visible;
				if(!scope.visible && scope.selected)
					wi.callFunc.selectPlan(scope.id, false, true);
				wi.callFunc.togglePlan(scope.id, scope.visible);
				
			};
			this.select = function(event) {
				if(scope.visible && event)
					wi.callFunc.selectPlan(scope.id, event.ctrlKey, false);
			};
			this.setOpacity = function(value) {
				wi.callFunc.setPlanOpacity(scope.id, value);
			};
			this.setOrthoView = function() {
				wi.callFunc.viewOrthoPlan(scope.id);
			};
		};
		
		function insertIntoHierarchList(item) {
			var parentItem = findHierarchyObject(wi.hierarchList, item.parent);
			if(parentItem !== undefined) {
				item.parent = parentItem;
				parentItem.children.push(item);
			}
			else {
				item.parent = null;
				wi.hierarchList.push(item);
			}
		}
		
		function insertIntoLayerList(item) {
			wi.layerList.push(item);
			if(item.layer in layerDict) {
				layerDict[item.layer].count++;
			}
			else {
				layerDict[item.layer] = {count: 1};
				wi.layers.push({name: item.layer, visible: true, expand: false});
			}
		}
		
		function findHierarchyObject(list, id) {
			for(var i=0, l=list.length; i<l; i++) {
				var child = list[i];
				if(child.id === id) return child;
				var object = findHierarchyObject(child.children, id);
				if(object !== undefined) return object;
			}
			return undefined;
		}
		
		function findPlanlistObject(id) {
			for(var i=0; i<wi.plans.length; i++) {
				if(wi.plans[i].id === id)
					return wi.plans[i];
			}
		}
		
		// selection
		wi.selectListEntry = function(id, userData) {
			var item = (userData.type === 'plan') ? findPlanlistObject(id) : findHierarchyObject(wi.hierarchList, id);
			if(item) {
				item.selected = true;
				wi.selected.push(userData);
				if(item.parent) expandParents(item.parent);
				$rootScope.$applyAsync();
			}
		};
		
		wi.deselectListEntry = function(id, userData) {
			var item = (userData.type === 'plan') ? findPlanlistObject(id) : findHierarchyObject(wi.hierarchList, id);
			if(item) {
				item.selected = false;
				wi.selected.splice(wi.selected.indexOf(userData), 1);
				$rootScope.$applyAsync();
			}
		};
		
		function expandParents(item) {
			item.expand = true;
			if(item.parent) expandParents(item.parent);
		}
		
		// category
		wi.visualizeCategory = function(category) {
			wi.callFunc.setShading('Custom');
			wi.callFunc.colorByCategory(category);
			wi.activeCategory = category;
		};
		
		return wi;
		
	});
	