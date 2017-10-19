/**
 * This class is container for objects, plans, or images. There are properties that are useful for global settings. Methods like `toggle()` iterate over all items.
 * @memberof DV3D
 * @constructor
 */
DV3D.Collection = function () {

	/**
	 * Associative array containing all entries.
	 * @type {object}
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
/**
 * Returns the entry with the given id. If no id is specified, the whole list is returned.
 * @param [id] {string|number} Id of the entry
 * @returns {DV3D.Entry|object}
 */
DV3D.Collection.prototype.get = function (id) {
	if(id) return this.list[id];
	else return this.list;
};
/**
 * Returns the list as array.
 * @returns {Array}
 */
DV3D.Collection.prototype.asArray = function () {
	var array = [];
	for(var key in this.list) {
		array.push(this.list[key]);
	}
	return array;
};
/**
 * Adds the object to the list (uses `obj.id` as id).
 * @param obj {DV3D.Entry} New entry
 */
DV3D.Collection.prototype.add = function (obj) {
	this.list[obj.id] = obj;
};
/**
 * Removes the object from the list.
 * @param obj {DV3D.Entry} Object to be removed
 */
DV3D.Collection.prototype.remove = function (obj) {
	delete this.list[obj.id];
};
/**
 * Find object by name and return it.
 * @param value {'string'} Name
 */
DV3D.Collection.prototype.getByName = function (value) {
	return this.getByProperty('name', value);
};
/**
 * Find object by property and return it.
 * @param prop {string} Property name
 * @param value {*} Property value
 * @return {DV3D.Entry|null} Returns entry if found, or null
 */
DV3D.Collection.prototype.getByProperty = function (prop, value) {
	for(var key in this.list) {
		if(this.list[key][prop] === value)
			return this.list[key];
	}
	return null;
};
/**
 * Get all visible entries.
 * @return {DV3D.Entry[]} Returns array of all visible entries.
 */
DV3D.Collection.prototype.getVisible = function () {
	var array = [];
	for (var key in this.list) {
		if (this.list[key].visible)
			array.push(this.list[key]);
	}
	return array;
};
/**
 * Iterates over the list and executes the given function for each item.
 * @param callback {function} Function to be executed
 * @param [onlyVisible] {boolean} Consider only visible items
 */
DV3D.Collection.prototype.forEach = function (callback, onlyVisible) {
	var filterVisible = onlyVisible || false;
	for (var key in this.list) {
		if ((filterVisible && this.list[key].visible) || !filterVisible)
			callback(this.list[key]);
	}
};
/**
 * Toggle all entries.
 * @return {DV3D.Collection}
 */
DV3D.Collection.prototype.toggle = function () {
	this.visible = !this.visible;
	for (var key in this.list) {
		this.list[key].toggle(this.visible);
	}
	return this;
};
/**
 * Set the opacity of all entries.
 * @param value {number} New opacity value
 */
DV3D.Collection.prototype.setOpacity = function (value) {
	if (typeof value !== 'undefined') this.opacity = value;
	for (var key in this.list) {
		this.list[key].setOpacity(this.opacity);
	}
	DV3D.callFunc.animateAsync();
};
/**
 * Set the scale of all entries.
 * @param value {number} New scale value
 */
DV3D.Collection.prototype.setScale = function (value) {
	if(typeof value !== 'undefined') this.scale = value;
	for(var key in this.list) {
		this.list[key].object.setScale(this.scale);
	}
	if(DV3D.callFunc.animateAsync) DV3D.callFunc.animateAsync();
};
DV3D.Collection.prototype.then = function (cb) {
	if(cb) cb();
};
