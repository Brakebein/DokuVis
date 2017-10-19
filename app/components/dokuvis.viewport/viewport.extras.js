angular.module('dokuvis.viewport')

/**
 * Top-left navigation bar.
 * @ngdoc directive
 * @name viewportNavigation
 * @module dokuvis.viewport
 */
.directive('viewportNavigation', ['ComponentsPath', 'viewportSettings',
	function (ComponentsPath, viewportSettings) {

		return {
			templateUrl: ComponentsPath + '/dokuvis.viewport/viewportNavigation.tpl.html',
			restrict: 'E',
			link: function (scope) {

				scope.navigation = {'default': true, rotate: false, pan: false, zoom: false};

				scope.shadings = viewportSettings.shadings;
				scope.cameras = viewportSettings.cameras;

				scope.vpSettings = viewportSettings;

				// TODO: setNavigation method

				scope.focus = function (mode) {
					viewportFocusStart(mode);
				};

				function viewportFocusStart(mode) {
					scope.$emit('viewportFocusStart', mode);
				}

				function setNavigationMode(mode, triggerEvent) {
					scope.navigation.default = false;
					scope.navigation.rotate = false;
					scope.navigation.pan = false;
					scope.navigation.zoom = false;

					if (mode && mode in scope.navigation)
						scope.navigation[mode] = true;
					else
						scope.navigation.default = true;

					scope.$applyAsync();

					if (triggerEvent !== false)
						viewportNavigationChange(mode);
				}
				scope.setNavigationMode = setNavigationMode;

				// emit event
				function viewportNavigationChange(mode) {
					scope.$emit('viewportNavigationChange', mode);
				}

				scope.$on('viewportNavigationChange', function (event, mode) {
					if (event.targetScope === scope) return;
					setNavigationMode(mode, false);
				});

				/**
				 * Event that gets fired, when user set another shading.
				 * @ngdoc event
				 * @name viewportNavigation#viewportShadingChange
				 * @eventType emit on viewportNavigation
				 * @param mode {string} New shading mode
				 * @param lastMode {string} Previous shading mode
				 */
				function viewportShadingChange(mode, lastMode) {
					scope.$emit('viewportShadingChange', mode, lastMode);
				}

				// watch for shading changes
				scope.$watch('vpSettings.shading', viewportShadingChange);

				function viewportCameraChange(mode, lastMode) {
					scope.$emit('viewportCameraChange', mode, lastMode);
				}

				// watch for camera changes
				scope.$watch('vpSettings.camera', viewportCameraChange);

				scope.$on('viewportCameraChange', function (event, mode) {
					console.log('listen to event in same scope', mode, event.targetScope === scope);
				})

			}
		};

	}
])

.directive('viewportAxis', ['$timeout',
	function ($timeout) {

		return {
			restrict: 'E',
			link: function (scope, element) {

				var renderer, camera, scene, axis;

				$timeout(function () {
					init();
				});
				
				function init() {
					var width = element.width(),
						height = element.height();

					renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
					renderer.setSize(width, height);
					element.append(renderer.domElement);

					camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 100);
					camera.position.set(0, 0, 50);

					axis = new THREE.AxisHelper(50);
					scene = new THREE.Scene();
					scene.add(axis);
					
					render();
				}

				function render() {
					renderer.render(scene, camera);
				}

				// listen to viewportCameraMove event
				scope.$on('viewportCameraMove', function (event, cam) {
					camera.rotation.copy(cam.rotation);
					camera.position.copy(cam.getWorldDirection().negate().setLength(50));
					render();
				});

				// dispose axis
				scope.$on('$destroy', function () {
					axis.geometry.dispose();
					axis.material.dispose();
				});

			}
		};

	}
])

.directive('viewportLoadprogress', function () {

	return {
		template: '<div class="loadprogress-bar ng-hide" ng-show="visible" ng-style="{ width: progress + \'%\' }"></div>\n<div class="loadprogress-label ng-hide" ng-show="visible">{{ item }} &ndash; {{ loaded }} / {{ total }}</div>',
		restrict: 'E',
		link: function (scope) {

			scope.visible = false;
			scope.item = '';
			scope.loaded = 0;
			scope.total = 0;
			scope.progress = 0;

			// listen to viewportLoadProgress event
			scope.$on('viewportLoadProgress', function (event, item, loaded, total) {
				if (!scope.visible) {
					scope.progress = loaded / total * 100;
					scope.visible = true;
					scope.$apply();
				}

				scope.item = item;
				scope.loaded = loaded;
				scope.total = total;
				scope.progress = loaded / total * 100;

				if (scope.progress === 100) {
					scope.visible = false;
				}
			});

		}
	};

});
