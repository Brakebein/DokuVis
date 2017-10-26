angular.module('dokuvis.viewport')

.directive('viewportObjectTree', ['ComponentsPath', 'viewportCache',
	function (ComponentsPath, viewportCache) {

		return {
			templateUrl: ComponentsPath + '/dokuvis.viewport/viewportObjectTree.tpl.html',
			restrict: 'E',
			link: function (scope) {

				scope.componentsPath = ComponentsPath;

				scope.objects = viewportCache.objects;
				scope.layers = viewportCache.objects.layers;
				scope.hierarchy = viewportCache.objects.hierarchy;

				scope.showLayers = false;
				scope.showHierarchy = true;

				scope.switchTo = function (type) {
					switch (type) {
						case 'layers':
							scope.showLayers = true;
							scope.showHierarchy = false;
							break;
						default:
							scope.showLayers = false;
							scope.showHierarchy = true;
					}
				};

			}
		};

	}
])

.directive('viewportPlanList', ['ComponentsPath', 'viewportCache',
	function (ComponentsPath, viewportCache) {

		return {
			templateUrl: ComponentsPath + '/dokuvis.viewport/viewportPlanList.tpl.html',
			restrict: 'E',
			link: function (scope) {

				scope.plans = viewportCache.plans;

			}
		};

	}
])

.directive('viewportImageList', ['ComponentsPath', 'viewportCache',
	function (ComponentsPath, viewportCache) {

		return {
			templateUrl: ComponentsPath + '/dokuvis.viewport/viewportImageList.tpl.html',
			restrict: 'E',
			link: function (scope) {

				scope.images = viewportCache.spatialImages;

			}
		};

	}
]);
