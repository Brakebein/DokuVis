/**
 * Class for a pin/needle/marker. Basically, it's just a cone with its top at origin.
 * @param length {number} length of the cone
 * @param radius {number} radius of the cone
 * @extends THREE.Object3D
 * @constructor
 */
DV3D.Pin = function ( length, radius ) {

	THREE.Object3D.call( this );

	var cgeo = new THREE.CylinderGeometry(0, radius, length, 16);
	var cmat = new THREE.MeshLambertMaterial({ color: 0x00ff00, depthTest: false, depthWrite: false });

	this.object = new THREE.Mesh(cgeo, cmat);
	this.object.renderOrder = 100;
	this.object.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
	this.object.translateY( - length / 2 );

	this.add(this.object);
};
DV3D.Pin.prototype = Object.create( THREE.Object3D.prototype );
DV3D.Pin.prototype.mousehit = function ( mx, my, camera, testObjects ) {

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
DV3D.Pin.prototype.dispose = function () {
	this.object.geometry.dispose();
	this.object.material.dispose();
};
