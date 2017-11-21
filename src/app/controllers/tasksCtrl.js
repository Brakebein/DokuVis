/**
 * Controller for the project management view.
 *
 * @ngdoc controller
 * @name tasksCtrl
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 */
angular.module('dokuvisApp').controller('tasksCtrl', ['$scope',
	function ($scope) {

		// Views
		$scope.views = {
			activeSide: 'details'
		};

		$scope.activeTask = null;

		// listen to task activate event
		$scope.$on('taskActivate', function (event, task) {
			$scope.activeTask = task;
		});

    }
]);
