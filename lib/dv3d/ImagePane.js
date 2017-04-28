/**
 * Class for visualizing spatialized images. It consists of a plane with the image as texture, and lines arranged as a pyramid representing the camera orientation and fov.<br/>
 * Extends [THREE.Object3D]{@link https://threejs.org/docs/index.html#Reference/Core/Object3D}.
 * @param imageUrl {string} Path to the image
 * @param [params] {Object} Camera parameters like resolution, fov, or image center
 * @param [scale] {number} Initial scale
 * @extends THREE.Object3D
 * @constructor
 */
DV3D.ImagePane = function ( imageUrl, params, scale ) {

	THREE.Object3D.call( this );

	var scope = this;

	scope.onComplete = undefined;

	var loader = new THREE.TextureLoader();

	loader.load(imageUrl, function ( texture ) {

		// if(texture.image.width < texture.image.height)
		// 	scope.width = scope.height * texture.image.width / texture.image.height;
		// else
		// 	scope.height = scope.width * texture.image.height / texture.image.width;

		scope.width = texture.image.width / texture.image.height;
		scope.height = 1.0;

		scope.fov = 2 * Math.atan(scope.height / (2 * params.ck)) * THREE.Math.RAD2DEG;
		
		// var offsetX = -scope.width * (params.width / 2 - params.offset[0]) / params.width;
		// var offsetY = scope.height * (params.height / 2 - params.offset[1]) / params.height;
		var offsetX = -params.offset[0];
		var offsetY = -params.offset[1];
		console.log(offsetX, offsetY);

		// var distance = scope.height / (2 * Math.tan( scope.fov / 2 * Math.PI / 180 ));
		var distance = params.ck;

		// plane with texture
		var paneGeometry = new THREE.PlaneBufferGeometry(scope.width, scope.height);
		var paneMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, side: THREE.DoubleSide });

		var pane = new THREE.Mesh(paneGeometry, paneMaterial);
		//pane.scale.set(-1,-1,-1);
		pane.translateZ(-distance);
		pane.translateX(offsetX);
		pane.translateY(offsetY);

		// pyramid representing camera
		var vertices = {
			origin: new THREE.Vector3(0,0,0),
			topleft: new THREE.Vector3(-scope.width/2 + offsetX, scope.height/2 + offsetY, -distance),
			topright: new THREE.Vector3(scope.width/2 + offsetX, scope.height/2 + offsetY, -distance),
			bottomleft: new THREE.Vector3(-scope.width/2 + offsetX, -scope.height/2 + offsetY, -distance),
			bottomright: new THREE.Vector3(scope.width/2 + offsetX, -scope.height/2 + offsetY, -distance)
		};
		scope.vertices = vertices;

		var lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(
			vertices.origin, vertices.topleft,
			vertices.origin, vertices.topright,
			vertices.origin, vertices.bottomleft,
			vertices.origin, vertices.bottomright,
			vertices.topleft, vertices.bottomleft,
			vertices.bottomleft, vertices.bottomright,
			vertices.bottomright, vertices.topright,
			vertices.topright, vertices.topleft
		);
		var lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });

		var line = new THREE.LineSegments( lineGeometry, lineMaterial );

		// invisible click dummy
		var boxGeometry = new THREE.BoxGeometry(scope.width, scope.height, distance);
		var boxMaterial = new THREE.MeshBasicMaterial({ visible: false });

		var clickBox = new THREE.Mesh(boxGeometry, boxMaterial);
		clickBox.translateZ( - distance / 2 );

		scope.add( pane );
		scope.add( line );
		scope.add( clickBox );
		scope.setScale(scale);
		
		scope.collisionObject = clickBox;
		scope.pyramid = line;
		scope.image = pane;

		if(scope.onComplete) scope.onComplete();
		
	}, null, function ( xhr ) {
		console.error('Couldn\'t load texture!', xhr);
	});
	
};

DV3D.ImagePane.prototype = Object.create( THREE.Object3D.prototype );
/**
 * Applies the selection color to the material of the pyramid.
 */
DV3D.ImagePane.prototype.select = function () {
	this.pyramid.material.color.setHex(THREE.DokuVisTray.defaults.selectionColor);	
};
/**
 * Applies the default color to the material of the pyramid.
 */
DV3D.ImagePane.prototype.deselect = function () {
	this.pyramid.material.color.setHex(0x0000ff);	
};
/**
 * Sets the scale of the object.
 * @param value {number} New scale value
 */
DV3D.ImagePane.prototype.setScale = function (value) {
	this.scale.set(value, value, value);
};
/**
 * Sets the opacity of the object.
 * @param value {number} New opacity value
 */
DV3D.ImagePane.prototype.setOpacity = function (value) {
	for(var i=0; i<this.children.length; i++) {
		var mat = this.children[i].material;
		if(value < 1) {
			mat.transparent = true;
			mat.opacity = value;
		}
		else {
			mat.transparent = false;
			mat.opacity = 1;
		}
	}
};
/**
 * Disposes geometries, materials, and textures.
 */
DV3D.ImagePane.prototype.dispose = function () {
	this.collisionObject.material.dispose();
	this.collisionObject.geometry.dispose();
	this.pyramid.material.dispose();
	this.pyramid.geometry.dispose();
	this.image.material.map.dispose();
	this.image.material.dispose();
	this.image.geometry.dispose();
};
