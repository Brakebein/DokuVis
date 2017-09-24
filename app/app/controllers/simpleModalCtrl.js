angular.module('dokuvisApp').controller('simpleModalCtrl', ['$scope', '$state',
	function ($scope, $state) {

		$scope.close = function () {
			$state.go('^');
		};

	}
]);
