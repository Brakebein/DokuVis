THREE.ImagePane = function ( imageUrl, fov, scale ) {

	THREE.Object3D.call( this );

	var scope = this;

	scope.width = 1;
	scope.height = 1;
	scope.fov = fov || 35;


	var loader = new THREE.TextureLoader();

	loader.load(imageUrl, function ( texture ) {

		if(texture.image.width < texture.image.height)
			scope.width = scope.height * texture.image.width / texture.image.height;
		else
			scope.height = scope.width * texture.image.height / texture.image.width;

		var distance = scope.height / (2 * Math.tan( scope.fov / 2 * Math.PI / 180 ));

		// plane with texture
		var paneGeometry = new THREE.PlaneBufferGeometry(scope.width, scope.height);
		var paneMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, side: THREE.DoubleSide });

		var pane = new THREE.Mesh(paneGeometry, paneMaterial);
		pane.translateZ(-distance);

		// pyramid representing camera
		var vertices = {
			origin: new THREE.Vector3(0,0,0),
			topleft: new THREE.Vector3(-scope.width/2, scope.height/2, -distance),
			topright: new THREE.Vector3(scope.width/2, scope.height/2, -distance),
			bottomleft: new THREE.Vector3(-scope.width/2, -scope.height/2, -distance),
			bottomright: new THREE.Vector3(scope.width/2, -scope.height/2, -distance)
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
	
	scope.onComplete = undefined;
	
};

THREE.ImagePane.prototype = Object.create( THREE.Object3D.prototype );

THREE.ImagePane.prototype.setScale = function (value) {
	this.scale.set(value, value, value);
};

THREE.ImagePane.prototype.select = function () {
	this.pyramid.material.color.setHex(THREE.DokuVisTray.selectionColor);	
};
THREE.ImagePane.prototype.deselect = function () {
	this.pyramid.material.color.setHex(0x0000ff);	
};
THREE.ImagePane.prototype.setOpacity = function (value) {
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
THREE.ImagePane.prototype.dispose = function () {
	this.collisionObject.material.dispose();
	this.collisionObject.geometry.dispose();
	this.pyramid.material.dispose();
	this.pyramid.geometry.dispose();
	this.image.material.map.dispose();
	this.image.material.dispose();
	this.image.geometry.dispose();
};
