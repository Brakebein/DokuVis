angular.module('dokuvisApp').controller('tasksCtrl', ['$scope','$stateParams', '$timeout', '$sce', 'phpRequest', 'mysqlRequest', 'neo4jRequest', '$http', 'Utilities','$modal', 'ganttUtils', 'GanttObjectModel', 'ganttMouseOffset', 'ganttDebounce', 'moment', 'Staff', 'Task',
	function($scope, $stateParams, $timeout, $sce, phpRequest, mysqlRequest, neo4jRequest, $http, Utilities, $modal,utils, ObjectModel, mouseOffset, debounce, moment, Staff, Task) {
		console.log($stateParams);
		$scope.project = $stateParams.project;
		$scope.subproject = $stateParams.subproject;
		$scope.sortby = 'task';

		//projectid
		$scope.pid;

		/*Resizer*/
		$scope.resizerOut = 1000;
		$scope.resizerIn = 1920;

		/*Mitarbeiter*/
		$scope.staffInGantt = [];
		$scope.staffExists= false;

		//Overlay
		$scope.overlayParams = {url: '', params: {}};


		//löschen
		$scope.removeFromGantt = [];
		$scope.removeFromGraph = [];

		/*Tasks*/
		$scope.root = [];

		$scope.newTask = new Object();
		$scope.newTask.ids = new Object();
		$scope.newTask.ids.gantt = '';
		$scope.newTask.ids.graph = '';
		$scope.newTask.staff = '';
		$scope.newTask.staffId = '';
		$scope.newTask.isStaff = '';
		$scope.newTask.clickedElement = '';
		$scope.newTask.task = '';
		$scope.newTask.from = '';
		$scope.newTask.to = '';
		$scope.newTask.desc = '';
		$scope.newTask.subprj = ''; //ausgewähltes Subproject in Masteransicht bei Aufgabe hinzufügen

		$scope.staff = [];
		$scope.nameFound = false;
		$scope.taskExists = false;

		// Kommentare
		$scope.taskNameForComment;
		$scope.taskIdForComment;
		$scope.commentIndex;
		$scope.comments = [];

		/*Tooltips*/
		$scope.tooltip = [
			{"title": "Mitarbeiter verwalten"},
			{"title": "Aufgabe hinzufügen"},
			{"title": "Nach Aufgaben sortieren"},
			{"title": "Nach Mitarbeitern sortieren"},
			{"title": "Durch den Kalender navigieren"},
			{"title": "Zoomstufe verändern"},
			{"title": "Nach Aufgaben suchen"},
			{"title": "Kommentare erstellen"},
			{"title": "Element löschen"},
			{"title": "Priorität ändern"},
			{"title": "Status ändern"},
			{"title": "Unterprojekte der Aufgaben anzeigen"},
			{"title": "Fenster schließen"},
			{"title": "Mitarbeiter hinzufügen"},
		];

		//bollean für Subprojektspalte
		$scope.showSub = false;
		$scope.recentPrjName = ''; //für Anzeige in Projektübersicht
		$scope.foundSubPrjName = ''; //gefundener Name

		$scope.editTask = false;

		/*Views*/
		$scope.views = {};
		$scope.views.activeSide = 'staff';

		$scope.newComment = {};
		$scope.newComment.text = '';

		/*Aufgaben umsortieren*/
		$scope.changeOrder = 'false';

		/*IndexDnd*/
		$scope.indexDnD;

		/*alle Unterprojekte abrufen*/
		$scope.subprojects = [];

		/*zweites Datenobjekt zum umsortieren*/
		$scope.dataTask = [];

		//hier werden alle Aufgaben gespeichert
		// row objects
		$scope.data = [{
			id: 1,
			name: 'Usabilitytest',
			isStaff: true,
			type: 'project',
			editors: ['Martin','Jonas'],
			groups: false,
			children: [],
			tasks: []
		}, {
			id: 2,
			name: 'Unterprojekt 1',
			parent: 1,
			type: 'project',
			editors: ['Martin'],
			isStaff: true,
			groups: false,
			children: [],
			tasks: []
		}, {
			id: 9,
			name: 'Aufgabe1',
			isStaff: false,
			type: 'task',
			parent: 2,
			editors: ['Martin'],
			children: [],
			status: 'zu bearbeiten',
			priority: 1,
			hasData: true,
			tasks: [{name: 'Aufgabe1', color: '#F1C232', from: moment('2017-05-20'), to: moment('2017-06-25')}]
		}, {
			id: 10,
			name: 'Aufgabe2',
			isStaff: false,
			type: 'task',
			parent: 2,
			editors: ['Martin'],
			children: [],
			status: 'erledigt',
			priority: 3,
			tasks: [{name: 'Aufgabe2', color: '#F1C232', from: moment('2017-05-20'), to: moment('2017-05-25')}]
		}, {
			id: 3,
			name: 'Unterunterprojekt 1',
			parent: 2,
			type: 'project',
			editors: ['Martin'],
			groups: 'false',
			isStaff: true,
			children: []
		}, {
			id: 5,
			name: 'Aufgabe3',
			isStaff: false,
			type: 'task',
			parent: 3,
			editors: ['Martin'],
			status: 'zu bearbeiten',
			priority: 3,
			tasks: [{name: 'Aufgabe3', color: '#F1C232', from: moment('2017-05-20'), to: moment('2017-06-01')}]
		}, {
			id: 4,
			name: 'Unterunterprojekt 2',
			parent: 2,
			type: 'project',
			editors: ['Jonas','Martin'],
			groups: 'false',
			isStaff: true,
			children: []
		}, {id: 7,
			name: 'Aufgabe4',
			isStaff: false,
			type: 'task',
			parent: 4,
			children: [],
			status: 'erledigt',
			priority: 2,
			hasData: false,
			editors: ['Jonas'],
			data: [],
			tasks: [{name: 'Aufgabe4', color: '#24ff6b', from: moment('2017-05-20'), to: moment('2017-06-15')}]
		}, {
			id: 6,
			name: 'Unterprojekt 2',
			type: 'project',
			isStaff: true,
			parent: 1,
			children: [],
			status: 'erledigt',
			priority: 3,
			hasData: false,
			editors: ['Jonas','Martin'],
			tasks: []
		}, {
			id: 8,
			name: 'Aufgabe5',
			isStaff: false,
			parent: 6,
			type: 'task',
			children: [9],
			status: 'erledigt',
			priority: 2,
			hasData: true,
			editors: ['Jonas','Martin'],
			tasks: []
		}, {
			id: 9,
			name: 'Aufgabe6',
			isStaff: false,
			parent: '',
			type: 'task',
			children: [],
			status: 'zu bearbeiten',
			priority: 2,
			hasData: false,
			editors: ['Martin'],
			tasks: [{name: 'Aufgabe6', color: '#F1C232', from: moment('2017-05-20'), to: moment('2017-06-25')}]
		}];

		$scope.config = {
			date: {
				from: moment().subtract(2, 'weeks'),
				to: moment().add(2, 'weeks'),
				viewScale: 'day'
			},
			gantt: {
				allowSideResizing: true,
				autoExpand: 'both',
				currentDate: 'line',
				currentDateValue: moment(),
				daily: true,
				expandToWidth: true,
				// filterRow: { name: '' },
				// filterTask: { name: '' },
				sideWidth: 'min-width',
				sortMode: 'model.name',
				taskOutOfRange: 'truncate',
				// viewScale: 'day',
				rowContent: '\
					<i ng-switch="row.model.type">\
						<i ng-switch-when="project" class="row-btn glyphicon glyphicon-folder-open" ng-click="scope.openDescAndComments"></i>\
						<i ng-switch-when="task" class="row-btn" ng-class="row.model.hasData ? \'fa fa-envelope\' : \'glyphicon glyphicon-file\'" ng-click="scope.openDescAndComments(row)"></i>\
					</i>\
					<span ng-class="row.model.type" ng-click="scope.openEditTaskForm(row)"> {{row.model.name}}</span>\
					<i class="row-btn fa fa-plus" bs-tooltip="tooltip[1]" ui-sref=".detail({taskId: \'new\', parent: {id: row.model.id, name: row.model.name}})"></i>',
				taskContent: '{{task.model.name}} <i class="task-btn fa fa-pencil" ui-sref=".detail({taskId: task.model.id})"></i>'
			},
			tree: {
				header: 'Projektstruktur'
			},
			table: {
				columns: ['model.editors'],
				headers: { 'model.editors': 'Bearbeiter' },
				headerContents: { 'model.editors': '<i class="fa fa-users"></i>' },
				formatters: {
					'model.editors': function (value) {
						if (Array.isArray(value)) {
							var merged = [];
							for (var i = 0; i < value.length; i++)
								merged.push(value[i]);
							return merged.join(', ');
						}
						else
							return value;
					}
				}
			},
			tooltips: {
				content: '{{task.model.name}}</br>' +
					'<small>{{task.isMilestone() === true && task.model.from.format("ll") || task.model.from.format("ll") + \' - \' + task.model.to.format("ll")}}</small>'
			}
		};

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

		console.log('config', $scope.config);

		// Konfiguration der Tabelle
		$scope.options = {
			useData: $scope.data,		// welches Datenobjekt
			canDraw: function(event) {	//Möglichkeit zum Zeichnen von Aufgaben
				var isLeftMouseButton = event.button === 0 || event.button === 1;
				return $scope.options.draw && !$scope.options.readOnly && isLeftMouseButton;
			},
			drawTaskFactory: function() { // Zeichnen
				return {
					id: utils.randomUuid(),  // Unique id of the task.
					name: 'Drawn task', // Name shown on top of each task.
					color: '#AA8833' // Color of the task in HEX format (Optional).
				};
			},
			columnsHeaders: {'trash': 'Löschen', 'model.priority': 'Priorität',  'model.status': 'Status', 'model.editors': 'Bearbeiter', 'model.subprj' : 'Unterprojekt'}, // Beschriftung der Kopfzeile

			columnsHeaderContents: { //Icons in Tabellenkopf
				'model.editors': '<i class="fa fa-users"></i>',
				'trash': '<i class="glyphicon glyphicon-trash" id="colHead"></i>',
				'model.priority': '<i class="fa fa-flag" id="colHead" bs-tooltip="tooltip[9]" ng-click="scope.sortDataBy(\'priority\')"></i>',
				'model.status': '<i  class="glyphicon glyphicon-ok" id="colHead" ng-click="scope.sortDataBy(\'status\')" ></i>',
				'model.subprj': '<i class="fa fa-folder-open"></i>'
			},
			columnsContents: { // Werte in Spalten
				'model.editors': '{{getValue()}}',
				'trash': '<i class="glyphicon glyphicon-trash" id="row" ng-click = "scope.deleteTask(row)" bs-tooltip="tooltip[8]"></i>',
				'model.priority': '<i  bs-tooltip="tooltip[9]" ng-switch= "getValue()" ng-click="scope.changePriority(row)"><i ng-switch-when=0 class="fa fa-flag" id="lowPriority"></i><i ng-switch-when=1 class="fa fa-flag" id="mediumPriority"></i><i ng-switch-when=2 class="fa fa-flag" id="highPriority"></i></i>',
				//'edit': '<i  ng-hide ="row.model.isStaff" class="fa fa-pencil" id="row" bs-tooltip="tooltip[1]" ng-click="scope.openEditTaskForm(row)" > </i>',
				'model.status': '<i bs-tooltip="tooltip[10]" ng-hide = "row.model.isStaff" ng-class="getValue() == 1 ? \'glyphicon glyphicon-ok\' : \'fa fa-exclamation\'" id= "row" ng-click="scope.changeStatus(row)"></i>',
			},
			//Inhalt eines Eintrages in der Tabelle
			rowContent: '	<!--<i ng-hide ="row.model.isStaff" ng-class="row.model.hasData == true ?  \'fa fa-comment-o\' : \'fa fa-comment-o\'" \
				ng-click="scope.showAsideForComment(row)" bs-tooltip="tooltip[7]"> </i> -->\
				<i ng-switch = "row.model.type" > <i ng-switch-when = \'project\' ng-class = "\'glyphicon glyphicon-folder-open\'" ng-click="scope.openDescAndComments(row)"></i><i ng-switch-when = \'task\' ng-class = "row.model.hasData == true ? \'fa fa-envelope\' : \'glyphicon glyphicon-file\'" ng-click="scope.openDescAndComments(row)"></i></i>\
				<i ng-class = "row.model.isStaff == true ? \'parent\': \'child\'" ng-click = scope.openEditTaskForm(row)>{{row.model.name}}</i>\
				<i class="fa fa-plus" id="row" bs-tooltip="tooltip[1]" ng-click="scope.openNewTaskForm(row)" ></i>',
			zoom: 1.3,
			filterTask: '', //durchsucht Taskmodel --> Balken rechts
			filterRow: '', //durchsucht Rowmodel --> Tabelle links
			api: function(api) { //Eventsteuerung
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

                api.core.on.ready($scope, function(){
                    //api.core.on.ready($scope, logReadyEvent);

                    api.data.on.remove($scope, addEventName('data.on.remove', logDataEvent)); //um Aufgaben zu löschen

                    api.side.on.resizeEnd($scope, addEventName('labels.on.resizeEnd', adaptToWidth));    //wird gerufen, sobald Breite der Tabelle geändert wird

                    if (api.tasks.on.moveBegin) { // Änderung der Balken
                        api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', changeTask));
                        api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', changeTask));
                    }

                    api.side.setWidth(350); // setzt Breite der Tabelle
                    $scope.sideWidth= api.side.getWidth(); //holt sich Breite der Tabelle

                });


                api.directives.on.new($scope, function(directiveName, directiveScope, element) { // Event, wenn auf Balken geklickt wird
                    if (directiveName === 'ganttTask') {
                        element.bind('click', function(event) {
                            event.stopPropagation();
                            /* logTaskEvent('task-click', directiveScope.task); */
                            $scope.openEditTaskForm(directiveScope.task);
                        });
                    }
                });


            }
		};

		var apiGlobal;

		// listen to events from angular gantt
		$scope.registerApi = function (api) {
			apiGlobal = api;
			api.core.on.ready($scope, function () {
				console.log(api);

				api.data.on.change($scope, function (newData, oldData) {
					console.log('data.on.change', newData, oldData);
				});

				api.tasks.on.moveEnd($scope, onTaskDateChange);

				api.tasks.on.resizeEnd($scope, onTaskDateChange);
			});
		};

		// get all tasks
		function queryTasks() {
			Task.query().$promise
				.then(function (results) {
					console.log(results);
					var rows = processTasks(results);
					console.log(rows);
					$scope.data = rows;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Task.query', err);
				});
		}

		// transform db results into rows and tasks
		function processTasks(data) {
			return data.map(function (task) {
				return {
					id: task.id,
					name: task.title,
					parent: task.parent,
					tasks: [{
						id: task.id,
						name: task.title,
						from: task.from,
						to: task.to,
						data: {
							type: task.type,
							priority: task.priority,
							editors: task.editors,
							resource: task
						},
						classes: getTaskClass('priority', task.priority)
					}]
				};
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
		}

		function onTaskDateChange(task) {
			console.log(task);
			var taskResource = task.model.data.resource;
			taskResource.from = moment(task.model.from).format();
			taskResource.to = moment(task.model.to).format();
			console.log(taskResource.from, taskResource.to);
			console.log(taskResource);
			taskResource.$update()
				.catch(function (err) {
					Utilities.throwApiException('#Task.update', err);
				})
		}

		$scope.$on('tasksUpdate', function () {
			console.log('event tasksUpdate');
			queryTasks();
		});

        //Funktionen für Gantt

        $scope.canAutoWidth = function(scale) { //passt Breite der Tabelle links an
            if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
                return false;
            }
            return true;
        };
		function getFormattedDate(date) {
			var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes				() + ":" + date.getSeconds();
			return str;
		}

        $scope.getColumnWidth = function(widthEnabled, scale, zoom) {
            if (!widthEnabled && $scope.canAutoWidth(scale)) {

                return undefined;
            }

            if (scale.match(/.*?week.*?/)) {

                return 150 * zoom;
            }

            if (scale.match(/.*?month.*?/)) {

                return 300 * zoom;
            }

            if (scale.match(/.*?quarter.*?/)) {

                return 500 * zoom;
            }

            if (scale.match(/.*?year.*?/)) {

                return 800 * zoom;
            }

            return 40 * zoom;
        };

        //Neues Zeug --> Nach Treffen am 21.4. 2016
        $scope.fillDataObjectAC = function(sortby){ // liest Aufgabenobjekte und Unterprojekten ein, allerdings nur eine Unterprojektebene
            //Mitarbeiter einfügen
            neo4jRequest.getAllSubprojects($stateParams.project).then(function(response){
                if(response.data.exception) { console.error('neo4jRequest Exception on getTasksFromProject()', response.data); return; }
                if(response.data){
                    //console.log(response.data);
                    $scope.subprojects = Utilities.cleanNeo4jData(response.data);
                    console.log($scope.subprojects);
                }
                return neo4jRequest.getTasksFromSubproject($stateParams.project,$stateParams.project)
            }).then(function(response){ //Aufgaben holen
                if(response.data.exception) { console.error('neo4jRequest Exception on getTasksFromSubproject()', response.data); return; }
                if(response.data.data.length > 0){

                    //$scope.root = Utilities.createHierarchy(response.data,['name','desc','priority','status','editors','editorNames','from','to'], false)[1];
                    //console.log(response.data);
                    //console.log(Utilities.createHierarchy(response.data, false));
                    $scope.root = [];
                    for(i = 0; i < Utilities.createHierarchy(response.data, false).length; i++){

                        $scope.root.push(Utilities.createHierarchy(response.data,['title','name','desc','priority','status','editors','from','to','amountComments'], false)[i]);

                    }
                    console.log($scope.root);
                }
                else{
                    $scope.root = [];
                }
                //Anzeige der Aufgaben unter Bearbeiter --> den Teil überarbeiten
                if(sortby == 'staff'){
                    //Bearbeiter hinzufügen
                    var mId = Utilities.getUniqueId();

                    $scope.data.push({id: mId,
                        graphId: $stateParams.project,
                        name: $scope.recentPrjName,
                        isStaff: true,
                        'groups': false,
                        //'movable': false,
                        type: 'project',
                        children: [],
                        tasks: []
                    });
                    $.each($scope.subprojects, function(index){
                        var sId = Utilities.getUniqueId();
                        var currentSub = $scope.subprojects[index].title;
                        //console.log({name: Utilities.cleanNeo4jData(response.data)[index].editorName});
                        $scope.data.push({id: sId,
                            graphId: $scope.subprojects[index].subId,
                            name: $scope.subprojects[index].title,
                            isStaff: true,
                            'groups': false,
                            //'movable': false,
                            type: 'project',
                            parent: mId,
                            children: [],
                            tasks: []
                        });

                        //Aufgabenstruktur hinzufügen
                        console.log($scope.root);
                        for(j = 0; j < $scope.root.length; j++){ //im Masterprojekt werden meherere Rootknoten ausgelesen
                            if($scope.root[j].children){
                                $.each($scope.root[j].children, function(indexC) {
                                    //Kommentare für Aufgabe
                                    console.log(currentSub);
                                    console.log($scope.root[j]);
                                    if($scope.root[j].parentName.indexOf(currentSub) != -1){

                                        var id = Utilities.getUniqueId();

                                        var rowTask = {
                                            id: id,
                                            graphId: $scope.root[j].children[indexC].content,
                                            subprj:  $scope.root[j].parentName,
                                            name: $scope.root[j].children[indexC].name,
                                            isStaff: false,
                                            parent: sId,
                                            children: [],
                                            desc: $scope.root[j].children[indexC].desc,
                                            status: $scope.root[j].children[indexC].status,
                                            priority: $scope.root[j].children[indexC].priority,
                                            hasData:  $scope.root[j].children[indexC].amountComments == 0 ? false : true,
                                            data: [],
                                            editors: $scope.root[j].children[indexC].editors,
                                            type: 'task',
                                            tasks: [{graphId:$scope.root[j].children[indexC].content,
                                                name: $scope.root[j].children[indexC].name,
                                                color: $scope.root[j].children[indexC].status == 0 ? '#F1C232' : '#24ff6b',
                                                from: $scope.root[j].children[indexC].from,
                                                to: $scope.root[j].children[indexC].to}]
                                        };




                                        $scope.data.push(rowTask);

                                        if($scope.root[j].children[indexC].children.length>0){ //wenn Kindobjekte vorhanden sind
                                            pushChildren($scope.root[j].children[indexC].children, rowTask);
                                            console.log($scope.root[j].children[indexC].children);
                                        }

                                    }


                                    function pushChildren(children, parentRow) {

                                        $.each(children,function(indexR){
                                            console.log(currentSub);
                                            console.log(children[indexR]);
                                            //if(children[indexR].parentName.indexOf(currentSub) != -1){
                                            var id = Utilities.getUniqueId();
                                            /* console.log(children[indexR]);  */

                                            parentRow.children.push(id);

                                            if(children[indexR].editors.length == 1){
                                                var newRow = {	id: id,
                                                    graphId: children[indexR].content,
                                                    name: children[indexR].name,
                                                    isStaff: false,
                                                    parent: [],
                                                    children: [],
                                                    subprj:  $scope.root[j].parentName,
                                                    desc: children[indexR].desc,
                                                    status: children[indexR].status,
                                                    priority: children[indexR].priority,
                                                    hasData: children[indexR].amountComments == 0 ? false : true,
                                                    data:[],
                                                    editors: children[indexR].editors,
                                                    type: 'task',
                                                    tasks: [{graphId:children[indexR].content,
                                                        name: children[indexR].name,
                                                        color: children[indexR].status == 0 ? '#F1C232' : '#24ff6b',
                                                        from: children[indexR].from,
                                                        to: children[indexR].to}]
                                                };
                                                $scope.data.push(newRow);
                                                pushChildren(children[indexR].children, newRow);
                                            }
                                            //}
                                        });
                                    }
                                });


                            }
                        }
                    });

                }
                //Anzeige der Bearbeiter hinter Aufgabe
                else{

                    for(j = 0; j < $scope.root.length; j++){
                        $.each($scope.root[j].children, function(indexC) {
                            //console.log('gefunden');
                            var id = Utilities.getUniqueId();
                            var rowTask = {
                                id: id,
                                graphId: $scope.root[j].children[indexC].content,
                                subprj:  $scope.root[j].parentName,
                                name: $scope.root[j].children[indexC].name,
                                isStaff: false,
                                parent: [],
                                children: [],
                                desc: $scope.root[j].children[indexC].desc,
                                status: $scope.root[j].children[indexC].status == 'status_done' ? 1 : 0,
                                priority: $scope.root[j].children[indexC].priority,
                                hasData: $scope.root[j].children[indexC].amountComments == 0 ? false : true,
                                data: [],
                                editors: [],
                                tasks: [{graphId:$scope.root[j].children[indexC].content,
                                    name: $scope.root[j].children[indexC].name,
                                    color: $scope.root[j].children[indexC].status == 0 ? '#F1C232' : '#24ff6b',
                                    from: $scope.root[j].children[indexC].from,
                                    to: $scope.root[j].children[indexC].to}]
                            };
                            rowTask.editors = $scope.root[j].children[indexC].editors;
                            $scope.dataTask.push(rowTask);

                            if($scope.root[j].children[indexC].children.length>0){ //wenn Kindobjekte vorhanden sind
                                pushChildren($scope.root[j].children[indexC].children, rowTask);
                            }


                            function pushChildren(children, parentRow) {

                                $.each(children,function(indexR){

                                    var id = Utilities.getUniqueId();
                                    console.log(children[indexR]);

                                    parentRow.children.push(id);
                                    //console.log(parentRow);

                                    if(children[indexR].editors.length == 1){
                                        var newRow = {	id: id,
                                            graphId: children[indexR].content,
                                            subprj:  $scope.root[j].parentName,
                                            name: children[indexR].name,
                                            isStaff: false,
                                            parent: [],
                                            children: [],
                                            desc: children[indexR].desc,
                                            status: children[indexR].status == 'status_done' ? 1 : 0,
                                            priority: children[indexR].priority,
                                            hasData: children[indexR].amountComments == 0 ? false : true,
                                            data: [],
                                            editors: [],
                                            editorIds: children[indexR].editorIds,
                                            tasks: [{	graphId:children[indexR].content,
                                                name: children[indexR].name,
                                                color: children[indexR].status == 0 ? '#F1C232' : '#24ff6b',
                                                from: children[indexR].from,
                                                to: children[indexR].to}]
                                        };
                                        newRow.editors = children[indexR].editors;
                                        $scope.dataTask.push(newRow);
                                        pushChildren(children[indexR].children, newRow);
                                    }

                                });
                            }
                            // console.log($scope.root);

                        });
                    }
                }

                console.log($scope.options.useData);
            });
        };

        $scope.addNewTaskAC = function(){ //neue Aufgaben aus Popup hinzufügen
            var gid = Utilities.getUniqueId();
            var tid = Utilities.getUniqueId();
            var hier= $scope.api.tree.getHierarchy();
            console.log ($scope.newTask.clickedElement.mode);

            $scope.extractEditorData();

            //für Unteraufgabe
            if($scope.newTask.clickedElement.model){
                $scope.options.useData.push({id: tid, graphId: gid, type: 'task', name: $scope.newTask.task, isStaff: false, parent: [], children: [], editors: $scope.editorNames,subprj: $scope.subproject, priority: 2, status: 0, desc: $scope.newTask.desc,
                    tasks: [{id: tid, graphId: gid, name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});

                //children der Oberaufgabe hinzufügen
                $scope.newTask.clickedElement.model.children.push(tid);

                neo4jRequest.addTaskAC($stateParams.project, $scope.newTask.clickedElement.model.graphId , gid, $scope.newTask.task,$scope.newTask.desc,$scope.editorIds
                    ,getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
                    .then(function(response){
                        console.log(response.data);
                    });

            }

            //für Oberaufgabe
            else{
                $scope.options.useData.push({id: tid, graphId: gid, name: $scope.newTask.task, isStaff: false, parent: [], children: [], editors: $scope.editorNames,subprj: $scope.subproject, priority: 2, status: 0, desc: $scope.newTask.desc,
                    tasks: [{id: tid, graphId: gid, name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});

                neo4jRequest.addTaskAC($stateParams.project, $stateParams.subproject, gid, $scope.newTask.task,$scope.newTask.desc,$scope.editorIds
                    ,getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
                    .then(function(response){
                        console.log(response.data);
                    });
            }

        };

        $scope.extractEditorData = function(){	// extrahiert Editordaten aus Eintrag
            $.each($scope.newTask.clickedElement.editors,function(i){
                $scope.editorNames.push($scope.newTask.clickedElement.editors[i].name);
                $scope.editorIds.push($scope.newTask.clickedElement.editors[i].sid);
            });
            console.log($scope.editorIds);
            console.log($scope.editorNames);
        };

        $scope.openNewTaskForm = function(row) { // öffnet Popup für neue Aufgaben

            //$scope.newTask.clickedElement = '';
            $scope.newTask.clickedElement= row;
            console.log($scope.newTask.clickedElement);

            $scope.modalParams = {
                modalType: 'medium'
                // type: type,
                // attachTo: attach || undefined,
            };
            $modal({
                title: 'Neues Objekt anlegen',
                templateUrl: 'partials/modals/_modalTpl.html',
                contentTemplate: 'partials/modals/newTask.html',
                // controller: 'insertSourceCtrl',
                scope: $scope,
                show: true
            });
        };

        $scope.openEditTaskForm = function(row) { //öffnet Popup zum Editieren
            $scope.newTask.clickedElement = row.model;
            console.log($scope.newTask.clickedElement.editors);
            $scope.modalParams = {
                modalType: 'medium',
                // type: type,
                // attachTo: attach || undefined,
            };
            $modal({
                title: 'Objekt editieren',
                templateUrl: 'partials/modals/_modalTpl.html',
                contentTemplate: 'partials/modals/editTask.html',
                // controller: 'insertSourceCtrl',
                scope: $scope,
                show: true
            });
        }

        $scope.openDescAndComments = function(row) { //Popup für Kommentare und Beschreibungen
            $scope.newTask.clickedElement = row.model;
            console.log($scope.newTask.clickedElement.editors);
            $scope.modalParams = {
                modalType: 'medium',
                // type: type,
                // attachTo: attach || undefined,
            };
            $modal({
                title: 'Beschreibung ansehen und Kommentare verfassen',
                templateUrl: 'partials/modals/_modalTpl.html',
                contentTemplate: 'partials/modals/descAndComments.html',
                // controller: 'insertSourceCtrl',
                scope: $scope,
                show: true
            });
        }

        //$scope.showAsideForComment = function(row){ //Seitenmenü für Kommentare

        function getFormattedDate(date) {
            var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes				() + ":" + date.getSeconds();
            return str;
        }

        function addDays(date, days) {
            var result = new Date(date);
            result.setDate(date.getDate() + days);
            return result;
        }


        //Altes Zeug

        $scope.sortDataBy = function(by) { // sortiert nach Status und Prioritöt --> halbwegse
            switch(by){
                case "priority":
                    $scope.options.sortMode === 'model.priority' ? $scope.options.sortMode = '-model.priority' : $scope.options.sortMode = 'model.priority';
                    break;
                case "status":
                    //alert('test');
                    $scope.options.sortMode === 'model.status' ? $scope.options.sortMode = '-model.status' : $scope.options.sortMode = 'model.status';
                    break;
            }
        }
        $scope.fillDataObject = function(sortby){ // liest Aufgaben ein
            //Mitarbeiter einfügen
            neo4jRequest.getStaffFromProject($stateParams.project).then(function(response){
                if(response.data.exception) { console.error('neo4jRequest Exception on getTasksFromProject()', response.data); return; }
                if(response.data){
                    //console.log(response.data);
                    $scope.editors = Utilities.cleanNeo4jData(response.data);
                    //console.log($scope.editors);
                }
                return $stateParams.subproject == 'master' ? neo4jRequest.getTasksFromSubproject($stateParams.project,$stateParams.project) : neo4jRequest.getTasksFromSubproject($stateParams.project,$stateParams.subproject)
            }).then(function(response){ //Aufgaben holen
                if(response.data.exception) { console.error('neo4jRequest Exception on getTasksFromSubproject()', response.data); return; }
                if(response.data.data.length > 0){

                    //$scope.root = Utilities.createHierarchy(response.data,['name','desc','priority','status','editors','editorNames','from','to'], false)[1];
                    //console.log(response.data);
                    //console.log(Utilities.createHierarchy(response.data, false));
                    $scope.root = [];
                    for(i = 0; i < Utilities.createHierarchy(response.data, false).length; i++){
                        $scope.root.push(Utilities.createHierarchy(response.data,['name','desc','priority','status','editors','editorNames','from','to','amountComments'], false)[i]);
                    };
                    console.log($scope.root);
                }
                else{
                    $scope.root = [];
                }
                //Anzeige der Aufgaben unter Bearbeiter
                if(sortby == 'staff'){
                    //Bearbeiter hinzufügen
                    $.each($scope.editors, function(index){
                        var eId = Utilities.getUniqueId();
                        var currentEditor = $scope.editors[index].editorId;
                        //console.log({name: Utilities.cleanNeo4jData(response.data)[index].editorName});
                        $scope.data.push({id: eId,
                            graphId: $scope.editors[index].editorId,
                            name: $scope.editors[index].editorName,
                            isStaff: true,
                            'groups': false,
                            //'movable': false,
                            children: [],
                            tasks: []
                        });

                        //Aufgabenstruktur hinzufügen

                        for(j = 0; j < $scope.root.length; j++){ //im Masterprojekt werden meherere Rootknoten (unterschiedliche Unterprojekte) ausgelesen
                            if($scope.root[j].children){
                                $.each($scope.root[j].children, function(indexC) {
                                    //Kommentare für Aufgabe
                                    //console.log($scope.root[j].children[indexC].content);
                                    if($scope.root[j].children[indexC].editors.indexOf(currentEditor) != -1){

                                        var id = Utilities.getUniqueId();

                                        var rowTask = {
                                            id: id,
                                            graphId: $scope.root[j].children[indexC].content,
                                            subprj:  $scope.root[j].parentName,
                                            name: $scope.root[j].children[indexC].name,
                                            isStaff: false,
                                            parent: eId,
                                            children: [],
                                            desc: $scope.root[j].children[indexC].desc,
                                            status: $scope.root[j].children[indexC].status,
                                            priority: $scope.root[j].children[indexC].priority,
                                            hasData:  $scope.root[j].children[indexC].amountComments == 0 ? false : true,
                                            data: [],
                                            editors: $scope.root[j].children[indexC].editors,
                                            tasks: [{graphId:$scope.root[j].children[indexC].content,
                                                name: $scope.root[j].children[indexC].name,
                                                color: $scope.root[j].children[indexC].status == 0 ? '#F1C232' : '#24ff6b',
                                                from: $scope.root[j].children[indexC].from,
                                                to: $scope.root[j].children[indexC].to}]
                                        };




                                        $scope.data.push(rowTask);

                                        if($scope.root[j].children[indexC].children.length>0){ //wenn Kindobjekte vorhanden sind
                                            pushChildren($scope.root[j].children[indexC].children, rowTask);
                                        }

                                    }


                                    function pushChildren(children, parentRow) {

                                        $.each(children,function(indexR){

                                            if(children[indexR].editors.indexOf(currentEditor) != -1){
                                                var id = Utilities.getUniqueId();
                                                /* console.log(children[indexR]);  */

                                                parentRow.children.push(id);

                                                if(children[indexR].editors.length == 1){
                                                    var newRow = {	id: id,
                                                        graphId: children[indexR].content,
                                                        name: children[indexR].name,
                                                        isStaff: false,
                                                        parent: [],
                                                        children: [],
                                                        subprj:  $scope.root[j].parentName,
                                                        desc: children[indexR].desc,
                                                        status: children[indexR].status,
                                                        priority: children[indexR].priority,
                                                        hasData: children[indexR].amountComments == 0 ? false : true,
                                                        data:[],
                                                        editors: children[indexR].editors,
                                                        tasks: [{graphId:children[indexR].content,
                                                            name: children[indexR].name,
                                                            color: children[indexR].status == 0 ? '#F1C232' : '#24ff6b',
                                                            from: children[indexR].from,
                                                            to: children[indexR].to}]
                                                    };
                                                    $scope.data.push(newRow);
                                                    pushChildren(children[indexR].children, newRow);
                                                }
                                            }
                                        });
                                    }
                                });


                            }
                        }
                    });

                }
                //Anzeige der Bearbeiter hinter Aufgabe, hier wird Bearbeiter nicht in Tabelle eingelesen
                else{
                    for(j = 0; j < $scope.root.length; j++){
                        $.each($scope.root[j].children, function(indexC) {
                            //console.log('gefunden');
                            var id = Utilities.getUniqueId();
                            var rowTask = {
                                id: id,
                                graphId: $scope.root[j].children[indexC].content,
                                subprj:  $scope.root[j].parentName,
                                name: $scope.root[j].children[indexC].name,
                                isStaff: false,
                                parent: [],
                                children: [],
                                desc: $scope.root[j].children[indexC].desc,
                                status: $scope.root[j].children[indexC].status == 'status_done' ? 1 : 0,
                                priority: $scope.root[j].children[indexC].priority,
                                hasData: $scope.root[j].children[indexC].amountComments == 0 ? false : true,
                                data: [],
                                editors: $scope.root[j].children[indexC].editorNames,
                                tasks: [{graphId:$scope.root[j].children[indexC].content,
                                    name: $scope.root[j].children[indexC].name,
                                    color: $scope.root[j].children[indexC].status == 0 ? '#F1C232' : '#24ff6b',
                                    from: $scope.root[j].children[indexC].from,
                                    to: $scope.root[j].children[indexC].to}]
                            };

                            $scope.dataTask.push(rowTask);

                            if($scope.root[j].children[indexC].children.length>0){ //wenn Kindobjekte vorhanden sind
                                pushChildren($scope.root[j].children[indexC].children, rowTask);
                            }


                            function pushChildren(children, parentRow) {

                                $.each(children,function(indexR){

                                    var id = Utilities.getUniqueId();
                                    console.log(children[indexR]);

                                    parentRow.children.push(id);
                                    //console.log(parentRow);

                                    if(children[indexR].editors.length == 1){
                                        var newRow = {	id: id,
                                            graphId: children[indexR].content,
                                            subprj:  $scope.root[j].parentName,
                                            name: children[indexR].name,
                                            isStaff: false,
                                            parent: [],
                                            children: [],
                                            desc: children[indexR].desc,
                                            status: children[indexR].status == 'status_done' ? 1 : 0,
                                            priority: children[indexR].priority,
                                            hasData: children[indexR].amountComments == 0 ? false : true,
                                            data: [],
                                            editors: children[indexR].editorNames,
                                            tasks: [{	graphId:children[indexR].content,
                                                name: children[indexR].name,
                                                color: children[indexR].status == 0 ? '#F1C232' : '#24ff6b',
                                                from: children[indexR].from,
                                                to: children[indexR].to}]
                                        };
                                        $scope.dataTask.push(newRow);
                                        pushChildren(children[indexR].children, newRow);
                                    }

                                });
                            }
                            // console.log($scope.root);

                        });
                    }
                }

                console.log($scope.options.useData);
            });



        }

        $scope.addNewTask = function (newTask){	// fügt neue Aufgabe hinzu
            var gid = Utilities.getUniqueId();
            var tid = Utilities.getUniqueId();
            var hier= $scope.api.tree.getHierarchy();
            $scope.editTask = false;
            $scope.findPrjName($scope.newTask.subprj)
            var subPrjName = $scope.foundSubPrjName;
            $scope.foundSubPrjName = '';

            /* console.log(hier.ancestors(row)[hier.ancestors(row).length-1].model.name); */
            $.each($scope.options.useData,function(index){

                if($scope.options.useData[index].name == $scope.newTask.task){
                    $scope.taskExists = 'true';
                    return false;
                }
            });

            if($scope.taskExists == 'true'){ //wenn Aufgabe schon existiert
                if(confirm('Diese Aufgabe existiert bereits! Wollen Sie die Aufgaben verknüpfen?')){
                    neo4jRequest.getTaskDates($stateParams.project, $scope.newTask.task)//Daten aus Aufgabe in DB holen und einfügen
                        .then(function(response) {
                            var response = Utilities.cleanNeo4jData(response.data);//neue Aufgabe in Gantt einfügen, aber ohne id!!
                            //Unterscheidung ob bei Bearbeiter oder aufgabe einzufügen //TODO
                            $scope.options.useData.push({
                                graphId: response[0].graphId,
                                name: response[0].name,
                                isStaff: false,
                                parent: $scope.newTask.staff,
                                children: [],
                                editors: [response[0].editors],
                                /* subprj:  response[0].parentName, */
                                priority: response[0].priority,
                                status: response[0].status,
                                desc: response[0].desc,

                                tasks: [{graphId: response[0].graphId,
                                    name: response[0].name,
                                    color: response[0].status == 0 ? '#F1C232' : '#24ff6b',
                                    from: response[0].from,
                                    to: response[0].to}]});

                            return neo4jRequest.connectTasks($stateParams.project, $stateParams.subproject, response[0].graphId, $scope.newTask.ids.graph) //Aufgabe mit neuem Bearbeiter verbinden
                        })
                        .then(function(response){
                            $scope.newTask.ids.graph = '';
                            $scope.newTask.ids.gantt = '';
                            $scope.newTask.staff = '';
                            $scope.newTask.staffId = '';
                            $scope.newTask.isStaff = '';
                            $scope.newTask.clickedElement = '';
                            $scope.newTask.task = '';
                            $scope.newTask.from = '';
                            $scope.newTask.to = '';
                            $scope.newTask.desc = '';
                            $scope.newTask.subprj = '';
                        });

                }
                $scope.taskExists = false;
            }

            else{
                if($scope.sortby == 'staff'){ //sortiert nach Bearbeitern
                    if($scope.newTask.isStaff == true){ //wenn auf Bearbeiter geklickt wurde

                        $scope.options.useData.push({id: tid, graphId: gid, name: $scope.newTask.task, isStaff: false, parent: $scope.newTask.ids.gantt, children: [], editors: $scope.newTask.ids.gantt,subprj: subPrjName, priority: 2, status: 0, desc: $scope.newTask.desc,
                            tasks: [{id: tid, graphId: gid, name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});



                        if($scope.subproject == 'master'){ //wenn master dann an ausgewähltes Unterprojekt anhängen
                            if($scope.newTask.subpj != ''){
                                neo4jRequest.addTask($stateParams.project, $scope.newTask.subprj, gid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.ids.graph
                                    ,getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
                                    .then(function(response){

                                    });
                            }

                            else{
                                alert('Bitte weisen sie der Aufgabe ein Unterprojekt zu!');
                            }
                        }

                        else{ //anhängen an Subprojekt -->$stateParams.subproject
                            neo4jRequest.addTask($stateParams.project, $stateParams.subproject, gid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.ids.graph
                                ,getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
                                .then(function(response){
                                    console.log(response.data);
                                });
                        }
                    }

                    else{ // wenn auf Aufgabe oder Unteraufgabe geklickt wurde
                        //hinzufügen der Unteraufgabe
                        $scope.options.useData.push({id: tid, graphId: gid, name: $scope.newTask.task,isStaff: false, children: [], editors: $scope.newTask.ids.gantt,subprj: subPrjName, priority: 2, status: 0,desc: $scope.newTask.desc,
                            tasks: [{id: tid, graphId: gid, name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});
                        //als child zu übergeordnetem Element hinzufügen
                        console.log($scope.newTask.clickedElement.model);
                        $scope.newTask.clickedElement.model.children.push(tid);
                        //anhängen an parenttask --> statt $stateParams.subproject --> clickedElement


                        neo4jRequest.addTask($stateParams.project, $scope.newTask.clickedElement.model.graphId, gid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.ids.graph
                            , getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
                            .then(function(response){
                                console.log(response.data);
                            })


                        $scope.newTask.clickedElement.tasks = []; //daten aus parent für gruppierung löschen
                        console.log($scope.newTask.clickedElement.model.graphId);

                        neo4jRequest.deleteTaskDates($stateParams.project, $scope.newTask.clickedElement.model.graphId)
                            .then(function(response){
                                console.log('element gelöscht')
                                console.log(response.data);
                            });


                        $scope.newTask.ids.graph = '';
                        $scope.newTask.ids.gantt = '';
                        $scope.newTask.staff = '';
                        $scope.newTask.staffId = '';
                        $scope.newTask.isStaff = '';
                        $scope.newTask.clickedElement = '';
                        $scope.newTask.task = '';
                        $scope.newTask.from = '';
                        $scope.newTask.to = '';
                        $scope.newTask.desc = '';
                        $scope.newTask.subprj = '';
                        $scope.taskExists = false;

                    }
                }

                else{ //sortiert nach Aufgaben
                    if($scope.subproject == 'master'){ //wenn master dann an ausgwähltes Subproject anhängen

                        if($scope.newTask.subprj != ''){ //wenn subprj ausgewählt

                            neo4jRequest.addTask($stateParams.project, $scope.newTask.subprj, gid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.ids.graph
                                ,getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
                                .then(function(response){

                                });
                        }

                        else{
                            alert('Bitte weisen sie der Aufgabe ein Unterprojekt zu!');
                        }
                    }

                    else{//in Unterprojekt neue Aufgabe oder Unteraufgabe hinzufügen
                        if($scope.newTask.clickedElement){//wenn Aufgabe geklickt
                            //Unteraufgabe erstellen
                            console.log($scope.newTask.clickedElement)
                            $scope.options.useData.push({id: tid, graphId: gid, name: $scope.newTask.task, isStaff: false, children: [],subprj: subPrjName, editors: $scope.newTask.ids.gantt, priority: 2, status: 0, data: [],
                                tasks: [{id: tid, graphId: gid, name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});

                            $scope.newTask.clickedElement.model.children.push(tid);
                            $scope.newTask.clickedElement.tasks = []; //daten aus parent für gruppierung löschen
                            neo4jRequest.deleteTaskDates($stateParams.project, $scope.newTask.clickedElement.model.graphId) //...auch in DB
                                .then(function(response){
                                    console.log('element gelöscht')
                                    console.log(response.data);
                                });

                            neo4jRequest.addTask($stateParams.project, $scope.newTask.clickedElement.model.graphId, gid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.ids.graph
                                ,getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
                                .then(function(response){
                                    console.log(response.data);
                                });

                            $scope.newTask.ids.graph = '';
                            $scope.newTask.ids.gantt = '';
                            $scope.newTask.staff = '';
                            $scope.newTask.staffId = '';
                            $scope.newTask.isStaff = '';
                            $scope.newTask.clickedElement = '';
                            $scope.newTask.task = '';
                            $scope.newTask.from = '';
                            $scope.newTask.to = '';
                            $scope.newTask.desc = '';
                            $scope.newTask.subprj = '';
                            $scope.taskExists = false;

                        }

                        else{//button für neue Aufgabe
                            $scope.options.useData.push({id: tid, graphId: gid, name: $scope.newTask.task, isStaff: false, children: [],subprj: subPrjName, editors: $scope.newTask.ids.gantt, priority: 2, status: 0, data: [],
                                tasks: [{id: tid, graphId: gid, name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});

                            neo4jRequest.addTask($stateParams.project, $stateParams.subproject, gid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.ids.graph
                                ,getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
                                .then(function(response){
                                    console.log(response.data);
                                });

                        }

                    }

                }


            }
            $scope.resizerValue = $scope.resizerIn;
        }

        $scope.getIndex = function(event, ui, indexStaff){ // Indexermittlung für Drag and Drop aus Seitenmenü
            /*console.log(indexStaff);*/
            $scope.indexDnD = indexStaff;
        }

        /* $scope.addNewStaffToGantt = function(){ // fügt Bearbeiter in Tabelle ein --> nach DnD
         //Mitarbeiter existiert bereits?
         if($scope.sortby == 'staff'){
         $.each($scope.data,function(index){
         if($scope.staff[$scope.indexDnD].name == $scope.data[index].name){
         $scope.staffExists = true;
         return false;
         }
         });

         if($scope.staffExists == true){
         alert('Nutzer existiert leider schon!');
         $scope.staffExists = false;
         }
         else{
         $scope.data.push({graphId: $scope.staff[$scope.indexDnD].sid, name: $scope.staff[$scope.indexDnD].name, isStaff: true, 'groups': false, children: [], tasks:[]});
         $scope.staffInGantt.push({editorId: $scope.staff[$scope.indexDnD].sid, editorName: $scope.staff[$scope.indexDnD].name});

         neo4jRequest.addStaffToGraph($stateParams.project, $scope.staff[$scope.indexDnD].sid, $scope.staff[$scope.indexDnD].name) .then(function(response){
         if(response.data.exception) { console.error('neo4jRequest Exception on addStaffToGraph()', response.data); return; }
         if(response.data){
         console.log('Bearbeiter hinzugefügt');
         }

         });

         $scope.staffExists = false;
         console.log($scope.data);
         }
         }

         else{
         alert('Bitte ändern Sie die Sortierung!');
         }

         }

         $scope.getStaffFromGraph = function(){
         neo4jRequest.getStaffFromProject ($stateParams.project).then(function(response){
         if(response.data.exception) { console.error('neo4jRequest Exception on getStaffFromGraph()', response.data); return; }
         if(response.data){
         $scope.staffInGantt = Utilities.cleanNeo4jData(response.data)
         console.log($scope.staffInGantt);
         }
         });
         } */

        $scope.changeOrder = function(){	// schaltet zwischen mitarbeiterzentrierter und aufgabenzentrierte Ansicht um
            if($scope.sortby == 'staff'){
                $scope.dataTask = [];
                $scope.fillDataObject('task');
                $scope.options.columns.push('model.editors');
                $scope.options.useData = $scope.dataTask;
                $scope.sortby = 'task';
            }
            else{
                $scope.data = [];
                $scope.options.useData = $scope.data;
                console.log($scope.data);
                $scope.fillDataObject('staff');
                console.log($scope.options.columns.indexOf('model.editors'));
                $scope.options.columns.splice($scope.options.columns.indexOf('model.editors'),1);
                $scope.sortby = 'staff';
            }
        }

        $scope.changeStatus = function(row){ // ändert Status
            switch(row.model.status){
                case 0 :
                    if(confirm("Ist die Aufgabe wirklich erledigt?")){
                        neo4jRequest.changeStatus($stateParams.project, row.model.graphId, 'status_todo','status_done') .then(function(response){
                            if(response.data.exception) { console.error('neo4jRequest Exception on changeStatus()', response.data); return; }
                            if(response.data){
                                console.log(response.data);
                                $.each($scope.options.useData,function(index){
                                    if(row.model.graphId == $scope.options.useData[index].graphId){
                                        $scope.options.useData[index].status = 1;
                                        $scope.options.useData[index].tasks[0].color = '#24ff6b';
                                    }
                                });
                            }
                        });
                    }
                    break;


                case 1:
                    neo4jRequest.changeStatus($stateParams.project, row.model.graphId, 'status_done','status_todo') .then(function(response){
                        if(response.data.exception) { console.error('neo4jRequest Exception on changeStatus()', response.data); return; }
                        if(response.data){
                            $.each($scope.options.useData,function(index){
                                if(row.model.graphId == $scope.options.useData[index].graphId){
                                    console.log(response.data);
                                    $scope.options.useData[index].status = 0;
                                    $scope.options.useData[index].tasks[0].color = '#F1C232';
                                }
                            });
                        }
                    });
                    break;
            }
        };

        $scope.changePriority = function(row){ // ändert Priorität
            switch(row.model.priority) {
                case 0:
                    neo4jRequest.changePriority($stateParams.project, row.model.graphId, 'priority_low','priority_medium') .then(function(response){
                        if(response.data.exception) { console.error('neo4jRequest Exception on changePriority()', response.data); return; }
                        if(response.data){
                            $.each($scope.options.useData,function(index){
                                if(row.model.graphId == $scope.options.useData[index].graphId){
                                    console.log("priority changed");
                                    $scope.options.useData[index].priority = 1;
                                }
                            });
                        }
                    });
                    break;

                case 1:
                    neo4jRequest.changePriority($stateParams.project, row.model.graphId, 'priority_medium','priority_high') .then(function(response){
                        if(response.data.exception) { console.error('neo4jRequest Exception on changePriority()', response.data); return; }
                        if(response.data){
                            $.each($scope.options.useData,function(index){
                                if(row.model.graphId == $scope.options.useData[index].graphId){
                                    console.log("priority changed");
                                    $scope.options.useData[index].priority = 2;
                                }
                            });
                        }
                    });
                    break;

                case 2:
                    neo4jRequest.changePriority($stateParams.project, row.model.graphId, 'priority_high','priority_low') .then(function(response){
                        if(response.data.exception) { console.error('neo4jRequest Exception on changePriority()', response.data); return; }
                        if(response.data){
                            $.each($scope.options.useData,function(index){
                                if(row.model.graphId == $scope.options.useData[index].graphId){
                                    console.log("priority changed");
                                    $scope.options.useData[index].priority = 0;
                                }
                            });
                        }
                    });
                    break;
            }

        };

        function countTask(task) { // zählt, wie oft Aufgabe in Array vorkommt
            var counter = 0;
            console.log(task.graphId);
            console.log($scope.options.useData[0].graphId);
            console.log(task.isStaff);
            $.each($scope.options.useData,function(index){ //durchzählen, wie oft Aufgabe in Datenobjekt vorkommt
                if(task.graphId == $scope.options.useData[index].graphId){
                    counter++;
                }
            });
            return counter
        }

        $scope.deleteTask = function(row) { //Aufgaben löschen
            var hier= $scope.api.tree.getHierarchy();

            if(confirm("Wollen Sie diese Aufgabe wirklich löschen?")){
                if(hier.children(row)){ //wenn oberaufgabe gelöscht werden soll
                    // alert('test1');
                    $.each(hier.descendants(row),function(indexC){ //alle childrenobjekte raussuchen und zum löschen übergeben
                        if (countTask(row.model) <= 1 && !row.model.isStaff){ // Aufgabe nur einmal da --> Aus Graph und Gantt komplett löschen
                            // alert('test2');
                            $scope.removeFromGantt.push({'id': hier.descendants(row)[indexC].model.id});
                            $scope.removeFromGraph.push({'gid': hier.descendants(row)[indexC].model.graphId});
                            $scope.removeFromGantt.splice(0,0,{'id': row.model.id}); //Elternobjekt zum löschen übergeben
                            $scope.removeFromGraph.splice(0,0,{'gid': row.model.graphId});
                            $scope.api.data.remove($scope.removeFromGantt); // aus Gantt löschen
                            $scope.deleteSingleTask(0);	 // Tasks aus Graph löschen
                        }

                        if (countTask(row.model) > 1 && !row.model.isStaff){ //ansonsten nur Zuständigkeit löschen
                            // alert('test3');
                            $scope.removeFromGantt.push({'id': row.model.id});
                            $scope.api.data.remove($scope.removeFromGantt); // aus Gantt löschen

                            neo4jRequest.disconnectTask($stateParams.project,row.model.graphId,hier.ancestors(row)[hier.ancestors(row).length-1].model.graphId) //löst Verbindung zu Mitarbeiter
                                .then(function(response){
                                    console.log(response.data);
                                });
                        }

                    });
                }
                else{ //Unteraufgabe löschen
                    if(hier.parent(row)){
                        if(hier.parent(row).model.children.length == 1){ //prüfen, ob letztes Kindelement, wenn ja, kopieren der Daten auf Parentaufgabe --> Anzeige der Gruppen
                            hier.parent(row).model.tasks.push({name: hier.parent(row).model.name, color: '#F1C232',from: row.model.tasks[0].from,to: row.model.tasks[0].to});

                            neo4jRequest.setTaskDates($stateParams.project,hier.parent(row).model.graphId, row.model.tasks[0].from, row.model.tasks[0].to)
                                .then(function(response){
                                    console.log(response.data);
                                });
                        }
                    }

                    if (countTask(row.model) <= 1){ // Aufgabe nur einmal da --> Aus Graph und Gantt komplett löschen
                        $scope.removeFromGantt.push({'id': row.model.id});
                        $scope.removeFromGraph.push({'gid': row.model.graphId});
                        $scope.api.data.remove($scope.removeFromGantt); // aus Gantt löschen
                        $scope.deleteSingleTask(0);	 // Tasks aus Graph löschen

                        if(hier.children(row)){
                            hier.parent(row).model.children.splice(hier.parent(row).model.children.indexOf(row.model.id,1)); //childrenobjekt in parent löschen
                        }

                    }
                    else{ //Aufgabe öfter da --> nur Zuständigkeit löschen
                        $scope.removeFromGantt.push({'id': row.model.id});
                        $scope.api.data.remove($scope.removeFromGantt); // aus Gantt löschen

                        neo4jRequest.disconnectTask($stateParams.project,row.model.graphId,hier.ancestors(row)[hier.ancestors(row).length-1].model.graphId) //löst Verbindung zu Mitarbeiter
                            .then(function(response){
                                console.log(response.data);
                            });

                        if(hier.children(row)){
                            hier.parent(row).model.children.splice(hier.parent(row).model.children.indexOf(row.model.id,1)); //childrenobjekt in parent löschen
                        }
                    }

                }
                if(row.model.isStaff){// Bearbeiter löschen

                    $.each(hier.descendants(row),function(indexC){ //alle childrenobjekte raussuchen und zum löschen übergeben
                        $scope.removeFromGantt.push({'id': hier.descendants(row)[indexC].model.id});
                        console.log(hier.descendants(row)[indexC].model.id);
                    });
                    $scope.removeFromGantt.splice(0,0,{'id': row.model.id}); //Elternobjekt zum löschen übergeben
                    $scope.api.data.remove($scope.removeFromGantt); // aus Gantt löschen

                    neo4jRequest.deleteStaff($stateParams.project,row.model.graphId).then(function(response){
                        console.log($stateParams.project);
                        console.log(response.data);
                    });
                }
            }
        };

        /* Wenn Klick auf Mitarbeiter-->
         alles durchgehen
         schauen, wie oft vorhanden
         wenn nur einmal, aus Graph löschen
         wenn nicht, nur Zuständigkeit

         Wenn Klick auf Oberaufgabe-->
         alles durchgehen
         schauen, wie oft vorhanden
         wenn nur einmal, aus Graph löschen
         wenn nicht, nur Zuständigkeit

         Wenn Klick auf Unteraufgabe-->
         alles durchgehen
         schauen, wie oft vorhanden
         wenn nur einmal, aus Graph löschen
         wenn nicht, nur Zuständigkeit
         */

        $scope.deleteSingleTask = function(index){ //löscht einzelne oder mehrere Aufgaben in Datenbank --> wird rekursiv aufgerufen
            neo4jRequest.deleteTask($stateParams.project, $scope.removeFromGraph[index].gid)
                .then(function(response){
                    index++;
                    if(index<$scope.removeFromGraph.length){
                        $scope.deleteSingleTask(index);
                    }
                });

        };

        $scope.openTask = function(row){ //öffnet Seitenmenü für neue Aufgabe

            var hier= $scope.api.tree.getHierarchy();
            $scope.resizerValue = $scope.resizerOut;
            $scope.views.activeSide = 'newTask';
            $scope.editTask = false;

            $scope.newTask.subprj= '';
            $scope.newTask.ids.graph='';
            $scope.newTask.staff='';
            $scope.newTask.task='';
            $scope.newTask.from='';
            $scope.newTask.to='';
            $scope.newTask.desc='';

            if($scope.sortby == 'staff'){//sortiert nach Bearbeitern
                if(row.model.isStaff == true){ //wenn angeklicktes Element BEarbeiter
                    $scope.newTask.ids.gantt = row.model.id //BearbeiterId in gantt
                    $scope.newTask.ids.graph= row.model.graphId; //BearbeiterId in graph
                    $scope.newTask.staffId= row.model.graphId;
                    $scope.newTask.clickedElement= row;
                    $scope.newTask.staff= row.model.name;
                    $scope.newTask.isStaff = row.model.isStaff;
                }

                else{//wenn angeklicktes Element Aufgabe

                    console.log(hier.ancestors(row)[hier.ancestors(row).length-1]); //ermittelt letztes element in Array--> ist immer Bearbeiter
                    if(hier.ancestors(row)[hier.ancestors(row).length-1]){
                        $scope.newTask.ids.gantt = hier.ancestors(row)[hier.ancestors(row).length-1].model.id
                        $scope.newTask.ids.graph = hier.ancestors(row)[hier.ancestors(row).length-1].model.graphId ////klcik auf Aufgabe ermittelt root-Element -->Bearbeiter
                        $scope.newTask.staffId = hier.ancestors(row)[hier.ancestors(row).length-1].model.graphId
                        $scope.newTask.staff= hier.ancestors(row)[hier.ancestors(row).length-1].model.name;
                        $scope.newTask.clickedElement= row;
                        $scope.newTask.isStaff = row.model.isStaff;
                        console.log($scope.newTask.clickedElement.model.name);
                    }
                }
            }
            else{ //sortiert nach Aufgabe
                if(row){ //in ganttChart angeklickt
                    $scope.newTask.clickedElement= row;
                }

                else{//durch Button geöffnet
                }
            }

        }

        $scope.openStaff = function(){ // Mitarbeiterverwaltung
            $scope.resizerValue = $scope.resizerOut;
            $scope.views.activeSide = 'staff';
        }

        $scope.openComment = function(row){ // Kommentarmenü
            $scope.resizerValue = $scope.resizerOut;
            $scope.views.activeSide = 'comments';
            $scope.taskIdForComment = row.model.graphId;
            $scope.taskNameForComment = row.model.name;
            $scope.description = row.model.desc;

            neo4jRequest.getCommentsFromTask(row.model.graphId)
                .then(function(response){
                    if(response.data.exception) { console.error('neo4jRequest Exception on getCommentFromTask()', response.data); return; }
                    if(response.data){
                        $scope.comments = Utilities.cleanNeo4jData(response.data);
                        console.log($scope.comments);
                    }
                });
        }

        $scope.addComment = function(){ //sendet Kommentar
            if($scope.newComment.text){
                $scope.comments.push({desc: $scope.newComment.text,  date: new Date() });

                $.each($scope.data,function(index){
                    if($scope.options.useData[index].graphId == $scope.taskIdForComment){ //-->in allen Aufgaben mit gleichem Namen steht Kommenta
                        if($scope.options.useData[index].hasData == false){
                            $scope.options.useData[index].hasData = true;
                        }
                    }
                });

                neo4jRequest.addCommentToTask($stateParams.project,$scope.taskIdForComment, $scope.newComment.text)
                    .then(function(response){
                        console.log(response.data);
                    });

                $scope.newComment.text = '';
            }
        }

        $scope.getAllSubprojects = function(){ //liest alle Unterprojekte ein
            neo4jRequest.getAllSubprojects ($stateParams.project).then(function(response){
                if(response.data.exception) { console.error('neo4jRequest Exception on getAllSubProjects()', response.data); return; }
                if(response.data){
                    $scope.subprojects = Utilities.cleanNeo4jData(response.data)
                    $scope.findPrjName($stateParams.subproject);
                    $scope.recentPrjName= $scope.foundSubPrjName;
                    $scope.foundSubPrjName = '';
                    /* console.log($scope.subprojects); */
                }
            });

        }

        $scope.showSubprj = function(){ // zeigt in Masteransicht die Unterprojekte zu den Aufgaben an
            if($scope.showSub == false){
                $scope.options.columns.push('model.subprj');
                $scope.showSub = true;
            }
            else{
                $scope.options.columns.splice($scope.options.columns.indexOf('model.subprj'),1);
                $scope.showSub = false;
            }

        }

        $scope.findPrjName = function (toFind){ // sucht namen des aktuellen Unterprojekts heraus --> für Anzeige in Navigation
            $.each($scope.subprojects,function(indexS){
                if($scope.subprojects[indexS].subId == toFind){
                    $scope.foundSubPrjName=$scope.subprojects[indexS].title;
                    console.log($scope.foundSubPrjName);
                    return false;
                }
                else{
                    $scope.foundSubPrjName='gesamt';
                }
            });
        }

        $scope.openEdit = function(row){ // öffnet Seitenmenü zum Editieren
            $scope.resizerValue = $scope.resizerOut;
            $scope.views.activeSide = 'newTask';
            $scope.editTask = true;
            var hier= $scope.api.tree.getHierarchy();

            //$scope.newTask.subprj= row.model.subprj;
            $scope.newTask.ids.graph=row.model.graphId;
            $scope.newTask.staff=hier.parent(row).model.name;
            $scope.newTask.staffId = hier.ancestors(row)[hier.ancestors(row).length-1].model.graphId;
            $scope.newTask.task=row.model.name;
            $scope.newTask.from=row.model.tasks[0].from;
            $scope.newTask.to=row.model.tasks[0].to;
            $scope.newTask.desc=row.model.desc;

        }

        $scope.saveTaskChanges = function() { //speichert Änderungen

            $.each($scope.options.useData,function(indexT){
                if($scope.newTask.ids.graph == $scope.options.useData[indexT].graphId){
                    $scope.options.useData[indexT].parent = $scope.newTask.staffId;
                    $scope.options.useData[indexT].name = $scope.newTask.task;
                    $scope.options.useData[indexT].tasks[0].from = $scope.newTask.from;
                    $scope.options.useData[indexT].tasks[0].to = $scope.newTask.to;
                    $scope.options.useData[indexT].desc = $scope.newTask.desc;
                }
            });

            neo4jRequest.editTask($stateParams.project, $scope.newTask)
                .then(function(response){
                    console.log(response.data);

                    $scope.newTask.staffId = '';
                    $scope.newTask.task = '';
                    $scope.newTask.from = '';
                    $scope.newTask.to = '';
                    $scope.newTask.desc = '';
                });

            $scope.resizerValue = $scope.resizerIn;
        }

        /*Mitarbeiter*/

        $scope.getPid = function(){
            mysqlRequest.getProjectEntry($stateParams.project).then(function(response) {
                if(!response.data) { console.error('mysqlRequest failed on getProjectEntry()', response); return; }
                $scope.pid = response.data.pid;
                //alert($scope.pid);
                //$scope.getAllStaff($scope.pid);
            });
        }

        $scope.getAllStaff = function(pid) {

            mysqlRequest.getAllStaff(pid).then(function(response){
                if(!response.data) { console.error('mysqlRequest failed on getAllStaff()', response); return; }
                $scope.staff = response.data;
                console.log($scope.staff);
            });
        };

        function queryStaff() {
			Staff.query().$promise.then(function (result) {
				$scope.staff = result;
			}, function (err) {
				Utilities.throwApiException('on Staff.query()', err);
			});
		}

        var changeTask = function(eventName, task) {
            $.each($scope.options.useData,function(index){
                console.log($scope.options.useData[index].graphId);
                console.log(task.model);
                if($scope.options.useData[index].graphId == task.model.graphId){
                    $scope.options.useData[index].tasks[0].from = task.model.from ;
                    $scope.options.useData[index].tasks[0].to = task.model.to;
                }
            });
            console.log(task.model);
            neo4jRequest.setTaskDates($stateParams.project,task.model.graphId, task.model.from, task.model.to)
                .then(function(response){
                    console.log(response.data);
                });

            $scope.api.groups.refresh();
        };


        var logDataEvent = function(eventName) {
            // console.log('[Event] ' + eventName);
        };

        // Event utility function
        var addEventName = function(eventName, func) {
            return function(data) {
                return func(eventName, data);
            };
        };


        //initiiere alles
        $scope.getPid();
        //console.log($scope.pid);
        //$scope.getAllSubprojects();
		queryTasks();
		queryStaff();
        $scope.fillDataObject('task');
        //$scope.getStaffFromGraph();

		$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
			// if (fromState.name === 'project.tasks.detail')
			// 	queryTasks();
		});

    }]);
