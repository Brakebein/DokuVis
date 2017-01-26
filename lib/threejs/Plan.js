THREE.Plan = function ( fileUrl, imageUrl, ctmloader ) {
	
	THREE.Object3D.call( this );

	var scope = this;

	ctmloader = ctmloader || new THREE.CTMLoader();
	
	ctmloader.load(fileUrl, function (geo) {
		
		geo.computeBoundingBox();
		geo.computeBoundingSphere();

		// scale
		var scale = 0.001;
		geo.scale(scale, scale, scale);

		// translate to origin
		var t = geo.boundingSphere.center.clone();
		geo.translate(-t.x, -t.y, -t.z);

		var material;
		if(imageUrl) {
			var texture = new THREE.TextureLoader().load(imageUrl, function () {
				if(scope.onComplete) scope.onComplete();
			});
			texture.anisotropy = 8;
			material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
		}
		else
			material = THREE.DokuVisTray.materials['defaultDoublesideMat'];
		//material.name = info.content + '_Mat';

		var mesh = new THREE.Mesh(geo, material);
		var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24.0), THREE.DokuVisTray.materials['edgesMat'].clone());

		scope.add( mesh );
		scope.add( edges );

		scope.mesh = mesh;
		scope.edges = edges;

		// translate to original position
		scope.position.set(t.x, t.y, t.z);
		
		scope.updateMatrix();
		scope.userData.initMatrix = scope.matrix.clone();

	}, { useWorker: false });

	scope.onComplete = undefined;
	
};

THREE.Plan.prototype = Object.create( THREE.Object3D.prototype );

THREE.Plan.prototype.select = function () {
	this.edges.material.color.set(THREE.DokuVisTray.selectionColor);
};
THREE.Plan.prototype.deselect = function () {
	this.edges.material.color.set(THREE.DokuVisTray.defaultEdgeColor);
};
THREE.Plan.prototype.setOpacity = function (value) {
	if(value < 1) {
		this.mesh.material.transparent = true;
		this.mesh.material.opacity = value;
		this.edges.material.transparent = true;
		this.edges.material.opacity = value;
	}
	else {
		this.mesh.material.transparent = false;
		this.mesh.material.opacity = 1;
		this.edges.material.transparent = false;
		this.edges.material.opacity = 1;
	}
};
