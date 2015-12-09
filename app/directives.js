var webglDirectives = angular.module('webglDirectives', ['urish']);

webglDirectives.directive('webglView', ['$stateParams', 'angularLoad', '$timeout', 'webglInterface', '$rootScope', 'phpRequest', 'neo4jRequest', '$http', '$q', 'Utilities',
	function($stateParams, angularLoad, $timeout, webglInterface, $rootScope, phpRequest, neo4jRequest, $http, $q, Utilities) {
		
		function link(scope, element, attr) {
			
			// Scripts werden nachgeladen, sobald diese directive genutzt wird
			var scripts = [
				'lib/webgl/three-r73.min.js',
				'lib/webgl/Projector.js',
				'lib/webgl/CanvasRenderer.js',
				'lib/webgl/OrbitControls.js',
				'lib/webgl/CombinedCamera.js',
				'lib/webgl/OBJMTLLoader.js',
				'lib/webgl/MTLLoader.js',
				'lib/webgl/OBJExporter.js',
				//'lib/webgl/ThreePlugins.js',
				'lib/webgl/Gizmo.js',
				'lib/webgl/ctm/lzma.js',
				'lib/webgl/ctm/ctm.js',
				'lib/webgl/ctm/CTMLoader.js',
				'lib/webgl/RenderPass.js',
				'lib/webgl/ShaderPass.js',
				'lib/webgl/MaskPass.js',
				'lib/webgl/CopyShader.js',
				'lib/webgl/SSAOShader.js',
				'lib/webgl/FXAAShader.js',
				'lib/webgl/XRayShader.js',
				'lib/webgl/EffectComposer.js',
				'lib/webgl/DepthPassPlugin.js',
				'lib/webgl/stats.min.js'
			];
			function loadScripts(counter) {
				angularLoad.loadScript(scripts[counter]).then(function() {
					console.log(scripts[counter] + ' loaded', counter);
					if(++counter < scripts.length)
						loadScripts(counter);
					else
						init();
				}).catch(function() {
					console.log(scripts[counter] + ' failed');
				});
			}
			loadScripts(0);
			
			// Konstante maximale Sichtweite
			var FAR = 1400;
			
			/* globale Variablen */
			// allgemein 
			var SCREEN_WIDTH, SCREEN_HEIGHT;
			var canvas;
			var renderer, scene, controls, stats;
			var axisrenderer, axisscene, axiscamera;
			var camera, orthocam;
			var dlight;
			
			var postprocessing = {};
			
			// Listen für die Verwaltung der einzelnen Objekte
			var objects = {}, plans = {}, marks = {};
			var highlighted = [], sliced = [], hidden = [];
			// Listen für die Schnittstelle mit der HTML-Seite
			scope.objModels = [];
			scope.planModels = [];
			scope.marksModels = [];
			
			
			var selected = [];
			
			
			var objloader;
			var ctmloader;
			
			var plane;
			var planGH;
			
			// Gizmo, Slice, Messen
			var gizmo, gizmoMove, gizmoRotate;
			var activeGizmo = false;
			
			var sliceTool = false;
			var isSliced = false;
			var isSliceMoving = false;
			
			var measureTool;
			var pin;
			
			var navigationState = {
				SELECT: 0,
				AREASELECT: 1,
				ROTATE: 2,
				PAN: 3,
				ZOOM: 4,
				
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
			var renderSSAO = false;
			
			// für Navigation
			var mouseDownCoord;
			var isMouseDown = false;
			var isRotatingView = false;
			var isZoomingView = false;
			var isPanningView = false;
			scope.navigation = {select: true, rotate: false, pan: false, zoom: false};
			
			var isSelecting = false;
			
			// Liste der Materials
			var materials = {};
			
			// Initialisierung des Ganzen
			function init() {
			
			// default mat
			materials['defaultMat'] = new THREE.MeshLambertMaterial({color: 0xdddddd, name: 'defaultMat'});
			materials['defaultDoublesideMat'] = new THREE.MeshLambertMaterial({color: 0xdddddd, side: THREE.DoubleSide, name: 'defaultDoublesideMat'});
			materials['defaultUnsafeMat'] = new THREE.MeshLambertMaterial({color: 0xaaaaaa, transparent: true, opacity: 0.5, depthWrite: false, name: 'defaultUnsafeMat'});
			
			// selection mat
			materials['selectionMat'] = new THREE.MeshLambertMaterial({color: 0xff4444, side: THREE.DoubleSide, name: 'selectionMat'});
			
			// transparent mat
			materials['transparentMat'] = new THREE.MeshLambertMaterial({color: 0xcccccc, transparent: true, opacity: 0.5, depthWrite: false, name: 'transparentMat'});
			materials['transparentSelectionMat'] = new THREE.MeshLambertMaterial({color: 0xff4444, transparent: true, opacity: 0.5, depthWrite: false, name: 'transparentSelectionMat'});
			// wireframe mat
			materials['wireframeMat'] = new THREE.MeshBasicMaterial({color: 0x333333, wireframe: true, name: 'wireframeMat'});
			materials['wireframeSelectionMat'] = new THREE.MeshBasicMaterial({color: 0xff4444, wireframe: true, name: 'wireframeSelectionMat'});
			
			materials['invisibleMat'] = new THREE.MeshLambertMaterial({color: 0xdddddd, visible: false, name: 'invisibleMat'});
			// highlight mat
			materials['highlightMat'] = new THREE.MeshLambertMaterial({color: 0xffff44, name: 'highlightMat'});
			materials['transparentHighlightMat'] = new THREE.MeshLambertMaterial({color: 0xffff44, transparent: true, opacity: 0.5, name: 'transparentHighlightMat'});
			
			materials['xrayMat'] = new THREE.ShaderMaterial({name: 'xrayMat', side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false, uniforms: {"ambient":{type:"f",value:0.05},"edgefalloff":{type:"f",value:0.1},"intensity":{type:"f",value:1.0},"vColor":{type:"c",value:new THREE.Color(0x000000)}}, vertexShader: THREE.XRayShader.vertexShader, fragmentShader: THREE.XRayShader.fragmentShader});
			materials['xraySelectionMat'] = new THREE.ShaderMaterial({name: 'xraySelectionMat', side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false, uniforms: {"ambient":{type:"f",value:0.05},"edgefalloff":{type:"f",value:0.3},"intensity":{type:"f",value:1.5},"vColor":{type:"c",value:new THREE.Color(0xff4444)}}, vertexShader: THREE.XRayShader.vertexShader, fragmentShader: THREE.XRayShader.fragmentShader});
			
			materials['edgesMat'] = new THREE.LineBasicMaterial({color: 0x333333, name: 'edgesMat'});
			materials['edgesSelectionMat'] = new THREE.LineBasicMaterial({color: 0xff4444, name: 'edgesMat'});
			//materials['edgesMat'] = new THREE.LineBasicMaterial({color: 0xcccccc, name: 'edgesMat'});
			
			// slice mat
			materials['sliceMultiMat'] = [ materials['defaultMat'], materials['invisibleMat'], materials['defaultMat'], materials['invisibleMat'] ];
			materials['sliceLineMat'] = new THREE.LineBasicMaterial({color: 0xff0000, name: 'sliceLineMat'});
			
			materials['sliceMultiMat_debug'] = [new THREE.MeshLambertMaterial({color: 0xdd4444}),new THREE.MeshLambertMaterial({color: 0x44dd44}),new THREE.MeshLambertMaterial({color: 0x4444dd}),new THREE.MeshLambertMaterial({color: 0x44dddd})];
			
			
			
				// Auslesen von Höhe und Breite des Fensters
				element.height(element.parent().height() - element.position().top - 2*parseInt(element.css('border-top-width'),10));
				SCREEN_WIDTH = element.width();
				SCREEN_HEIGHT = element.height();
				console.log('viewport size: ' + SCREEN_WIDTH + ' ' + SCREEN_HEIGHT);
				
				
				// Camera
				//camera = new THREE.PerspectiveCamera(35, SCREEN_WIDTH/SCREEN_HEIGHT, 0.1, FAR);
				camera = new THREE.CombinedCamera(SCREEN_WIDTH, SCREEN_HEIGHT, 35, 0.1, FAR, 0.1, FAR);
				//camera.setSize(SCREEN_WIDTH/20, SCREEN_HEIGHT/20);
				//camera.position.set(0, 60, 10);
				camera.position.set(-100, 60, 100);
				
				orthocam = new THREE.OrthographicCamera(SCREEN_WIDTH/-20, SCREEN_WIDTH/20, SCREEN_HEIGHT/20, SCREEN_HEIGHT/-20, 0.1, FAR);
				
				// Scene
				scene = new THREE.Scene();
				scene.add(camera);
				scene.add(orthocam);
				scene.fog = new THREE.Fog(0x666666, FAR-100, FAR);
				
				// Grid
				scene.add(new THREE.GridHelper(100, 10));
				
				var camera2 = new THREE.CombinedCamera(SCREEN_WIDTH, SCREEN_HEIGHT, 35, 0.1, 200, 0.1, 200);
				camera2.position.set(-20,50,150);
				scene.add(camera2);
				scene.add(new THREE.CameraHelper(camera2));
				console.log(camera);
				
				// Renderer
				renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, preserveDrawingBuffer: true});
				renderer.setClearColor(0x666666, 1);
				//renderer.setClearColor(0x000000, 1);
				renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
				//renderer.autoClear = false;
				canvas = renderer.domElement;
				element.append(canvas);
				
				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '33px';
				element.append( stats.domElement );
				
				// MouseHandler für Viewport
				addMouseHandler();
				
				// Controls (für Navigation)
				controls = new THREE.OrbitControls(camera, canvas);
				controls.center.set(86, 0, -74);
				controls.zoomSpeed = 1.0;
				//controls.userPanSpeed = 1;
				camera.target = controls.center;
				
				// axis helper
				var axiselement = $('#axis');
				//axisrenderer = new THREE.CanvasRenderer();
				axisrenderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
				axisrenderer.setSize(axiselement.width(), axiselement.height());
				axiselement.append(axisrenderer.domElement);
				
				axisscene = new THREE.Scene();
				axiscamera = new THREE.OrthographicCamera(axiselement.width()/-2, axiselement.width()/2, axiselement.height()/2, axiselement.height()/-2, 1, 100);
				//axiscamera = new THREE.PerspectiveCamera(50, axiselement.width() / axiselement.height(), 1, 100);
				axiscamera.up = camera.up;
				
				var axes = new THREE.AxisHelper(30);
				axisscene.add(axes);
				
				
				// Light
				//var alight = new THREE.AmbientLight(0x666666);
				var alight = new THREE.AmbientLight(0x888888);
				//var alight = new THREE.AmbientLight(0xffffff);
				scene.add(alight);
				
				dlight = new THREE.DirectionalLight(0xffffff, 0.7);
				dlight.position.set(-2,8,4);
				scene.add(dlight);
				
				// Ladebalken
				var manager = new THREE.LoadingManager();
				manager.onProgress = function ( item, loaded, total ) {
					$('#loadprogressbar').show();
					$('#loadprogressitem').show();
					//console.log( item, loaded, total );
					var percent = loaded / total * 100;
					$('#loadprogressbar').css('width', percent + '%');
					$('#loadprogressitem').html(item + ' &ndash; ' + loaded + ' / ' + total);
					if(percent == 100) {
						//$('#loadprogressbar').css('visibility' , 'hidden');
						$('#loadprogressbar').delay(2000).fadeOut(2000);
						$('#loadprogressitem').delay(2000).fadeOut(2000);
						/*$timeout(function() {
							webglInterface.callFunc.focusAll();
						}, 100);*/
					}
				};
				
				// Postprocessing
				postprocessing.sampleRatio = 2;
				var sampleRatio = 2;
				var renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
				var composer = new THREE.EffectComposer(renderer, renderTarget);
				composer.setSize(SCREEN_WIDTH * sampleRatio, SCREEN_HEIGHT * sampleRatio);
				//composer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
				var renderPass = new THREE.RenderPass(scene, camera);
				composer.addPass(renderPass);
				
				var depthShader = THREE.ShaderLib['depthRGBA'];
				var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);
				
				postprocessing.depthMaterial = new THREE.ShaderMaterial({ fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms });
				postprocessing.depthMaterial.blending = THREE.NoBlending;
				
				//postprocessing.depthTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH * sampleRatio, SCREEN_HEIGHT * sampleRatio, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat});
				postprocessing.depthTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH * sampleRatio, SCREEN_HEIGHT * sampleRatio, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
				
				var ssaoPass = new THREE.ShaderPass(THREE.SSAOShader);
				ssaoPass.uniforms['tDepth'].value = postprocessing.depthTarget;
				ssaoPass.uniforms['size'].value.set(SCREEN_WIDTH * sampleRatio, SCREEN_HEIGHT * sampleRatio);
				ssaoPass.uniforms['cameraNear'].value = camera.near;
				ssaoPass.uniforms['cameraFar'].value = camera.far;
				//ssaoPass.renderToScreen = true;
				composer.addPass(ssaoPass);
				
				
				var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
				fxaaPass.uniforms['resolution'].value.set(1/SCREEN_WIDTH, 1/SCREEN_HEIGHT);
				//fxaaPass.renderToScreen = true;
				fxaaPass.enabled = true;
				//composer.addPass(fxaaPass);
				
				
				var copyPass = new THREE.ShaderPass(THREE.CopyShader);
				copyPass.renderToScreen = true;
				composer.addPass(copyPass);
				
				postprocessing.composer = composer;
				console.log(composer);
				
				// Loader für obj-Dateien
				objloader = new THREE.OBJMTLLoader(manager);
				ctmloader = new THREE.CTMLoader(manager);
				
				/*objloader.load('data/steinmetzzeichen/Steinmetzzeichen_auswahl.obj', 'data/steinmetzzeichen/Steinmetzzeichen_auswahl.mtl', loadMasonMarkHandler);
				*/
				
				// Gizmo
				gizmoMove = new THREE.GizmoMove(10, 2.5, 1.2);
				gizmoRotate = new THREE.GizmoRotate(10);
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
				
				//gizmo.attachToObject(plane);
				
				
				
				animate();
			}
			
			// Animations- und Renderschleife
			function animate() {
				requestAnimationFrame(animate);
				
				TWEEN.update();
				controls.update();
				
				// Steinmetzzeichen zeigen immer zur Kamera
				for(var key in marks) {
					if(marks[key].visible) {
						for(var i=0; i<marks[key].mesh.children.length; i++)
							marks[key].mesh.children[i].lookAt(camera.position);
					}
				}
				
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
					axiscamera.position.copy(camera.position);
					axiscamera.position.sub(controls.center);
					axiscamera.position.setLength(50);
					axiscamera.lookAt(axisscene.position);
				}
				
				render();
				stats.update();
			}

			function render() {
				//renderer.render(scene, camPerspective ? camera : orthocam);
				axisrenderer.render(axisscene, axiscamera);
				
				if(renderSSAO) {
					// do postprocessing
					scene.overrideMaterial = postprocessing.depthMaterial;
					renderer.render(scene, camera, postprocessing.depthTarget);
					scene.overrideMaterial = null;
					postprocessing.composer.render();
				}
				else {
					renderer.render(scene, camera);
				}
			}
			
			
			// Initialisierung des geladenen Objekts
			function loadObjectHandler(obj) {
				obj.traverse(function (child) {
					if(child instanceof THREE.Mesh) {
						
						var isUnsafe = false
						if(/unsicher/.test(child.name))
							isUnsafe = true;
						
						setObjectMaterial(child, true, false, true, isUnsafe);
						//child.castShadow = true;
						//child.receiveShadow = true;
						
						// Kanten (wenn unsicher, dann gestrichelte Kanten)
						var edges = new THREE.EdgesHelper(child, '#333333');
						if(isUnsafe) {
							var ldgeo = new THREE.Geometry();
							var coords = edges.geometry.attributes.position.array;
							for(var i=0; i<coords.length; i+=3) {
								var v = new THREE.Vector3(coords[i],coords[i+1],coords[i+2]);
								ldgeo.vertices.push(v);
							}
							var ldmat = new THREE.LineDashedMaterial({color:0x333333, scale:1.0, dashSize:0.5, gapSize:0.25, transparent:true, opacity:0.5});
							edges = new THREE.Line(ldgeo, ldmat, THREE.LinePieces);
							edges.geometry.computeLineDistances();
							edges.geometry.lineDistancesNeedUpdate = true;
						}
						
						// Mesh und Kanten der Scene hinzufügen
						scene.add(child);
						scene.add(edges);
						
						// userData
						child.userData.eid = 'e22_'+child.name;
						child.userData.type = 'object';
						child.userData.unsafe = isUnsafe;
						
						// Liste, um zusammengehörige Objekte zu managen
						objects[child.id] = {mesh: child, edges: edges, slicedMesh: null, slicedEdges: null, sliceLine: null, sliceFaces: null, visible: true};
						
						// Liste für die Anzeige auf der HTML-Seite
						scope.layerList.push({name: child.name, id: child.id, visible: child.visible});
						scope.$apply();
					}
				});
				console.log(scene);
			}
			
			// Material für Objekte anpassen
			function setObjectMaterial(obj, setAmbient, disableColor, disableSpecular, unsafe) {
				if(obj.material.name in materials) {
					obj.material = materials[obj.material.name];
					obj.userData.originalMat = obj.material.name;
					//console.log(obj.name, obj.material.name);
					return;
				}
				/*obj.material.color.r = Math.pow(obj.material.color.r, 1/2.2);
				obj.material.color.g = Math.pow(obj.material.color.g, 1/2.2);
				obj.material.color.b = Math.pow(obj.material.color.b, 1/2.2);*/
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
			
			// Initialisierung des geladenen Plans
			function loadPlanHandler(obj) {
				obj.traverse(function (child) {
					if(child instanceof THREE.Mesh) {
						
						setPlanMaterial(child);
						
						// Kanten
						var edges = new THREE.EdgesHelper(child, '#333333');
						
						// Mesh und Kanten der Scene hinzufügen
						scene.add(child);
						scene.add(edges);
						
						// userData
						child.userData.type = 'plan';
						
						// Liste, um zusammengehörige Objekte zu managen
						plans[child.id] = {mesh: child, edges: edges, visible: true};
						
						// Liste für die Anzeige auf der HTML-Seite
						scope.planModels.push({name: child.name, id: child.id, visible: child.visible});
						scope.$apply();
					}
				});
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
							var x = vs[i+0].x+vs[i+1].x+vs[i+2].x+vs[i+3].x+vs[i+4].x+vs[i+5].x+vs[i+6].x+vs[i+7].x;
							var y = vs[i+0].y+vs[i+1].y+vs[i+2].y+vs[i+3].y+vs[i+4].y+vs[i+5].y+vs[i+6].y+vs[i+7].y;
							var z = vs[i+0].z+vs[i+1].z+vs[i+2].z+vs[i+3].z+vs[i+4].z+vs[i+5].z+vs[i+6].z+vs[i+7].z;
							
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
			
			function setGizmo(obj, type) {
				if(gizmo)
					gizmo.attachToObject(null);
				
				switch(type) {
					case 'move': gizmo = gizmoMove; break;
					case 'rotate': gizmo = gizmoRotate; break;
					default: gizmo = null; break;
				}
				
				if(gizmo)
					gizmo.attachToObject(obj);
			}
			
			function selectObject(mx, my, ctrlKey) {
				var elementOffset = new THREE.Vector2();
				elementOffset.x = element.offset().left - $(window).scrollLeft();
				elementOffset.y = element.offset().top - $(window).scrollTop();
				
				var mouse = new THREE.Vector2();
				mouse.x = ((mx - elementOffset.x) / SCREEN_WIDTH) * 2 - 1;
				mouse.y = - ((my - elementOffset.y) / SCREEN_HEIGHT) * 2 + 1;
				
				var cam = camPerspective ? camera : orthocam;
				var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(cam);
				
				//var raycaster = new THREE.Projector().pickingRay(vector, camPerspective ? camera : orthocam);
				var raycaster = new THREE.Raycaster(cam.position, vector.sub(cam.position).normalize());
				
				var testObjects = [];
				for(var key in objects) {
					if(objects[key].visible && objects[key].mesh.userData.type === 'object')
						testObjects.push(objects[key].mesh);
				}
				for(var key in plans) {
					if(plans[key].visible)
						testObjects.push(plans[key].mesh);
				}
				
				var intersects = raycaster.intersectObjects(testObjects, true);
				
				if(intersects.length > 0 ) {
					console.log(intersects[0]);
					console.log(objects[intersects[0].object.id]);
					setSelected(intersects[0].object, ctrlKey);
				}
				else 
					setSelected(null, ctrlKey);
			}
			
			function selectArea(mStart, mEnd, ctrlKey) {
				var cam = camPerspective ? camera : orthocam;
				var s0 = new THREE.Vector3(mStart.x, mStart.y, 0.5).unproject(cam);
				var s1 = new THREE.Vector3(mStart.x, mEnd.y, 0.5).unproject(cam);
				var s2 = new THREE.Vector3(mEnd.x, mEnd.y, 0.5).unproject(cam);
				var s3 = new THREE.Vector3(mEnd.x, mStart.y, 0.5).unproject(cam);
				var s4 = new THREE.Vector3(0, 0, 0.5).unproject(cam);
				
				
				
				
				var v0 = new THREE.Vector3().subVectors(s0, cam.position).normalize();
				var v1 = new THREE.Vector3().subVectors(s1, cam.position).normalize();
				var v2 = new THREE.Vector3().subVectors(s2, cam.position).normalize();
				var v3 = new THREE.Vector3().subVectors(s3, cam.position).normalize();
				var v4 = new THREE.Vector3().subVectors(s4, cam.position).normalize();
				
				var s5 = new THREE.Vector3(0, 0, FAR).unproject(cam).add(v4.clone().setLength(FAR));
				var v5 = new THREE.Vector3().subVectors(s5, cam.position).normalize();
				
				console.log(s0,s1,s4,s5);
				
				var n0 = new THREE.Vector3().crossVectors(v0, v1);
				var n1 = new THREE.Vector3().crossVectors(v1, v2);
				var n2 = new THREE.Vector3().crossVectors(v2, v3);
				var n3 = new THREE.Vector3().crossVectors(v3, v0);
				var n4 = v4.clone().negate();
				// var n4 = camera.getWorldDirection();
				var n5 = v5.clone();
				// var n5 = camera.getWorldDirection().negate();
				
				var d0 = -n0.x*s0.x -n0.y*s0.y -n0.z*s0.z;
				var d1 = -n1.x*s1.x -n1.y*s1.y -n1.z*s1.z;
				var d2 = -n2.x*s2.x -n2.y*s2.y -n2.z*s2.z;
				var d3 = -n3.x*s3.x -n3.y*s3.y -n3.z*s3.z;
				var d4 = -n4.x*s4.x -n4.y*s4.y -n4.z*s4.z;
				var d5 = -n5.x*s5.x -n5.y*s5.y -n5.z*s5.z;
				
				console.log(v0,v1,v4,v5);
				console.log(n0,n1,n4,n5);
				console.log(d0,d1,d4,d5);
				
				var p0 = new THREE.Plane(n0, d0);
				var p1 = new THREE.Plane(n1, d1);
				var p2 = new THREE.Plane(n2, d2);
				var p3 = new THREE.Plane(n3, d3);
				var p4 = new THREE.Plane(n4, d4);
				var p5 = new THREE.Plane(n5, d5);
				
				var frustum = new THREE.Frustum(p0, p1, p2, p3, p4, p5);
				
				console.log(frustum);
				
				var countSelect = 0;
				for(var key in objects) {
					if(objects[key].visible && objects[key].mesh.userData.type === 'object') {
						if(frustum.intersectsObject(objects[key].mesh)) {
							if(countSelect === 0) setSelected(objects[key].mesh, false);
							else setSelected(objects[key].mesh, true);
							countSelect++;
						}
					}
				}
			}
			
			// deselect any selected obj and assign original material
			// select obj and assign selectionMat
			function setSelected(obj, onlySelect, onlyDeselect) {
				onlySelect = onlySelect || false;
				onlyDeselect = onlyDeselect || false;
				
				//dehighlight();
				// deselection
				if(selected.length > 0 && !onlySelect) {
					for(var i=0; i<selected.length; i++) {
						var o = selected[i];
						if(o.userData.type === 'object' || o.userData.type === 'plan')
							rejectSelectionMat(o);
						webglInterface.deselectListEntry(o.id, o.userData.type);
						deselectChildren(o.children);
					}
					selected = [];
				}
				// selection
				if(obj && !onlyDeselect && selected.indexOf(obj) === -1) {
					if(obj.userData.type === 'object' || obj.userData.type === 'plan')
						assignSelectionMat(obj);
					webglInterface.selectListEntry(obj.id, obj.userData.type);
					selectChildren(obj.children);
					
					selected.push(obj);
					//console.log(selected);
				}
				else if(obj && !onlyDeselect && selected.indexOf(obj) !== -1) {
					if(obj.userData.type === 'object' || obj.userData.type === 'plan')
						rejectSelectionMat(obj);
					webglInterface.deselectListEntry(obj.id, obj.userData.type);
					deselectChildren(obj.children);
					selected.splice(selected.indexOf(obj), 1);
				}
			}
			
			function selectChildren(children) {
				for(var i=0, l=children.length; i<l; i++) {
					var o = children[i];
					if(o.userData.type === 'object')
						assignSelectionMat(o);
					webglInterface.selectListEntry(o.id);
					selectChildren(o.children);
				}
			}
			function deselectChildren(children) {
				for(var i=0, l=children.length; i<l; i++) {
					var o = children[i];
					if(o.userData.type === 'object')
						rejectSelectionMat(o);
					webglInterface.deselectListEntry(o.id);
					deselectChildren(o.children);
				}
			}
			
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
					 obj.material.color.setHex(0xffcccc);
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
						else	
							//obj.material = materials['selectionMat'];
							objects[obj.id].edges.material = materials['edgesSelectionMat'];
						break;
				}
			}
			
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
					 obj.material.color.setHex(0xffffff);
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
					case 'grey':
						if(obj.userData.modifiedMat)
							obj.material.color = materials['defaultDoublesideMat'].color;
						else
							obj.material = materials['defaultDoublesideMat'];
						break;
					default:
						if(obj.userData.modifiedMat)
							obj.material.color = materials[obj.userData.originalMat].color;
						else	
							//obj.material = materials[obj.userData.originalMat];
							objects[obj.id].edges.material = materials['edgesMat'];
						break;
				}
			}
			
			// check for intersection of BoundingBoxes
			function overlapAABB(o1, o2) {
				if(!o1.geometry.boundingBox) o1.geometry.computeBoundingBox();
				if(!o2.geometry.boundingBox) o2.geometry.computeBoundingBox();
				var box1 = o1.geometry.boundingBox;
				var box2 = o2.geometry.boundingBox;
				
				var ext1 = new THREE.Vector3(box1.max.x - box1.min.x, box1.max.y - box1.min.y, box1.max.z - box1.min.z);
				var ext2 = new THREE.Vector3(box2.max.x - box2.min.x, box2.max.y - box2.min.y, box2.max.z - box2.min.z);
				
				var pos1 = box1.min.add(box1.max).divideScalar(2).add(o1.position);
				var pos2 = box2.min.add(box2.max).divideScalar(2).add(o2.position);
				
				var pdiff = pos1.sub(pos2);
				
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
				var o = new Object();
				
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
			});
			
			// watch edges settings
			$rootScope.$watch(function() {
				return webglInterface.vizSettings.edges;
			}, function(value) {
				for(var key in objects) {
					var obj = objects[key];
					if(obj.visible) {
						if(value) scene.add(obj.edges);
						else scene.remove(obj.edges);
					}
				}
			});
			$rootScope.$watch(function() {
				return webglInterface.vizSettings.edgesOpacity;
			}, function(value) {
				if(!materials['edges']) return;
				if(value === 100) {
					materials['edgesMat'].transparent = false;
					materials['edgesSelectionMat'].transparent = false;
				}
				else {
					materials['edgesMat'].transparent = true;
					materials['edgesMat'].opacity = value/100;
					materials['edgesSelectionMat'].transparent = true;
					materials['edgesSelectionMat'].opacity = value/100;
				}
			});
			
			//scope.$watch('viewportSettings.shading', function(value) {
			webglInterface.callFunc.setShading = function(value) {
				console.log('set shading', value);
				if(!scene) return;
				
				var uncoverObj = ['onlyEdges'].indexOf(currentShading) !== -1 ? true : false;
				var uncoverEdge = webglInterface.viewportSettings.edges ? ['xray'].indexOf(currentShading) !== -1 ? true : false : false;
				currentShading = value;
				
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
			};
			
			//scope.$watch('viewportSettings.camera', function(value) {
			webglInterface.callFunc.setCamera = function(value) {
				console.log('set camera', value);
				if(!scene) return;
				
				switch(value) {
					case 'Perspective':
						camPerspective = true;
						camera.toPerspective();
						camera.setZoom(1);
						break;
					case 'Top':
						camera.toOrthographic(controls.center);
						camera.toTopView();
						// break;
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
			});
			
			// set opacity of objects
			webglInterface.callFunc.setObjectOpacity = function(item, value) {
				var mesh = objects[item.id].mesh;
				var edges = objects[item.id].edges;
				
				if(item.type === 'object')
					setOpacity(mesh, edges, value);
				item.opacity = value;
				setChildrenOpacity(item.children, value);
			};
			
			// set opacity of plans
			webglInterface.callFunc.setPlanOpacity = function(id, value) {
				var mesh = plans[id].mesh;
				var edges = plans[id].edges;
				setOpacity(mesh, edges, value);
			};
			
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
						edges.material.needsUpdate = true;
					}
					mesh.userData.modifiedMat = true;
				}
				mesh.material.opacity = value;
				if(edges) edges.material.opacity = value;
			}
			
			
			
			// transformiere Mousekoordinaten zu Viewportkoordinaten
			function mouseInputToViewport(event) {
				var elementOffset = new THREE.Vector2();
				elementOffset.x = element.offset().left - $(window).scrollLeft();
				elementOffset.y = element.offset().top - $(window).scrollTop();
				
				var mouse = new THREE.Vector2();
				mouse.x = ((event.clientX - elementOffset.x) / SCREEN_WIDTH) * 2 - 1;
				mouse.y = - ((event.clientY - elementOffset.y) / SCREEN_HEIGHT) * 2 + 1;
				
				return mouse;
			}
			function mouseOffsetToViewport(ox, oy) {
				var mouse = new THREE.Vector2();
				mouse.x = (ox / SCREEN_WIDTH) * 2 - 1;
				mouse.y = - (oy / SCREEN_HEIGHT) * 2 + 1;
				
				return mouse;
			}
			
			// MouseDown EventHandler
			function mousedown(event) {
				//controls.onMouseDown(event.originalEvent);
				//$(canvas).bind('mousemove', mousemove);
				isMouseDown = true;
				//$(canvas).bind('mouseup', mouseup);
				
				//mouseDownCoord = new THREE.Vector2(event.clientX, event.clientY);
				mouseDownCoord = new THREE.Vector2(event.offsetX, event.offsetY);
				
				if(scope.navigation.select) {
				
					if(event.button === 0 && event.altKey && !isPanningView) {
						if(activeGizmo) activeGizmo = false;
						$('#webglViewport').addClass('cursor_orbit');
						isRotatingView = true;
						controls.onMouseDown(event.originalEvent);
					}
					// else if(event.button === 1 && event.altKey && !isRotatingView && !isPanningView) {
						// $('#webglViewport').addClass('cursor_zoom');
						// isZoomingView = true;
						// controls.onMouseDown(event.originalEvent);
					// }
					else if(event.button === 1 && !isRotatingView) {
						$('#webglViewport').addClass('cursor_pan');
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
				else if(event.button === 0 && scope.navigation.selectRect) {
					isSelecting = true;
					console.log(event);
					var sr = $('<div/>', {id: 'select-rectangle', 'class': 'select-rectangle'})
						.css({left: event.offsetX, top: event.offsetY, width: 0, height: 0});
					element.append(sr);
				}
			}
			
			// MouseMove EventHandler
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
					else if(isSelecting) {
						element.find('#select-rectangle').css({width: event.offsetX-mouseDownCoord.x, height: event.offsetY-mouseDownCoord.y});
					}
				}
				else {
					// check if mouse hits gizmo
					if(gizmo) {
						var mouse = mouseInputToViewport(event);
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
					else if(pin) {
						var mouse = mouseInputToViewport(event);
						var testObjects = [];
						for(var key in objects) {
							if(objects[key].visible)
								testObjects.push(objects[key].mesh);
						}
						pin.mousehit(mouse.x, mouse.y, camera, testObjects);
					}
				}
				
			}
			
			// MouseUp EventHandler
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
				
				if(event.button === 0 && isSelecting) {
					isSelecting = false;
					console.log('select finished');
					element.find('#select-rectangle').remove();
					
					var mStart = mouseOffsetToViewport(mouseDownCoord.x, mouseDownCoord.y);
					var mEnd = mouseOffsetToViewport(event.offsetX, event.offsetY);
					
					selectArea(mStart, mEnd, event.ctrlKey);
				}
				
				else if(event.button === 0 && !scope.navigation.select) {
					controls.onMouseUp(event.originalEvent);
					if(scope.navigation.rotate) {
						isRotatingView = false;
					}
					else if(scope.navigation.pan) {
						isPanningView = false;
					}
					else if(scope.navigation.zoom) {
						isZoomingView = false;
					}
				}
				
				else if(event.button === 0 && !isPanningView) {
					if(isRotatingView) {
						isRotatingView = false;
						$('#webglViewport').removeClass('cursor_orbit');
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
					else {
						//console.log(event);
						selectObject(event.clientX, event.clientY, event.ctrlKey);
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
						$('#webglViewport').removeClass('cursor_pan');
						controls.onMouseUp(event.originalEvent);
						return;
					}
				}
				else if(event.button === 2) {
					webglInterface.callFunc.setNavigationMode('select');
					scope.$apply();
					//if(!mouseDownCoord.equals(new THREE.Vector2(event.clientX, event.clientY))) return;
					if(!mouseDownCoord.equals(new THREE.Vector2(event.offsetX, event.offsetY))) return;
					
					
				}
				
			}
			
			// MouseWheel EventHandler
			function mousewheel(event) {
				event.preventDefault();
				if(camPerspective)
					controls.onMouseWheel(event.originalEvent);
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
			
			function keydown(event) {
				controls.onKeyDown(event.originalEvent);
			}
			
			function keyup(event) {
				console.log('keyup');
			}
			
			
			function onWindowResize(event) {
				resizeViewport();
			}
			
			function resizeViewport() {
				
				element.height(element.parent().height() - element.position().top - 2*parseInt(element.css('border-top-width'),10));
				SCREEN_WIDTH = element.width();
				SCREEN_HEIGHT = element.height();
				
				console.log('resize called', SCREEN_WIDTH, SCREEN_HEIGHT);
				
				camera.cameraP.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
				camera.cameraP.updateProjectionMatrix();
				
				renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
				
				postprocessing.composer.setSize(SCREEN_WIDTH * postprocessing.sampleRatio, SCREEN_HEIGHT * postprocessing.sampleRatio);
				
				//postprocessing.depthTarget.setSize(SCREEN_WIDTH * postprocessing.sampleRatio, SCREEN_HEIGHT * postprocessing.sampleRatio);
				postprocessing.depthTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH * postprocessing.sampleRatio, SCREEN_HEIGHT * postprocessing.sampleRatio, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat});
				
				postprocessing.composer.passes[1].uniforms['size'].value.set(SCREEN_WIDTH * postprocessing.sampleRatio, SCREEN_HEIGHT * postprocessing.sampleRatio);
				postprocessing.composer.passes[1].uniforms['tDepth'].value = postprocessing.depthTarget;
				
			}
			
			function addMouseHandler() {
				$(canvas).bind('mousedown', mousedown);
				$(canvas).bind('mousemove', mousemove);
				$(canvas).bind('mouseup', mouseup);
				$(canvas).bind('mousewheel', mousewheel);
				//$(canvas).bind('MozMousePixelScroll', mousewheel); // firefox
				$(canvas).bind('DOMMouseScroll', mousewheel); // firefox
				$(canvas).bind('keydown', keydown);
				$(canvas).bind('keyup', keyup);
				$(window).bind('resize', onWindowResize);
				
				$(canvas).bind('contextmenu', function(event) {
					event.preventDefault();
				});
			}
			
			webglInterface.callFunc.startMarking = function() {
				webglInterface.callFunc.setNavigationMode(false);
				pin = new THREE.Pin(3, 1, 0.5);
				scene.add(pin);
			};
			
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
			
			webglInterface.callFunc.setNavigationMode = function(mode) {
				scope.navigation.select = false;
				scope.navigation.selectRect = false;
				scope.navigation.rotate = false;
				scope.navigation.pan = false;
				scope.navigation.zoom = false;
				if(mode)
					scope.navigation[mode] = true;
			};
			
			scope.internalCallFunc.getObjForPlans = function() {
				
				var res = [];
				
				for(var key in plans) {
					var pgeo = plans[key].mesh.geometry;
					var objs = [];
					
					for(var i=0; i<pgeo.faces.length; i++) {
						var tg = new THREE.Geometry();
						tg.vertices.push(pgeo.vertices[pgeo.faces[i].a]);
						tg.vertices.push(pgeo.vertices[pgeo.faces[i].b]);
						tg.vertices.push(pgeo.vertices[pgeo.faces[i].c]);
						var tm = new THREE.Mesh(tg);
						
						for(var k in objects) {
							if(overlapAABB(objects[k].mesh, tm))
								objs.push(objects[k].mesh.name);
						}
					}
					
					res.push({plan: plans[key].mesh.name, objs: objs});
				}
				
				return res;
			}
			
			function dehighlight() {
				for(var i=0; i< highlighted.length; i++) {
					var obj = highlighted[i];
					if(obj.material.map != null) {
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
						objects[obj.id].edges.material.color.setHex(0x333333);
				}
				highlighted = [];
			}
			
			scope.internalCallFunc.highlightObj = function(eid) {
				//dehighlight();
				for(var key in objects) {
					if(objects[key].mesh.userData.eid == eid) {
						var obj = objects[key].mesh;
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
							objects[obj.id].edges.material.color.setHex(0xffff44);
						
						highlighted.push(obj);
					}
				}
			}
			
			scope.internalCallFunc.loadObjIntoScene = function(path, file) {
				objloader.load(path+file, path+'_empty.mtl', loadObjectHandler);
			}
			
			scope.internalCallFunc.loadPlanIntoScene = function(path, file) {
				objloader.load(path+file, path+'plans_muristan.mtl', loadPlanHandler);
			}
			
			scope.internalCallFunc.loadCTMPlanIntoScene = function(plan3d, info, file) {
				
				ctmloader.load('data/'+file.path+file.content, ctmPlanHandler, {useWorker: false});
				
				var po = {e36id: plan3d};
				return po;
				
				function ctmPlanHandler(geo) {
					geo.computeBoundingBox();
					
					var texture = THREE.ImageUtils.loadTexture('data/' + info.materialMapPath + info.materialMap);
					texture.anisotropy = 8;
					var material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
					
					var mesh = new THREE.Mesh(geo, material);
					
					var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24.0), materials['edgesMat']);
					//edges.matrix = mesh.matrixWorld;
					//edges.matrixAutoUpdate = false;
					scene.add(edges);
					
					mesh.name = info.content;
					mesh.userData.name = info.name;
					mesh.userData.eid = info.content;
					mesh.userData.type = 'plan';
					
					scene.add(mesh);
					
					// Liste, um zusammengehörige Objekte zu managen
					plans[mesh.id] = {mesh: mesh, edges: edges, visible: true};
					//webglInterface.insertIntoPlanlist({ name: mesh.name, id: mesh.id, title: mesh.userData.name, type: mesh.userData.type });
					webglInterface.plans.push(new webglInterface.PlanEntry(mesh.id, mesh.name, mesh.userData.name, mesh.userData.type));
					scope.$applyAsync();
					
					po.meshId = mesh.id;
				}
				
				
			};
			
			scope.internalCallFunc.loadCTMIntoScene = function(info, file, parent) {
				
				var defer = $q.defer();
				
				var m = info.matrix;
				var mat = new THREE.Matrix4();
				mat.set(m[0],m[1],m[2],m[3],m[4],m[5],m[6],m[7],m[8],m[9],m[10],m[11],m[12],m[13],m[14],m[15]);
				
				// transformation from z-up-world to y-up-world
				if(info.upAxis == 'Z_UP') {
					var ymat = new THREE.Matrix4();
					ymat.set(1,0,0,0, 0,0,1,0, 0,-1,0,0, 0,0,0,1);
					mat.multiplyMatrices(ymat,mat);
				}
				
				var t = new THREE.Vector3();
				var q = new THREE.Quaternion();
				var s = new THREE.Vector3();
				mat.decompose(t,q,s);
				
				var scale = info.unit == 'centimeter' ? 0.1 : 1.0;
				
				if(info.type === 'group') {
					var obj = new THREE.Object3D();
					obj.name = info.content;
					obj.userData.name = info.name;
					obj.userData.eid = info.content;
					obj.userData.type = info.type;
					obj.userData.layer = info.layer;
					
					// only scale translation
					t.multiplyScalar(scale);
					mat.compose(t,q,s);
					obj.applyMatrix(mat);
					
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
					
					defer.resolve();
					return defer.promise;
				}
				else if(info.type === 'object') {
					ctmloader.load('data/'+file.path+file.content, ctmHandler, {useWorker: false});
					defer.resolve();
					return defer.promise;
				}
				
				function ctmHandler(geo) {
					//defer.resolve();
					
					geo.computeBoundingBox();
					//geo.computeFaceNormals();
					//geo.computeVertexNormals();
					
					var isUnsafe = false
					if(/unsicher/.test(info.name))
						isUnsafe = true;
					
					var mesh;
					if(info.materialId) {
						var material = new THREE.MeshLambertMaterial();
						//material.color = new THREE.Color(Math.pow(info.materialColor[0], 1/2.2), Math.pow(info.materialColor[1], 1/2.2), Math.pow(info.materialColor[2], 1/2.2));
						material.color = new THREE.Color(info.materialColor[0], info.materialColor[1], info.materialColor[2]);
						//material.ambient = material.color.clone();
						material.name = info.materialId;
						//materials[info.materialId] = material;
						mesh = new THREE.Mesh(geo, material);
						setObjectMaterial(mesh, true, false, true, isUnsafe);
					}
					else {
						mesh = new THREE.Mesh(geo, materials['defaultDoublesideMat']);
						mesh.userData.originalMat = 'defaultDoublesideMat';
					}
					
					// edges
					var edges = null;
					
					
					if(file.edges) {
						// lade und entpacke geometry für edges
						JSZipUtils.getBinaryContent('data/'+file.path+file.edges, function(err, data) {
							var zip = new JSZip(data);
							var vobj = JSON.parse(zip.file(file.content+'.json').asText());
							
							var floatarray = new Float32Array(vobj.data.attributes.position.array);
							var egeo = new THREE.BufferGeometry();
							egeo.addAttribute('position', new THREE.BufferAttribute(floatarray, 3));
							edges = new THREE.LineSegments(egeo, materials['edgesMat']);
							edges.matrix = mesh.matrixWorld;
							edges.matrixAutoUpdate = false;
							scene.add(edges);
							objects[mesh.id].edges = edges;
						});
					}
					else {
						// wenn noch keine geometry für edges da, berechne und speichere edges
						edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24.0), materials['edgesMat']);
						edges.matrix = mesh.matrixWorld;
						edges.matrixAutoUpdate = false;
						scene.add(edges);
						
						var zip = new JSZip();
						zip.file(file.content+'.json', JSON.stringify(edges.geometry.toJSON()));
						var zipdata = zip.generate({compression:'DEFLATE'});
						phpRequest.saveGeoToJson(file.path, file.content, zipdata).then(function(response){
							if(response.data !== 'SUCCESS') {
								console.error('phpRequest failed on saveGeoToJson()', response.data);
								return $q.reject();
							}
							return neo4jRequest.addEdgesFile($stateParams.project, file.content, file.content+'.zip');
						}).then(function(response){
							if(response.data.exception) { console.error('neo4j failed on addEdgesFile()', response); return; }
							file.edges = file.content+'.zip';
						});
					}
					
					//mesh = new THREE.Mesh(geo, materials['xrayMat']);
					
					// scale translation and set scale component
					t.multiplyScalar(scale);
					s.multiplyScalar(scale);
					mat.compose(t,q,s);
					mesh.applyMatrix(mat);
					//mesh.add(edges);
					
					
					mesh.name = info.content;
					mesh.userData.name = info.name;
					mesh.userData.eid = info.content;
					mesh.userData.type = info.type;
					mesh.userData.layer = info.layer;
					//mesh.userData.originalMat = origMat;
					mesh.userData.unsafe = isUnsafe;
					
					// mesh in scene einfügen
					var parentid = null;
					if(parent && (p = scene.getObjectByName(parent, true))) {
						p.add(mesh);
						parentid = p.id;
					}
					else {
						scene.add(mesh);
					}
					
					// Liste, um zusammengehörige Objekte zu managen
					objects[mesh.id] = {mesh: mesh, edges: edges, slicedMesh: null, slicedEdges: null, sliceLine: null, sliceFaces: null, visible: true, parent: parentid, parentVisible: true};
					
					// Liste für die Anzeige auf der HTML-Seite
					webglInterface.insertIntoLists({ name: mesh.name, id: mesh.id, title: mesh.userData.name, layer: mesh.userData.layer, type: mesh.userData.type, parent: parentid });
					
					// if(scope.layers.indexOf(mesh.userData.layer) === -1)
						// scope.layers.push(mesh.userData.layer);
					
					
				}
			};
			
			scope.internalCallFunc.setCoordsFromInput = function(coords) {
				if(gizmo instanceof THREE.GizmoMove)
					gizmo.object.position.set(parseFloat(coords.x), parseFloat(coords.y), parseFloat(coords.z));
				else if(gizmo instanceof THREE.GizmoRotate)
					gizmo.object.rotation.set(THREE.Math.degToRad(coords.x), THREE.Math.degToRad(coords.y), THREE.Math.degToRad(coords.z));
			};
			
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
					if(f.vertexNormals.length < 3)
						var face = [ f.a, f.b, f.c];
					else {
					var face = [ f.a, f.b, f.c,
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
				
			}
			
			scope.internalCallFunc.getScreenshot = function() {
				var screenData = {
					dataUrl: renderer.domElement.toDataURL("image/jpeg"),
					cameraMatrix: camera.matrix.toArray(),
					cameraFOV: camera.fov,
					cameraCenter: controls.center.toArray(),
					width: SCREEN_WIDTH,
					height: SCREEN_HEIGHT
				};
				return screenData;
			};
			
			// select Object (from list)
			webglInterface.callFunc.selectObjectById = function(id, event, type) {
				if(type === 'plan' && plans[id].visible)
					setSelected(plans[id].mesh, event.ctrlKey);
				else if(objects[id].visible)
					setSelected(objects[id].mesh, event.ctrlKey);
			};
			
			webglInterface.callFunc.selectObject = function(id, ctrlKey, deselect) {
				if(objects[id].visible)
					setSelected(objects[id].mesh, ctrlKey, deselect);
			};
			
			webglInterface.callFunc.selectPlan = function(id, ctrlKey, deselect) {
				if(plans[id].visible)
					setSelected(plans[id].mesh, ctrlKey, deselect);
			};
			
			// get object by id and add or remove mesh and edges
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
			
			webglInterface.callFunc.togglePlan = function(pid, visible) {
				if(visible && !plans[pid].visible) {
					scene.add(plans[pid].mesh);
					scene.add(plans[pid].edges);
					plans[pid].visible = true;
				}
				else {
					scene.remove(plans[pid].mesh);
					scene.remove(plans[pid].edges);
					plans[pid].visible = false;
				}
			};
			
			// get plan by id and add or remove mesh and edges
			scope.internalCallFunc.showhidePlan = function(id, bool) {
				var obj = scene.getObjectById(id);
				if(bool && !obj) {
					if(scope.shading != shading.EDGE)
						scene.add(plans[id].mesh);
					if(scope.shading == shading.COLOR_EDGE || scope.shading == shading.GREY_EDGE || scope.shading == shading.EDGE || scope.shading == shading.TRANSPARENT_EDGE)
						scene.add(plans[id].edges);
				}
				if(!bool) {
					if(scope.shading != shading.EDGE)
						scene.remove(obj);
					if(scope.shading == shading.COLOR_EDGE || scope.shading == shading.GREY_EDGE || scope.shading == shading.EDGE || scope.shading == shading.TRANSPARENT_EDGE)
						scene.remove(plans[id].edges);
				}
				plans[id].visible = bool;
			}
			
			webglInterface.callFunc.resize = function() {
				resizeViewport();
			}
			
			webglInterface.callFunc.viewOrthoPlan = function(pid) {
				
				var pgeo = plans[pid].mesh.geometry;
				
				console.log(pgeo);
				
				var normal = new THREE.Vector3(pgeo.attributes.normal.array[0], pgeo.attributes.normal.array[1], pgeo.attributes.normal.array[2]);
				
				var aspect = SCREEN_WIDTH/SCREEN_HEIGHT;
				var pwidth = Math.sqrt( Math.pow(pgeo.boundingBox.max.x - pgeo.boundingBox.min.x, 2) + Math.pow(pgeo.boundingBox.max.z - pgeo.boundingBox.min.z, 2) ) / 2;
				var pheight = (pgeo.boundingBox.max.y - pgeo.boundingBox.min.y) / 2;
				
				if(normal.y > 0.707 || normal.y < -0.707) {
					pwidth = Math.sqrt( Math.pow(pgeo.boundingBox.max.x - pgeo.boundingBox.min.x, 2) + Math.pow(pgeo.boundingBox.max.y - pgeo.boundingBox.min.y, 2) ) / 2;
					pheight = (pgeo.boundingBox.max.z - pgeo.boundingBox.min.z) / 2;
				}
				
				if(aspect < pwidth/pheight)
					pheight = 1/aspect * pwidth;
				
				var h = pheight / Math.tan( camera.fov/2 * Math.PI / 180 );
				
				var newpos = new THREE.Vector3();
				newpos.addVectors(pgeo.boundingSphere.center, normal.setLength(h));
				
				new TWEEN.Tween(camera.position)
					.to(newpos, 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.start();
				new TWEEN.Tween(controls.center)
					.to(pgeo.boundingSphere.center, 500)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.start()
					.onComplete(function() {
						camera.toOrthographic(controls.center);
						webglInterface.viewportSettings.cameraSel = 'Custom';
						scope.$apply();
					});
				console.log('orthoview');
			};
			
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
			
			// Focus selected objects
			webglInterface.callFunc.focusSelected = function() {
				if(selected.length === 0) return;
				var cc = [];
				function collectChildren(children) {
					for(var i=0; i<children.length; i++) {
						collectChildren(children[i].children);
						if(children[i].userData.type === 'object')
							cc.push(children[i]);
					}
				}
				collectChildren(selected);
				focusObjects(cc);
			};
			
			// Focus all objects
			webglInterface.callFunc.focusAll = function() {
				var cc = [];
				for(var key in objects) {
					if(objects[key].mesh.userData.type === 'object') 
						cc.push(objects[key].mesh);
				}
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
				
				//var mesh = new THREE.Mesh(geo, materials['defaultMat']);
				//scene.add(new THREE.BoxHelper(mesh, 0x00ff00));
				
				computeFocusFromSphere(geo.boundingSphere.center, geo.boundingSphere.radius);
			}
			
			// place camera in appropriate distance to selected object
			// so the object will fit nicely within the viewport
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
					new TWEEN.Tween(camera.position).to(newpos, 500).easing(TWEEN.Easing.Quadratic.InOut).start();
					new TWEEN.Tween(controls.center).to(M, 500).easing(TWEEN.Easing.Quadratic.InOut).start();
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
		}
		
		return {
			restrict: 'AE',
			//replace: true,
			scope: {
				objModels: '=',
				planModels: '=',
				marksModels: '=',
				selectedModels: '=',
				highlightedModels: '=',
				unsafeSettings: '=',
				viewportSettings: '=',
				callFunc: '=',
				gizmoCoords: '=',
				navigation: '='
			},
			link: link
		};
	}]);

webglDirectives.directive('horizontalScroll',
	function() {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				function mousewheelHorizontalScroll(event) {
					var delta = event.originalEvent.wheelDelta || -event.originalEvent.detail*40 || 0;
					var sl = element.scrollLeft();
					element.scrollLeft(sl -= delta);
				}
				element.bind('mousewheel', mousewheelHorizontalScroll);
				element.bind('DOMMouseScroll', mousewheelHorizontalScroll); // firefox
			}
		};
	});

webglDirectives.directive('alert', ['$timeout',
	function($timeout) {
		return {
			restrict: 'A',
			scope: {
				alert: '='
			},
			template: '<span class="glyphicon glyphicon-exclamation-sign"></span> {{alert.message}}',
			link: function(scope, element, attr) {
				element.hide().fadeIn(300);
				$timeout(function() {
					element.fadeOut({duration: 1000, done: function() {
						scope.$parent.alert.showing = false;
						scope.$apply();
					}});
				}, 5000);
			}
		};
	}]);
	

webglDirectives.directive('dragMarker', ['$compile', '$timeout',
	function($compile, $timeout) {
		return {
			restrict: 'A',
			scope: {
				dragData: '=',
				dragEnabled: '=',
				dragComplete: '=',
				dragAbort: '=',
				dragLeaveParent: '='
			},
			link: function(scope, element, attr) {
				
				var isEnabled = (typeof scope.dragEnabled === 'undefined') ? true : scope.dragEnabled;
				var isDragging = false;
				var oldPosition = null;
				
				function mousedown(event) {
					event.preventDefault();
					if(isEnabled && event.button === 0) {
						isDragging = true;
						element.parent().toggleClass('cursor_pointer', true);
						oldPosition = element.position();
					}
				}
				
				function mousemove(event) {
					
					if(!isDragging) return;
					
					var movementX = event.originalEvent.movementX || event.originalEvent.mozMovementX || event.originalEvent.webkitMovementX || 0;
					var movementY = event.originalEvent.movementY || event.originalEvent.mozMovementY || event.originalEvent.webkitMovementY || 0;
					var offset = element.position();
					element.css('left', offset.left+movementX);
					element.css('top', offset.top+movementY);
				}
				
				function mouseup(event) {
					if(isDragging) {
						event.preventDefault();
						element.parent().toggleClass('cursor_pointer', false);
						var newPosition = element.position();
						if(oldPosition.left == newPosition.left && oldPosition.top == newPosition.top) {
							if(scope.dragAbort) scope.dragAbort(scope.dragData);
						}
						else {
							if(scope.dragComplete) scope.dragComplete(element.position(), scope.dragData);
						}
						isDragging = false;
					}
				}
				
				function mouseleave(event) {
					if(isDragging) {
						element.parent().toggleClass('cursor_pointer', false);
						if(scope.dragLeaveParent) scope.dragLeaveParent(scope.dragData);
						isDragging = false;
					}
				}
				
				element.bind('mousedown', mousedown);
				element.parent().bind('mousemove', mousemove);
				element.bind('mouseup', mouseup);
				element.parent().bind('mouseleave', mouseleave);
			
			}	
		};
	}]);
                                                                                                                                                                                                                                                                             
// zum Anpassen des Layouts
webglDirectives.directive('resizer',
	function($document) {
		return {
			scope: {
				resizerEnd: '=',
				resizerAnim: '='
			},
			link: function(scope, element, attrs) {
				
				var offset = 0;
				var space = 0;
				var endPosition = 0;
				
				element.on('mousedown', function(event) {
					event.preventDefault();
					
					if(!(attrs.resizer == 'vertical' || attrs.resizer == 'horizontal')) return;
					
					$document.bind('mousemove', rMousemove);
					$document.bind('mouseup', rMouseup);
					
					if(attrs.resizer == 'vertical') {
						offset = event.pageX - event.offsetX - event.delegateTarget.offsetLeft;
						space = element.parent()[0].offsetWidth;
					}
					else {
						offset = event.pageY - event.offsetY - event.delegateTarget.offsetTop;
						space = element.parent()[0].offsetHeight;
					}
					console.log(event);
				});
				
				function rMousemove(event) {
					if(attrs.resizer == 'vertical') {
						// handle vertical resizer
						var x = event.pageX - offset;
						
						if(attrs.resizerLeftMin && x < attrs.resizerLeftMin) {
							x = parseInt(attrs.resizerLeftMin);
						}
						if(attrs.resizerRightMin && x > space - attrs.resizerRightMin) {
							x = space - parseInt(attrs.resizerRightMin);
						}
						
						element.css({
							left: x + 'px'
						});
						$(attrs.resizerLeft).css({
							width: x + 'px'
						});
						$(attrs.resizerRight).css({
							left: (x + element.width()) + 'px'
						});
						endPosition = x;
					}
					else {
						// handle horizontal resizer
						var y = space - event.pageY - offset;
						
						if(attrs.resizerTopMin && y > space - attrs.resizerTopMin) {
							y = space - parseInt(attrs.resizerTopMin);
						}
						if(attrs.resizerBottomMin && y < attrs.resizerBottomMin) {
							y = parseInt(attrs.resizerBottomMin);
						}
						
						element.css({
							bottom: y + 'px'
						});
						$(attrs.resizerTop).css({
							bottom: (y + element.height()) + 'px'
						});
						$(attrs.resizerBottom).css({
							height: y + 'px'
						});
						endPosition = y;
					}
				}
				
				function rMouseup() {
					$document.unbind('mousemove', rMousemove);
					$document.unbind('mouseup', rMouseup);
					if(scope.resizerEnd) scope.resizerEnd();
					scope.resizerAnim = endPosition;
					scope.$apply();
				}
				
				scope.$watch('resizerAnim', function(newValue, oldValue) {
					console.log(newValue, oldValue);
					
					if(attrs.resizer == 'vertical') {
						space = element.parent()[0].offsetWidth;
						var x = newValue;
						
						if(attrs.resizerLeftMin && x < attrs.resizerLeftMin) {
							x = parseInt(attrs.resizerLeftMin);
						}
						if(attrs.resizerRightMin && x > space - attrs.resizerRightMin) {
							x = space - parseInt(attrs.resizerRightMin);
						}
						
						element.animate({
							left: x + 'px'
						}, 500);
						$(attrs.resizerLeft).animate({
							width: x + 'px'
						}, 500);
						$(attrs.resizerRight).animate({
							left: (x + element.width()) + 'px'
						}, 500);
					}
					else {
						space = element.parent()[0].offsetHeight;
						var y = newValue;
						
						if(attrs.resizerTopMin && y > space - attrs.resizerTopMin) {
							y = space - parseInt(attrs.resizerTopMin);
						}
						if(attrs.resizerBottomMin && y < attrs.resizerBottomMin) {
							y = parseInt(attrs.resizerBottomMin);
						}
						
						element.animate({
							bottom: y + 'px'
						}, 500);
						$(attrs.resizerTop).animate({
							bottom: (y + element.height()) + 'px'
						}, 500);
						$(attrs.resizerBottom).animate({
							height: y + 'px'
						}, 500);
					}
				});
			}
		};
	});
	
webglDirectives.directive('rampSlider',
	function($document) {
		return {
			scope: {
				rsModel: '=',
				rsOnchange: '='
			},
			template: '<div ng-style="{width: rsModel*100+\'%\'}""></div>',
			link: function(scope, element, attrs) {
				
				var colorStart = attrs.rsColor || '#aaa';
				var colorEnd = attrs.rsColorTwo || colorStart;
				
				var ramp = element.find('div');
				ramp.css('height', (element.css('height').replace(/[^-\d\.]/g, '') - element.css('border-top-width').replace(/[^-\d\.]/g, '') - element.css('border-bottom-width').replace(/[^-\d\.]/g, '')) + 'px');
				ramp.css('background', 'linear-gradient(to right, '+colorStart+', '+colorEnd+')');
				
				element.on('mousedown', function(event) {
					event.preventDefault();
					$document.bind('mousemove', jQuery.throttle(100, rampSliderMousemove) );
					$document.bind('mouseup', rampSliderMouseup);
				});
				
				function rampSliderMousemove(event) {
					scope.rsModel = parseFloat(((event.pageX - element.offset().left) / element[0].offsetWidth ).toFixed(2));
					if(scope.rsModel > 0.9) scope.rsModel = 1.0;
					else if(scope.rsModel < 0.1) scope.rsModel = 0.0;
					
					scope.rsOnchange(scope.rsModel);
					scope.$applyAsync();
				}
				
				function rampSliderMouseup() {
					$document.unbind('mousemove', rampSliderMousemove);
					$document.unbind('mouseup', rampSliderMouseup);
				}
			}
		};
	});