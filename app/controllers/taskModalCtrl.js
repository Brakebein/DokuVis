angular.module('dokuvisApp').controller('taskModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Staff', 'Task', 'Utilities', 'moment',
	function ($scope, $state, $stateParams, $timeout, Staff, Task, Utilities, moment) {

		var parent = null;
		var task = null;

		if ($stateParams.taskId === 'new') {
			$scope.title = 'Neue Aufgabe';
			setEmptyTask();
		}
		else {
			$scope.title = 'Aufgabe bearbeiten';
			getTask();
		}

		function setEmptyTask() {
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
				priority: 0,
				editors: []
			};
		}

		function getTask() {
			Task.get({ id: $stateParams.taskId }).$promise
				.then(function (result) {
					console.log(result);
					$scope.task = {
						title: result.title,
						description: result.description,
						from: moment(result.from).format('YYYY-MM-DD'),
						to: moment(result.to).format('YYYY-MM-DD'),
						priority: result.priority,
						editors: result.editors,
						created: result.created,
						modified: result.modified
					};
					task = result;
				})
				.catch(function (reason) {
					Utilities.throwApiException('#Task.get', reason);
				});
		}

		$scope.save = function () {
			console.log($scope.task);

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

			if (task) {
				// update existing task
				task.title = $scope.title;
				task.description = $scope.task.description;
				task.from = moment($scope.task.from).format();
				task.to = moment($scope.task.to).format();
				task.priority = $scope.task.priority;
				task.editors = $scope.task.editors.map(function (value) {
					return value.email || value.id;
				});

				task.$update()
					.then(function (result) {
						console.log(result);
						tasksUpdate(task);
						$scope.close();
					})
					.catch(function (err) {
						Utilities.throwException('#Taskupdate', err);
					});
			}
			else {
				if (!parent) {
					Utilities.throwException('Controller Exception', '"parent" is not set!');
					return;
				}

				// create new task
				Task.save({
					title: $scope.task.title,
					description: $scope.task.description,
					from: moment($scope.task.from).format(),
					to: moment($scope.task.to).format(),
					priority: $scope.task.priority,
					editors: $scope.task.editors.map(function (value) {
						return value.email || value.id;
					}),
					parent: parent
				}).$promise
					.then(function (result) {
						console.log(result);
						tasksUpdate(result);
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Task.save', reason);
					});
			}
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

		// /**
		//  *
		//  * @ngdoc event
		//  * @name tasksUpdate
		//  * @param {Task} task The new or updated task.
		//  * @eventType broadcast on $rootScope
		//  */
		function tasksUpdate(task) {
			$scope.$root.$broadcast('tasksUpdate', task);
		}

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
