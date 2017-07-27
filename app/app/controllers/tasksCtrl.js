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

		// data
		var tasks = [];
		var projects = [];
		var staff = [];

		$scope.activeTask = null;

		// api
		var apiGlobal;
		var apiReady = $q.defer();
		var apiHierarchy;

		var deferredTaskActivate = undefined;

		// data object used by gantt (contains row and task objects)
		$scope.data = [];

		// configuration
		$scope.config = {
			date: {
				from: moment().subtract(2, 'weeks'),
				to: moment().add(2, 'weeks'),
				viewScale: 'day'
			},
			filter: {
				row: ''
			},
			sort: {
				primary: 'task',
				secondary: [
					{ name: 'Name', value: 'model.name' },
					{ name: 'Priority', value: ['model.data.status', '-model.data.priority', 'model.name'] },
					{ name: 'Von', value: ['model.data.resource.from', 'model.name'] },
					{ name: 'Bis', value: ['model.data.resource.to', 'model.name'] }
				],
				sortMode: 'model.name'
			},
			gantt: {
				allowSideResizing: true,
				autoExpand: 'both',
				currentDate: 'line',
				currentDateValue: moment(),
				daily: true,
				expandToWidth: true,
				sideWidth: 'min-width',
				taskOutOfRange: 'truncate',
				rowContent: '\
					<span ng-switch="row.model.data.type">\
						<span ng-switch-when="project">\
							<i class="btn-row fa fa-folder-open" ng-click="scope.openDescAndComments"></i>\
							<b class="label-highlight" ng-click="scope.activateRow(row.model)">{{row.model.name | characters:30}}</b>\
							<i class="btn-row fa fa-plus" bs-tooltip="tooltip[1]" ui-sref=".detail({taskId: \'new\', parent: {id: row.model.data.resource.id, name: row.model.name}})"></i>\
						</span>\
						<span ng-switch-when="task">\
							<i class="btn-row" ng-class="row.model.hasData ? \'fa fa-envelope\' : \'glyphicon glyphicon-file\'" ng-click="scope.openDescAndComments(row)"></i>\
							<span class="label-highlight" ng-click="scope.activateRow(row.model)">{{row.model.name | characters:30}}</span>\
							<i class="btn-row fa fa-plus" bs-tooltip="tooltip[1]" ui-sref=".detail({taskId: \'new\', parent: {id: row.model.data.resource.id, name: row.model.name}})"></i>\
						</span>\
						<span ng-switch-when="staff">\
							<i class="btn-row fa fa-user"></i>\
							<b><u>{{row.model.name | characters:30}}</u></b>\
						</span>\
					</span>',
				taskContent: '{{task.model.name}}'
			},
			tree: {
				header: 'Projektstruktur'
			},
			table: {
				columns: ['model.data.editors'],
				headers: { 'model.data.editors': 'Bearbeiter' },
				headerContents: { 'model.data.editors': '<i class="fa fa-users"></i>' },
				contents: { 'model.data.editors': '{{ getValue() | asList:\', \':true:\'name\' }}' }
			},
			groups: {
				display: 'overview'
			},
			tooltips: {
				content: '{{task.model.name}}</br>' +
					'<small>{{task.isMilestone() === true && task.model.from.format("ll") || task.model.from.format("ll") + \' - \' + task.model.to.format("ll")}}</small>'
			}
		};

		// listen to events from angular gantt
		$scope.registerApi = function (api) {
			apiGlobal = api;

			api.core.on.ready($scope, function () {
				console.log(api);
				apiHierarchy = api.tree.getHierarchy();
				apiReady.resolve();

				api.data.on.change($scope, onDataChange);

				api.tasks.on.moveEnd($scope, onTaskDateChange);

				api.tasks.on.resizeEnd($scope, onTaskDateChange);

			});

			api.directives.on.new($scope, function (dName, dScope, dElement) {

				if (dName === 'ganttBody') {
					dElement.on('click', function () {
						deactivateRow($scope.activeTask);
						if (deferredTaskActivate)
							deferredTaskActivate.resolve();
					});
				}

				else if (dName === 'ganttTask') {
					dElement.on('click', function () {
						console.log('task', dScope.task.model);

						if (!deferredTaskActivate)
							deferredTaskActivate = $q.defer();
						deferredTaskActivate.promise.then(function () {
							activateRow(dScope.task.model.row);
							deferredTaskActivate = undefined;
						});
					});
				}

				else if (dName === 'ganttRow') {
					dElement.on('click', function () {
						console.log('row', dScope);
					});
				}
			});
		};

		// compute gantt data
		function updateGantt(reload) {
			var promises = [apiReady.promise];

			if (reload) {
				promises.push(querySubprojects());
				promises.push(queryTasks());
				promises.push(queryStaff());
			}

			$q.all(promises)
				.then(function () {
					$scope.data = [];
					$scope.activeTask = null;

					// process data
					if ($scope.config.sort.primary === 'staff')
						processStaff();
					if ($scope.config.sort.primary === 'task')
						processSubprojects();
					processTasks();

				});
		}
		
		function onDataChange() {
			// update editors
			if ($scope.config.sort.primary === 'task') {
				for (var i = 0, l = $scope.data.length; i < l; i++) {
					if ($scope.data[i].data.type === 'staff') continue;
					$scope.data[i].data.editors = retrieveEditors($scope.data[i]);
				}
			}
			console.log('final', $scope.data);
			// update table width
			$timeout(function () {
				apiGlobal.side.setWidth();
			});
		}

		// get all subprojects
		function querySubprojects() {
			return Subproject.query().$promise
				.then(function (results) {
					console.log('Projects', results);
					projects = results;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Subproject.query', err);
				});
		}

		// get all tasks
		function queryTasks() {
			return Task.query().$promise
				.then(function (results) {
					console.log('Tasks', results);
					tasks = results;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Task.query', err);
				});
		}

		// get all staff
		function queryStaff() {
			Staff.query().$promise
				.then(function (results) {
					console.log('Staff', results);
					staff = results;
					$scope.staff = staff;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Staff.query', err);
				});
		}

		// transform project entries into rows
		function processSubprojects() {
			projects.forEach(function (prj) {
				var row = {
					id: prj.id,
					name: prj.name,
					parent: undefined,
					data: {
						type: 'project',
						resource: prj
					},
					classes: [],
					active: false
				};

				$scope.data.push(row);
			});
		}

		// transform task entries into rows and tasks
		function processTasks() {
			if ($scope.config.sort.primary === 'task') {
				tasks.forEach(function (task) {
					addTask(task, task.id, task.parent);
				});
			}
			else if ($scope.config.sort.primary === 'staff') {
				staff.forEach(function (value) {
					tasks.forEach(function (task) {
						// check if task has editor
						var found = false;
						for (var i = 0; i < task.editors.length; i++) {
							if (task.editors[i].id === value.email) {
								found = true;
								break;
							}
						}
						if (!found) return;

						// new id
						var id = task.id + '_' + value.email;

						// skip if it already exists
						if (getDataEntryById(id)) return;

						addTask(task, id, task.parent + '_' + value.email);
						addParent(task.parent, value.email);
					});
				});
			}
		}

		// prepare task data object
		function addTask(task, id, parent) {
			var data = {
				type: task.type,
				priority: task.priority,
				status: task.status,
				editors: [],
				resource: task
			};

			var row =  {
				id: id,
				name: task.title,
				parent: parent,
				data: data,
				classes: ['task-group'],
				tasks: [],
				active: false
			};

			var classes = [];
			classes.push(getTaskClass('priority', task.priority));
			classes.push(getTaskClass('status', task.status));

			var rowTask = {
				id: id,
				name: task.title,
				from: task.from,
				to: task.to,
				data: data,
				classes: classes,
				row: row,
				progress: 40
			};

			row.tasks.push(rowTask);
			$scope.data.push(row);
		}

		// add parent to data
		function addParent(parentId, staffId) {
			var parent = parentId + '_' + staffId;
			// skip if already exists
			if (getDataEntryById(parent)) return;

			// add parent project and add to data if existing
			var pObj = getSubprojectById(parentId);
			if (pObj) {
				var row = {
					id: parent,
					name: pObj.name,
					parent: staffId,
					data: {
						type: 'project',
						resource: pObj
					},
					classes: [],
					active: false
				};

				$scope.data.push(row);
				return;
			}

			// get parent task and add to data if existing
			pObj = getTaskById(parentId);
			if (pObj) {
				addTask(pObj, parent, pObj.parent + '_' + staffId);
				addParent(pObj.parent, staffId);
			}
		}

		// transform staff entries into rows
		function processStaff() {
			staff.forEach(function (value) {
				var row = {
					id: value.email,
					name: value.name,
					data: {
						type: 'staff',
						resource: value
					},
					classes: ['staff-row']
				};

				$scope.data.push(row);
			});
		}

		// accumulate editors
		function retrieveEditors(row) {
			var editors = [];

			// get own editors
			if (row.data.resource && row.data.resource.editors)
				editors = editors.concat(row.data.resource.editors);

			// get all editors of descendants
			var desc = apiHierarchy.descendants({ model: row });
			for (var i = 0, l = desc.length; i < l; i++) {
				if (desc[i].model.data.resource && desc[i].model.data.resource.editors) {
					editors = editors.concat(desc[i].model.data.resource.editors);
				}
			}

			// remove duplicates
			for (var j = 0; j < editors.length; j++) {
				for (var k = j + 1; k < editors.length; k++) {
					if (editors[j].id === editors[k].id)
						editors.splice(k--, 1);
				}
			}

			return editors;
		}

		function getDataEntryById(id) {
			for (var i = 0, l = $scope.data.length; i < l; i++) {
				if ($scope.data[i].id === id)
					return $scope.data[i];
			}
		}

		function getSubprojectById(id) {
			for (var i = 0; i < projects.length; i++) {
				if (projects[i].id === id)
					return projects[i];
			}
		}

		function getTaskById(id) {
			for (var i = 0; i < tasks.length; i++) {
				if (tasks[i].id === id)
					return tasks[i];
			}
		}

		// get specific class for task
		function getTaskClass(type, value) {
			if (type === 'priority') {
				switch (value) {
					case 1: return 'task-priority-medium';
					case 2: return 'task-priority-high';
					default: return 'task-priority-low';
				}
			}
			else if (type === 'status') {
				switch (value) {
					case 1: return 'task-status-done';
					default: return 'task-status-todo'
				}
			}
		}

		// event handler for task.move or task.resize
		function onTaskDateChange(task) {
			console.log(task);
			var taskResource = task.model.data.resource;
			var newFrom = moment(task.model.from).format();
			var newTo = moment(task.model.to).format();

			if (taskResource.from !== newFrom || taskResource.to !== newTo) {
				taskResource.from = newFrom;
				taskResource.to = newTo;
			}
			else return;

			console.log(taskResource.from, taskResource.to);
			console.log(taskResource);
			taskResource.$update()
				.catch(function (err) {
					Utilities.throwApiException('#Task.update', err);
				});

			if ($scope.config.sort.primary === 'staff')
				updateGantt();
		}

		// select task/row
		function activateRow(row) {
			row.active = true;
			$scope.activeTask = row;
			updateRowClasses(row);
		}

		// select task/row called from table
		$scope.activateRow = function (row) {
			deactivateRow($scope.activeTask);
			activateRow(row);
		};

		// unselect task/row
		function deactivateRow(row) {
			if (!row) return;
			row.active = false;
			$scope.activeTask = null;
			updateRowClasses(row);
			$scope.$applyAsync();
		}

		// update task status
		$scope.setTaskStatus = function (row, status) {
			var taskResource = row.data.resource;
			if (status)
				taskResource.status = 1;
			else
				taskResource.status = 0;

			taskResource.$update()
				.then(function (result) {
					console.log(result);
					row.data.status = taskResource.status;
					for (var i=0; i<row.tasks.length; i++)
						row.tasks[i].status = taskResource.status;
					updateRowClasses(row);
				})
				.catch(function (err) {
					Utilities.throwApiException('#Task.update', err);
				});
		};

		// update active and status css classes
		function updateRowClasses(row) {
			var activeRowClassIndex = row.classes.indexOf('active');
			if (row.active && activeRowClassIndex === -1)
				row.classes.push('active');
			else if (!row.active && activeRowClassIndex !== -1)
				row.classes.splice(activeRowClassIndex, 1);

			// var statusRowClassIndex = row.classes.indexOf('task-status-done');
			// if (row.data.status && statusRowClassIndex === -1)
			// 	row.classes.push('task-status-done');
			// else if (!row.data.status && statusRowClassIndex !== -1)
			// 	row.classes.splice(statusRowClassIndex);

			if (row.tasks) {
				for (var i = 0; i < row.tasks.length; i++) {
					var activeTaskClassIndex = row.tasks[i].classes.indexOf('active');
					if (row.active && activeTaskClassIndex === -1)
						row.tasks[i].classes.push('active');
					else if (!row.active && activeTaskClassIndex !== -1)
						row.tasks[i].classes.splice(activeTaskClassIndex, 1);

					var statusTaskClassIndex = row.tasks[i].classes.indexOf('task-status-done');
					if (row.data.status && statusTaskClassIndex === -1)
						row.tasks[i].classes.push('task-status-done');
					else if (!row.data.status && statusTaskClassIndex !== -1)
						row.tasks[i].classes.splice(statusTaskClassIndex, 1);
				}
			}
		}

        // switch between user centered and task centered view
        $scope.updateSort = function (sortby) {
			$scope.config.sort.primary = sortby;
			updateGantt();
		};

		// update the view scale of the gantt chart depending on the date range
		$scope.updateViewScale = function () {
			var fromDate = moment($scope.config.date.from);
			var toDate = moment($scope.config.date.to);
			if (toDate.diff(fromDate, 'days') < 35)
				$scope.config.date.viewScale = 'day';
			else if (toDate.diff(fromDate, 'weeks') < 20)
				$scope.config.date.viewScale = 'week';
			else
				$scope.config.date.viewScale = 'month';
		};

		// listen to tasksUpdate event and update gantt
		$scope.$on('tasksUpdate', function () {
			console.log('event tasksUpdate');
			updateGantt(true);
		});

        // init
		updateGantt(true);

    }]);
