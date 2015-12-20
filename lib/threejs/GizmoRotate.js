THREE.GizmoRotate = function ( radius ) {
	
	THREE.Object3D.call( this );
	
	var xgeo = new THREE.CircleGeometry(radius, 64);
	xgeo.vertices.shift();
	
	this.xCircle = new THREE.Line(xgeo, new THREE.LineBasicMaterial({color: 0xff0000}));
	this.xCircle.rotateOnAxis(new THREE.Vector3(0,1,0), 0.5 * Math.PI);
	this.yCircle = new THREE.Line(xgeo, new THREE.LineBasicMaterial({color: 0x00ff00}));
	this.yCircle.rotateOnAxis(new THREE.Vector3(1,0,0), 0.5 * Math.PI);
	this.zCircle = new THREE.Line(xgeo, new THREE.LineBasicMaterial({color: 0x0000ff}));
	
	var sphere = new THREE.Mesh(new THREE.SphereGeometry(9.5, 32, 16), new THREE.MeshBasicMaterial({color:0x333333, transparent:true, opacity:0.4}));
	sphere.name = 'sphere';
	
	var invMat = new THREE.MeshBasicMaterial({visible: false});
	//var invMat = new THREE.MeshBasicMaterial({color: 0x00ffff});
	
	var xCollider = new THREE.Mesh(new THREE.TorusGeometry(radius, 1, 5, 16), invMat);
	xCollider.rotateOnAxis(new THREE.Vector3(0,1,0), 0.5 * Math.PI);
	xCollider.name = 'x';
	var yCollider = new THREE.Mesh(new THREE.TorusGeometry(radius, 1, 5, 16), invMat);
	yCollider.rotateOnAxis(new THREE.Vector3(1,0,0), 0.5 * Math.PI);
	yCollider.name = 'y';
	var zCollider = new THREE.Mesh(new THREE.TorusGeometry(radius, 1, 5, 16), invMat);
	zCollider.name = 'z';
	
	this.add(this.xCircle);
	this.add(this.yCircle);
	this.add(this.zCircle);
	this.add(sphere);
	this.add(xCollider);
	this.add(yCollider);
	this.add(zCollider);
	
	this.testObjects = [ xCollider, yCollider, zCollider, sphere ];
	
	this.currentAxis = '';
	this.object = null;
};

THREE.GizmoRotate.prototype = Object.create( THREE.Object3D.prototype );

THREE.GizmoRotate.prototype.attachToObject = function ( object ) {
	
	if(this.object)
		this.object.remove( this );
		
	this.object = object;
	
	if(this.object)
		this.object.add( this );
};

THREE.GizmoRotate.prototype.checkMouseHit = function ( mx, my, camera ) {

	if(!(this.currentAxis == '')) {
		switch(this.currentAxis) {
			case 'x': this.xCircle.material.color.setHex(0xff0000); break;
			case 'y': this.yCircle.material.color.setHex(0x00ff00); break;
			case 'z': this.zCircle.material.color.setHex(0x0000ff); break;
		}
		this.currentAxis = '';
	}

	var vector = new THREE.Vector3(mx, my, 0.5);
	
	var raycaster = new THREE.Projector().pickingRay(vector, camera);
	
	var intersects = raycaster.intersectObjects(this.testObjects, false);
	
	if(intersects.length > 0 ) {
		switch(intersects[0].object.name) {
			case 'x': this.xCircle.material.color.setHex(0xffdd00); break;
			case 'y': this.yCircle.material.color.setHex(0xffdd00); break;
			case 'z': this.zCircle.material.color.setHex(0xffdd00); break;
		}
		this.currentAxis = intersects[0].object.name;
		return true;
	}
	else {
		return false;
	}
};

THREE.GizmoRotate.prototype.translateObject = function ( mv, camera, factor ) {
	
	var v0 = new THREE.Projector().projectVector( new THREE.Vector3(0,0,0).applyMatrix4( this.object.matrixWorld ), camera );
	
	var axis;
	switch(this.currentAxis) {
		case 'x': axis = new THREE.Vector3(1,0,0); break;
		case 'y': axis = new THREE.Vector3(0,1,0); break;
		case 'z': axis = new THREE.Vector3(0,0,1); break;
	}
	
	var v1 = new THREE.Projector().projectVector(axis.clone().applyMatrix4(this.object.matrixWorld), camera);
	v1.sub(v0);
	mv.projectOnVector(v1);
	
	if((mv.x > 0 && v1.x > 0) 
	|| (mv.y > 0 && v1.y > 0) 
	|| (mv.x < 0 && v1.x < 0) 
	|| (mv.y < 0 && v1.y < 0))
		this.object.translateOnAxis(axis, mv.length() * factor);
	else
		this.object.translateOnAxis(axis, - mv.length() * factor);
};