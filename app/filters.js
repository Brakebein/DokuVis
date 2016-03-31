angular.module('dokuvisApp').filter('timeFormat', function() {
	return function(time) {
		moment.locale('de');
		return moment(time).format('lll');
	}
})