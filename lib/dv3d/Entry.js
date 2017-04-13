/**
 * Base class for items to be added to a DV3D.Collection.
 * @param obj {object} Item that is an instance of DV3D.Plan, DV3D.ImagePane, etc.
 * @constructor
 */
DV3D.Entry = function (obj) {

	/**
	 * Id of the object.
	 * @type {number|string}
	 */
	this.id = obj.id;
	/**
	 * Name of the object.
	 * @type {string}
	 */
	this.name = obj.name;
	/**
	 * Title to be visible in the view.
	 * @type {string}
	 */
	this.title = (obj.userData.source && obj.userData.source.title) ? obj.userData.source.title : obj.name;
	/**
	 * The actual object.
	 * @type {Object}
	 */
	this.object = obj;

	/**
	 * Flag, if the object is visible.
	 * @type {boolean}
	 */
	this.visible = true;
	/**
	 * Flag, if the object is selected.
	 * @type {boolean}
	 */
	this.selected = false;
	/**
	 * Opacity of the object.
	 * @type {number}
	 */
	this.opacity = 1.0;
	
};
/**
 * Toggles the object in the scene.
 * @param [bool] {boolean} Object will be toggled regarding to this value. If not set, the `visible` property will be "inverted".
 */
DV3D.Entry.prototype.toggle = function (bool) {
	if(typeof bool !== 'undefined') this.visible = bool;
	else this.visible = !this.visible;
	if(!this.visible && this.selected)
		DV3D.callFunc.setSelected(this.object, false, true);
	DV3D.callFunc.toggle(this.object, this.visible);
};
/**
 * Calls external selection method.
 */
DV3D.Entry.prototype.select = function () {
	if(this.visible && event)
		DV3D.callFunc.setSelected(this.object, event.ctrlKey, false);
};
/**
 * Sets the opacity of the object.
 * @param [value] {number} New opacity value. If not set, the `opacity` proptery will be used.
 */
DV3D.Entry.prototype.setOpacity = function (value) {
	if (typeof value !== 'undefined') this.opacity = value;
	this.object.setOpacity(this.opacity);
	DV3D.callFunc.animateAsync();
};

/**
 * Extended DV3D.Entry class for objects.
 * @param obj {DV3D.Object} Instance of a Plan object
 * @extends DV3D.Entry
 * @constructor
 */
DV3D.ObjectEntry = function (obj) {
	DV3D.Entry.call( this, obj );
	
	this.layer = obj.layer || 0;
	
	this.parent = obj.parent || null;
	this.children = [];
	
	this.expand = false;
	this.parentVisible = false;
};
DV3D.ObjectEntry.prototype = Object.create( DV3D.Entry.prototype );
/**
 * Calls external function to focus the camera on object.
 */
DV3D.ObjectEntry.prototype.focus = function () {
	DV3D.callFunc.focusObject(this.object);
};

/**
 * Extended DV3D.Entry class for plans.
 * @param obj {DV3D.Plan} Instance of a Plan object
 * @extends DV3D.Entry
 * @constructor
 */
DV3D.PlanEntry = function (obj) {
	DV3D.Entry.call( this, obj );
};
DV3D.PlanEntry.prototype = Object.create( DV3D.Entry.prototype );
/**
 * Calls external function to set/tween orthogonal view to fit plan to viewport.
 */
DV3D.PlanEntry.prototype.setOrthoView = function () {
	DV3D.callFunc.viewOrthoPlan(this.object);
};

/**
 * Extended DV3D.Entry class for images.
 * @param obj {DV3D.ImagePane} Instance of a ImagePane object
 * @extends DV3D.Entry
 * @constructor
 */
DV3D.ImageEntry = function (obj) {
	DV3D.Entry.call( this, obj );

	this.source = obj.userData.source;
};
DV3D.ImageEntry.prototype = Object.create( DV3D.Entry.prototype );
/**
 * Calls external function to set/tween camera to position and orientation of the ImagePane.
 */
DV3D.ImageEntry.prototype.setImageView = function () {
	DV3D.callFunc.setImageView(this.object);
};
