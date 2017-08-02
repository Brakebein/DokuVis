/**
 * Controller for modal to create new task or edit an existing one.
 *
 * @ngdoc controller
 * @name taskModalCtrl
 * @module dokuvisApp
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires https://github.com/urish/angular-moment moment
 * @requires Staff
 * @requires Task
 * @requires ConfirmService
 * @requires Utilities
 */
angular.module('dokuvisApp').controller('taskModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'moment', 'Staff', 'Task', 'ConfirmService', 'Utilities',
	function ($scope, $state, $stateParams, $timeout, moment, Staff, Task, ConfirmService, Utilities) {

		var parent = null;
		var task = null;

		if ($stateParams.taskId === 'new') {
			$scope.title = 'Neue Aufgabe';
			$scope.newTask = true;
			setEmptyTask();
		}
		else {
			$scope.title = 'Aufgabe bearbeiten';
			$scope.newTask = false;
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

		/**
		 * Save new task or changes of existing task.
		 * @ngdoc method
		 * @name taskModalCtrl#save
		 */
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
				task.title = $scope.task.title;
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
						Utilities.throwApiException('#Task.update', err);
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

		/**
		 * Delete task. The user will be prompted with a confirm dialog.
		 * @ngdoc method
		 * @name taskModalCtrl#delete
		 */
		$scope.delete = function () {

			ConfirmService({
				headerText: 'Aufgabe löschen',
				bodyText: 'Soll die Aufgabe <b>' + task.title + '</b> wirklich gelöscht werden? <br/> \
					Alle Unteraufgaben gehen an die Oberaufgabe.'
			}).then(function () {
				task.$delete()
					.then(function (result) {
						console.log(result);
						tasksUpdate();
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Task.delete', reason);
					});
			});
		};

		/**
		 * Search for users, which contain given query string in their names.
		 * @ngdoc method
		 * @name taskModalCtrl#searchEditors
		 * @param query {string} Query string
		 * @returns {Array|*} Returns an array with the found users.
		 */
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

		/**
		 * Check, if the user entered exists and is valid.
		 * @ngdoc method
		 * @name taskModalCtrl#checkEditor
		 * @param tag {Object} Tag object of `tags-input` directive.
		 * @returns {boolean|*} Return false, if the user is not valid, or returns a promise resolving to true, if the user is valid.
		 */
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

		/**
		 * Event that gets fired, when a new task has been created or an exiting one has been updated.
		 * @ngdoc event
		 * @name taskModalCtrl#tasksUpdate
		 * @eventType broadcast on $rootScope
		 * @param {Task=} task New or updated task.
		 */
		function tasksUpdate(task) {
			$scope.$root.$broadcast('tasksUpdate', task);
		}

		/**
		 * Closes the modal and destroys the scope.
		 * @ngdoc method
		 * @name taskModalCtrl#close
		 */
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
