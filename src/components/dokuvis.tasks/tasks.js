/**
 * Components to integrate tasks and project management.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 * * [ui.router](https://ui-router.github.io/ng1/docs/0.3.2/#/api)
 * * [angularMoment](https://github.com/urish/angular-moment)
 * * [gantt](https://www.angular-gantt.com/)
 * * gantt.table
 * * gantt.tree
 * * gantt.groups
 * * gantt.movable
 * * gantt.tooltips
 * * gantt.sortable
 *
 * ### Requirements
 * Add `dokuvis.tasks.js` and `dokuvis.tasks.css` to your `index.html` and add `dokuvis.tasks` as dependency.
 *
 * In your application, define a constant named `ApiTask` to specify the REST-API url. The url will be extended by `/:id`. Don't forget to set your {@link ApiParams}.
 * ```
 * // example
 * var myApp = angular.module('myApp', ['dokuvis.tasks']);
 * myApp.constant('ApiTask', 'api/auth/project/:project/:subproject/task');
 * ```
 * Also, the path to the components should be defined, so directives can find their templates (see {@link ComponentsPath}).
 *
 * ### Task object
 * ```
 * {
 *   children: <Array<id>>,     // ids of child tasks
 *   created: {                 // who created the task?
 *     id: <id>,                // user id
 *     name: <string>,          // user name
 *     date: <string>           // creation date
 *   },
 *   description: <string>,     // what is the content of this task
 *   editors: <Array<Object>>,  // array of persons who are assigned to this task ({ id: <id>, name: <string> })
 *   from: <string>,            // when starts the task?
 *   id: <id>,                  // id of the task (string)
 *   modified: {                // who modified the task?
 *     id: <id>,                // user id
 *     name: <string>,          // user name
 *     date: <string>           // modification date
 *   },
 *   parent: <id>,              // id of parent task or subproject
 *   priority: <integer>,       // priority low: 0, medium: 1, high: 2
 *   status: <integer>,         // status to do: 0, done: 1
 *   title: <string>,           // title (should always be set)
 *   to: <string>,              // when ends the task?
 *   type: <string>             // task or subproject
 * }
 * ```
 *
 * @ngdoc module
 * @name dokuvis.tasks
 * @module dokuvis.tasks
 */
angular.module('dokuvis.tasks', [
	'ngResource',
	'ui.router',
	'angularMoment',
	'gantt',
	'gantt.table',
	'gantt.tree',
	'gantt.groups',
	'gantt.movable',
	'gantt.tooltips',
	'gantt.sortable',
	// 'gantt.drawtask',
	// 'gantt.progress',
	// 'gantt.overlap',
	'gantt.resizeSensor'
])

/**
 * $resource for tasks to interact with RESTful server-side data sources.
 * @ngdoc factory
 * @name Task
 * @module dokuvis.tasks
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiTask
 * @requires https://github.com/urish/angular-moment moment
 */
.factory('Task', ['$resource', 'ApiParams', 'ApiTask', 'moment',
	function ($resource, ApiParams, ApiTask, moment) {

		return $resource(ApiTask + '/:id', angular.extend({ id: '@id' }, ApiParams), {
			/**
			 * Creates a new task.
			 * ```
			 * Task.save({
			 *   title: <string>,
			 *   description: <string>,
			 *   from: <string>,        // formatted date, 'YYYY-MM-DDTHH:mm:ssZ'
			 *   to: <string>,          // formatted date
			 *   priority: <number>,    // (optional) defaults to 0
			 *   editors: <Array>       // list of ids of editors
			 *   parent: <id>           // id of parent task or subproject
			 * }).$promise
			 *   .then(function (task) {...});
			 * ```
			 * @ngdoc method
			 * @name Task#save
			 * @param data {Object} Object with data
			 * @return {Resource} Saved task as Resource object.
			 */
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						date: moment().format()
					}));
				}
			},
			/**
			 * Save any changes of the task.
			 * ```
			 * task.$update().then(...);
			 * ```
			 * @ngdoc method
			 * @name Task#$update
			 * @return {Promise} Promise that resolves, if the request was succesful.
			 */
			update: {
				method: 'PUT',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, {
						date: moment().format()
					}));
				}
			}
		});

		/**
		 * Get all tasks.
		 * ```
		 * Task.query().$promise
		 *   .then(function (tasks) {...});
		 * ```
		 * @ngdoc method
		 * @name Task#query
		 * @return {Array<Resource>} Array of all tasks, each a Resource object.
		 */

		/**
		 * Get task by id.
		 * ```
		 * Task.get({ id: <id> }).$promise
		 *   .then(function (task) {...});
		 * ```
		 * @ngdoc method
		 * @name Task#get
		 * @param id {Object} Object with task id
		 * @return {Resource} Task as Resouce object.
		 */

		/**
		 * Delete task. If there are any subtasks, they will be direct children of the parent task/subproject.
		 * ```
		 * task.$delete().then(...);
		 * ```
		 * @ngdoc method
		 * @name Task#$delete
		 * @return {Promise} Promise that resolves, if the request was succesful.
		 */

	}
])

/**
 * Directive showing the gantt chart with controls.
 *
 * @ngdoc directive
 * @name tasksGantt
 * @module dokuvis.tasks
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://github.com/urish/angular-moment moment
 * @requires Task
 * @requires Subproject
 * @requires Staff
 * @requires Utilities
 * @requires https://docs.angularjs.org/api/ng/service/$log $log
 * @restrict E
 * @scope
 */
.directive('tasksGantt', ['$rootScope', '$timeout', '$q', '$stateParams', 'moment', 'Task', 'Subproject', 'Staff', 'Utilities', '$log',
	function ($rootScope, $timeout, $q, $stateParams, moment, Task, Subproject, Staff, Utilities, $log) {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.tasks/tasksGantt.tpl.html',
			scope: {},
			link: function (scope) {

				var enableInitialTask = true;

				// data
				var tasks = [];
				var projects = [];
				var staff = [];

				var activeTask = null;
				var updatedTask = null;

				// api
				var apiGlobal;
				var apiReady = $q.defer();
				var apiHierarchy;

				var deferredTaskActivate = undefined;

				// data object used by gantt (contains row and task objects)
				scope.data = [];

				// configuration
				scope.config = {
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
						// maxHeight: 300,
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
						headers: { 'model.data.editors': 'Editors' },
						// headerContents: { 'model.data.editors': '<i class="fa fa-users"></i>' },
						contents: { 'model.data.editors': '<span user-initials="ed.name" ng-repeat="ed in getValue()"></span>' }
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
				scope.registerApi = function (api) {
					apiGlobal = api;

					api.core.on.ready(scope, function () {
						$log.debug(api);
						apiHierarchy = api.tree.getHierarchy();
						apiReady.resolve();

						api.data.on.change(scope, onDataChange);

						api.tasks.on.moveEnd(scope, onTaskDateChange);

						api.tasks.on.resizeEnd(scope, onTaskDateChange);

					});

					api.directives.on.new(scope, function (dName, dScope, dElement) {

						if (dName === 'ganttBody') {
							dElement.on('click', function () {
								deactivateRow(activeTask);
								if (deferredTaskActivate)
									deferredTaskActivate.resolve();
							});
						}

						else if (dName === 'ganttTask') {
							dElement.on('click', function () {
								//console.log('task', dScope.task.model);

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
								//console.log('row', dScope);
							});
						}
					});
				};

				function onDataChange() {
					// update editors
					if (scope.config.sort.primary === 'task') {
						for (var i = 0, l = scope.data.length; i < l; i++) {
							if (scope.data[i].data.type === 'staff') continue;
							scope.data[i].data.editors = retrieveEditors(scope.data[i]);
						}
					}
					$log.debug('final', scope.data, $stateParams);

					// set active task
					if (updatedTask) {
						activateRow(getDataEntryById(updatedTask.id));
						updatedTask = null;
					}
					else if (enableInitialTask && $stateParams.initialTask) {
						activateRow(getDataEntryById($stateParams.initialTask));
						enableInitialTask = false;
					}

					// update table width
					$timeout(function () {
						apiGlobal.side.setWidth();
					});
				}

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
							scope.data = [];
							activeTask = null;

							// process data
							if (scope.config.sort.primary === 'staff')
								processStaff();
							if (scope.config.sort.primary === 'task')
								processSubprojects();
							processTasks();

						});
				}

				// get all subprojects
				function querySubprojects() {
					return Subproject.query().$promise
						.then(function (results) {
							$log.debug('Projects', results);
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
							$log.debug('Tasks', results);
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
							$log.debug('Staff', results);
							staff = results;
							scope.staff = staff;
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

						scope.data.push(row);
					});
				}

				// transform task entries into rows and tasks
				function processTasks() {
					if (scope.config.sort.primary === 'task') {
						tasks.forEach(function (task) {
							addTask(task, task.id, task.parent);
						});
					}
					else if (scope.config.sort.primary === 'staff') {
						tasks.forEach(function (task) {
							var hasEditor = false;

							staff.forEach(function (value) {
								// check if task has editor
								var found = task.editors.find(function (e) {
									return e.id === value.email;
								});

								if (!found) return;

								// new id
								var id = task.id + '_' + value.email;

								// skip if it already exists
								if (getDataEntryById(id)) return;

								addTask(task, id, task.parent + '_' + value.email);
								addParent(task.parent, value.email);

								hasEditor = true;
							});

							if (hasEditor) return;

							// if it hasn't been added yet due to lacking editor, add to 'not_assigned' group
							var id = task.id + '_' + 'not_assigned';

							// skip if it already exists
							if (getDataEntryById(id)) return;

							addTask(task, id, task.parent + '_not_assigned');
							addParent(task.parent, 'not_assigned');
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
					scope.data.push(row);
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

						scope.data.push(row);
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

						scope.data.push(row);
					});

					// add row for not-assigned tasks
					scope.data.push({
						id: 'not_assigned',
						name: '~Nicht zugewiesen~',
						data: {
							type: 'staff'
						},
						classes: ['staff-row']
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
					return scope.data.find(function (d) {
						return d.id === id;
					});
				}

				function getSubprojectById(id) {
					return projects.find(function (p) {
						return p.id === id;
					});
				}

				function getTaskById(id) {
					return tasks.find(function (t) {
						return t.id === id;
					});
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
					$log.debug(task);
					var taskResource = task.model.data.resource;
					var newFrom = moment(task.model.from).format();
					var newTo = moment(task.model.to).format();

					if (taskResource.from !== newFrom || taskResource.to !== newTo) {
						taskResource.from = newFrom;
						taskResource.to = newTo;
					}
					else return;

					$log.debug(taskResource.from, taskResource.to);
					$log.debug(taskResource);
					taskResource.$update()
						.catch(function (err) {
							Utilities.throwApiException('#Task.update', err);
						});

					if (scope.config.sort.primary === 'staff')
						updateGantt();
				}

				// select task/row
				function activateRow(row) {
					row.active = true;
					activeTask = row;
					taskActivate(row.data.resource, row);
					updateRowClasses(row);
				}

				// select task/row called from table
				scope.activateRow = function (row) {
					deactivateRow(activeTask);
					activateRow(row);
				};

				// unselect task/row
				function deactivateRow(row) {
					if (!row) return;
					row.active = false;
					activeTask = null;
					taskActivate();
					updateRowClasses(row);
					scope.$applyAsync();
				}

				// update active and status css classes
				function updateRowClasses(row) {
					if (!row) return;

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
				scope.updateSort = function (sortby) {
					scope.config.sort.primary = sortby;
					updateGantt();
				};

				// update the view scale of the gantt chart depending on the date range
				scope.updateViewScale = function () {
					var fromDate = moment(scope.config.date.from);
					var toDate = moment(scope.config.date.to);
					if (toDate.diff(fromDate, 'days') < 35)
						scope.config.date.viewScale = 'day';
					else if (toDate.diff(fromDate, 'weeks') < 20)
						scope.config.date.viewScale = 'week';
					else
						scope.config.date.viewScale = 'month';
				};

				scope.zoomAllTasks = function () {
					var tmp = scope.data.filter(function (d) {
						return d.data.type === 'task';
					});
					if (!tmp.length) return;
					console.log(tmp.length);

					// determine first date
					var firstDate = tmp.sort(function (a, b) {
						return  a.data.resource.from < b.data.resource.from ? -1 : 1;
					})[0];
					var lastDate = tmp.sort(function (a, b) {
						return a.data.resource.to > b.data.resource.to ? -1 : 1;
					})[0];

					console.log(firstDate, lastDate);
					scope.config.date.from = firstDate.data.resource.from;
					scope.config.date.to = lastDate.data.resource.to;
					scope.updateViewScale();
				};

				/**
				 * Event that gets fired, when a task in the gantt chart has been selected. If `task` and `row` are not set, the event is supposed to trigger a deactivation of the current task.
				 * @ngdoc event
				 * @name tasksGantt#taskActivate
				 * @eventType broadcast on $rootScope
				 * @param task {Task=} Selected/activated task
				 * @param row {Object=} Row object of the task
				 */
				function taskActivate(task, row) {
					$rootScope.$broadcast('taskActivate', task, row);
				}

				// listen to tasksUpdate event and update gantt
				scope.$on('tasksUpdate', function (event, task) {
					$log.debug('event tasksUpdate');
					updatedTask = task;
					updateGantt(true);
				});

				// listen to taskStatusUpdate event
				scope.$on('taskStatusUpdate', function (event, task, row) {
					var dRow = scope.data.find(function (r) {
						return r.id === row.id;
					});
					console.log(dRow, row);
					if (dRow) {
						dRow.data.status = row.data.status;
						updateRowClasses(dRow);
					}
				});

				// init
				updateGantt(true);

			}
		};

	}
])

/**
 * Directive showing details of a task.
 *
 * @ngdoc directive
 * @name taskDetail
 * @module dokuvis.tasks
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires Utilities
 * @requires https://docs.angularjs.org/api/ng/service/$log $log
 * @restrict E
 * @scope
 */
.directive('taskDetail', ['$rootScope', 'Utilities', '$log',
	function ($rootScope, Utilities, $log) {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.tasks/taskDetail.tpl.html',
			scope: {},
			link: function (scope) {

				scope.task = null;
				var taskRow = null;

				// update task status
				scope.setTaskStatus = function (status) {
					var taskResource = scope.task;
					if (!taskResource || !taskRow) return;
					if (status)
						taskResource.status = 1;
					else
						taskResource.status = 0;

					taskResource.$update()
						.then(function (result) {
							$log.debug(result);
							taskRow.data.status = taskResource.status;
							for (var i=0; i<taskRow.tasks.length; i++)
								taskRow.tasks[i].status = taskResource.status;
							taskStatusUpdate(taskResource, taskRow);
						})
						.catch(function (err) {
							Utilities.throwApiException('#Task.update', err);
						});
				};

				// listen to taskActivate event
				scope.$on('taskActivate', function (event, task, row) {
					$log.debug(task, row);
					scope.task = task;
					taskRow = row;
				});

				/**
				 * Event that gets fired, when the status of a task changed.
				 * @ngdoc event
				 * @name taskDetail#taskStatusUpdate
				 * @eventType broadcast on $rootScope
				 * @param task {Task} Task, which status has changed
				 * @param row {Object} Associated row object
				 */
				function taskStatusUpdate(task, row) {
					$rootScope.$broadcast('taskStatusUpdate', task, row);
				}
			}
		};

	}
])

/**
 * Controller for modal to create new task or edit an existing one.
 *
 * Usage in combination with `taskModal.html` template. Further information: see {@link StateModalConfiguration $state configuration for modals}.
 *
 * @ngdoc controller
 * @name taskModalCtrl
 * @module dokuvis.tasks
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://github.com/urish/angular-moment moment
 * @requires Task
 * @requires Staff
 * @requires Utilities
 * @requires ConfirmDialog
 * @requires https://docs.angularjs.org/api/ng/service/$log $log
 */
.controller('taskModalCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'moment', 'Task', 'Staff', 'Utilities', 'ConfirmDialog', '$log',
	function ($scope, $rootScope, $state, $stateParams, moment, Task, Staff, Utilities, ConfirmDialog, $log) {

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
				$scope.attachNote = 'Aufgabe wird als Aufgabe des Unterprojektes <strong>' + $rootScope.globalSubproject.name + '</strong> erstellt.';
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
					$log.debug(result);
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
			if (!$scope.task.title.length) {
				Utilities.dangerAlert('Geben Sie der Aufgabe einen Namen!');
				return;
			}
			if (!$scope.task.from.length ||
				!$scope.task.to.length ||
				!moment($scope.task.from).isValid() ||
				!moment($scope.task.to).isValid() ||
				moment($scope.task.from).isAfter($scope.task.to)) {
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

				$scope.isSaving = true;

				task.$update()
					.then(function (result) {
						$log.debug(result);
						tasksUpdate(task);
						$scope.close();
					})
					.catch(function (err) {
						Utilities.throwApiException('#Task.update', err);
						$scope.isSaving = false;
					});
			}
			else {
				if (!parent) {
					Utilities.throwException('Controller Exception', '"parent" is not set!');
					return;
				}

				$scope.isSaving = true;

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
						$log.debug(result);
						tasksUpdate(result);
						$scope.close();
					})
					.catch(function (reason) {
						Utilities.throwApiException('#Task.save', reason);
						$scope.isSaving = false;
					});
			}
		};

		/**
		 * Delete task. The user will be prompted with a confirm dialog.
		 * @ngdoc method
		 * @name taskModalCtrl#delete
		 */
		$scope.delete = function () {

			ConfirmDialog({
				headerText: 'Aufgabe löschen',
				bodyText: 'Soll die Aufgabe <b>' + task.title + '</b> wirklich gelöscht werden? <br/> \
					Alle Unteraufgaben gehen an die Oberaufgabe.'
			}).then(function () {
				task.$delete()
					.then(function (result) {
						$log.debug(result);
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
		 * Close the modal.
		 * @ngdoc method
		 * @name taskModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^');
		};

	}
]);
