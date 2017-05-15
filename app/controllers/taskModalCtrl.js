angular.module('dokuvisApp').controller('taskModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Staff', 'Task', 'Utilities', 'moment',
	function ($scope, $state, $stateParams, $timeout, Staff, Task, Utilities, moment) {

		if ($stateParams.taskId === 'new')
			$scope.title = 'Neue Aufgabe';
		else {
			$scope.title = 'Aufgabe bearbeiten';
			getTask();
		}

		var parent = null;
		if ($stateParams.parent) {
			$scope.parentName = $stateParams.parent.name;
			parent = $stateParams.parent.id;
		}
		else if ($stateParams.subproject === 'master') {
			$scope.attachNote = 'Aufgabe wird als Aufgabe des Hauptprojektes erstellt.';
			parent = $stateParams.project;
		}
		else {
			$scope.attachNote = 'Aufgabe wird als Aufgabe des Unterprojektes erstellt.';
			parent = $stateParams.subproject;
		}

		$scope.task = {
			title: '',
			description: '',
			from: moment().format('YYYY-MM-DD'),
			to: moment().add(1, 'days').format('YYYY-MM-DD'),
			editors: []
		};

		function getTask() {
			console.log('old task');
		}

		$scope.save = function () {
			console.log($scope.task);
			console.log($scope.editors);

			if (!$scope.task.title.length) {
				Utilities.dangerAlert('Geben Sie der Aufgabe einen Namen!');
				return;
			}
			if (!$scope.task.from.length ||
				!$scope.task.to.length ||
				!moment($scope.task.from).isValid() ||
				!moment($scope.task.to).isValid()) {
				Utilities.dangerAlert('Geben Sie ein korrektes Datum an!');
				return;
			}

			console.log({
				title: $scope.task.title,
				description: $scope.task.description,
				from: moment($scope.task.from).format(),
				to: moment($scope.task.to).format(),
				editors: $scope.task.editors.map(function (value) {
					return value.email;
				}),
				parent: parent
			});

			Task.save({
				title: $scope.task.title,
				description: $scope.task.description,
				from: moment($scope.task.from).format(),
				to: moment($scope.task.to).format(),
				editors: $scope.task.editors.map(function (value) {
					return value.email;
				}),
				parent: parent
			}).$promise
				.then(function (result) {
					console.log(result);
					$scope.close();
				})
				.catch(function (err) {
					Utilities.throwApiException('#Task.save', err);
				});
		};

		$scope.searchEditors = function(query) {
			return Staff.query({ search: query })
				.$promise.then(function (result) {
					return result;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Staff.query', err);
					return [];
				});
		};

		$scope.checkEditor = function (tag) {
			if (tag.email || tag.id)
				return Staff.get({ id: tag.email || tag.id })
					.$promise.then(function (result) {
						return !!result.email;
					})
					.catch(function (err) {
						Utilities.throwApiException('#Staff.get', err);
						return false;
					});
			else
				return false;
		};

		$scope.close = function () {
			$state.go('^');
		};

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		})
	}]);
