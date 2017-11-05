angular.module('dokuvisApp').filter('filterEditor', function(){
	return function(items, search) {
		if(!search) return items;
		return items.filter(function(element) {
			return element.editors.indexOf(search) !== -1;
		});
	};
});

angular.module('dokuvisApp').filter('amJSDate', ['moment', function (moment) {
	return function (input) {
		console.log(input);
		if (moment.isMoment(input))
			return input.toDate();
		else if (moment.isDate(input))
			return input;
		else
			return moment(input).toDate();
	};
}]);

angular.module('dokuvisApp').filter('asList', function () {
	return function (items, separator, sort, key) {
		if (!Array.isArray(items)) return;
		if (!key) {
			items.sort();
			return items.join(separator);
		}

		var list = [];
		items.forEach(function (item) {
			list.push(item[key]);
		});
		if (sort) list.sort();

		return list.join(separator);
	};
});
