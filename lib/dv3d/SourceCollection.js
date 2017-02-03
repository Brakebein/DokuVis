DV3D.SourceCollection = function () {

	this.list = {};
	
	this.visible = true;
	this.opacity = 1.0;

	this.then = null;

};
DV3D.SourceCollection.prototype.asArray = function () {
	var array = [];
	for(var key in this.list) {
		array.push(this.list[key]);
	}
	return array;
};
DV3D.SourceCollection.prototype.add = function (obj) {
	this.list[obj.id] = obj;
};
DV3D.SourceCollection.prototype.remove = function (obj) {
	delete this.list[obj.id];
};
DV3D.SourceCollection.prototype.getByName = function (value) {
	this.getByProperty('name', value);
};
DV3D.SourceCollection.prototype.getByProperty = function (prop, value) {
	for(var key in this.list) {
		if(this.list[key][prop] === value)
			return this.list[key];
	}
	return null;
};
DV3D.SourceCollection.prototype.toggleAll = function () {
	this.visible = !this.visible;
	for(var key in this.list) {
		this.list[key].toggle(this.visible);
	}
	if(this.then) this.then();
};