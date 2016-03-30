angular.module('dokuvisApp').factory('webglContext',
	function() {
		
		var wc = {};
		
		// Konstante maximale Sichtweite
		var FAR = 1400;
		var backgroundColor = 0x666666;
		var selectionColor = 0xff4444;
		
		var initWidth = 800, initHeight = 600;
		
		
		wc.objects = {};
		wc.plans = {};
		
		// Camera
		wc.camera = new THREE.CombinedCamera(initWidth, initHeight, 35, 0.1, FAR, 0.1, FAR);
		wc.camera.position.set(-100, 60, 100);
		
		// Scene
		wc.scene = new THREE.Scene();
		wc.scene.add(wc.camera);
		wc.scene.fog = new THREE.Fog(backgroundColor, FAR-100, FAR);
		
		// Grid
		wc.scene.add(new THREE.GridHelper(100, 10));
		
		// Renderer
		wc.renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, preserveDrawingBuffer: true});
		wc.renderer.setClearColor(backgroundColor, 1);
		wc.renderer.setSize(initWidth, initHeight);
		
		// Stats
		wc.stats = new Stats();
		
		// Controls (für Navigation)
		wc.controls = new THREE.OrbitControls(wc.camera, wc.renderer.domElement);
		//wc.controls.center.set(86, 0, -74);
		wc.controls.zoomSpeed = 1.0;
		//wc.controls.userPanSpeed = 1;
		wc.camera.target = wc.controls.center;
		
		// Light
		var alight = new THREE.AmbientLight(0x888888);
		wc.scene.add(alight);
		wc.directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
		wc.directionalLight.position.set(-2,8,4);
		wc.scene.add(wc.directionalLight);
		
		// Axis helper
		wc.axisRenderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
		wc.axisCamera = new THREE.OrthographicCamera(-30, 30, 30, -30, 1, 100);
		wc.axisCamera.up = wc.camera.up;
		wc.axisScene = new THREE.Scene();
		wc.axisScene.add( new THREE.AxisHelper(30) );
		
		// Liste der Materials
		wc.materials = {};
		
		// default mat
		wc.materials['defaultMat'] = new THREE.MeshLambertMaterial({
			name: 'defaultMat',
			color: 0xdddddd });
		wc.materials['defaultDoublesideMat'] = new THREE.MeshLambertMaterial({
			name: 'defaultDoublesideMat',
			color: 0xdddddd,
			side: THREE.DoubleSide });
		wc.materials['defaultUnsafeMat'] = new THREE.MeshLambertMaterial({
			name: 'defaultUnsafeMat',
			color: 0xaaaaaa,
			transparent: true,
			opacity: 0.5,
			depthWrite: false });
			
		// default selection mat
		wc.materials['selectionMat'] = new THREE.MeshLambertMaterial({
			name: 'selectionMat',
			color: selectionColor,
			side: THREE.DoubleSide });
			
		// transparent mat
		wc.materials['transparentMat'] = new THREE.MeshLambertMaterial({
			name: 'transparentMat',
			color: 0xcccccc,
			transparent: true,
			opacity: 0.5,
			depthWrite: false });
		wc.materials['transparentSelectionMat'] = new THREE.MeshLambertMaterial({
			name: 'transparentSelectionMat',
			color: selectionColor,
			transparent: true,
			opacity: 0.5,
			depthWrite: false });
		
		// wireframe mat
		wc.materials['wireframeMat'] = new THREE.MeshBasicMaterial({
			name: 'wireframeMat',
			color: 0x333333,
			wireframe: true });
		wc.materials['wireframeSelectionMat'] = new THREE.MeshBasicMaterial({
			name: 'wireframeSelectionMat',
			color: selectionColor,
			wireframe: true });
			
		// highlight mat
		wc.materials['highlightMat'] = new THREE.MeshLambertMaterial({
			name: 'highlightMat',
			color: 0xffff44 });
		wc.materials['transparentHighlightMat'] = new THREE.MeshLambertMaterial({
			name: 'transparentHighlightMat',
			color: 0xffff44,
			transparent: true,
			opacity: 0.5 });
		
		// xray mat
		wc.materials['xrayMat'] = new THREE.ShaderMaterial({
			name: 'xrayMat',
			side: THREE.DoubleSide,
			transparent: true,
			depthWrite: false,
			depthTest: false,
			uniforms: {
				"ambient":{type:"f",value:0.05},
				"edgefalloff":{type:"f",value:0.1},
				"intensity":{type:"f",value:1.0},
				"vColor":{type:"c",value:new THREE.Color(0x000000)} },
			vertexShader: THREE.XRayShader.vertexShader,
			fragmentShader: THREE.XRayShader.fragmentShader });
		wc.materials['xraySelectionMat'] = new THREE.ShaderMaterial({
			name: 'xraySelectionMat',
			side: THREE.DoubleSide,
			transparent: true,
			depthWrite: false,
			depthTest: false,
			uniforms: {
				"ambient":{type:"f",value:0.05},
				"edgefalloff":{type:"f",value:0.3},
				"intensity":{type:"f",value:1.5},
				"vColor":{type:"c",value:new THREE.Color(selectionColor)} },
			vertexShader: THREE.XRayShader.vertexShader,
			fragmentShader: THREE.XRayShader.fragmentShader });
		
		// edges mat
		wc.materials['edgesMat'] = new THREE.LineBasicMaterial({
			name: 'edgesMat',
			color: 0x333333 });
		wc.materials['edgesSelectionMat'] = new THREE.LineBasicMaterial({
			name: 'edgesSelectionMat',
			color: selectionColor });
			
		// slice mat
		wc.materials['invisibleMat'] = new THREE.MeshLambertMaterial({color: 0xdddddd, visible: false, name: 'invisibleMat'});
		wc.materials['sliceMultiMat'] = [ wc.materials['defaultMat'], wc.materials['invisibleMat'], wc.materials['defaultMat'], wc.materials['invisibleMat'] ];
		wc.materials['sliceLineMat'] = new THREE.LineBasicMaterial({color: 0xff0000, name: 'sliceLineMat'});
		wc.materials['sliceMultiMat_debug'] = [new THREE.MeshLambertMaterial({color: 0xdd4444}),new THREE.MeshLambertMaterial({color: 0x44dd44}),new THREE.MeshLambertMaterial({color: 0x4444dd}),new THREE.MeshLambertMaterial({color: 0x44dddd})];
		
		return wc;
		
	});