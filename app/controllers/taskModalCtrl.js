angular.module('dokuvisApp').controller('taskModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Staff', 'Task', 'Utilities',
	function ($scope, $state, $stateParams, $timeout, Staff, Task, Utilities) {

		if ($stateParams.taskId === 'new')
			$scope.title = 'Neue Aufgabe';
		else {
			$scope.title = 'Aufgabe bearbeiten';
			getTask();
		}

		$scope.task = {
			title: '',
			description: '',
			from: '',
			to: '',
			editors: []
		};

		function getTask() {
			console.log('old task');
		}



		$scope.save = function () {
			console.log($scope.task);
			console.log($scope.editors);
		};

		$scope.searchEditors = function(query) {
			return Staff.query({ search: query }).$promise.then(function (result) {
				return result;
			});
		};

		$scope.checkEditor = function (tag) {
			if (tag.email || tag.id)
				return Staff.get({ id: tag.email || tag.id }).$promise.then(function (result) {
					return !!result.email;
				});
			else
				return false;
		};

		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^');
		};

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		})
	}]);
