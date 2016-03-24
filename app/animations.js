angular.module('dokuvisApp').animation('.fadeLoadprogress', [function() {
	return {
		addClass: function(element, className, doneFn) {
			if(className === 'ng-hide')
				jQuery(element).delay(2000).fadeOut(2000);
		},
		removeClass: function(element, className, doneFn) {
			if(className === 'ng-hide')
				jQuery(element).show();
		}
	};
}])