(function () {

/**
 * Extended DV3D.Entry class for 3D objects.
 * @param obj {THREE.Object3D} Instance of a geometry object or group
 * @constructor
 * @extends DV3D.Entry
 * @author Brakebein
 */
DV3D.ObjectEntry = function (obj) {
	DV3D.Entry.call( this, obj );

	this.label = obj.userData.name;
	this.layer = obj.userData.layer || 0;
	this.type = obj.userData.type;

	this.edges = null;

	this.parent = obj.parent instanceof THREE.Scene ? null : obj.parent.id;
	this.children = [];

	this.expand = false;
};

DV3D.ObjectEntry.prototype = Object.assign( Object.create(DV3D.Entry.prototype), {

	/**
	 * Assign corresponding edges object to `edges` property.
	 * @param edgesObject {THREE.LineSegments} Three.js edges object.
	 */
	addEdges: function (edgesObject) {
		this.edges = edgesObject;
	},

	/**
	 * Activate/select the entry and dispatch `select` event.
	 * @param event {MouseEvent|null} Event object of click event
	 * @param [bool] {boolean} If not set, `active` property is inverted
	 * @override
	 */
	select: function (event, bool) {
		if (typeof bool === 'boolean') this.active = bool;
		else this.active = !this.active;

		if (this.visible && event)
			this.dispatchEvent({ type: 'select', active: this.active, originalEvent: event });
		if (this.active)
			this.expandParents();
	},

	/**
	 * Toggle object and its children in scene. If visibility is changing, an `toggle` event will be dispatched.
	 * @param [bool] {boolean} Object will be toggled depending on this value. If not set, the visibility will be inverted.
	 * @param [traverse=true] {boolean} If true, the descendants will be toggle according to this objects visibility. Otherwise, only this object will be toggled.
	 * @override
	 */
	toggle: function (bool, traverse) {
		var visible;
		if (typeof bool === 'boolean') visible = bool;
		else visible = !this.visible;

		if (traverse === false) {
			this.visible = visible;
			this.dispatchEvent({ type: 'toggle', visible: visible });
		}
		else {
			this.traverse(function (obj) {
				if (obj.visible !== visible) {
					obj.visible = visible;
					obj.dispatchEvent({ type: 'toggle', visible: visible });
				}
			});
		}
	},

	/**
	 * Execute the callback on this object and all descendants.
	 * @param callback {function} A function with as first argument an Entry object.
	 */
	traverse: function (callback) {
		callback(this);
		for (var i = 0, l = this.children.length; i < l; i++) {
			this.children[i].traverse(callback);
		}
	},

	/**
	 * Set parent's `expand` property to `true`, so element becomes visible in list.
	 */
	expandParents: function () {
		if (this.parent) {
			this.parent.expand = true;
			this.parent.expandParents();
		}
	},

	/**
	 * Set the opacity of the object (and its children if any).
	 * @param [value] {boolean} New opacity value. If not set, an `opacity` event will be dispatched with the old value.
	 */
	setOpacity: function (value) {
		if (typeof value !== 'undefined') this.opacity = value;
		value = this.opacity;
		this.traverse(function (child) {
			child.opacity = value;
			if (child.object instanceof THREE.Mesh) {
				var mesh = child.object;
				var edges = child.edges;
				if (value === 1.0) {
					// TODO: consider opacity
					if(!child.active) {
						mesh.material = THREE.DokuVisTray.materials[mesh.userData.originalMat];
						if (edges) edges.material = THREE.DokuVisTray.materials['edgesMat'] ;
					}
					else {
						mesh.material = THREE.DokuVisTray.materials['selectionMat'];
						if (edges) edges.material = THREE.DokuVisTray.materials['edgesSelectionMat'] ;
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
						edges.material.depthWrite = false;
						edges.material.needsUpdate = true;
					}
					mesh.userData.modifiedMat = true;
				}
				mesh.material.opacity = value;
				if(edges) edges.material.opacity = value;
			}
		});
		this.dispatchEvent({ type: 'change' });
	},

	/**
	 * Remove any references to meshes, other 3D objects, and other entries, so this entry is ready for GC.
	 * @override
	 */
	dispose: function () {
		if (this.object.entry)
			delete this.object.entry;
		delete this.object;
		delete this.edges;
		delete this.parent;
		delete this.children;
	}

});

})();
