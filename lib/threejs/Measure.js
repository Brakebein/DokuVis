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
