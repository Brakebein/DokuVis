/**
 * This class is container for objects, plans, or images. There are properties that are useful for global settings. Methods like `toggle()` iterate over all items.
 * @constructor
 * @memberof DV3D
 * @author Brakebein
 */
DV3D.Collection = function () {

	/**
	 * Associative array containing all entries.
	 * @type {Object}
	 */
	this.list = {};
	/**
	 * Global visibility.
	 * @type {boolean}
	 */
	this.visible = true;
	/**
	 * Global opacity value.
	 * @type {number}
	 */
	this.opacity = 1.0;
	/**
	 * Global scale value.
	 * @type {number}
	 */
	this.scale = 1.0;
	
};

Object.assign( DV3D.Collection.prototype, THREE.EventDispatcher.prototype, {

	/**
	 * Get an entry by the given id. If no id is specified, the whole list will be returned.
	 * @param id {string|number} Id of the entry
	 * @return {DV3D.Entry|Object} The entry with the given id or the whole list/map.
	 */
	get: function (id) {
		if (id) return this.list[id];
		else return this.list;
	},

	/**
	 * Get the list as array.
	 * @return {DV3D.Entry[]} All entries as array.
	 */
	asArray: function () {
		var array = [];
		for (var key in this.list)
			array.push(this.list[key]);
		return array;
	},

	/**
	 * Add object to the collection (uses `obj.id` as id).
	 * @param obj {DV3D.Entry} New entry
	 */
	add: function (obj) {
		this.list[obj.id] = obj;
	},

	/**
	 * Remove the object from the collection.
	 * @param obj {DV3D.Entry} Object to be removed
	 */
	remove: function (obj) {
		delete this.list[obj.id];
	},

	/**
	 * Get object by name.
	 * @param value {string} Name of the object
	 * @return {DV3D.Entry|null} Entry or null, if not found.
	 */
	getByName: function (value) {
		return this.getByProperty('name', value);
	},

	/**
	 * Get object by property.
	 * @param prop {string} Property name
	 * @param value {*} Property value
	 * @return {DV3D.Entry|null} Entry or null, if not found.
	 */
	getByProperty: function (prop, value) {
		for (var key in this.list) {
			if (this.list[key][prop] === value)
				return this.list[key];
		}
		return null;
	},

	/**
	 * Get all visible entries.
	 * @return {DV3D.Entry[]} Array of all visible entries.
	 */
	getVisible: function () {
		var array = [];
		for (var key in this.list) {
			if (this.list[key].visible)
				array.push(this.list[key]);
		}
		return array;
	},

	/**
	 * Iterate over the list and execute the given function for each item.
	 * @param callback {function} Function to be executed
	 * @param [onlyVisible=false] {boolean} If true, consider only visible items
	 */
	forEach: function (callback, onlyVisible) {
		var filterVisible = onlyVisible || false;
		for (var key in this.list) {
			if (!filterVisible || (filterVisible && this.list[key].visible))
				callback(this.list[key]);
		}
	},

	/**
	 * Toggle all entries (set visibility).
	 */
	toggle: function () {
		this.visible = !this.visible;
		for (var key in this.list) {
			this.list[key].toggle(this.visible, false);
		}
	},

	/**
	 * Set opacity of all entries.
	 * @param value {number} New opacity value (0.0 .. 1.0)
	 */
	setOpacity: function (value) {
		value = +value;
		if (typeof value === 'number' && value >= 0.0 && value <= 1.0) this.opacity = value;
		else return;
		for (var key in this.list) {
			this.list[key].setOpacity(this.opacity);
		}
		// TODO: dispatchEvent animate
	},

	/**
	 * Set the scale of all entries.
	 * @param value {number} New scale value
	 */
	setScale: function (value) {
		value = +value;
		if (typeof value === 'number') this.scale = value;
		for (var key in this.list) {
			// TODO: differentiate between plans, images, objects
			this.list[key].object.setScale(this.scale);
		}
	}

});

/**
 * @deprecated
 * @param cb
 */
DV3D.Collection.prototype.then = function (cb) {
	if(cb) cb();
};
