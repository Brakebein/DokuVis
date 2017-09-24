/**
 * Controller for the project management view.
 *
 * @ngdoc controller
 * @name tasksCtrl
 * @module dokuvisApp
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$q $q
 * @requires https://github.com/urish/angular-moment moment
 * @requires Staff
 * @requires Task
 * @requires Subproject
 * @requires Utilities
 */
angular.module('dokuvisApp').controller('tasksCtrl', ['$scope','$stateParams', '$timeout', '$q', 'moment', 'Staff', 'Task', 'Subproject', 'Utilities',
	function($scope, $stateParams, $timeout, $q, moment, Staff, Task, Subproject, Utilities) {

		// Views
		$scope.views = {
			activeSide: 'details'
		};

		$scope.activeTask = null;

		// listen to task activate event
		$scope.$on('taskActivate', function (event, task) {
			$scope.activeTask = task;
		});

    }]);
