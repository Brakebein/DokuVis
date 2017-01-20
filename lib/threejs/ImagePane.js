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

		var paneGeometry = new THREE.PlaneGeometry(scope.width, scope.height);
		var paneMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, side: THREE.DoubleSide });

		var pane = new THREE.Mesh(paneGeometry, paneMaterial);
		pane.translateZ(-distance);

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

		scope.add( pane );
		scope.add( line );
		scope.setScale(scale);

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
