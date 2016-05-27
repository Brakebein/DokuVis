/**
 * @author Jonas Bruschke
 */

/**
 * transformation gizmo for translation
 * @param {number} length - length of arrow
 * @param {number} headLength - length of arrow head
 * @param {number} radius - radius of arrow head
 * @constructor
 */
THREE.GizmoMove = function ( length, headLength, radius ) {
	
	THREE.Object3D.call( this );

	this.xArrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), length, 0xff0000, headLength, radius);
	this.yArrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), length, 0x00ff00, headLength, radius);
	this.zArrow = new THREE.ArrowHelper(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0), length, 0x0000ff, headLength, radius);
	
	function setMaterials(obj) {
		obj.children[0].material.depthTest = false;
		obj.children[0].material.depthWrite = false;
		obj.children[0].renderOrder = 100;
		obj.children[1].material.depthTest = false;
		obj.children[1].material.depthWrite = false;
		obj.children[1].renderOrder = 100;
	}
	//console.log(this.xArrow);
	setMaterials(this.xArrow);
	setMaterials(this.yArrow);
	setMaterials(this.zArrow);
	
	var invMat = new THREE.MeshBasicMaterial({ visible: false, depthTest: false, depthWrite: false });
	//var invMat = new THREE.MeshBasicMaterial({color: 0x00ffff});
	
	var xCollider = new THREE.Mesh(new THREE.CylinderGeometry(radius/2, radius/2, length, 5, 1, 1), invMat);
	xCollider.translateX(length/2).rotateOnAxis(new THREE.Vector3(0,0,1), 0.5 * Math.PI);
	xCollider.name = 'x';
	var yCollider = new THREE.Mesh(new THREE.CylinderGeometry(radius/2, radius/2, length, 5, 1, 1), invMat);
	yCollider.translateY(length/2);
	yCollider.name = 'y';
	var zCollider = new THREE.Mesh(new THREE.CylinderGeometry(radius/2, radius/2, length, 5, 1, 1), invMat);
	zCollider.translateZ(length/2).rotateOnAxis(new THREE.Vector3(1,0,0), 0.5 * Math.PI);
	zCollider.name = 'z';
	
	var center = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color:0x00ffff, depthTest: false, depthWrite: false }));
	center.renderOrder = 100;
	
	this.add(this.xArrow);
	this.add(this.yArrow);
	this.add(this.zArrow);
	this.add(xCollider);
	this.add(yCollider);
	this.add(zCollider);
	this.add(center);
	
	this.testObjects = [ xCollider, yCollider, zCollider ];
	
	this.currentAxis = '';
	this.object = null;
	this.refs = [];
};

THREE.GizmoMove.prototype = Object.create( THREE.Object3D.prototype );

THREE.GizmoMove.prototype.attachToObject = function ( object, refs ) {
	
	if(this.object)
		this.object.remove( this );
		
	this.object = object;
	
	if(this.object)
		this.object.add( this );
	
	if(refs)
		this.refs = refs;
	else
		this.refs = [];
};

/**
 * checks, if mouse hovers over gizmo
 * @param {number} mx - mouse X coordinate
 * @param {number} my - mouse Y coordinate
 * @param {THREE.Camera} camera
 * @returns {boolean}
 */
THREE.GizmoMove.prototype.checkMouseHit = function ( mx, my, camera ) {

	var lastAxis = this.currentAxis;

	if(!(this.currentAxis == '')) {
		switch(this.currentAxis) {
			case 'x': this.xArrow.setColor(0xff0000); break;
			case 'y': this.yArrow.setColor(0x00ff00); break;
			case 'z': this.zArrow.setColor(0x0000ff); break;
		}
		this.currentAxis = '';
	}
	
	var vector = new THREE.Vector3(mx, my, 0.5).unproject(camera);
	
	var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	
	var intersects = raycaster.intersectObjects(this.testObjects, false);
	
	if(intersects.length > 0 ) {
		switch(intersects[0].object.name) {
			case 'x': this.xArrow.setColor(0xffdd00); break;
			case 'y': this.yArrow.setColor(0xffdd00); break;
			case 'z': this.zArrow.setColor(0xffdd00); break;
		}
		this.currentAxis = intersects[0].object.name;
		
		if(lastAxis !== this.currentAxis) this.dispatchEvent({ type: 'change' });
		return true;
	}
	else {
		if(lastAxis !== '') this.dispatchEvent({ type: 'change' });
		return false;
	}
};

/**
 * transform object along axis
 * @param {THREE.Vector3} mv - mouse movement vector
 * @param {THREE.Camera} camera
 */
THREE.GizmoMove.prototype.transformObject = function ( mv, camera ) {
	
	var axis;
	switch(this.currentAxis) {
		case 'x': axis = new THREE.Vector3(1,0,0); break;
		case 'y': axis = new THREE.Vector3(0,1,0); break;
		case 'z': axis = new THREE.Vector3(0,0,1); break;
	}
	
	//var v0 = new THREE.Projector().projectVector( new THREE.Vector3(0,0,0).applyMatrix4( this.object.matrixWorld ), camera );
	var v0 = new THREE.Vector3(0,0,0).applyMatrix4( this.object.matrixWorld ).project( camera );
	//var v1 = new THREE.Projector().projectVector(axis.clone().applyMatrix4(this.object.matrixWorld), camera);
	var v1 = axis.clone().applyMatrix4( this.object.matrixWorld ).project( camera );
	v1.sub(v0);
	mv.projectOnVector(v1);
	
	var distFactor = this.object.position.distanceTo(camera.position) / 100;
	
	if((mv.x > 0 && v1.x > 0) 
	|| (mv.y > 0 && v1.y > 0) 
	|| (mv.x < 0 && v1.x < 0) 
	|| (mv.y < 0 && v1.y < 0)) {
		this.object.translateOnAxis(axis, mv.length() * distFactor);
		for(var i=0; i<this.refs.length; i++)
			this.refs[i].translateOnAxis(axis, mv.length() * distFactor);
	}
	else {
		this.object.translateOnAxis(axis, - mv.length() * distFactor);
		for(i=0; i<this.refs.length; i++)
			this.refs[i].translateOnAxis(axis, - mv.length() * distFactor);
	}

	this.dispatchEvent({ type: 'change' });
};

/**
 * transformation gizmo for rotation
 * @param {number} radius - radius of gizmo
 * @constructor
 */
THREE.GizmoRotate = function ( radius ) {
	
	THREE.Object3D.call( this );
	
	var xgeo = new THREE.CircleGeometry(radius, 64);
	xgeo.vertices.shift();
	
	this.xCircle = new THREE.Line(xgeo, new THREE.LineBasicMaterial({color: 0xff0000}));
	this.xCircle.rotateOnAxis(new THREE.Vector3(0,1,0), 0.5 * Math.PI);
	this.yCircle = new THREE.Line(xgeo, new THREE.LineBasicMaterial({color: 0x00ff00}));
	this.yCircle.rotateOnAxis(new THREE.Vector3(1,0,0), 0.5 * Math.PI);
	this.zCircle = new THREE.Line(xgeo, new THREE.LineBasicMaterial({color: 0x0000ff}));
	
	var center = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({color:0x00ffff}));
	
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
	this.add(center);
	this.add(xCollider);
	this.add(yCollider);
	this.add(zCollider);
	
	this.testObjects = [ xCollider, yCollider, zCollider ];
	
	this.currentAxis = '';
	this.lastVector = new THREE.Vector3(1,1,1);
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

	var lastAxis = this.currentAxis;
	
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
		this.lastVector = null;

		if(lastAxis !== this.currentAxis) this.dispatchEvent({ type: 'change' });
		return true;
	}
	else {
		if(lastAxis !== '') this.dispatchEvent({ type: 'change' });
		return false;
	}
};

THREE.GizmoRotate.prototype.transformObject = function ( mv, camera ) {
	
	var axis;
	switch(this.currentAxis) {
		case 'x': axis = new THREE.Vector3(1,0,0); break;
		case 'y': axis = new THREE.Vector3(0,1,0); break;
		case 'z': axis = new THREE.Vector3(0,0,1); break;
	}
	
	var ori = new THREE.Projector().unprojectVector(new THREE.Vector3(mv.x, mv.y, -1.0).normalize(), camera);
	var end = new THREE.Projector().unprojectVector(new THREE.Vector3(mv.x, mv.y, 1.0).normalize(), camera);
	var u = new THREE.Vector3().subVectors(end, ori).normalize();
	
	var axisWorld = axis.clone().transformDirection(this.object.matrixWorld);
	
	var s = axisWorld.dot(new THREE.Vector3().subVectors(this.object.position, camera.position)) / axisWorld.dot(u);
	var ps = new THREE.Vector3().addVectors(camera.position, u.multiplyScalar(s));
	
	var currentVector = ps.sub(this.object.position).normalize();
	
	if(this.lastVector) {
		var cross = new THREE.Vector3().crossVectors(this.lastVector, currentVector);
		
		var angle = 0;
		if(axisWorld.dot(cross) > 0)
			angle = Math.atan2(cross.length(), currentVector.dot(this.lastVector));
		else
			angle = Math.atan2(-cross.length(), currentVector.dot(this.lastVector));
		
		this.object.rotateOnAxis(axis, angle);
	}
	this.lastVector = currentVector;

	this.dispatchEvent({ type: 'change' });
};

/**
 * measuring tool
 * @param {number} length - length of cross axes
 * @constructor
 */
THREE.Measure = function ( length ) {
	
	THREE.Object3D.call( this );
	
	var lineMat = new THREE.LineBasicMaterial({color: 0x00ff00, depthTest: false, depthWrite: false});
	var dashMat = new THREE.LineDashedMaterial({color: 0x00ff00, dashSize: 3, gapSize: 1.5, scale: 3.0, depthTest: false, depthWrite: false});
	
	var geo = new THREE.Geometry();
	geo.vertices.push(new THREE.Vector3(-length/2, 0, 0), new THREE.Vector3(length/2, 0, 0));
	
	var line = new THREE.Line(geo, lineMat);
	var cross = new THREE.Object3D();
	cross.add(line);
	cross.add(line.clone().rotateOnAxis(new THREE.Vector3(0,0,1), 0.5 * Math.PI));
	cross.add(line.clone().rotateOnAxis(new THREE.Vector3(0,1,0), 0.5 * Math.PI));
	
	this.crossOrigin = cross.clone();
	this.crossTarget = cross.clone();
	
	//var buffergeo = new THREE.BufferGeometry();
	//buffergeo.addAttribute('position', new THREE.Float32Attribute(2,3));
	
	this.distLine = new THREE.Line(geo.clone(), dashMat);
	
	this.states = {
		SETORIGIN: 0,
		SETTARGET: 1,
		SHOWRESULT: 2
	};
	this.currentState = 0;

	this.onComplete = undefined;
	
	this.add(this.crossOrigin);
};

THREE.Measure.prototype = Object.create( THREE.Object3D.prototype );

THREE.Measure.prototype.setTarget = function ( mx, my, camera, testObjects ) {
	
	if(this.currentState === this.states.SHOWRESULT) {
		this.remove(this.distLine);
		this.remove(this.crossTarget);
		this.currentState = this.states.SETORIGIN;
		return;
	}
	
	var np = this.obtainNearestPoint(mx, my, camera, testObjects);
	
	if(this.currentState === this.states.SETORIGIN && np) {
		this.crossOrigin.position.copy(np);
		this.distLine.geometry.vertices[0] = np;
		this.distLine.geometry.verticesNeedUpdate = true;
		this.add(this.distLine);
		this.add(this.crossTarget);
		this.currentState = this.states.SETTARGET;
	}
	else if(this.currentState === this.states.SETTARGET && np) {
		this.crossTarget.position.copy(np);
		this.distLine.geometry.vertices[1] = np;
		this.distLine.geometry.computeBoundingSphere();
		this.distLine.geometry.computeLineDistances();
		this.distLine.geometry.lineDistancesNeedUpdate = true;
		this.distLine.geometry.verticesNeedUpdate = true;
		this.currentState = this.states.SHOWRESULT;
		
		var finalDistance = this.crossTarget.position.distanceTo(this.crossOrigin.position);
		console.log('distance:', finalDistance);
		if(this.onComplete) this.onComplete(finalDistance);
	}
	
	this.dispatchEvent({ type: 'change' });
};

THREE.Measure.prototype.checkMouseHit = function ( mx, my, camera, testObjects ) {
	
	if(this.currentState === this.states.SHOWRESULT) return;
	
	var np = this.obtainNearestPoint(mx, my, camera, testObjects);

	if(this.currentState === this.states.SETORIGIN && np) {
		//this.crossOrigin.position = np;
		this.crossOrigin.position.copy(np);
	}
	else if(this.currentState === this.states.SETTARGET && np) {
		this.crossTarget.position.copy(np);
		this.distLine.geometry.vertices[1] = np;
		this.distLine.geometry.computeLineDistances();
		this.distLine.geometry.lineDistancesNeedUpdate = true;
		this.distLine.geometry.verticesNeedUpdate = true;
	}

	this.dispatchEvent({ type: 'change' });
};

THREE.Measure.prototype.obtainNearestPoint = function ( mx, my, camera, testObjects ) {
	
	var vector = new THREE.Vector3(mx, my, 0.5).unproject(camera);
	
	var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	
	var intersects = raycaster.intersectObjects(testObjects, false);
	
	if(intersects.length > 0) {
		var geoPos = intersects[0].object.geometry.attributes.position.array;
		var matrix = intersects[0].object.matrixWorld;
		var index = intersects[0].face.a * 3;
		var vA = new THREE.Vector3(geoPos[index], geoPos[index+1], geoPos[index+2]).applyMatrix4(matrix);
		index = intersects[0].face.b * 3;
		var vB = new THREE.Vector3(geoPos[index], geoPos[index+1], geoPos[index+2]).applyMatrix4(matrix);
		index = intersects[0].face.c * 3;
		var vC = new THREE.Vector3(geoPos[index], geoPos[index+1], geoPos[index+2]).applyMatrix4(matrix);

		var s = intersects[0].point;
		var nearest = vA; //intersects[0].object.geometry.vertices[intersects[0].face.a];
		var d = s.distanceTo(nearest);
		var dtest = s.distanceTo(vB); //intersects[0].object.geometry.vertices[intersects[0].face.b]);
		if(dtest < d) {
			nearest = vB; //intersects[0].object.geometry.vertices[intersects[0].face.b];
			d = dtest;
		}
		dtest = s.distanceTo(vC); //intersects[0].object.geometry.vertices[intersects[0].face.c]);
		if(dtest < d) {
			nearest = vC; //intersects[0].object.geometry.vertices[intersects[0].face.c];
			//d = dtest;
		}
		
		return nearest; //.clone();
	}
	else
		return null;
};

THREE.Measure.prototype.dispose = function () {
	this.crossOrigin.children[0].geometry.dispose();
	this.crossOrigin.children[0].material.dispose();
	this.distLine.geometry.dispose();
	this.distLine.material.dispose();
};

THREE.Pin = function ( length, radius ) {

	THREE.Object3D.call( this );
	
	var cgeo = new THREE.CylinderGeometry(0, radius, length, 16);
	var cmat = new THREE.MeshLambertMaterial({ color: 0x00ff00, depthTest: false, depthWrite: false });
	
	this.object = new THREE.Mesh(cgeo, cmat);
	this.object.renderOrder = 100;
	this.object.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
	this.object.translateY( - length / 2 );

	this.add(this.object);
};
THREE.Pin.prototype = Object.create( THREE.Object3D.prototype );
THREE.Pin.prototype.mousehit = function ( mx, my, camera, testObjects ) {
	
	var vector = new THREE.Vector3(mx, my, 0.5).unproject(camera);
	
	var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
	
	var intersects = raycaster.intersectObjects(testObjects, false);
	
	if(intersects.length > 0) {
		var s = intersects[0].point;
		this.position.copy(s);
		
		var normalMatrix = new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld);
		var normal = new THREE.Vector3().copy(intersects[0].face.normal).applyMatrix3(normalMatrix).normalize();
		var focalPoint = new THREE.Vector3().subVectors(s, normal);
		this.lookAt(focalPoint);

		this.dispatchEvent({ type: 'change' });
		return intersects[0].object;
	}
	else {
		this.position.set(0,0,0);

		this.dispatchEvent({ type: 'change' });
		return null;
	}
};
THREE.Pin.prototype.dispose = function () {
	this.object.geometry.dispose();
	this.object.material.dispose();
};
