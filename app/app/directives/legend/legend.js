angular.module('dokuvisApp').directive('legend', 
	function() {
		return {
			restrict: 'A',
			templateUrl: 'app/directives/legend/legend.html',
			scope: {
				category: '=legend'
			}
		};
	});