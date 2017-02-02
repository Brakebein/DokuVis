angular.module('dokuvisApp').directive('webglView', ['$stateParams', '$timeout', 'webglContext', 'webglInterface', '$rootScope', 'phpRequest', 'neo4jRequest', '$http', '$q', 'Utilities', 'Comment', 'ConfirmService', 'debounce',
	/**
	 * Directive implementing the 3D viewport and all 3D functionalities using {@link http://threejs.org/ threes.js}
	 * @memberof dokuvisApp
	 * @ngdoc directive
	 * @name webglView
	 * @param $stateParams {service}
	 * @param $timeout {service}
	 * @param webglContext {webglContext}
	 * @param webglInterface {webglInterface}
	 * @param $rootScope {service}
	 * @param phpRequest {service}
	 * @param neo4jRequest {service}
	 * @param $http {service}
	 * @param $q {service}
	 * @param Utilities {Utilities}
	 * @param Comment {Comment}
	 * @param ConfirmService {ConfirmService}
	 */
	function($stateParams, $timeout, webglContext, webglInterface, $rootScope, phpRequest, neo4jRequest, $http, $q, Utilities, Comment, ConfirmService) {
		
		function link(scope, element, attr) {
			
			//scope.wi = webglInterface;
			scope.viewportSettings = webglInterface.viewportSettings;
			scope.vPanel = webglInterface.vPanel;
			scope.vizSettings = webglInterface.vizSettings;
			scope.snapshot = webglInterface.snapshot;
			scope.spatialize = webglInterface.spatialize;
			scope.$applyAsync();

			// Konstante maximale Sichtweite
			var FAR = 1400;
			
			/* globale Variablen */
			// allgemein 
			var SCREEN_WIDTH, SCREEN_HEIGHT;
			var canvas;
			var renderer, scene, controls, stats;
			var axisRenderer, axisScene, axisCamera;
			var camera, orthocam;
			var dlight;
			
			var postprocessing = {};
			
			// Listen für die Verwaltung der einzelnen Objekte
			var marks = {};
			var sliced = [], hidden = [];
			// Listen für die Schnittstelle mit der HTML-Seite
			scope.marksModels = [];
			
			
			var selected = [], highlighted = [];
			var pins = [];
			
			var objloader, ctmloader;
			scope.loading = { item: '', loaded: 0, total: 0, percent: 100, visible: false };
			
			var plane;
			
			// Gizmo, Slice, Messen
			var gizmo, gizmoMove, gizmoRotate;
			var activeGizmo = false;
			
			var sliceTool = false;
			var isSliced = false;
			var isSliceMoving = false;
			
			var measureTool, pin;
			
			var navigationState = {
				SELECT: 0,
				ROTATE: 2,
				PAN: 3,
				ZOOM: 4
			};
			var interactionState = {
				SELECT: 0,
				MEASURE: 1,
				PIN: 2,
				SLICE: 3
			};
			
			// Shading-Konstanten
			var shading = {
				COLOR_EDGE: 'color+edges',
				GREY_EDGE: 'grey+edges',
				COLOR: 'color-edges',
				EDGE: 'edges',
				TRANSPARENT_EDGE: 'transparent+edges',
				COLOR_WIRE: 'color+wireframe',
				WIRE: 'wireframe',
				XRAY: 'xray'
			};
			var currentShading = webglInterface.viewportSettings.shadingSel;
			
			var camPerspective = true;
			var needsAnimationRequest = false;
			var renderSSAO = false;
			
			// für Navigation
			var mouseDownCoord = new THREE.Vector2();
			var isMouseDown = false;
			var isRotatingView = false;
			var isZoomingView = false;
			var isPanningView = false;
			scope.navigation = {select: true, rotate: false, pan: false, zoom: false};
			
			var isSelecting = false;
			var isPinning = false;
			
			// Übernahme aus webglContext
			var objects = webglContext.objects;
			var plans = webglInterface.plans;
			var spatialImages = webglInterface.spatialImages;
			var geometries = webglContext.geometries;
			var materials = webglContext.materials;
			
			// Initialisierung des Ganzen
			init();
			function init() {
			
				// Auslesen von Höhe und Breite des Fensters
				// element.height(element.parent().height() - element.position().top - 2*parseInt(element.css('border-top-width'),10));
				// SCREEN_WIDTH = element.width();
				// SCREEN_HEIGHT = element.height();
				// console.log('viewport size: ' + SCREEN_WIDTH + ' ' + SCREEN_HEIGHT);
				
				
				// Camera
				camera = webglContext.camera;
				
				// Scene
				scene = webglContext.scene;
				
				// Renderer
				renderer = webglContext.renderer;
				canvas = renderer.domElement;
				element.append(canvas);
				
				// Stats
				if(webglContext.stats) {
					stats = webglContext.stats;
					stats.domElement.style.position = 'absolute';
					stats.domElement.style.top = '33px';
					//element.append( stats.domElement );
				}
				
				// MouseHandler für Viewport
				addMouseHandler();
				
				// Controls (für Navigation)
				controls = webglContext.controls;
				controls.addEventListener('change', animate);
				
				// Axis helper
				axisRenderer = webglContext.axisRenderer;
				axisScene = webglContext.axisScene;
				axisCamera = webglContext.axisCamera;
				
				var axisElement = element.find('#axis');
				axisRenderer.setSize(axisElement.width(), axisElement.height());
				axisElement.append(axisRenderer.domElement);
				
				axisCamera.left = axisElement.width()/-2;
				axisCamera.right = axisElement.width()/2;
				axisCamera.top = axisElement.height()/2;
				axisCamera.bottom = axisElement.height()/-2;
				axisCamera.near = 1;
				axisCamera.far = 100;
				axisCamera.updateProjectionMatrix();
				
				// Light
				dlight = webglContext.directionalLight;

				// Ladebalken
				var manager = new THREE.LoadingManager();
				manager.onProgress = function ( item, loaded, total ) {
					scope.loading.visible = true;
					scope.loading.item = item;
					scope.loading.loaded = loaded;
					scope.loading.percent = loaded / total * 100;
					scope.loading.total = total;
					if(scope.loading.percent === 100) {
						scope.loading.visible = false;
						console.log('before timeout');
						$timeout(function () {
							console.log('after timeout');
							manager.reset();
							scope.$apply();
							animate();
						}, 2000);
					}
					scope.$apply();
					animate();
				};
				
				objloader = new THREE.OBJMTLLoader(manager);
				ctmloader = new THREE.CTMLoader(manager);
				
				
				// Postprocessing
				//postprocessing.sampleRatio = 2;
				//var sampleRatio = 2;
				//var renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
				//var composer = new THREE.EffectComposer(renderer, renderTarget);
				//composer.setSize(SCREEN_WIDTH * sampleRatio, SCREEN_HEIGHT * sampleRatio);
				//composer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
				//var renderPass = new THREE.RenderPass(scene, camera);
				//composer.addPass(renderPass);
				
				// var depthShader = THREE.ShaderLib['depthRGBA'];
				// var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);
				//
				// postprocessing.depthMaterial = new THREE.ShaderMaterial({ fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms });
				// postprocessing.depthMaterial.blending = THREE.NoBlending;
				
				//postprocessing.depthTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH * sampleRatio, SCREEN_HEIGHT * sampleRatio, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat});
				// postprocessing.depthTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH * sampleRatio, SCREEN_HEIGHT * sampleRatio, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
				//
				// var ssaoPass = new THREE.ShaderPass(THREE.SSAOShader);
				// ssaoPass.uniforms['tDepth'].value = postprocessing.depthTarget;
				// ssaoPass.uniforms['size'].value.set(SCREEN_WIDTH * sampleRatio, SCREEN_HEIGHT * sampleRatio);
				// ssaoPass.uniforms['cameraNear'].value = camera.near;
				// ssaoPass.uniforms['cameraFar'].value = camera.far;
				//ssaoPass.renderToScreen = true;
				// composer.addPass(ssaoPass);
				
				
				// var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
				// fxaaPass.uniforms['resolution'].value.set(1/SCREEN_WIDTH, 1/SCREEN_HEIGHT);
				// //fxaaPass.renderToScreen = true;
				// fxaaPass.enabled = true;
				// //composer.addPass(fxaaPass);
				//
				//
				// var copyPass = new THREE.ShaderPass(THREE.CopyShader);
				// copyPass.renderToScreen = true;
				// composer.addPass(copyPass);
				
				//postprocessing.composer = composer;
				//console.log(composer);

				// neu
				//var renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
				var composer = new THREE.EffectComposer(renderer);
				composer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
				var renderPass = new THREE.RenderPass(scene, camera);
				composer.addPass(renderPass);

				// var maskPass = new THREE.MaskPass(scene, camera);
				// composer.addPass(maskPass);

				// var sobelPass = new THREE.ShaderPass(THREE.EdgeShader2);
				// sobelPass.uniforms['aspect'].value.set(SCREEN_WIDTH, SCREEN_HEIGHT);
				// composer.addPass(sobelPass);

				var copyPass = new THREE.ShaderPass(THREE.CopyShader);
				copyPass.renderToScreen = true;
				composer.addPass(copyPass);

				postprocessing.composer = composer;
				console.log(composer);

				/*objloader.load('data/steinmetzzeichen/Steinmetzzeichen_auswahl.obj', 'data/steinmetzzeichen/Steinmetzzeichen_auswahl.mtl', loadMasonMarkHandler);
				*/
				
				// Gizmo
				gizmoMove = new THREE.GizmoMove(10, 2.5, 1.2);
				gizmoMove.addEventListener('change', animate);
				gizmoRotate = new THREE.GizmoRotate(10);
				gizmoRotate.addEventListener('change', animate);
				//console.log(gizmo);
				
				// Schnittebene
				var planegeo = new THREE.PlaneGeometry(50, 50);
				var planemat = new THREE.MeshBasicMaterial( {color: 0xffff00, opacity: 0.25, transparent: true, side: THREE.DoubleSide, depthTest: true, depthWrite: false});
				plane = new THREE.Mesh(planegeo, planemat);
				
				var pedges = new THREE.EdgesHelper(plane.clone(), '#dd8888');
				
				//plane.add(pedges);
				
				//plane.position.set(-20, 10, -99);
				//plane.position.set(-20, 10, -20);
				plane.position.set(20, 11, -38);
				//plane.translateZ(-20);
				plane.rotateOnAxis(new THREE.Vector3(0,1,0), 1 * Math.PI);
				//plane.rotateOnAxis(new THREE.Vector3(0,1,0), 0.7 * Math.PI);
				//plane.rotateOnAxis(new THREE.Vector3(1,0,0), 0.5 * Math.PI);
				//plane.geometry.computeBoundingBox();
				plane.add(pedges);
				//scene.add(plane);
				console.log(plane);
				
				//setGizmo(plane, 'move');
				
				
				$timeout(function() {
					resizeViewport();
				});
				
				animate();
			}

			/**
			 * starts animation loop
			 */
			function enableAnimationRequest() {
				if(!needsAnimationRequest) {
					controls.removeEventListener('change', animate);
					needsAnimationRequest = true;
					animate();
				}
			}

			/**
			 * call animate() from outside
			 */
			webglInterface.callFunc.animate = function () {
				animate();
			};

			/**
			 * animation loop
			 */
			function animate() {
				if(needsAnimationRequest) {
					// only if there are active Tweens
					if(TWEEN.getAll().length) {
						requestAnimationFrame(animate);
					}
					// if no Tweens -> stop animation loop
					else {
						needsAnimationRequest = false;
						controls.addEventListener('change', animate);
					}
				}
				
				TWEEN.update();
				controls.update();
				
				// Steinmetzzeichen zeigen immer zur Kamera
				// for(var key in marks) {
				// 	if(marks[key].visible) {
				// 		for(var i=0; i<marks[key].mesh.children.length; i++)
				// 			marks[key].mesh.children[i].lookAt(camera.position);
				// 	}
				// }
				
				// position light depending on camera
				dlight.position.set(4,4,4);
				var lmat = new THREE.Matrix4().makeRotationFromQuaternion(camera.quaternion);
				dlight.position.applyMatrix4(lmat);
				
				// set transperancy depending on camera
				if(scope.unsafeSettings.autoTransparent) {
					var lookV = new THREE.Vector3().subVectors(camera.position, controls.center).normalize();
					var newOpacity = Math.pow( Math.abs(lookV.x) + Math.abs(lookV.y) + Math.abs(lookV.z), 2) / 5;
					for(var key in objects) {
						if(objects[key].mesh.userData.unsafe) {
							objects[key].mesh.material.opacity = newOpacity;
						}
					}
				}
				
				// update of axis helper
				if(camPerspective) {
					axisCamera.position.copy(camera.position);
					axisCamera.position.sub(controls.center);
					axisCamera.position.setLength(50);
					axisCamera.lookAt(axisScene.position);
				}
				
				render();
				//stats.update();
			}

			/**
			 * render calls
			 */
			function render() {
				axisRenderer.render(axisScene, axisCamera);
				
				// if(renderSSAO) {
				// 	// do postprocessing
				// 	scene.overrideMaterial = postprocessing.depthMaterial;
				// 	renderer.render(scene, camera, postprocessing.depthTarget);
				// 	scene.overrideMaterial = null;
				// 	postprocessing.composer.render();
				// }
				// else {
				// 	renderer.render(scene, camera);
				// }

				renderer.render(scene, camera);
				//postprocessing.composer.render();
			}

			/**
			 * set material for object
			 * @param {THREE.Mesh} obj - object
			 * @param {boolean} setAmbient
			 * @param {boolean} disableColor
             * @param {boolean} disableSpecular
             * @param {boolean} [unsafe=false]
             */
			function setObjectMaterial(obj, setAmbient, disableColor, disableSpecular, unsafe) {
				if(obj.material.name in materials) {
					obj.material = materials[obj.material.name];
					obj.userData.originalMat = obj.material.name;
					return;
				}
				//obj.material.color.convertGammaToLinear();
				obj.material.color.convertLinearToGamma();
				if(setAmbient)
					obj.material.ambient = obj.material.color.clone();
				if(disableColor)
					obj.material.color.setHex(0x000000);
				if(disableSpecular && obj.material instanceof THREE.MeshPhongMaterial)
					obj.material.specular.setHex(0x000000);
				if(unsafe) {
					obj.material.transparent = true;
					obj.material.opacity = 0.5;
				}
				obj.material.side = THREE.DoubleSide;
				materials[obj.material.name] = obj.material;
				obj.userData.originalMat = obj.material.name;
			}
			
			// Material für Pläne anpassen
			function setPlanMaterial(obj) {
				var map = obj.material.map;
				map.anisotropy = 8;
				obj.material = new THREE.MeshBasicMaterial({map: map, side: THREE.DoubleSide});
				//obj.material = new THREE.MeshBasicMaterial({map: map, side: THREE.DoubleSide, transparent: true, alphaTest:0.5});
			}
			
			// Initialisierung der geladenen Steinmetzzeichen
			function loadMasonMarkHandler(obj) {
				obj.traverse(function (child) {
					if(child instanceof THREE.Mesh) {
						
						var anz = child.geometry.vertices.length;
						var vs = child.geometry.vertices;
						
						var mark = new THREE.Object3D();
						mark.name = child.name;
						mark.userData.type = 'masonMark';
						var mat = new THREE.MeshBasicMaterial({color: 0xffffff, map: child.material.map});
						mat.color = new THREE.Color((Math.random()+1)/2,(Math.random()+1)/2,(Math.random()+1)/2);
						
						for(var i=0; i<anz; i+=8) {
							var geo = new THREE.PlaneGeometry(0.5,0.5);
							// Mittelpunkt aus den 8 Eckpunkten des Würfels wird errechnet
							var x = vs[i].x+vs[i+1].x+vs[i+2].x+vs[i+3].x+vs[i+4].x+vs[i+5].x+vs[i+6].x+vs[i+7].x;
							var y = vs[i].y+vs[i+1].y+vs[i+2].y+vs[i+3].y+vs[i+4].y+vs[i+5].y+vs[i+6].y+vs[i+7].y;
							var z = vs[i].z+vs[i+1].z+vs[i+2].z+vs[i+3].z+vs[i+4].z+vs[i+5].z+vs[i+6].z+vs[i+7].z;
							
							var mesh = new THREE.Mesh(geo, mat);
							mesh.position.set(x/8, y/8, z/8);
							
							//smark.scale.set(0.5,0.5,0.5);
							mark.add(mesh);
						}
						
						scene.add(mark);
						
						marks[child.id] = {mesh: mark, visible: true};
						
						// Liste für die Anzeige auf der HTML-Seite
						scope.marksModels.push({name: child.name, id: child.id, visible: child.visible});
						scope.$apply();
					}
				});
			}

			/**
			 * selection by a simple click
			 * @param {THREE.Vector2} mouse - mouse position
             * @param {boolean} ctrlKey - if ctrlKey is pressed
             */
			function selectRay(mouse, ctrlKey) {				
			
				var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
				var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
				
				var testObjects = [];
				for(var key in objects) {
					if(objects[key].visible && objects[key].mesh.userData.type === 'object')
						testObjects.push(objects[key].mesh);
				}
				for(key in plans) {
					if(plans[key].visible)
						testObjects.push(plans[key].object.mesh);
				}
				for(key in spatialImages) {
					if(spatialImages[key].visible)
						testObjects.push(spatialImages[key].object.collisionObject);
				}
				
				var intersects = raycaster.intersectObjects(testObjects, true);
				
				if(intersects.length > 0 ) {
					console.log(intersects[0]);
					console.log(objects[intersects[0].object.id]);
					if(intersects[0].object.parent instanceof THREE.Plan)
						setSelected(intersects[0].object.parent, ctrlKey);
					else if(intersects[0].object.parent instanceof THREE.ImagePane)
						setSelected(intersects[0].object.parent, ctrlKey);
					else
						setSelected(intersects[0].object, ctrlKey);
				}
				else 
					setSelected(null, ctrlKey);
			}

			/**
			 * selection by drawing a rectangle
			 * @param {THREE.Vector2} mStart - mouse position at start
			 * @param {THREE.Vector2} mEnd - mouse position at end
             * @param {boolean} ctrlKey - if ctrlKey is pressed
             */
			function selectArea(mStart, mEnd, ctrlKey) {
				
				var s0 = new THREE.Vector3(mStart.x, mStart.y, 0.5).unproject(camera);
				var s1 = new THREE.Vector3(mStart.x, mEnd.y, 0.5).unproject(camera);
				var s2 = new THREE.Vector3(mEnd.x, mEnd.y, 0.5).unproject(camera);
				var s3 = new THREE.Vector3(mEnd.x, mStart.y, 0.5).unproject(camera);
				var s4 = new THREE.Vector3(0, 0, 0.5).unproject(camera);
				
				var v0 = new THREE.Vector3().subVectors(s0, camera.position);
				var v1 = new THREE.Vector3().subVectors(s1, camera.position);
				var v2 = new THREE.Vector3().subVectors(s2, camera.position);
				var v3 = new THREE.Vector3().subVectors(s3, camera.position);
				var v4 = new THREE.Vector3().subVectors(s4, camera.position);
				
				var s5 = new THREE.Vector3(0, 0, FAR).unproject(camera).add(v4.clone().setLength(FAR));
				var v5 = new THREE.Vector3().subVectors(s5, camera.position);
				
				var n0 = new THREE.Vector3().crossVectors(v1, v0).normalize();
				var n1 = new THREE.Vector3().crossVectors(v2, v1).normalize();
				var n2 = new THREE.Vector3().crossVectors(v3, v2).normalize();
				var n3 = new THREE.Vector3().crossVectors(v0, v3).normalize();
				var n4 = v4.clone().normalize();
				var n5 = v5.clone().negate().normalize();
				
				var d0 = - n0.dot(s0);
				var d1 = - n1.dot(s1);
				var d2 = - n2.dot(s2);
				var d3 = - n3.dot(s3);
				var d4 = - n4.dot(s4);
				var d5 = - n5.dot(s5);
				
				var p0 = new THREE.Plane(n0, d0);
				var p1 = new THREE.Plane(n1, d1);
				var p2 = new THREE.Plane(n2, d2);
				var p3 = new THREE.Plane(n3, d3);
				var p4 = new THREE.Plane(n4, d4);
				var p5 = new THREE.Plane(n5, d5);
				
				var frustum = new THREE.Frustum(p0, p1, p2, p3, p4, p5);
				
				if(!ctrlKey)
					setSelected(null, false, true);
				
				for(var key in objects) {
					if(objects[key].visible && objects[key].mesh.userData.type === 'object') {
						if(selected.indexOf(objects[key].mesh) === -1 && frustum.intersectsObject(objects[key].mesh)) {
							var position = objects[key].mesh.geometry.attributes.position.array;
							var m = objects[key].mesh.matrixWorld;
							for(var i=0, l=position.length; i<l; i+=3) {
								var vertex = new THREE.Vector3(position[i], position[i+1], position[i+2]);
								vertex.applyMatrix4(m);
								if(frustum.containsPoint(vertex)) {
									setSelected(objects[key].mesh, true);
									break;
								}
							}
						}
					}
				}
			}

			/**
			 * deselect any selected object and assign original material,
			 * then select object and assign selection material
			 * @param {THREE.Mesh} obj - object to be set
			 * @param {boolean} [onlySelect=false] - if true, no deselection
             * @param {boolean} [onlyDeselect=false] - if true, no selection
             */
			function setSelected(obj, onlySelect, onlyDeselect) {
				onlySelect = onlySelect || false;
				onlyDeselect = onlyDeselect || false;
				
				dehighlight();
				// deselect all
				if(selected.length > 0 && !onlySelect) {
					for(var i=0; i<selected.length; i++) {
						var o = selected[i];
						if(o.userData.type === 'object')
							rejectSelectionMat(o);
						webglInterface.deselectListEntry(o.id, o.userData);
						if(o.userData.type === 'plan') {
							plans[o.id].selected = false;
							o.deselect();
						}
						if(o.userData.type === 'image') {
							spatialImages[o.id].selected = false;
							o.deselect();
						}
						if(o.userData.type !== 'plan')
							deselectChildren(o.children);
						else
							setGizmo();
					}
					selected = [];
				}
				// selection
				if(obj && !onlyDeselect && selected.indexOf(obj) === -1) {
					if(obj.userData.type === 'object')
						assignSelectionMat(obj);
					webglInterface.selectListEntry(obj.id, obj.userData);
					if(obj.userData.type === 'plan') {
						plans[obj.id].selected = true;
						obj.select();
					}
					if(obj.userData.type === 'image') {
						spatialImages[obj.id].selected = true;
						obj.select();
					}
					if(obj.userData.type !== 'plan')
						selectChildren(obj.children);
					else
						// setGizmo(obj, 'move', [plans[obj.id].edges]);
						setGizmo(obj, 'move');

					selected.push(obj);
					//console.log(selected);
				}
				// deselect obj
				else if(obj && !onlyDeselect && selected.indexOf(obj) !== -1) {
					if(obj.userData.type === 'object')
						rejectSelectionMat(obj);
					webglInterface.deselectListEntry(obj.id, obj.userData);
					if(obj.userData.type === 'plan') {
						plans[obj.id].selected = false;
						obj.deselect();
					}
					if(obj.userData.type === 'image') {
						spatialImages[obj.id].selected = false;
						obj.deselect();
					}
					if(obj.userData.type !== 'plan')
						deselectChildren(obj.children);
					else
						setGizmo();
						
					selected.splice(selected.indexOf(obj), 1);
				}

				$rootScope.$applyAsync();
			}

			/**
			 * Call `setSelected` from outside.
			 * @param obj
			 * @param ctrlKey
			 * @param deselect
			 */
			webglInterface.callFunc.setSelected = function (obj, ctrlKey, deselect) {
				setSelected(obj, ctrlKey, deselect);
				animate();
			};

			/**
			 * look for any children and select them
			 * @param {Array} children
             */
			function selectChildren(children) {
				for(var i=0, l=children.length; i<l; i++) {
					var o = children[i];
					if(o.userData.type === 'object')
						assignSelectionMat(o);
					webglInterface.selectListEntry(o.id, o.userData);
					selectChildren(o.children);
				}
			}

			/**
			 * look for any children and deselect them
			 * @param {Array} children
             */
			function deselectChildren(children) {
				for(var i=0, l=children.length; i<l; i++) {
					var o = children[i];
					if(o.userData.type === 'object')
						rejectSelectionMat(o);
					webglInterface.deselectListEntry(o.id, o.userData);
					deselectChildren(o.children);
				}
			}

			/**
			 * assign selection material to object
			 * @param {THREE.Mesh} obj - object
             */
			function assignSelectionMat(obj) {
				// if(obj.material.map != null) {
					// if(obj.userData.type == 'plan')
						// obj.material.color.setHex(0xff8888);
					// else
						// obj.material.ambient.setHex(0xff8888);
				// }
				// else if(shading === 'transparent')
					// obj.material = materials['transparentSelectionMat'];
				// else if(shading === shading.WIRE)
					// obj.material = materials['wireframeSelectionMat'];
				// else if(shading == 'xray')
					// obj.material = materials['xraySelectionMat'];
				// else
					// obj.material = materials['selectionMat'];
				// if(scope.viewportSettings.shading == shading.EDGE && obj.userData.type === 'object' && objects[obj.id].edges)
					// objects[obj.id].edges.material.color.setHex(0xff4444);
				 if(obj.userData.type === 'plan') {
					 //obj.material.color.setHex(0xffcccc);
					 plans[obj.id].edges.material = materials['edgesSelectionMat'];
					 return;
				 }

				if(obj.userData.type === 'image') {
					obj.pyramid.material.color.setHex(webglContext.selectionColor);
					return;
				}
				
				switch(currentShading) {
					case 'xray': obj.material = materials['xraySelectionMat']; break;
					case 'onlyEdges': objects[obj.id].edges.material = materials['edgesSelectionMat']; break;
					case 'transparent':
						if(obj.userData.modifiedMat)
							obj.material.color = materials['transparentSelectionMat'].color;
						else
							obj.material = materials['transparentSelectionMat'];
						break;
					default:
						if(obj.userData.modifiedMat)
							obj.material.color = materials['selectionMat'].color;
						else {
							//obj.material = materials['selectionMat'];
							if (objects[obj.id].edges)
								objects[obj.id].edges.material = materials['edgesSelectionMat'];
						}
						break;
				}
			}

			/**
			 * reject selection material from object
			 * @param {THREE.Mesh} obj - object
			 */
			function rejectSelectionMat(obj) {
				// if(obj.material.map != null) {
					// if(obj.userData.type == 'plan')
						// obj.material.color.setHex(0xffffff);
					// else
						// obj.material.ambient.setHex(0xffffff);
				// }
				// else if(scope.viewportSettings.shading == shading.GREY_EDGE)
					// obj.material = materials['defaultMat'];
				// else if(scope.viewportSettings.shading == shading.TRANSPARENT_EDGE)
					// obj.material = materials['transparentMat'];
				// else if(scope.viewportSettings.shading == shading.WIRE)
					// obj.material = materials['wireframeMat'];
				// else if(scope.viewportSettings.shading == shading.XRAY)
					// obj.material = materials['xrayMat'];
				// else
					// obj.material = materials[obj.userData.originalMat];
				// if(obj.userData.type === 'object' && objects[obj.id].edges)
					// objects[obj.id].edges.material.color.setHex(0x333333);
				if(obj.userData.type === 'plan') {
					 //obj.material.color.setHex(0xffffff);
					plans[obj.id].edges.material = materials['edgesMat'];
					return;
				}

				if(obj.userData.type === 'image') {
					obj.pyramid.material.color.setHex(0x0000ff);
					return;
				}

				switch(currentShading) {
					case 'xray': obj.material = materials['xrayMat']; break;
					case 'onlyEdges': objects[obj.id].edges.material = materials['edgesMat']; break;
					case 'transparent':
						if(obj.userData.modifiedMat)
							obj.material.color = materials['transparentMat'].color;
						else
							obj.material = materials['transparentMat'];
						break;
					/*case 'grey':
						if(obj.userData.modifiedMat)
							obj.material.color = materials['defaultDoublesideMat'].color;
						else
							obj.material = materials['defaultDoublesideMat'];
						break;*/
					default:
						if(obj.userData.modifiedMat)
							obj.material.color = materials[obj.userData.originalMat].color;
						else {
							//obj.material = materials[obj.userData.originalMat];
							if (objects[obj.id].edges)
								objects[obj.id].edges.material = materials['edgesMat'];
						}
						break;
				}
			}
			
			function highlightObject(obj) {
				
				for(var i=0; i<highlighted.length; i++) {
					if(highlighted[i] === obj) continue;
					rejectHighlightMat(highlighted[i]);
					highlighted.splice(i,1);
					--i;
				}
				
				if(obj && highlighted.indexOf(obj) === -1) {
					if(obj.userData.type === 'object')
						assignHighlightMat(obj);
					highlighted.push(obj);
				}
				
			}
			
			function assignHighlightMat(obj) {
				
				obj.material = obj.material.clone();
				var hcolor = new THREE.Color(0xffff00); //materials['highlightMat'].color.clone();
				
				obj.material.color.lerp(hcolor, 0.2);
				
				/*
				switch(currentShading) {
					case 'xray': obj.material = materials['xrayHighlightMat']; break;
					case 'onlyEdges': objects[obj.id].edges.material = materials['edgesHighlightMat']; break;
					case 'transparent':
						if(obj.userData.modifiedMat)
							obj.material.color = materials['transparentHighlightMat'].color;
						else
							obj.material = materials['transparentHighlightMat'];
						break;
					default:
						if(obj.userData.modifiedMat)
							obj.material.color = materials['highlightMat'].color;
						else	
							//obj.material = materials['selectionMat'];
							objects[obj.id].edges.material = materials['edgesHighlightMat'];
						break;
				}*/
			}
			
			function rejectHighlightMat(obj) {
				obj.material.dispose();
				switch(currentShading) {
					case 'grey':
						obj.material = materials['defaultDoublesideMat'];
						break;
					default:
						obj.material = materials[obj.userData.originalMat];
						break;
				}
			}
			
			// check for intersection of BoundingBoxes
			function overlapAABB(o1, o2) {
				if(!o1.geometry.boundingBox) o1.geometry.computeBoundingBox();
				if(!o2.geometry.boundingBox) o2.geometry.computeBoundingBox();
				var box1 = o1.geometry.boundingBox.clone().applyMatrix4(o1.matrixWorld);
				var box2 = o2.geometry.boundingBox.clone().applyMatrix4(o2.matrixWorld);

				var ext1 = new THREE.Vector3().subVectors(box1.max, box1.min);
				var ext2 = new THREE.Vector3().subVectors(box2.max, box2.min);
				var pdiff = new THREE.Vector3().subVectors(box1.center(), box2.center());
				
				return Math.abs(pdiff.x) <= ((ext1.x + ext2.x)/2)
					&&
					Math.abs(pdiff.y) <= ((ext1.y + ext2.y)/2)
					&&
					Math.abs(pdiff.z) <= ((ext1.z + ext2.z)/2);
			}
			
			// slice object/faces
			function sliceObject(objGeometry, pl, linegeo) {
				
				var objFaces = objGeometry.faces;
				var objVertices = objGeometry.vertices;
				
				//var pV0 = pl.geometry.faces[0].centroid.clone().add(pl.position);
				var pV0 = pl.geometry.vertices[0].clone().setFromMatrixPosition(pl.matrix);
				var pN = pl.geometry.faces[0].normal.clone();
				
				pN = pN.transformDirection(pl.matrix);
				//pN = pl.worldToLocal(pN);
				//pN.normalize();
				//console.log(pN);
				
				var frontFaces = [];
				for(var i=0; i<objFaces.length; i++) {
					
					var f = objFaces[i];
					var cf = classifyFace(f, objVertices, pV0, pN);
					if(cf > 2) {
						// frontside
						frontFaces.push(f);
					}
					else if(cf < -2 && cf !== 0) {
						// backside
					}
					else {
						// intersections with plane
						var o = intersectionsFacePlane(pV0, pN, objVertices[f.a], objVertices[f.b], objVertices[f.c]);
						
						if(o) {
							// generate 3 new faces
							var a = splitFaceIntoFaces(f, objVertices, o, linegeo);
							
							var c = classifyFace(a[0], objVertices, pV0, pN);
							if(c > 2)
								frontFaces.push(a[0]);
							
							c = classifyFace(a[1], objVertices, pV0, pN);
							if(c > 2)
								frontFaces.push(a[1]);
							
							c = classifyFace(a[2], objVertices, pV0, pN);
							if(c > 2)
								frontFaces.push(a[2]);
						}
					}
				}
				
				var geo = new THREE.Geometry();
				geo.faces = frontFaces;
				geo.vertices = objVertices;
				
				return new THREE.Mesh(geo, materials['defaultMat']);
				//return new THREE.Mesh(geo, new THREE.MeshFaceMaterial(materials['sliceMultiMat']));
				//return new THREE.Mesh(geo, new THREE.MeshFaceMaterial(materials_debug));
			}
			
			// slice lines
			function sliceEdges(edgGeometry, pl) {
				
				var pList = edgGeometry.attributes.position.array;
				var newPList = [];
				
				var pV0 = pl.geometry.vertices[0].clone().setFromMatrixPosition(pl.matrix);
				var pN = pl.geometry.faces[0].normal.clone();
				
				pN = pN.transformDirection(pl.matrix);
				//pN = pl.worldToLocal(pN);
				//pN.normalize();
				//console.log(pN);
				
				for(var i=0; i<pList.length; i+=6) {
					
					var v0 = new THREE.Vector3(pList[i], pList[i+1], pList[i+2]);
					var v1 = new THREE.Vector3(pList[i+3], pList[i+4], pList[i+5]);
					
					var cl = classifyLine(v0, v1, pV0, pN);
					
					if(cl === 4 || cl === 3 || cl === 2) {
						// frontside: take values
						newPList.push(pList[i]);
						newPList.push(pList[i+1]);
						newPList.push(pList[i+2]);
						newPList.push(pList[i+3]);
						newPList.push(pList[i+4]);
						newPList.push(pList[i+5]);
					}
					else if(cl === -4 || cl === -1) {
						// backside: do nothing (discard values)
					}
					else {
						// get intersection point
						var vs = intersectionLinePlane(pV0, pN, v0, v1).intersection;
						
						if(vs) {
							// exchange backside point with intersection point
							if(classifyPoint(v0, pV0, pN) === -2)
								v0 = vs;
							else if(classifyPoint(v1, pV0, pN) === -2)
								v1 = vs;
							
							// take values
							newPList.push(v0.x);
							newPList.push(v0.y);
							newPList.push(v0.z);
							newPList.push(v1.x);
							newPList.push(v1.y);
							newPList.push(v1.z);
						}
					}
				}
				
				edgGeometry.attributes.position.array = new Float32Array(newPList);
				return new THREE.Line(edgGeometry, materials['edgesMat'], THREE.LinePieces);
			}
			
			// split/cut face into 3 faces
			function splitFaceIntoFaces(face, vertices, o, linegeo) {
				// vertex indices
				var i0 = face.a;
				var i1 = face.b;
				var i2 = face.c;
				
				// intersection points
				var vA = o.sideA.intersection;
				var vB = o.sideB.intersection;
				var vC = o.sideC.intersection;
				
				var iA, iB, iC;
				var nA, nB, nC;
				
				// insert new intersection points, compute new vertex normals
				if(vA) {
					vertices.push(vA);
					iA = vertices.length - 1;
					nA = interpolateVectors(face.vertexNormals[0], face.vertexNormals[1], o.sideA.t);
					linegeo.vertices.push(vA);
				}
				if(vB) {
					vertices.push(vB);
					iB = vertices.length - 1;
					nB = interpolateVectors(face.vertexNormals[1], face.vertexNormals[2], o.sideB.t);
					linegeo.vertices.push(vB);
				}
				if(vC) {
					vertices.push(vC);
					iC = vertices.length - 1;
					nC = interpolateVectors(face.vertexNormals[2], face.vertexNormals[0], o.sideC.t);
					linegeo.vertices.push(vC);
				}
				
				var fa, fb;
				
				// create new faces
				if(iA && iB) {
					face.a = i1; face.b = iB; face.c = iA;
					
					fa = new THREE.Face3(i0, iA, iB, face.normal, face.color, 0);
					fb = new THREE.Face3(i0, iB, i2, face.normal, face.color, 0);
					
					fa.vertexNormals = [face.vertexNormals[0], nA, nB];
					fb.vertexNormals = [face.vertexNormals[0], nB, face.vertexNormals[2]];
					face.vertexNormals = [face.vertexNormals[1], nB, nA];
				}
				else if(iB && iC) {
					face.a = i2; face.b = iC; face.c = iB;
					
					fa = new THREE.Face3(i1, iB, iC, face.normal, face.color, 0);
					fb = new THREE.Face3(i0, i1, iC, face.normal, face.color, 0);
					
					fa.vertexNormals = [face.vertexNormals[1], nB, nC];
					fb.vertexNormals = [face.vertexNormals[0], face.vertexNormals[1], nC];
					face.vertexNormals = [face.vertexNormals[2], nC, nB];
				}
				else if(iA && iC) {
					face.a = i0; face.b = iA; face.c = iC;
					
					fa = new THREE.Face3(i2, iC, iA, face.normal, face.color, 0);
					fb = new THREE.Face3(iA, i1, i2, face.normal, face.color, 0);
					
					fa.vertexNormals = [face.vertexNormals[2], nC, nA];
					fb.vertexNormals = [nA, face.vertexNormals[1], face.vertexNormals[2]];
					face.vertexNormals = [face.vertexNormals[0], nA, nC];
				}
				
				return [face, fa, fb];
			}
			
			// get intersection points of face and plane
			function intersectionsFacePlane(pV, pN, v0, v1, v2) {
				var num = 0;
				var o = {};
				
				o.sideA = intersectionLinePlane(pV, pN, v0, v1);
				if(!o.sideA.t) num++;
				o.sideB = intersectionLinePlane(pV, pN, v1, v2);
				if(!o.sideB.t) num++;
				o.sideC = intersectionLinePlane(pV, pN, v2, v0);
				if(!o.sideC.t) num++;
				
				if(num == 1) return o;
				else return null; // possible logic problem
			}
			
			// get intersection point of line and plane
			function intersectionLinePlane(pV, pN, lineStart, lineEnd) {
				var vd = pN.dot(pV.clone().sub(lineStart));
				var vo = pN.dot(lineEnd.clone().sub(lineStart));
				
				if(vo == 0) return {intersection: null, t: null}; // parallel
				
				var t = vd/vo;
				
				if(t >= 0 && t <= 1)
					return {intersection: interpolateVectors(lineStart, lineEnd, t), t: t};
				else
					return {intersection: null, t: null};
			}
			
			// teste, ob AABB vor, hinter oder in der Schnittebene liegt
			function classifyObject(o, pl) {
				var pV = pl.geometry.vertices[0].clone().setFromMatrixPosition(pl.matrix);
				var pN = pl.geometry.faces[0].normal.clone();
				pN = pN.transformDirection(pl.matrix);
				
				//o.geometry.computeBoundingBox();
				var box = o.geometry.boundingBox.clone();
				box.min = box.min.add(o.position);
				box.max = box.max.add(o.position);
				
				var v0 = box.min;
				var v1 = new THREE.Vector3(box.min.x, box.min.y, box.max.z);
				var v2 = new THREE.Vector3(box.min.x, box.max.y, box.min.z);
				var v3 = new THREE.Vector3(box.min.x, box.max.y, box.max.z);
				var v4 = new THREE.Vector3(box.max.x, box.min.y, box.max.z);
				var v5 = new THREE.Vector3(box.max.x, box.max.y, box.min.z);
				var v6 = new THREE.Vector3(box.max.x, box.min.y, box.min.z);
				var v7 = box.max;
				
				var value = 0;
				value += classifyPoint(v0, pV, pN);
				value += classifyPoint(v1, pV, pN);
				value += classifyPoint(v2, pV, pN);
				value += classifyPoint(v3, pV, pN);
				value += classifyPoint(v4, pV, pN);
				value += classifyPoint(v5, pV, pN);
				value += classifyPoint(v6, pV, pN);
				value += classifyPoint(v7, pV, pN);
				
				if(value == 16) return 1; // frontside
				else if(value == -16) return -1; // backside
				else return 0; // intersects plane
			}
			
			// teste, ob Face vor, hinter oder in der Schnittebene liegt
			function classifyFace(face, objVertices, pV, pN) {
				/** value explanation
					 6 - 3 points frontside
					 5 - 2 points frontside, 1 point touches plane
					 4 - 1 point frontside, 2 points touch plane
					 3 - 3 points touch plane
					 2 - 2 points frontside, 1 point backside
					 ---
					 0 - 1 point backside, 2 points touch plane
					-2 - 2 points backside, 1 point frontside
					-3 - 2 points backside, 1 point touches plane
					-6 - 3 points backside
				*/
				var value = 0;
				
				value += classifyPoint(objVertices[face.a], pV, pN);
				value += classifyPoint(objVertices[face.b], pV, pN);
				value += classifyPoint(objVertices[face.c], pV, pN);
				
				return value;
			}
			
			// teste, ob Line vor, hinter oder in der Schnittebene liegt
			function classifyLine(v0, v1, pV, pN) {
				/** value explanation
					 4 - 2 points frontside
					 3 - 1 point frontside, 1 point touches plane
					 2 - 2 points touch plane
					 ---
					 0 - 1 point frontside, 1 point backside
					 ---
					-1 - 1 point backside, 1 point touches plane
					-4 - 2 points backside
				*/
				var value = 0;
				
				value += classifyPoint(v0, pV, pN);
				value += classifyPoint(v1, pV, pN);
				
				return value;
			}
			
			// teste, ob Point vor, hinter oder auf der Schnittebene liegt
			function classifyPoint(p, pV, pN) {
				if((p.clone().sub(pV)).dot(pN).toFixed(8) < 0)
					return -2; // backside
				else if((p.clone().sub(pV)).dot(pN).toFixed(8) > 0)
					return 2; // frontside
				else
					return 1; // on plane
			}
			
			function sliceWorld() {
				
				for(var key in objects) {
					var obj = objects[key].mesh;
					
					// teste, ob AABB vor, hinter oder in der Schnittebene liegt
					var c = classifyObject(obj, plane);
					
					if(c === 1) {
						// do nothing
					}
					else if(c === -1) {
						// obj ausblenden
						scene.remove(obj);
						scene.remove(objects[key].edges);
						hidden.push(obj.id);
					}
					else if(c === 0) {
						// obj schneiden
						scene.remove(obj);
						scene.remove(objects[key].edges);
						
						var lineGeo = new THREE.Geometry();
						var sobj = sliceObject(obj.geometry.clone(), plane, lineGeo);
						var sedg = sliceEdges(objects[key].edges.geometry.clone(), plane);
						
						// sliced mesh
						sobj.material = obj.material;
						objects[key].slicedMesh = sobj;
						scene.add(sobj);
						sliced.push(obj.id);
						
						// sliced edges
						objects[key].slicedEdges = sedg;
						scene.add(sedg);
						
						// rote Schnittlinie
						//objects[key].sliceLine = new THREE.Line(lineGeo, materials['sliceLineMat'], THREE.LinePieces);
						objects[key].sliceLine = sortLines(lineGeo);
						scene.add(objects[key].sliceLine);
						
						//console.log(objects[key].sliceLine);
						
						var m = new THREE.Matrix4().getInverse(plane.matrix);
						//objects[key].sliceLine.children[0].geometry.applyMatrix(m);
						
						// Schnittflächen
						objects[key].sliceFaces = sliceFaces(objects[key].sliceLine, plane);
						scene.add(objects[key].sliceFaces);
						
						//objects[key].sliceFaces.applyMatrix(m);
					}
				}
				
				//console.log(sliced);
				//console.log(hidden);
			}
			
			function restoreWorld() {
				for(var i=0; i<sliced.length; i++) {
					scene.remove(objects[sliced[i]].slicedMesh);
					scene.remove(objects[sliced[i]].slicedEdges);
					scene.remove(objects[sliced[i]].sliceLine);
					scene.remove(objects[sliced[i]].sliceFaces);
					
					objects[sliced[i]].slicedMesh = null;
					objects[sliced[i]].slicedEdges = null;
					objects[sliced[i]].sliceLine = null;
					objects[sliced[i]].sliceFaces = null;
					
					scene.add(objects[sliced[i]].mesh);
					scene.add(objects[sliced[i]].edges);
				}
				for(var i=0; i<hidden.length; i++) {
					scene.add(objects[hidden[i]].mesh);
					scene.add(objects[hidden[i]].edges);
				}
				/*for(var i=0; i<objects.length; i++) {
					if(!scene.getObjectById(objects[i].id))
						scene.add(objects[i]);
				}*/
				
				sliced = [];
				hidden = [];
			}
			
			function sliceFaces(lines, pl) {
				var obj = new THREE.Object3D();
				var m = new THREE.Matrix4().getInverse(pl.matrix);
				
				for(var i=0; i<lines.children.length; i++) {
					var verts = lines.children[i].geometry.vertices;
					
					// wenn Schnittlinie nicht geschlossen, dann keine Fläche erstellen
					if(verts.length < 3)
						continue;
					if(!equalVectors(verts[0], verts[verts.length-1], 8))
						continue;
					
					var shapeVerts = [];
					for(var j=0; j<verts.length; j++) {
						var v = verts[j].clone();
						v.applyMatrix4(m);
						//console.log(v.x, v.y, v.z);
						shapeVerts.push(new THREE.Vector2(v.x, v.y));
					}
					
					var shape = new THREE.Shape(shapeVerts);
					var shapegeo = new THREE.ShapeGeometry(shape);
					shapegeo.applyMatrix(pl.matrix);
					
					// var tex = new THREE.ImageUtils.loadTexture('bg_schraffur.png');
					// var mat = new THREE.MeshLambertMaterial({map: tex, side: THREE.DoubleSide});
					// obj.add(new THREE.Mesh(shapegeo, mat));
					obj.add(new THREE.Mesh(shapegeo, materials['defaultDoublesideMat']));
					//obj.add(new THREE.Mesh(shapegeo, materials['wireframeMat']));
				}
				
				return obj;
			}
			
			// sort LinePieces to LineStrip
			function sortLines(oldgeo) {
				var obj = new THREE.Object3D();
				var verts = oldgeo.vertices;
				
				while(verts.length > 0) {
					var sorted = [];
					if(verts.length === 1) break;
					
					sorted.push(verts[0]);
					sorted.push(verts[1]);
					verts.splice(0,2);
					
					for(var i=0; i<verts.length; i++) {
						
						var first = sorted[0];
						var last = sorted[sorted.length-1];
						
						for(var j=0; j<verts.length; j++) {
							// test with last element
							if(equalVectors(last, verts[j], 8)) {
								if(j%2 == 0) {
									sorted.push(verts[j+1]);
									verts.splice(j,2);
								}
								else {
									sorted.push(verts[j-1]);
									verts.splice(j-1, 2);
								}
								j -= 2;
								i -= 2;
								break;
							}
							// test with first element
							else if(equalVectors(first, verts[j], 8)) {
								if(j%2 == 0) {
									sorted.unshift(verts[j+1]);
									verts.splice(j,2);
								}
								else {
									sorted.unshift(verts[j-1]);
									verts.splice(j-1, 2);
								}
								j -= 2;
								i -= 2;
								break;
							}
						}
					}
					
					// add new Line object
					var geo = new THREE.Geometry();
					geo.vertices = sorted;
					obj.add(new THREE.Line(geo, materials['sliceLineMat'], THREE.LineStrip));
				}
				
				return obj;
			}
			
			// compare two Vector3 with given precision
			function equalVectors(v1, v2, precision) {
				if(v1.x.toFixed(precision) !== v2.x.toFixed(precision))
					return false;
				else if(v1.y.toFixed(precision) !== v2.y.toFixed(precision))
					return false;
				else if(v1.z.toFixed(precision) !== v2.z.toFixed(precision))
					return false;
				else
					return true;
			}
			
			// interpolate two vectors
			function interpolateVectors(start, end, t) {
				return start.clone().add((end.clone().sub(start)).multiplyScalar(t));
			}
			
			// watch für die Einstellungen für Unsicheres Wissen
			scope.$watch('unsafeSettings', function(value) {
				//console.log('watch unsafe', value);
				//if(/^-?[\d.]+(?:e-?\d+)?$/.test(value))
				if(typeof materials['defaultUnsafeMat'] == 'undefined') return;
				materials['defaultUnsafeMat'].opacity = value.opacity/100;
				for(var key in objects) {
					if(objects[key].mesh.userData.unsafe) {
						objects[key].mesh.material.opacity = value.opacity/100;
						if(objects[key].visible) {
							if(value.edges && scope.shading != shading.COLOR) {
								if(!scene.getObjectById(objects[key].edges.id))
									scene.add(objects[key].edges);
							}
							else {
								scene.remove(objects[key].edges);
							}
						}
					}
				}
				animate();
			}, true);
			
			/*scope.$watch('viewportSettings.ssao', function(value) {
				switch(value) {
					case 'ssao': renderSSAO = true; break;
					default: renderSSAO = false; break;
				}
			});
			*/
			
			// watch ssao settings
			$rootScope.$watch(function() {
				return webglInterface.viewportSettings.ssao;
			}, function(value) {
				console.log('watchssao', value);
				switch(value) {
					case 'ssao': renderSSAO = true; break;
					default: renderSSAO = false; break;
				}
				animate();
			});
			
			// watch edges settings
			scope.$watch('vizSettings.edges', function(value) {
				for(var key in objects) {
					var obj = objects[key];
					if(obj.visible && obj.edges) {
						if(value) scene.add(obj.edges);
						else scene.remove(obj.edges);
					}
				}
				animate();
			});
			scope.$watch('vizSettings.edgesOpacity', function(value) {
				console.log(value);
				if(!materials['edges']) return;
				if(value == 100) {
					materials['edgesMat'].transparent = false;
					materials['edgesSelectionMat'].transparent = false;
				}
				else {
					materials['edgesMat'].transparent = true;
					materials['edgesMat'].opacity = value/100;
					materials['edgesSelectionMat'].transparent = true;
					materials['edgesSelectionMat'].opacity = value/100;
				}
				animate();
			});
			
			//scope.$watch('viewportSettings.shading', function(value) {
			scope.setShading = function(value) {
				console.log('set shading', value);
				if(!scene) return;
				
				var uncoverObj = ['onlyEdges'].indexOf(currentShading) !== -1;
				var uncoverEdge = webglInterface.viewportSettings.edges ? ['xray'].indexOf(currentShading) !== -1 : false;
				if(currentShading === 'Custom') { scope.activeCategory = null; webglInterface.activeCategory = null; }
				currentShading = value;
				webglInterface.viewportSettings.shadingSel = value;
				
				switch(value) {
					case 'color':
						for(var key in objects) {
							var obj = objects[key];
							if(selected.indexOf(obj.mesh) !== -1) {
								obj.mesh.material = materials['selectionMat'];
								if(obj.edges)
									obj.edges.material = materials['edgesMat'];
							}
							else
								obj.mesh.material = materials[obj.mesh.userData.originalMat];
							if(obj.visible) {
								if(uncoverObj) {
									if(obj.parent) objects[obj.parent].mesh.add(obj.mesh);
									else scene.add(obj.mesh);
								}
								if(uncoverEdge) scene.add(obj.edges);
							}
						}
						break;
					case 'grey':
						for(var key in objects) {
							var obj = objects[key];
							if(selected.indexOf(obj.mesh) !== -1) {
								obj.mesh.material = materials['selectionMat'];
								if(obj.edges)
									obj.edges.material = materials['edgesMat'];
							}
							else if(objects[key].mesh.userData.unsafe)
								obj.mesh.material = materials['defaultUnsafeMat'];
							else
								obj.mesh.material = materials['defaultDoublesideMat'];
							if(obj.visible) {
								if(uncoverObj) {
									if(obj.parent) objects[obj.parent].mesh.add(obj.mesh);
									else scene.add(obj.mesh);
								}
								if(uncoverEdge) scene.add(obj.edges);
							}
						}
						break;
					case 'transparent':
						for(var key in objects) {
							var obj = objects[key];
							if(selected.indexOf(obj.mesh) !== -1) {
								obj.mesh.material = materials['transparentSelectionMat'];
								if(obj.edges)
									obj.edges.material = materials['edgesMat'];
							}
							else if(objects[key].mesh.userData.unsafe)
								obj.mesh.material = materials['defaultUnsafeMat'];
							else
								obj.mesh.material = materials['transparentMat'];
							if(obj.visible) {
								if(uncoverObj) {
									if(obj.parent) objects[obj.parent].mesh.add(obj.mesh);
									else scene.add(obj.mesh);
								}
								if(uncoverEdge) scene.add(obj.edges);
							}
						}
						break;
					case 'onlyEdges':
						uncoverEdge = !webglInterface.viewportSettings.edges || uncoverEdge;
						webglInterface.viewportSettings.edges = true;
						for(var key in objects) {
							var obj = objects[key];
							if(selected.indexOf(obj.mesh) !== -1)
								obj.edges.material = materials['edgesSelectionMat'];
							if(obj.visible) {
								if(obj.parent) objects[obj.parent].mesh.remove(obj.mesh);
								else scene.remove(obj.mesh);
								if(uncoverEdge)	scene.add(obj.edges)
							}
						}
						break;
					case 'xray':
						for(var key in objects) {
							var obj = objects[key];
							if(selected.indexOf(obj.mesh) !== -1)
								obj.mesh.material = materials['xraySelectionMat'];
							else
								obj.mesh.material = materials['xrayMat'];
							if(obj.visible) {
								if(uncoverObj) {
									if(obj.parent) objects[obj.parent].mesh.add(obj.mesh);
									else scene.add(obj.mesh);
								}
								if(webglInterface.viewportSettings.edges) scene.remove(obj.edges);
							}
						}
						break;
					/*case shading.WIRE:
						for(var key in objects) {
							if(selected == objects[key].mesh) {
								objects[key].mesh.material = materials['wireframeSelectionMat'];
								objects[key].edges.material.color.setHex(0x333333);
							}
							else
								objects[key].mesh.material = materials['wireframeMat'];
							if(objects[key].visible) {
								if(!scene.getObjectById(key))
									scene.add(objects[key].mesh);
								scene.remove(objects[key].edges);
							}
						}
						break;*/
				}
				animate();
			};
			
			//scope.$watch('viewportSettings.camera', function(value) {
			scope.setCamera = function(value) {
				console.log('set camera', value);
				if(!scene) return;
				
				switch(value) {
					case 'Perspective':
						camera.toPerspective();
						camera.setZoom(1);
						break;
					case 'Top':
						camera.toOrthographic(controls.center);
						camera.toTopView();
						break;
					case 'Front':
						camera.toOrthographic(controls.center);
						camera.toFrontView();
						break;
					case 'Back':
						camera.toOrthographic(controls.center);
						camera.toBackView();
						break;
					case 'Left':
						camera.toOrthographic(controls.center);
						camera.toLeftView();
						break;
					case 'Right':
						camera.toOrthographic(controls.center);
						camera.toRightView();
						break;
					default: break;
				}
				animate();
				console.log(camera);
			};
			
			// watch vizSettings.opacitySelected
			$rootScope.$watch(function() {
				return webglInterface.vizSettings.opacitySelected;
			}, function(value) {
				for(var i=0; i<selected.length; i++) {
					var mesh = selected[i];
					var edges;
					if(mesh.userData.type === 'plan')
						edges = plans[mesh.id].edges;
					else
						edges = objects[mesh.id].edges;
					if(!mesh.userData.modifiedMat) {
						mesh.material = mesh.material.clone();
						mesh.material.transparent = true;
						mesh.material.depthWrite = false;
						//mesh.material.side = THREE.FrontSide;
						mesh.material.needsUpdate = true;
						edges.material = edges.material.clone();
						edges.material.transparent = true;
						edges.material.needsUpdate = true;
						mesh.userData.modifiedMat = true;
					}
					mesh.material.opacity = value/100;
					edges.material.opacity = value/100;
					
				}
				animate();
			});
			
			// set opacity of objects
			webglInterface.callFunc.setObjectOpacity = function(item, value) {
				var mesh = objects[item.id].mesh;
				var edges = objects[item.id].edges;
				
				if(item.type === 'object')
					setOpacity(mesh, edges, value);
				item.opacity = value;
				setChildrenOpacity(item.children, value);
				animate();
			};
			
			// set opacity of plans
			// webglInterface.callFunc.setPlanOpacity = function(id, value) {
			// 	var mesh = plans[id].mesh;
			// 	var edges = plans[id].edges;
			// 	setOpacity(mesh, edges, value);
			// 	animate();
			// };
			
			function setChildrenOpacity(children, value) {
				for(var i=0; i<children.length; i++) {
					var cid = children[i].id;
					var mesh = objects[cid].mesh;
					var edges = objects[cid].edges;
					
					if(children[i].type === 'object')
						setOpacity(mesh, edges, value);
					children[i].opacity = value;
					setChildrenOpacity(children[i].children, value);
				}
			}

			/**
			 * set opacity
			 * @param {THREE.Mesh} mesh - reference to mesh
			 * @param {THREE.Line} edges - reference to edges
             * @param {number} value - opacity value
             */
			function setOpacity(mesh, edges, value) {
				if(value == 1.0) {
					if(selected.indexOf(mesh) === -1) {
						mesh.material = materials[mesh.userData.originalMat];
						if(edges) edges.material = materials['edgesMat'] ;
					}
					else {
						mesh.material = materials['selectionMat'];
						if(edges) edges.material = materials['edgesSelectionMat'] ;
					}
					mesh.userData.modifiedMat = false;
				}
				else if(!mesh.userData.modifiedMat) {
					mesh.material = mesh.material.clone();
					mesh.material.transparent = true;
					mesh.material.depthWrite = false;
					mesh.material.needsUpdate = true;
					if(edges) {
						edges.material = edges.material.clone();
						edges.material.transparent = true;
						edges.material.depthWrite = false;
						edges.material.needsUpdate = true;
					}
					mesh.userData.modifiedMat = true;
				}
				mesh.material.opacity = value;
				if(edges) edges.material.opacity = value;
			}
			
			/**
			 * transformiere Mousekoordinaten zu Viewportkoordinaten
			 * @deprecated
			 * @param event
			 * @returns {THREE.Vector2}
			 */
			function mouseInputToViewport(event) {
				var elementOffset = new THREE.Vector2();
				elementOffset.x = element.offset().left - $(window).scrollLeft();
				elementOffset.y = element.offset().top - $(window).scrollTop();
				
				var mouse = new THREE.Vector2();
				mouse.x = ((event.clientX - elementOffset.x) / SCREEN_WIDTH) * 2 - 1;
				mouse.y = - ((event.clientY - elementOffset.y) / SCREEN_HEIGHT) * 2 + 1;
				
				return mouse;
			}

			/**
			 * transform mouse coordinates to viewport coordinates
			 * @param ox {Number} x coordinate
			 * @param oy {Number} y coordinate
			 * @returns {THREE.Vector2} viewport coordinates
			 */
			function mouseOffsetToViewport(ox, oy) {
				var mouse = new THREE.Vector2();
				mouse.x = (ox / SCREEN_WIDTH) * 2 - 1;
				mouse.y = - (oy / SCREEN_HEIGHT) * 2 + 1;
				
				return mouse;
			}

			/**
			 * MouseDown EventHandler
			 * @param event
             */
			function mousedown(event) {
				//controls.onMouseDown(event.originalEvent);
				//$(canvas).bind('mousemove', mousemove);
				isMouseDown = true;
				//$(canvas).bind('mouseup', mouseup);
				
				//mouseDownCoord = new THREE.Vector2(event.clientX, event.clientY);
				mouseDownCoord = new THREE.Vector2(event.offsetX, event.offsetY);
				
				if(scope.navigation.select || isPinning) {
				
					if(event.button === 0 && event.altKey && !isPanningView && webglInterface.viewportSettings.cameraSel === 'Perspective') {
						if(activeGizmo) activeGizmo = false;
						element.addClass('cursor_orbit');
						isRotatingView = true;
						controls.onMouseDown(event.originalEvent);
					}
					// else if(event.button === 1 && event.altKey && !isRotatingView && !isPanningView) {
						// $('#webglViewport').addClass('cursor_zoom');
						// isZoomingView = true;
						// controls.onMouseDown(event.originalEvent);
					// }
					else if(event.button === 1 && !isRotatingView) {
						element.addClass('cursor_pan');
						isPanningView = true;
						controls.onMouseDown(event.originalEvent);
					}
				
				}
				else if(event.button === 0 && scope.navigation.rotate) {
					isRotatingView = true;
					controls.onMouseDown(event.originalEvent, 0);
				}
				else if(event.button === 0 && scope.navigation.pan) {
					isPanningView = true;
					controls.onMouseDown(event.originalEvent, 2);
				}
				else if(event.button === 0 && scope.navigation.zoom) {
					isZoomingView = true;
					controls.onMouseDown(event.originalEvent, 1);
				}
				/*else if(event.button === 0 && scope.navigation.selectRect) {
					isSelecting = true;
					console.log(event);
					var sr = $('<div/>', {id: 'select-rectangle', 'class': 'select-rectangle'})
						.css({left: event.offsetX, top: event.offsetY, width: 0, height: 0});
					element.append(sr);
				}*/
			}

			/**
			 * MouseMove EventHandler
			 * @param event
             */
			function mousemove(event) {
				
				event.preventDefault();
				//if(isMouseDown)
				//	console.log(event);
				
				if(isMouseDown) {
					// transform gizmo
					if(activeGizmo && event.button === 0) {
						
						if(gizmo instanceof THREE.GizmoMove) {
							var movementX = event.originalEvent.movementX || event.originalEvent.mozMovementX || event.originalEvent.webkitMovementX || 0;
							var movementY = event.originalEvent.movementY || event.originalEvent.mozMovementY || event.originalEvent.webkitMovementY || 0;
							
							var mv = new THREE.Vector3(movementX*0.1, -movementY*0.1, 0);
							gizmo.transformObject(mv, camera);
							setGizmoCoords('move', true);
						}
						else if(gizmo instanceof THREE.GizmoRotate) {
							var mouse = mouseInputToViewport(event);
							gizmo.transformObject(mouse, camera);
							setGizmoCoords('rotate', true);
						}
						isSliceMoving = true;
					}
					// transform view
					else if(isRotatingView || isPanningView || isZoomingView) {
						if(scope.navigation.select) {
							if(camPerspective) {
								controls.onMouseMove(event.originalEvent);
							}
							else {
								var movementX = event.originalEvent.movementX || event.originalEvent.mozMovementX || event.originalEvent.webkitMovementX || 0;
								var movementY = event.originalEvent.movementY || event.originalEvent.mozMovementY || event.originalEvent.webkitMovementY || 0;
								//console.log('mouse move', movementX, movementY);
								orthocam.translateX(-movementX*0.1);
								orthocam.translateY(movementY*0.1);
							}
						}
						else {
							controls.onMouseMove(event.originalEvent);
						}
					}
					// area selection
					else if(event.button === 0 && scope.navigation.select){
						if(mouseDownCoord.equals(new THREE.Vector2(event.offsetX, event.offsetY))) return;
						var css = {};
						if(event.offsetX - mouseDownCoord.x > 0) {
							css.left = mouseDownCoord.x;
							css.width = event.offsetX - mouseDownCoord.x;
						}
						else {
							css.left = event.offsetX;
							css.width = mouseDownCoord.x - event.offsetX;
						}
						if(event.offsetY - mouseDownCoord.y > 0) {
							css.top = mouseDownCoord.y;
							css.height = event.offsetY - mouseDownCoord.y;
						}
						else {
							css.top = event.offsetY;
							css.height = mouseDownCoord.y - event.offsetY;
						}
						
						if(isSelecting) {
							element.find('#select-rectangle').css(css);
						}
						else {
							isSelecting = true;
							var sr = $('<div/>', {id: 'select-rectangle', 'class': 'select-rectangle'})
								.css(css);
							element.append(sr);
						}
					}
				}
				
				else {
					// check if mouse hits gizmo
					if(gizmo) {
						var mouse = mouseInputToViewport(event);
						//var mouse = mouseOffsetToViewport(event);
						activeGizmo = gizmo.checkMouseHit(mouse.x, mouse.y, camera);
					}
					// measureTool routine
					else if(measureTool) {
						var mouse = mouseInputToViewport(event);
						
						var testObjects = [];
						for(var key in objects) {
							if(objects[key].visible)
								testObjects.push(objects[key].mesh);
						}
						
						measureTool.checkMouseHit(mouse.x, mouse.y, camera, testObjects);
					}
					// pinning
					else if(isPinning && pin) {
						var mouse = mouseInputToViewport(event);
						var testObjects = [];
						for(var key in objects) {
							if(objects[key].visible)
								testObjects.push(objects[key].mesh);
						}
						var obj = pin.mousehit(mouse.x, mouse.y, camera, testObjects);
						highlightObject(obj);
					}
				}
				
			}

			/**
			 * MouseUp EventHandler
			 * @param event
             */
			function mouseup(event) {
				//controls.onMouseUp(event.originalEvent);
				//$(canvas).unbind('mousemove', mousemove);
				isMouseDown = false;
				//$(canvas).unbind('mouseup', mouseup);
				
				if(isSliced && isSliceMoving) {
					restoreWorld();
					sliceWorld();
				}
				isSliceMoving = false;
				
				//if(!mouseDownCoord.equals(new THREE.Vector2(event.clientX, event.clientY))) return;
				
				// area selection
				if(event.button === 0 && isSelecting) {
					isSelecting = false;
					element.find('#select-rectangle').remove();
					
					var mStart, mEnd;
					
					if (event.offsetX - mouseDownCoord.x > 0 && event.offsetY - mouseDownCoord.y > 0 ||
						event.offsetX - mouseDownCoord.x < 0 && event.offsetY - mouseDownCoord.y < 0) {
						mStart = mouseOffsetToViewport(mouseDownCoord.x, mouseDownCoord.y);
						mEnd = mouseOffsetToViewport(event.offsetX, event.offsetY);
					}
					else {
						mStart = mouseOffsetToViewport(mouseDownCoord.x, event.offsetY);
						mEnd = mouseOffsetToViewport(event.offsetX, mouseDownCoord.y);
					}
					
					selectArea(mStart, mEnd, event.ctrlKey);
					animate();
				}
				
				// complete navigation
				else if(event.button === 0 && (scope.navigation.rotate || scope.navigation.pan || scope.navigation.zoom)) {
					controls.onMouseUp(event.originalEvent);
					isRotatingView = false;
					isPanningView = false;
					isZoomingView = false;
				}
				
				else if(event.button === 0 && !isPanningView) {
					if(isRotatingView) {
						isRotatingView = false;
						element.removeClass('cursor_orbit');
						controls.onMouseUp(event.originalEvent);
						return;
					}
					//if(!mouseDownCoord.equals(new THREE.Vector2(event.clientX, event.clientY))) return;
					if(!mouseDownCoord.equals(new THREE.Vector2(event.offsetX, event.offsetY))) return;
					
					if(measureTool) {
						var mouse = mouseInputToViewport(event);
						
						var testObjects = [];
						for(var key in objects) {
							if(objects[key].visible)
								testObjects.push(objects[key].mesh);
						}
						
						measureTool.setTarget(mouse.x, mouse.y, camera, testObjects);
					}
					else if(isPinning && pin) {
						// make screenshot
						var sData = getScreenshot();
						sData.pinMatrix = pin.matrixWorld.toArray();
						sData.pinObject = highlighted[0].userData.eid;
						scope.screenshotCallback(sData);
						
						highlightObject(null);
						scene.remove(pin);
						pin.dispose();
						pin = null;
						isPinning = false;
						scope.setNavigationMode('select');
						scope.$applyAsync();
					}
					// selection
					else {
						var mouse = mouseOffsetToViewport(event.offsetX, event.offsetY);
						selectRay(mouse, event.ctrlKey);
						animate();
					}
				}
				
				// else if(event.button === 1 && !isRotatingView && !isPanningView) {
					// if(isZoomingView) {
						// isZoomingView = false;
						// $('#webglViewport').removeClass('cursor_zoom');
						// controls.onMouseUp(event.originalEvent);
						// return;
					// }
				// }
				else if(event.button === 1 && !isRotatingView) {
					if(isPanningView) {
						isPanningView = false;
						element.removeClass('cursor_pan');
						controls.onMouseUp(event.originalEvent);
					}
				}
				else if(event.button === 2) {
					scope.setNavigationMode('select');
					scope.$apply();

					
					//if(!mouseDownCoord.equals(new THREE.Vector2(event.clientX, event.clientY))) return;
					//if(!mouseDownCoord.equals(new THREE.Vector2(event.offsetX, event.offsetY))) return;
					
					
				}
				
			}

			/**
			 * MouseWheel EventHandler
			 * @param event
             */
			function mousewheel(event) {
				event.preventDefault();
				if(camPerspective) {
					controls.onMouseWheel(event.originalEvent);
				}
				else {
					var delta = event.originalEvent.wheelDelta || -event.originalEvent.detail*40 || 0;
					//console.log(delta);
					var ar = SCREEN_WIDTH/SCREEN_HEIGHT;
					var zoomSpeed = 0.05;
					var min = 10;
					orthocam.left += delta*ar*zoomSpeed;
					orthocam.right -= delta*ar*zoomSpeed;
					orthocam.top -= delta*zoomSpeed;
					orthocam.bottom += delta*zoomSpeed;
					if(orthocam.right < min*ar || orthocam.top < min) {
						orthocam.left = -min*ar;
						orthocam.right = min*ar;
						orthocam.top = min;
						orthocam.bottom = -min;
					}
					orthocam.updateProjectionMatrix();
				}
			}

			/**
			 * KeyDown EventHandler
			 * @param event
			 */
			function keydown(event) {
				if(['INPUT', 'TEXTAREA'].indexOf(event.target.tagName) !== -1) return;
				controls.onKeyDown(event.originalEvent);
			}

			/**
			 * KeyUp EventHandler
			 * @param event
			 */
			function keyup(event) {
				//console.log('keyup', event);
				if(['INPUT', 'TEXTAREA'].indexOf(event.target.tagName) !== -1) return;

				switch(event.keyCode) {
					case 70: scope.setCamera('Front'); break;		// F
					case 76: scope.setCamera('Left'); break;		// L
					case 80: scope.setCamera('Perspective'); break;	// P
					case 84: scope.setCamera('Top'); break;			// T
				}
			}
			
			
			function onWindowResize() {
				resizeViewport();
			}
			
			function resizeViewport() {
				
				element.height(element.parent().height() - element.position().top - 2*parseInt(element.css('border-top-width'),10));
				SCREEN_WIDTH = element.width();
				SCREEN_HEIGHT = element.height();
				
				console.log('resize called', SCREEN_WIDTH, SCREEN_HEIGHT);
				
				//camera.cameraP.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
				camera.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
				camera.cameraP.updateProjectionMatrix();
				
				
				renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
				
				//postprocessing.composer.setSize(SCREEN_WIDTH * postprocessing.sampleRatio, SCREEN_HEIGHT * postprocessing.sampleRatio);
				postprocessing.composer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

				//postprocessing.depthTarget.setSize(SCREEN_WIDTH * postprocessing.sampleRatio, SCREEN_HEIGHT * postprocessing.sampleRatio);
				// postprocessing.depthTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH * postprocessing.sampleRatio, SCREEN_HEIGHT * postprocessing.sampleRatio, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
				//
				//postprocessing.composer.passes[1].uniforms['aspect'].value.set(SCREEN_WIDTH, SCREEN_HEIGHT);
				// postprocessing.composer.passes[1].uniforms['tDepth'].value = postprocessing.depthTarget;

				animate();
			}
			
			function addMouseHandler() {
				$(canvas).bind('mousedown', mousedown);
				$(canvas).bind('mousemove', mousemove);
				$(canvas).bind('mouseup', mouseup);
				$(canvas).bind('mousewheel', mousewheel);
				//$(canvas).bind('MozMousePixelScroll', mousewheel); // firefox
				$(canvas).bind('DOMMouseScroll', mousewheel); // firefox
				$(window).bind('keydown', keydown);
				$(window).bind('keyup', keyup);
				$(window).bind('resize', onWindowResize);
				
				$(canvas).bind('contextmenu', function(event) {
					event.preventDefault();
				});
				
				// var pinLayer = element.find('.pinLayer');
				// $(pinLayer).bind('mousemove', mousemoveOnPinLayer);
				// $(pinLayer).bind('mouseup', mouseupOnPinLayer);
				// console.log(pinLayer);
			}
			
			scope.mousemoveOnPinLayer = function (event) {
				if(isPinning && pin) {
					var mouse = mouseInputToViewport(event);
					var testObjects = [];
					for(var key in objects) {
						if(objects[key].visible)
							testObjects.push(objects[key].mesh);
					}
					var obj = pin.mousehit(mouse.x, mouse.y, camera, testObjects);
					highlightObject(obj);
				}
			};
			
			scope.mouseupOnPinLayer = function (event) {
				event.preventDefault();
				if(isPinning && pin && event.button === 0) {
					// make screenshot
					//var sData = getScreenshot();
					if (highlighted[0]) {
						//sData.pinMatrix = pin.matrixWorld.toArray();
						//sData.pinObject = highlighted[0].userData.eid;
						var pinned = false;
						for (var i = 0; i < scope.snapshot.refObj.length; i++) {
							if (scope.snapshot.refObj[i].eid === highlighted[0].userData.eid) {
								pinned = true;
								break;
							}
						}
						if (!pinned) {
							scope.snapshot.refObj.push({
								eid: highlighted[0].userData.eid,
								name: highlighted[0].userData.name,
								pinMatrix: pin.matrixWorld.toArray()
							});
						}
						//scope.screenshotCallback(sData);
					}
					//console.log(sData);
					console.log(scope.snapshot.refObj);
				}
				if(event.button === 0 || event.button === 2) {
					scope.setNavigationMode('select');
					scope.snapshot.mode = 'paint';
					scope.$applyAsync();
				}
			};
			
			webglInterface.callFunc.openSnapshot = function () {
				scope.openSnapshot();
			};
			
			scope.openSnapshot = function () {
				scope.snapshot.paintOptions.width = SCREEN_WIDTH;
				scope.snapshot.paintOptions.height = SCREEN_HEIGHT;
				scope.snapshot.active = true;

				scope.snapshot.sIndex = 0;
				scope.snapshot.screenshots.push(getScreenshot());
				//console.log(sData);
			};
			webglInterface.callFunc.abortSnapshot = function () {
				ConfirmService.showAlert({
					headerText: 'Vorgrang abbrechen',
					bodyText: 'Snapshot nicht gespeichert! Fortfahren?'
				}).then(function () {
					scope.snapshot.active = false;
					scope.snapshot.text = '';
					scope.snapshot.title = '';
					scope.snapshot.refObj = [];
					scope.snapshot.refSrc = [];
					scope.snapshot.screenshots = [];
					scope.setNavigationMode('select');
				});
			};
			webglInterface.callFunc.saveSnapshot = function () {
				if(!scope.snapshot.text.length) {
					Utilities.dangerAlert('Bitte geben Sie einen Text ein!'); return;
				}
				if(!scope.snapshot.title.length) {
					Utilities.dangerAlert('Bitte geben Sie dem Kommentar einen Titel!'); return;
				}

				scope.snapshot.screenshots[scope.snapshot.sIndex].pData = element.find('#pwCanvasMain')[0].toDataURL("image/png");
				
				Comment.save({
					type: 'model',
					text: scope.snapshot.text,
					title: scope.snapshot.title,
					targets: scope.snapshot.refObj,
					refs: scope.snapshot.refSrc,
					screenshots: scope.snapshot.screenshots
				}).$promise.then(function (response) {
					console.log('Comment.save', response);
					scope.snapshot.active = false;
					scope.snapshot.text = '';
					scope.snapshot.title = '';
					scope.snapshot.refObj = [];
					scope.snapshot.refSrc = [];
					scope.snapshot.screenshots = [];
					scope.setNavigationMode('select');
					webglInterface.callFunc.updateComments();
				}, function (err) {
					Utilities.throwApiException('on Comment.save()', err);
				});
				// Comment.create('model', scope.snapshot.text, scope.snapshot.title, scope.snapshot.refObj, scope.snapshot.refSrc, scope.snapshot.screenshots).then(function (response) {
				// 	console.log(response);
				// 	scope.snapshot.active = false;
				// 	scope.snapshot.text = '';
				// 	scope.snapshot.title = '';
				// 	scope.snapshot.refObj = [];
				// 	scope.snapshot.refSrc = [];
				// 	scope.snapshot.screenshots = [];
				// 	scope.setNavigationMode('select');
				// 	webglInterface.callFunc.updateComments();
				// }, function (err) {
				// 	console.log(err);
				// });
			};

			webglInterface.callFunc.makeScreenshot = function () {
				var sData = getScreenshot();
				scope.screenshotCallback(sData);
			};

			/**
			 * retrieve viewport image and camera data
			 * @returns {{sData: string, cameraMatrix: *, cameraFOV: *, cameraCenter: *, width: *, height: *}}
			 */
			function getScreenshot() {
				return {
					sData: renderer.domElement.toDataURL("image/jpeg"),
					cameraMatrix: camera.matrix.toArray(),
					cameraFOV: camera.fov,
					cameraCenter: controls.center.toArray(),
					width: SCREEN_WIDTH,
					height: SCREEN_HEIGHT
				};
			}

			scope.startMarking = function () {
				scope.setNavigationMode();
				scope.snapshot.mode = 'pin';
				pin = new THREE.Pin(3, 0.5);
				pin.addEventListener('change', animate);
				scene.add(pin);
				isPinning = true;
			};

			scope.startMeasuring = function () {
				scope.setNavigationMode();
				measureTool = new THREE.Measure(2);
				measureTool.addEventListener('change', animate);
				scene.add(measureTool);
				measureTool.onComplete = function (distance) {
					scope.measureDistance = distance;
					scope.$applyAsync();
				};
			};

			///// SPATIALIZE IMAGE

			webglInterface.callFunc.openSpatializeImage = function (img) {
				scope.spatialize.active = true;
				scope.spatialize.source = img;
				scope.spatialize.image = img.file.path + img.file.display;
				scope.spatialize.fov = camera.fov;
			};

			scope.abortSpatializeImage = function () {
				scope.spatialize.active = false;
				scope.spatialize.source = null;
				scope.spatialize.fov = 35;
			};

			scope.saveSpatializeImage = function () {
				scope.spatialize.source.matrix = camera.matrixWorld.toArray(); 
				scope.spatialize.source.fov = parseInt(camera.fov); 
				scope.spatialize.source.$spatialize().then(function (response) {
					console.log('source.spatialize', response);
					scope.spatialize.active = false;
					scope.spatialize.source = null;
					scope.spatialize.fov = 35;
				}, function (err) {
					Utilities.throwApiException('on Source.spatialize()', err);
				});
			};

			scope.changeFOV = function () {
				camera.fov = scope.spatialize.fov;
				camera.updateProjectionMatrix();
				animate();
			};

			/**
			 * Loads spatialized image into the scene.
			 * @param img
			 */
			webglInterface.callFunc.loadSpatializeImage = function (img) {
				if(webglInterface.getImageEntryByName(img.content)) return;
				
				var imagepane = new THREE.ImagePane('data/' + img.path + img.map, img.fov, 10);
				imagepane.onComplete = function () {
					animate();
				};
				var m = new THREE.Matrix4().fromArray(img.matrix);
				imagepane.applyMatrix(m);
				scene.add(imagepane);
				
				imagepane.name = img.content;
				imagepane.userData.source = img.source;
				imagepane.userData.type = 'image';

				var entry = new webglInterface.ImageEntry(imagepane);
				imagepane.entry = entry;
				spatialImages[imagepane.id] = entry;
				console.log('ImagePane', imagepane);
			};

			/**
			 * Sets camera to position and angle of the image pane object.<br/>
			 * Called form webglInterface ImageEntry.
			 * @param obj
			 */
			webglInterface.callFunc.setImageView = function (obj) {
				var end =  new THREE.Vector3(0,0,-1000);
				end.applyQuaternion(obj.quaternion);
				end.add(obj.position);

				var line = new THREE.Line3(obj.position, end);
				var plane = new THREE.Plane(new THREE.Vector3(0,1,0));
				var lookAt = plane.intersectLine(line);

				new TWEEN.Tween(camera.position.clone())
					.to(obj.position, 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(function () { camera.position.copy(this); })
					.start();
				new TWEEN.Tween(controls.center.clone())
					.to(lookAt, 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(function () { controls.center.copy(this); })
					.start();
				new TWEEN.Tween({ fov: camera.fov })
					.to({ fov: obj.fov }, 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(function () {
						camera.fov = this.fov;
						camera.updateProjectionMatrix();
					})
					.start();

				enableAnimationRequest();
			};

			///// PLANS

			/**
			 * Load spatialized plan into the scene.
			 * @param obj
			 */
			webglInterface.callFunc.load3DPlan = function (obj) {
				if(webglInterface.getPlanEntryByName(obj.info.content)) return;
				// if(obj.info.content in plans) return;
				
				var plan = new THREE.Plan('data/' + obj.file.path + obj.file.content, 'data/' + obj.info.materialMapPath + obj.info.materialMap, obj.info.scale);
				plan.onComplete = function () {
					animate();
				};
				scene.add(plan);

				plan.name = obj.info.content;
				plan.userData.name = obj.info.materialName;
				plan.userData.source = obj.source;
				plan.userData.type = 'plan';

				plans[plan.id] = new webglInterface.PlanEntry(plan);
				console.log('Plan', plan);
			};

			/**
			 * set camera to orthogonal view to fit plan to viewport
			 * @param obj
			 */
			webglInterface.callFunc.viewOrthoPlan = function(obj) {

				var pgeo = obj.mesh.geometry;
				var matWorld = obj.mesh.matrixWorld;

				//console.log(pgeo);

				var normal = new THREE.Vector3(pgeo.attributes.normal.array[0], pgeo.attributes.normal.array[1], pgeo.attributes.normal.array[2]);

				var boundingBox = pgeo.boundingBox.clone().applyMatrix4(matWorld);

				// Ausmaße im Raum
				var aspect = SCREEN_WIDTH/SCREEN_HEIGHT;
				var pwidth = Math.sqrt( Math.pow(boundingBox.max.x - boundingBox.min.x, 2) + Math.pow(boundingBox.max.z - boundingBox.min.z, 2) ) / 2;
				var pheight = (boundingBox.max.y - boundingBox.min.y) / 2;

				if(normal.y > 0.707 || normal.y < -0.707) {
					pwidth = Math.sqrt( Math.pow(boundingBox.max.x - boundingBox.min.x, 2) + Math.pow(boundingBox.max.y - boundingBox.min.y, 2) ) / 2;
					pheight = (boundingBox.max.z - boundingBox.min.z) / 2;
				}

				if(aspect < pwidth/pheight)
					pheight = 1/aspect * pwidth;

				// Abstand zum Bild (abhängig von Kamerawinkel)
				var h = pheight / Math.tan( camera.fov/2 * Math.PI / 180 );

				var bsCenter = pgeo.boundingSphere.center.clone().applyMatrix4(matWorld);

				var newpos = new THREE.Vector3();
				newpos.addVectors(bsCenter, normal.setLength(h));

				// Kamerafahrt zur Ansicht
				new TWEEN.Tween(camera.position.clone())
					.to(newpos, 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(function () { camera.position.copy(this); })
					.start();
				new TWEEN.Tween(controls.center.clone())
					.to(bsCenter, 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(function () { controls.center.copy(this); })
					.onComplete(function() {
						camera.toOrthographic(controls.center);
						webglInterface.viewportSettings.cameraSel = 'Custom';
						scope.$apply();
					})
					.start();

				enableAnimationRequest();
			};

			/**
			 * toggle plan or spatialImage
			 * @param obj
			 * @param {boolean} visible
			 */
			webglInterface.callFunc.toggle = function(obj, visible) {
				if(visible)
					scene.add(obj);
				else
					scene.remove(obj);
				animate();
			};

			webglInterface.callFunc.toggleAll = function (list, visible) {
				for(var key in list) {
					if(list[key].visible !== visible) {
						if(list[key].selected && !visible)
							setSelected(list[key].object, false, true);
						webglInterface.callFunc.toggle(list[key].object, visible);
						list[key].visible = visible;
					}
				}
				animate();
			};

			webglInterface.callFunc.setScaleAll = function (value) {
				for(var key in spatialImages) {
					spatialImages[key].object.setScale(value);
				}
				animate();
			};

			webglInterface.callFunc.setOpacityAll = function (list, value) {
				for(var key in list) {
					list[key].object.setOpacity(value);
					list[key].opacity = value;
				}
				animate();
			};

			/**
			 * attach gizmo to object
			 * @param {THREE.Mesh} [obj] - object to be transformed
			 * @param {string} [type] - type of gizmo ('move'|'rotate')
			 * @param {THREE.Object3D[]} [refs] - references to objects which need to be transformed too
			 */
			function setGizmo(obj, type, refs) {
				if(gizmo)
					gizmo.attachToObject(null);

				switch(type) {
					case 'move': gizmo = gizmoMove; break;
					case 'rotate': gizmo = gizmoRotate; break;
					default: gizmo = null; break;
				}

				if(gizmo)
					gizmo.attachToObject(obj, refs);
			}
			
			function setGizmoCoords(type, apply) {
				scope.gizmoCoords.enabled = true;
				switch(type) {
					case 'move':
						scope.gizmoCoords.x = gizmo.object.position.x.toFixed(2);
						scope.gizmoCoords.y = gizmo.object.position.y.toFixed(2);
						scope.gizmoCoords.z = gizmo.object.position.z.toFixed(2);
						break;
					case 'rotate':
						scope.gizmoCoords.x = THREE.Math.radToDeg(gizmo.object.rotation.x).toFixed(2);
						scope.gizmoCoords.y = THREE.Math.radToDeg(gizmo.object.rotation.y).toFixed(2);
						scope.gizmoCoords.z = THREE.Math.radToDeg(gizmo.object.rotation.z).toFixed(2);
						break;
					default:
						scope.gizmoCoords.enabled = false;
						break;
				}
				//console.log(scope.gizmoCoords);
				if(apply)
					scope.$apply();
			}
			
			// Funktionen, die auch von außen aufgerufen werden können
			scope.internalCallFunc = scope.callFunc || {};

			/**
			 * @deprecated
			 * @param btn
             */
			scope.internalCallFunc.ctrlBtnHandler = function(btn) {
				
				switch(btn) {
					case 'slice_move':
						setGizmo(plane, 'move');
						setGizmoCoords('move', false);
						break;
					case 'slice_rotate':
						setGizmo(plane, 'rotate');
						setGizmoCoords('rotate', false);
						break;
					
					case'slice_toggle':
						if(sliceTool) {
							scene.remove(plane);
							if(isSliced) {
								restoreWorld();
								isSliced = false;
							}
							sliceTool = false;
						}
						else {
							scene.add(plane);
							sliceTool = true;
						}
						break;
					case'slice_cut':
						if(isSliced) {
							restoreWorld();
							isSliced = false;
						}
						else {
							sliceWorld();
							isSliced = true;
						}
						break;
					case 'measure':
						measureTool = new THREE.Measure(2);
						scene.add(measureTool);
						break;	
					default:
						setGizmo(null, '');
						setGizmoCoords('', false);
						if(measureTool) {
							scene.remove(measureTool);
							measureTool = null;
						}
						break;
				}
			};

			/**
			 * set navigation mode
			 * @param {string} [mode]
             */
			scope.setNavigationMode = function(mode) {
				
				if(measureTool) {
					scene.remove(measureTool);
					measureTool.dispose();
					measureTool = null;
				}
				if(pin) {
					scene.remove(pin);
					pin.dispose();
					pin = null;
					isPinning = false;
					highlightObject(null);
				}
				
				scope.navigation.select = false;
				scope.navigation.rotate = false;
				scope.navigation.pan = false;
				scope.navigation.zoom = false;
				if(mode)
					scope.navigation[mode] = true;

				animate();
			};

			/**
			 * detect intersections between plan and objects
			 * @param meshId - ID of plan mesh
			 * @returns {{plan: *, objs: Array}}
             */
			webglInterface.callFunc.getObjForPlans = function(meshId) {
				
				if(!meshId in plans) return;

				var pgeo = plans[meshId].mesh.geometry;
				var pMatrix = plans[meshId].mesh.matrixWorld;
				var objs = [];

				var facesLength = pgeo.index.count * pgeo.index.itemSize;
				for(var i=0; i<facesLength; i+=3) {
					var tg = new THREE.Geometry();
					for(var j=0; j<3; j++) {
						var index = pgeo.index.array[i+j] * pgeo.attributes.position.itemSize;
						var v = new THREE.Vector3(pgeo.attributes.position.array[index], pgeo.attributes.position.array[index+1], pgeo.attributes.position.array[index+2]);
						tg.vertices.push(v);
					}

					tg.applyMatrix(pMatrix);
					tg.computeBoundingBox();
					var tm = new THREE.Mesh(tg, materials['defaultMat']);

					for(var k in objects) {
						if(objects[k].mesh.userData.type == 'group')
							continue;
						if(overlapAABB(objects[k].mesh, tm))
							objs.push(objects[k].mesh.userData.eid);
					}

					tg.dispose();
				}

				return { plan: plans[meshId].mesh.name, objs: objs };
			};

			/**
			 * clear all highlighted objects
			 */
			function dehighlight() {
				for(var i=0; i< highlighted.length; i++) {
					var obj = highlighted[i];
					
					objects[obj.id].edges.material = materials['edgesMat'];
					
					/*if(obj.material.map != null) {
						if(obj.userData.type == 'plan')
							obj.material.color.setHex(0xffffff);
						else
							obj.material.ambient.setHex(0xffffff);
					}
					else if(scope.shading == shading.GREY_EDGE)
						obj.material = materials['defaultMat'];
					else if(scope.shading == shading.TRANSPARENT_EDGE)
						obj.material = materials['transparentMat'];
					else if(scope.shading == shading.WIRE)
						obj.material = materials['wireframeMat'];
					else
						obj.material = materials[obj.userData.originalMat];
					if(obj.userData.type === 'object')
						objects[obj.id].edges.material.color.setHex(0x333333);*/
				}
				highlighted = [];
			}

			/**
			 * highlight objects
			 * @param {Array} data - array of object/mesh IDs [{ meshId: * }]
             */
			webglInterface.callFunc.highlightObjects = function(data) {
				setSelected(null, false, true);
				//dehighlight();
				for(var i=0; i<data.length; i++) {
					for (var key in objects) {
						if (objects[key].mesh.userData.eid === data[i].meshId) {
							var obj = objects[key].mesh;
							//objects[key].edges.material = materials['edgesHighlightMat'];
							setSelected(objects[key].mesh, true);
							/*
							 if(obj.material.map != null) {
							 if(obj.userData.type == 'plan')
							 obj.material.color.setHex(0xff8888);
							 else
							 obj.material.ambient.setHex(0xff8888);
							 }
							 else if(scope.shading == shading.TRANSPARENT_EDGE)
							 obj.material = materials['transparentHighlightMat'];
							 else if(scope.shading == shading.WIRE)
							 obj.material = materials['wireframeSelectionMat'];
							 else
							 obj.material = materials['highlightMat'];
							 if(scope.shading == shading.EDGE)
							 objects[obj.id].edges.material.color.setHex(0xffff44);*/

							//highlighted.push(obj);
						}
					}
				}
				animate();
			};

			/**
			 * @deprecated
			 * @param plan3d
			 * @param info
			 * @param file
			 * @returns {{e36id: *}}
			 */
			scope.internalCallFunc.loadCTMPlanIntoScene = function(plan3d, info, file) {
				
				ctmloader.load('data/'+file.path+file.content, ctmPlanHandler, {useWorker: false});
				
				var po = {e36id: plan3d};
				return po;
				
				function ctmPlanHandler(geo) {
					geo.computeBoundingBox();
					geo.computeBoundingSphere();
					
					var scale = 0.001;
					geo.scale(scale, scale, scale);
					
					var texture = THREE.ImageUtils.loadTexture('data/' + info.materialMapPath + info.materialMap);
					texture.anisotropy = 8;
					var material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
					material.name = info.content + '_Mat';
					
					//var mesh = new THREE.Mesh(geo, materials['defaultDoublesideMat']);
					var mesh = new THREE.Mesh(geo, material);
					
					var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24.0), materials['edgesMat']);
					//edges.matrix = mesh.matrixWorld;
					//edges.matrixAutoUpdate = false;
					//scene.add(edges);
					
					mesh.name = info.content;
					mesh.userData.name = info.name;
					mesh.userData.eid = info.content;
					mesh.userData.type = 'plan';
					
					materials[mesh.material.name] = mesh.material;
					mesh.userData.originalMat = mesh.material.name;
					
					//mesh.scale.divideScalar(1000);
					
					/*switch(info.unit) {
						case 'centimeter': scale = 0.1; break;
						case 'millimeter': scale = 0.001; break;
						default: scale = 1.0;
					}*/
					//mesh.scale.multiplyScalar(scale);
					//var scale = 0.001;
					//mesh.geometry.scale(scale, scale, scale);
					var t = mesh.geometry.boundingSphere.center.clone();
					//console.log(t);
					mesh.position.set(t.x, t.y, t.z);
					edges.position.set(t.x, t.y, t.z);
					t.negate();
					mesh.geometry.translate(t.x, t.y, t.z);
					edges.geometry.translate(t.x, t.y, t.z);
					
					//console.log(mesh);
					
					scene.add(mesh);
					scene.add(edges);
					
					mesh.updateMatrix();
					mesh.userData.initMatrix = mesh.matrix.clone();
					
					// Liste, um zusammengehörige Objekte zu managen
					plans[mesh.id] = {mesh: mesh, edges: edges, visible: true};
					//webglInterface.insertIntoPlanlist({ name: mesh.name, id: mesh.id, title: mesh.userData.name, type: mesh.userData.type });
					webglInterface.plans.push(new webglInterface.PlanEntry(mesh.id, mesh.name, mesh.userData.name, mesh.userData.type));
					scope.$applyAsync();
					
					po.meshId = mesh.id;
				}
				
				
			};

			/**
			 * loads .ctm file into the scene
			 * via weblInterface.callFunc
			 * @memberof webglView
			 * @param child {Object} child information object
			 * @param parent {Object} parent information object
			 * @returns {Promise} resolved promise when object is set
			 */
			webglInterface.callFunc.loadCTMIntoScene = function(child, parent) {
				
				var defer = $q.defer();
				
				var info = child.obj;
				var file = child.file;

				var m = info.matrix;
				var mat = new THREE.Matrix4();
				mat.set(m[0],m[1],m[2],m[3],m[4],m[5],m[6],m[7],m[8],m[9],m[10],m[11],m[12],m[13],m[14],m[15]);
				
				// transformation from z-up-world to y-up-world
				if(info.upAxis == 'Z_UP' && !parent) {
					var ymat = new THREE.Matrix4();
					ymat.set(1,0,0,0, 0,0,1,0, 0,-1,0,0, 0,0,0,1);
					mat.multiplyMatrices(ymat,mat);
				}
				
				var t = new THREE.Vector3();
				var q = new THREE.Quaternion();
				var s = new THREE.Vector3();
				mat.decompose(t,q,s);

				var scale;
				switch(info.unit) {
					case 'decimeter': scale = 0.1; break;
					case 'centimeter': scale = 0.01; break;
					case 'millimeter': scale = 0.001; break;
					default: scale = 1.0;
				}

				var obj = info.type === 'group' ? new THREE.Object3D() : new THREE.Mesh(geometries['initgeo'], materials['defaultMat']);

				obj.name = info.content;
				obj.userData.name = info.name;
				obj.userData.eid = info.content;
				obj.userData.type = info.type;
				obj.userData.layer = info.layer;
				obj.userData.categories = child.categories;
					
				// only scale translation
				if(!parent) {
					t.multiplyScalar(scale);
					s.multiplyScalar(scale);
				}
				mat.compose(t,q,s);
				obj.applyMatrix(mat);
				obj.matrixAutoUpdate = false;
					
				var parentid = null;
				if(parent && (p = scene.getObjectByName(parent, true))) {
					p.add(obj);
					parentid = p.id;
				}
				else
					scene.add(obj);

				// Liste, um zusammengehörige Objekte zu managen
				objects[obj.id] = {mesh: obj, edges: null, slicedMesh: null, slicedEdges: null, sliceLine: null, sliceFaces: null, visible: true, parent: parentid};

				// Liste für die Anzeige auf der HTML-Seite
				webglInterface.insertIntoLists({ name: obj.name, id: obj.id, title: obj.userData.name, layer: obj.userData.layer, type: obj.userData.type, parent: parentid, parentVisible: true});

				// if(scope.layers.indexOf(obj.userData.layer) === -1)
					// scope.layers.push(obj.userData.layer);

				if(info.type === 'object') {
					if(geometries[file.content])
						ctmHandler(geometries[file.content].meshGeo);
					else
						ctmloader.load('data/' + file.path + file.content, ctmHandler, {useWorker: false});
				}

				defer.resolve();
				
				function ctmHandler(geo) {
					//defer.resolve();

					geo.computeBoundingBox();

					if(!geometries[file.content]) {
						geo.name = file.content;
						geometries[file.content] = {meshGeo: geo};
					}
					//defer.resolve();

					var isUnsafe = /unsicher/.test(info.name);

					obj.geometry = geo;

					//var mesh;
					if(info.materialId) {
						var material = new THREE.MeshLambertMaterial();
						//material.color = new THREE.Color(Math.pow(info.materialColor[0], 1/2.2), Math.pow(info.materialColor[1], 1/2.2), Math.pow(info.materialColor[2], 1/2.2));
						material.color = new THREE.Color(info.materialColor[0], info.materialColor[1], info.materialColor[2]);
						//material.ambient = material.color.clone();
						material.name = info.materialId;
						//materials[info.materialId] = material;
						//mesh = new THREE.Mesh(geo, material);
						obj.material = material;
						setObjectMaterial(obj, true, false, true, isUnsafe);
					}
					else {
						//mesh = new THREE.Mesh(geo, materials['defaultDoublesideMat']);
						obj.material = materials['defaultDoublesideMat'];
						obj.userData.originalMat = 'defaultDoublesideMat';
					}
					
					// edges
					var edges = null;
					
					if (geometries[file.content].edgesGeo) {
						edges = new THREE.LineSegments(geometries[file.content].edgesGeo, materials['edgesMat']);
						edges.matrix = mesh.matrixWorld;
						edges.matrixAutoUpdate = false;
						scene.add(edges);
					}
					else {
						if (file.edges) {
							// lade und entpacke geometry für edges
							JSZipUtils.getBinaryContent('data/' + file.path + file.edges, function (err, data) {
								// var worker = new Worker('lib/jszip/JSZipWorker.js');
								// worker.onmessage = function (event) {
								// 	if(event.data == 0) return;
								// 	var egeo = new THREE.BufferGeometry();
								// 	egeo.addAttribute('position', new THREE.BufferAttribute(event.data, 3));
								// 	edges = new THREE.LineSegments(egeo, materials['edgesMat']);
								// 	edges.matrix = obj.matrixWorld;
								// 	edges.matrixAutoUpdate = false;
								// 	scene.add(edges);
								// 	geometries[file.content].edgesGeo = egeo;
								// 	objects[obj.id].edges = edges;
								// };
								// worker.postMessage({ data: data, file: file.content });
								var zip = new JSZip(data);
								var vobj = JSON.parse(zip.file(file.content + '.json').asText());
								if (vobj.data.attributes.position.array.length === 0)
									return;
								var floatarray = new Float32Array(vobj.data.attributes.position.array);
								var egeo = new THREE.BufferGeometry();
								egeo.addAttribute('position', new THREE.BufferAttribute(floatarray, 3));
								edges = new THREE.LineSegments(egeo, materials['edgesMat']);
								edges.matrix = obj.matrixWorld;
								edges.matrixAutoUpdate = false;
								scene.add(edges);
								geometries[file.content].edgesGeo = egeo;
								objects[obj.id].edges = edges;
							});
						}
						else {
							// wenn noch keine geometry für edges da, berechne und speichere edges
							edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24.0), materials['edgesMat']);
							edges.matrix = obj.matrixWorld;
							edges.matrixAutoUpdate = false;
							scene.add(edges);
							geometries[file.content].edgesGeo = edges.geometry;
							objects[obj.id].edges = edges;

							// Kommastellen kürzen
							var json = edges.geometry.toJSON();
							var array = json.data.attributes.position.array;
							for(var i=0, l=array.length; i<l; i++) {
								array[i] = parseFloat(array[i].toFixed(3));
							}

							var zip = new JSZip();
							zip.file(file.content + '.json', JSON.stringify(json));
							var zipdata = zip.generate({compression: 'DEFLATE'});
							phpRequest.saveGeoToJson(file.path, file.content, zipdata).then(function (response) {
								if (response.data !== 'SUCCESS') {
									console.error('phpRequest failed on saveGeoToJson()', response.data);
									return $q.reject();
								}
								return neo4jRequest.addEdgesFile($stateParams.project, file.content, file.content + '.zip');
							}).then(function (response) {
								if (response.data.exception) {
									console.error('neo4j failed on addEdgesFile()', response);
									return;
								}
								file.edges = file.content + '.zip';
							});
						}
					}
					
				}

				return defer.promise;
				
			};

			webglInterface.callFunc.resetScene = function () {
				for(var key in objects) {
					if(!objects.hasOwnProperty(key)) continue;
					var obj = objects[key];
					var p = obj.mesh.parent;
					p.remove(obj.mesh);
					//if(obj.mesh.geometry) obj.mesh.geometry.dispose();
					if(obj.edges) {
						scene.remove(obj.edges);
						//obj.edges.geometry.dispose();
					}
					delete objects[key];
				}
				for(var key in geometries) {
					if(!geometries.hasOwnProperty(key)) continue;
					if(geometries[key].meshGeo) geometries[key].meshGeo.dispose();
					if(geometries[key].edgesGeo) geometries[key].edgesGeo.dispose();
					delete geometries[key];
				}
				animate();
				webglInterface.clearLists();
			};

			// function removeObject(obj) {
			// 		var p = obj.mesh.parent;
			// 		p.remove(obj.mesh);
			// 		if(obj.edges) scene.remove(obj.edges);
			// 		obj.mesh.geometry.dispose();
			// 		obj.edges.geometry.dispose();
			// 		delete objects[obj.mesh.id];
			// 		for(var i=0; i<obj.mesh.children.length; i++) {
			// 			removeObject()
			// 		}
			// 	}
			// }
			
			/**
			 * @deprecated
			 * @param coords
			 */
			scope.internalCallFunc.setCoordsFromInput = function(coords) {
				if(gizmo instanceof THREE.GizmoMove)
					gizmo.object.position.set(parseFloat(coords.x), parseFloat(coords.y), parseFloat(coords.z));
				else if(gizmo instanceof THREE.GizmoRotate)
					gizmo.object.rotation.set(THREE.Math.degToRad(coords.x), THREE.Math.degToRad(coords.y), THREE.Math.degToRad(coords.z));
			};

			// ziemlich alt
			scope.internalCallFunc.saveSelected = function() {
				console.log('saveFunc called');
				console.log(selected);
				
				if(!selected) return;
				
				var obj = {v: [], f: [], uv: []};
				
				for(var i=0; i<selected.geometry.vertices.length; i++) {
					var v = selected.geometry.vertices[i];
					//console.log(v);
					obj.v.push( [ v.x, v.y, v.z ] );
				}
				for(var i=0; i<selected.geometry.vertices.length; i++) {
					var f = selected.geometry.faces[i];
					/*var face = {};
					face.a = f.a;
					face.b = f.b;
					face.c = f.c;
					//face.n = [f.normal.x, f.normal.y, f.normal.z];
					face.vn = [ [f.vertexNormals[0].x, f.vertexNormals[0].y, f.vertexNormals[0].z],
						[f.vertexNormals[1].x, f.vertexNormals[1].y, f.vertexNormals[1].z],
						[f.vertexNormals[2].x, f.vertexNormals[2].y, f.vertexNormals[2].z] ];
					*/
					var face;
					if(f.vertexNormals.length < 3)
						face = [ f.a, f.b, f.c];
					else {
						face = [ f.a, f.b, f.c,
						f.vertexNormals[0].x, f.vertexNormals[0].y, f.vertexNormals[0].z,
						f.vertexNormals[1].x, f.vertexNormals[1].y, f.vertexNormals[1].z,
						f.vertexNormals[2].x, f.vertexNormals[2].y, f.vertexNormals[2].z ];
					}
					obj.f.push(face);
				}
				for(var i=0; i<selected.geometry.faceVertexUvs[0].length; i++) {
					var uvs = selected.geometry.faceVertexUvs[0][i];
					obj.uv.push( [ uvs[0].x, uvs[0].y, uvs[1].x, uvs[1].y, uvs[2].x, uvs[2].y ] );
				}
				
				$.ajax({
					type: 'POST',
					url: 'php/jsonwrite.php',
					datatype: 'json',
					data: {
						json: JSON.stringify(obj)
						//json: obj
					}
				}).done(function() {console.log('ajax done')})
				.fail(function() {console.log('ajax fail')});
				
				/*
				var json = JSON.stringify(obj);
				//var encoded = btoa(json);
				
				var blob = new Blob([json], {type: 'text/plain;charset=utf-8'});
				saveAs(blob, 'selected.json');
				*/
				//var exporter = new THREE.OBJExporter();
				//var blob = new Blob([exporter.parse(selected.geometry)], {type: 'text/plain;charset=utf-8'});
				//saveAs(blob, 'selected.obj');
				
			};
			
			webglInterface.callFunc.selectObject = function(id, ctrlKey, deselect) {
				if(objects[id].visible)
					setSelected(objects[id].mesh, ctrlKey, deselect);
				animate();
			};
			
			

			/**
			 * get object by id and add or remove mesh and edges
			 * @param item
             * @param {boolean} visible
             */
			webglInterface.callFunc.toggleObject = function(item, visible) {
				var p;
				if(item.parent)
					p = objects[item.parent.id].mesh;
				else
					p = scene;
				
				var obj = p.getObjectById(item.id);	
				if(visible && !obj) {
					p.add(objects[item.id].mesh);
					scene.add(objects[item.id].edges);
					objects[item.id].visible = true;
					addChildren(item.children);
					
				}
				else if(!visible) {
					p.remove(objects[item.id].mesh);
					scene.remove(objects[item.id].edges);
					objects[item.id].visible = false;
					removeChildren(item.children);
				}

				animate();
			};
			
			function addChildren(children) {
				for(var i=0; i<children.length; i++) {
					var cid = children[i].id;
					scene.add(objects[cid].edges);
					objects[cid].visible = true;
					addChildren(children[i].children);
				}
			}
			
			function removeChildren(children) {
				for(var i=0; i<children.length; i++) {
					var cid = children[i].id;
					scene.remove(objects[cid].edges);
					objects[cid].visible = false;
					removeChildren(children[i].children);
				}
			}

			/**
			 * color all objects by their assigned category attribute
			 * @param category
             */
			webglInterface.callFunc.colorByCategory = function(category) {
				console.log(category);
				scope.setShading('Custom');
				scope.activeCategory = category; webglInterface.activeCategory = category;
				for(var i=0; i<category.attributes.length; i++) {
					if(category.attributes[i].id === 0 || category.attributes[i].id === -1) continue;
					var cValues = category.attributes[i].color.match(/\d+(\.\d+)?/g);
					
					var mat;
					if(materials[category.attributes[i].id]) {
						mat = materials[category.attributes[i].id];
						mat.color.setRGB(parseInt(cValues[0])/255, parseInt(cValues[1])/255, parseInt(cValues[2])/255);
					}
					else
						mat = new THREE.MeshLambertMaterial({
							name: category.attributes[i].id,
							color: new THREE.Color(parseInt(cValues[0])/255, parseInt(cValues[1])/255, parseInt(cValues[2])/255),
							side: THREE.DoubleSide
						});
					var opacity = parseFloat(cValues[3]);
					if(opacity !== 1.0) {
						mat.transparent = true;
						mat.opacity = opacity;
					}
					else
						mat.transparent = false;
					
					materials[category.attributes[i].id] = mat;
					console.log(mat);
				}
				for(var key in objects) {
					var userData = objects[key].mesh.userData;
					if(userData.type === 'object') {
						if(userData.categories[category.id] && userData.categories[category.id].attrId)
							objects[key].mesh.material = materials[userData.categories[category.id].attrId];
						else
							objects[key].mesh.material = materials['defaultDoublesideMat'];
					}
				}

				animate();
			};
			
			// add and remove pins
			webglInterface.callFunc.addPin = function(id, pinObj) {
				if(pins[id]) return;
				var pin = new THREE.Pin(3, 0.5);
				var m = pinObj.pinMatrix;
				pin.applyMatrix(new THREE.Matrix4().set(m[0],m[4],m[8],m[12],m[1],m[5],m[9],m[13],m[2],m[6],m[10],m[14],m[3],m[7],m[11],m[15]));
				scene.add(pin);
				pins[id] = pin;
				animate();
				return toScreenXY(new THREE.Vector3(m[12], m[13], m[14]));
			};
			webglInterface.callFunc.removePin = function(id) {
				if(pins[id]) {
					scene.remove(pins[id]);
					pins[id].dispose();
					delete pins[id];
				}
				animate();
			};
			webglInterface.callFunc.removePins = function() {
				for(var key in pins) {
					scene.remove(pins[key]);
					pins[key].dispose();
				}
				pins = [];
				animate();
			};

			function toScreenXY(pos3D) {
				var v = pos3D.project(camera);
				var left = SCREEN_WIDTH * (v.x + 1) / 2;
				var top = SCREEN_HEIGHT * (-v.y + 1) / 2;
				return new THREE.Vector2(left, top);
			}
			
			webglInterface.callFunc.setScreenshotView = function(screenData) {
				new TWEEN.Tween(camera.position.clone())
					.to(new THREE.Vector3(screenData.cameraMatrix[12],screenData.cameraMatrix[13],screenData.cameraMatrix[14]), 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(function () { camera.position.copy(this); })
					.start();
				new TWEEN.Tween(controls.center.clone())
					.to(new THREE.Vector3(screenData.cameraCenter[0],screenData.cameraCenter[1],screenData.cameraCenter[2]), 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(function () { controls.center.copy(this); })
					.start();
				enableAnimationRequest();
			};
			
			webglInterface.callFunc.resize = function() {
				resizeViewport();
			};

			// explode plans
			function explodePlans() {
				if(!(selected[0] && selected[0].userData.type === 'plan')) return;
				var basePlan = selected[0];
				console.log(basePlan);
				
				var padding = 5; // Abstand zwischen den Plänen
				var offset = {
					top: [],	// -z
					bottom: [],	// +z
					left: [],	// -x
					right: []	// +x
				};
				
				var baseNormal = new THREE.Vector3(basePlan.mesh.geometry.attributes.normal.array[0], basePlan.mesh.geometry.attributes.normal.array[1], basePlan.mesh.geometry.attributes.normal.array[2]).applyQuaternion(basePlan.quaternion).normalize();
				
				var baseBbox = basePlan.mesh.geometry.boundingBox.clone().applyMatrix4(basePlan.matrixWorld);
				
				//console.log(baseNormal, baseBbox);
				
				for(var key in plans) {
					if(plans[key].object.id === basePlan.id || !plans[key].visible) continue;

					(function (p) {
						var pNormal = new THREE.Vector3(p.mesh.geometry.attributes.normal.array[0], p.mesh.geometry.attributes.normal.array[1], p.mesh.geometry.attributes.normal.array[2]).applyQuaternion(p.quaternion).normalize();
						var pBbox = p.mesh.geometry.boundingBox.clone().applyMatrix4(p.matrixWorld);

						// translate
						var height = new THREE.Vector3().subVectors(pBbox.max, pBbox.min).multiply(baseNormal).length();
						var distance = height / 2 + padding;

						var subMin = new THREE.Vector3().subVectors(baseBbox.min, p.position);
						var subMax = new THREE.Vector3().subVectors(baseBbox.max, p.position);
						if(pNormal.dot(subMin) > pNormal.dot(subMax))
							distance += subMin.projectOnVector(pNormal).length();
						else
							distance += subMax.projectOnVector(pNormal).length();

						var arrange = '';
						var directionVector = new THREE.Vector3();
						if(pNormal.x > 0.9) {
							arrange = 'right';
							directionVector.set(1, 0, 0);
						}
						else if(pNormal.x < -0.9) {
							arrange = 'left';
							directionVector.set(-1, 0, 0);
						}
						else if(pNormal.z > 0.9) {
							arrange = 'bottom';
							directionVector.set(0, 0, 1);
						}
						else if(pNormal.z < -0.9) {
							arrange = 'top';
							directionVector.set(0, 0, -1);
						}

						if(arrange) {
							for(var i=0; i<offset[arrange].length; i++)
								distance += offset[arrange][i].height + padding;
							offset[arrange].push({ name: p.name, height: height });
						}

						var startPosition = p.position.clone();
						var endPosition = p.position.clone().add(new THREE.Vector3().copy(pNormal).multiplyScalar(distance));
						endPosition.add(new THREE.Vector3().subVectors(baseBbox.min, endPosition).multiply(baseNormal));

						// rotation
						var startQuaternion = p.quaternion.clone();
						var theta = baseNormal.angleTo(pNormal);
						var endQuaternion = p.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), theta));

						// tween
						new TWEEN.Tween({ t: 0 })
							.to({ t: 1, p: endPosition }, 500)
							.easing(TWEEN.Easing.Quadratic.InOut)
							.onUpdate(function () {
								p.position.lerpVectors(startPosition, endPosition, this.t);
								THREE.Quaternion.slerp(startQuaternion, endQuaternion, p.quaternion, this.t);
							})
							.start();
					})(plans[key].object);
				}
				enableAnimationRequest();
			}
			webglInterface.callFunc.explodePlans = explodePlans;
			
			// reset plans to their original position
			function resetPlans() {
				for(var key in plans) {
					(function (plan) {
						var t = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
						plan.userData.initMatrix.decompose(t,q,s);

						var startPosition = plan.position.clone(),
							startQuaternion = plan.quaternion.clone();

						new TWEEN.Tween({ t: 0 })
							.to({ t: 1 }, 500)
							.easing(TWEEN.Easing.Quadratic.InOut)
							.onUpdate(function () {
								plan.position.lerpVectors(startPosition, t, this.t);
								THREE.Quaternion.slerp(startQuaternion, q, plan.quaternion, this.t);
							})
							.start();
					})(plans[key].object);
				}
				enableAnimationRequest();
			}
			webglInterface.callFunc.resetPlans = resetPlans;

			/**
			 * focus object (call from object list)
			 * @param id
             */
			webglInterface.callFunc.focusObject = function(id) {
				var objs = [objects[id].mesh];
				var cc = [];
				function collectChildren(children) {
					for(var i=0; i<children.length; i++) {
						collectChildren(children[i].children);
						if(children[i].userData.type === 'object')
							cc.push(children[i]);
					}
				}
				collectChildren(objs);
				focusObjects(cc);
			};

			/**
			 * focus selected objects
			 */
			scope.focusSelected = function() {
				if(selected.length === 0) return;
				var cc = [];
				function collectChildren(children) {
					for(var i=0; i<children.length; i++) {
						collectChildren(children[i].children);
						if(children[i].userData.type === 'object' || children[i].userData.type === 'plan')
							cc.push(children[i]);
					}
				}
				collectChildren(selected);
				focusObjects(cc);
			};

			/**
			 * focus all objects
			 */
			scope.focusAll = function() {
				var cc = [];
				for(var key in objects) {
					if(objects[key].mesh.userData.type === 'object') 
						cc.push(objects[key].mesh);
				}
				if(cc.length < 1) return;
				focusObjects(cc);
			};
			
			function focusObjects(objs) {
				// maximale BoundingBox
				var xmin=0, xmax=0, ymin=0, ymax=0, zmin=0, zmax=0;
				for(var i=0, l=objs.length; i<l; i++) {
					var omin = objs[i].geometry.boundingBox.min.clone().applyMatrix4(objs[i].matrixWorld);
					var omax = objs[i].geometry.boundingBox.max.clone().applyMatrix4(objs[i].matrixWorld);
					if(i == 0) {
						xmin = omin.x; ymin = omin.y; zmin = omin.z;
						xmax = omax.x; ymax = omax.y; zmax = omax.z;
					}
					else {
						if(omin.x < xmin) xmin = omin.x;
						if(omin.y < ymin) ymin = omin.y;
						if(omin.z < zmin) zmin = omin.z;
						if(omax.x > xmax) xmax = omax.x;
						if(omax.y > ymax) ymax = omax.y;
						if(omax.z > zmax) zmax = omax.z;
					}
				}
				// BoundingSphere um BoundingBox
				var geo = new THREE.Geometry();
				geo.vertices.push(new THREE.Vector3(xmin,ymin,zmin));
				geo.vertices.push(new THREE.Vector3(xmax,ymax,zmax));
				geo.computeBoundingSphere();
				
				// debug boundingBox
				//var mesh = new THREE.Mesh(geo, materials['defaultMat']);
				//scene.add(new THREE.BoxHelper(mesh, 0x00ff00));
				
				computeFocusFromSphere(geo.boundingSphere.center, geo.boundingSphere.radius);
			}

			/**
			 * place camera in appropriate distance to selected object,
			 * so the object will fit nicely within the viewport
			 * @memberof webglView
			 * @param {THREE.Vector3} M - center position
             * @param {number} r - radius
             */
			function computeFocusFromSphere(M, r) {
				if(camera.inPerspectiveMode) {
					// vector from current center to cam-position
					var s = new THREE.Vector3();
					s.subVectors(camera.position, controls.center);
					
					var h = r / Math.tan( camera.fov/2 * Math.PI / 180 );
					
					var newpos = new THREE.Vector3();
					newpos.addVectors(M, s.setLength(h));
					
					//camera.position.copy(newpos);
					//controls.center = M.clone();
					
					// animate camera.position and controls.center
					new TWEEN.Tween(camera.position.clone())
						.to(newpos, 500)
						.easing(TWEEN.Easing.Quadratic.InOut)
						.onUpdate(function () { camera.position.copy(this); })
						.start();
					new TWEEN.Tween(controls.center.clone())
						.to(M, 500)
						.easing(TWEEN.Easing.Quadratic.InOut)
						.onUpdate(function () { controls.center.copy(this); })
						.start();

					enableAnimationRequest();
				}
				else {
					if(scope.viewportSettings.camera == 'top')
						orthocam.position.set(M.x, 50, M.z);
					else if(scope.camera == 'front')
						orthocam.position.set(M.x, M.y, 50);
					else if(scope.camera == 'left')
						orthocam.position.set(-50, M.y, M.z);
				}
			}
			
			scope.$on('$destroy', function() {
				setSelected(null, false, true);
				if(scope.snapshot.active) scope.abortSnapshot();
				console.log('destroy webgl directive');
			});
		}
		
		return {
			restrict: 'AE',
			replace: false,
			transclude: true,
			templateUrl: 'app/directives/webglView/webglView.html',
			scope: {
				unsafeSettings: '=',
				callFunc: '=',
				gizmoCoords: '=',
				navigation: '=',
				screenshotCallback: '='
			},
			link: link
		};
	}]);
