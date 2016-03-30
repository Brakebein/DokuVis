var webglControllers = angular.module('webglControllers', ['uiSlider', 'angularFileUpload', 'pw.canvas-painter',
	'gantt',
	'gantt.table',
	'gantt.movable', 
	'gantt.tooltips',
	'gantt.sortable',
    'gantt.drawtask',
    'gantt.bounds',
    'gantt.progress',
    'gantt.tree',
    'gantt.groups',
    'gantt.overlap',
    'gantt.resizeSensor'
]);

app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});

webglControllers.controller('navCtrl', ['$scope', '$state', '$window', 'UserAuthFactory', 'AuthenticationFactory', 'Utilities',
	function($scope, $state, $window, UserAuthFactory, AuthenticationFactory, Utilities) {
		
		$scope.user = {
			email: '',
			password: ''
		};
		
		$scope.login = function() {
			var email = $scope.user.email,
				password = $scope.user.password;
			
			if(email.length === 0) { Utilities.dangerAlert('Ungültige Emailadresse!'); return; }
			if(password.length === 0) { Utilities.dangerAlert('Ungültiges Passwort!'); return; }
			
			UserAuthFactory.login(email, password)
				.success(function(data) {
					AuthenticationFactory.isLogged = true;
					AuthenticationFactory.user = data.user.email;
					AuthenticationFactory.userName = data.user.name;
					//AuthenticationFactory.userRole = data.user.role;
					
					$window.localStorage.token = data.token;
					$window.localStorage.user = data.user.email;
					$window.localStorage.userName = data.user.name;
					//$window.localStorage.userRole = data.user.role;
					
					$state.go('projectlist');
				})
				.error(function(status) {
					Utilities.throwException('Login', 'failed', status);
				});
	};
		
		$scope.logout = function() {
			UserAuthFactory.logout();
		};
		
	}]);
	
webglControllers.controller('registerCtrl', ['$scope', '$state', '$window', 'UserAuthFactory', 'AuthenticationFactory', 'Utilities',
	function($scope, $state, $window, UserAuthFactory, AuthenticationFactory, Utilities) {
		
		$scope.userRegister = {
			email: '',
			name: '',
			password1: '',
			password2: ''
		};
		
		$scope.register = function() {
			var email = $scope.userRegister.email,
				username = $scope.userRegister.name,
				password1 = $scope.userRegister.password1,
				password2 = $scope.userRegister.password2;
			
			if(password1 !== password2) { Utilities.dangerAlert('Die Passwörter stimmen nicht überein!'); return; }
			if(email.length === 0) { Utilities.dangerAlert('Bitte geben Sie eine Emailadresse ein!'); return; }
			if(username.length === 0) { Utilities.dangerAlert('Bitte geben Sie einen Nutzernamen ein!'); return; }
			if(password1.length < 5) { Utilities.dangerAlert('Passwort hat nicht genügend Zeichen (mind. 6)!'); return; }
			
			UserAuthFactory.register(email, username, password1)
				.success(function(data) {
					AuthenticationFactory.isLogged = true;
					AuthenticationFactory.user = data.user.email;
					AuthenticationFactory.userName = data.user.name;
					//AuthenticationFactory.userRole = data.user.role;
					
					$window.localStorage.token = data.token;
					$window.localStorage.user = data.user.email;
					$window.localStorage.userName = data.user.name;
					//$window.localStorage.userRole = data.user.role;
					
					$state.go('projectlist');
				})
				.error(function(status) {
					Utilities.throwException('Register', 'failed', status);
				});
		};
		
	}]);

webglControllers.controller('homeCtrl', ['$scope',
	function($scope) {
		
	}]);

webglControllers.controller('projectCtrl',
	function($scope, $state, $stateParams, $window) {
	
		console.log('projectCtrl init');
		
		console.log($stateParams);
	
		$scope.project = $stateParams.project;
		
		$scope.toProjectList = function() {
			var url = $state.href('projectlist');
			$window.open(url, '_blank');
		};
		
		$scope.$on('modal.show', function(){
			console.log('modal show')
			var zIndex = 1040 + (10 * $('.modal:visible').length);
			$(this).css('z-index', zIndex);
			$('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
		});
		
	});
	
webglControllers.controller('projHomeCtrl', ['$scope', '$stateParams', 'APIRequest', 'neo4jRequest', 'Utilities',
	function($scope, $stateParams, APIRequest, neo4jRequest, Utilities) {
		
		$scope.isMaster = $stateParams.subproject === 'master' ? true : false;
		
		$scope.projInfo = {};
		
		$scope.editor = {};
		$scope.editor.input = '';
		$scope.editor.show = false;
		$scope.editor.edit = false;
		$scope.editor.editId = '';
		
		$scope.subprojects = [];
		
		$scope.newSubproj = {};
		$scope.newSubproj.title = '';
		$scope.newSubproj.desc = '';
		$scope.newSubproj.show = false;
		
		// init
		if($stateParams.subproject === 'master') {
			getProjectInfoFromTable();
			getAllSubprojects();
		}
		else
			getSubprojectInfo();
		getProjectInfoFromNodes();
		
		function getProjectInfoFromTable() {
			APIRequest.getProjectEntry($stateParams.project).then(function(response) {
				if(!response.data) { console.error('mysqlRequest failed on getProjectEntry()', response); return; }
				$scope.projInfo.name = response.data.name;
				$scope.projInfo.description = response.data.description;
			});
		}
		function getProjectInfoFromNodes() {
			neo4jRequest.getProjInfos($stateParams.project, $stateParams.subproject).then(function(response) {
				if(response.data.exception) { console.error('neo4jRequest Exception on getProjInfos()', response.data); return; }
				if(response.data) $scope.projInfo.notes = Utilities.cleanNeo4jData(response.data);
				console.log($scope.projInfo);
			});
		}
		function getSubprojectInfo() {
			neo4jRequest.getSubprojectInfo($stateParams.project, $stateParams.subproject).then(function(response) {
				if(response.data.exception) { console.error('neo4jRequest Exception on getSubprojectInfo()', response.data); return; }
				var cdata = Utilities.cleanNeo4jData(response.data)[0];
				$scope.projInfo.name = cdata.name;
				$scope.projInfo.description = cdata.desc;
				console.log(response.data);
			});
		}
		function getAllSubprojects() {
			neo4jRequest.getAllSubprojects($stateParams.project).then(function(response) {
				if(response.data.exception) { console.error('neo4jRequest Exception on getAllSubprojects()', response.data); return; }
				if(response.data) $scope.subprojects = Utilities.cleanNeo4jData(response.data);
				console.log($scope.subprojects);
			});
		}
		
		$scope.addProjInfo = function() {
			if($scope.editor.input.length === 0) return;
			neo4jRequest.addProjInfo($stateParams.project, $stateParams.subproject, $scope.editor.input).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on addProjInfo()', response.data); return; }
				console.log(response.data);
				$scope.closeEditor();
				getProjectInfoFromNodes();
			});
		};
		$scope.editProjInfo = function() {
			neo4jRequest.editProjInfo($stateParams.project, $stateParams.subproject, $scope.editor.editId, $scope.editor.input).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on editProjInfo()', response.data); return; }
				console.log(response.data);
				$scope.closeEditor();
				getProjectInfoFromNodes();
			});
		};
		$scope.removeProjInfo = function(id) {
			neo4jRequest.removeProjInfo($stateParams.project, $stateParams.subproject, id).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on removeProjInfo()', response.data); return; }
				getProjectInfoFromNodes();
			});
		};
		
		$scope.swapInfoOrder = function(oldIndex, newIndex) {
			neo4jRequest.swapProjInfoOrder($stateParams.project, $stateParams.subproject, $scope.filteredInfos[oldIndex].id, $scope.filteredInfos[newIndex].id).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on swapProjInfoOrder()', response.data); return; }
				getProjectInfoFromNodes();
			});
		};
		
		$scope.openEditor = function(editId, html) {
			if(editId) {
				$scope.editor.editId = editId;
				$scope.editor.edit = true;
				$scope.editor.input = html;
			}
			$scope.editor.show = true;
		};
		
		$scope.closeEditor = function() {
			$scope.editor.input = '';
			$scope.editor.show = false;
			$scope.editor.edit = false;
			$scope.editor.editId = '';
		};
		
		$scope.closeNewSubproj = function() {
			$scope.newSubproj.title = '';
			$scope.newSubproj.desc = '';
			$scope.newSubproj.show = false;
		};
		
		$scope.outputInput = function() {
			console.log($scope.editor.input);
		};
		
		// subprojects
		$scope.createSubproject = function() {
			if($scope.newSubproj.title.length === 0) return;
			neo4jRequest.createSubproject($stateParams.project, $scope.newSubproj.title, $scope.newSubproj.desc).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on createSubproject()', response.data); return; }
				console.log(response.data);
				$scope.closeNewSubproj();
				getAllSubprojects();
			});
		};
		
	}]);

webglControllers.controller('indexEditCtrl', ['$scope', '$stateParams', 'phpRequest', 
	function($scope, $stateParams, phpRequest) {
		
		$scope.blacklist = [];
		$scope.whitelist = [];
		
		var currBlacklist = [];
		var currWhitelist = [];
		
		function getIndex() {
			phpRequest.getWhitelist($stateParams.project)
				.then(function(response){
					$scope.whitelist = response.data.split(" ");
					console.log($scope.whitelist);
					return phpRequest.getIndex($stateParams.project);
				})
				.then(function(response){
					$scope.blacklist = response.data.replace(/(\r\n|\n|\r)/gm,"").split(" ");
					$scope.blacklist.splice(0,4);
					console.log($scope.blacklist);
					for(var i=0; i<$scope.whitelist.length; i++) {
						var index = $scope.blacklist.indexOf($scope.whitelist[i]);
						if(index > -1) $scope.blacklist.splice(index, 1);
					}
				});
		}
		function getBlacklist() {
			phpRequest.getBlacklist($stateParams.project).then(function(response){
				console.log(response);
				currBlacklist = response.data.split(" ");
				console.log(currBlacklist);
			});
		}
		
		getIndex();
		getBlacklist();
		
		$scope.addToWhitelist = function(entry) {
			$scope.blacklist.splice($scope.blacklist.indexOf(entry), 1);
			$scope.whitelist.push(entry);
		};
		
		$scope.removeFromWhitelist = function(entry) {
			$scope.whitelist.splice($scope.whitelist.indexOf(entry), 1);
			$scope.blacklist.push(entry);
		};
		
		$scope.updateIndex = function() {
			phpRequest.setNewBlacklist($stateParams.project, currBlacklist.concat($scope.blacklist))
				.then(function(response){
					if(response.data !== 'SUCCESS') {
						console.error('setNewBlacklist failed');
					}
					return phpRequest.setNewWhitelist($stateParams.project, $scope.whitelist);
				})
				.then(function(response){
					if(response.data !== 'SUCCESS') {
						console.error('setNewWhitelist failed');
					}
					return phpRequest.indexDocuments($stateParams.project);
				}).then(function(response){
					console.log(response.data);
					getIndex();
					getBlacklist();
				});
		};
		
	}]);

webglControllers.controller('categoryEditCtrl',
	function($scope, $stateParams, APIRequest, Utilities, APIRequest) {
		
		$scope.categories = [];
		
		// color picker settings
		$scope.minicolors = {
			control: 'wheel',
			opacity: true,
			position: 'bottom left',
			format: 'rgb',
			changeDelay: 200
		};
		
		
		function getAllCategories() {
			APIRequest.getAllCategories().then(function(response) {
				console.log(response);
				$scope.categories = Utilities.cleanNeo4jData(response.data);
			}, function(err) {
				Utilities.throwApiException('on getAllCategories()', err);
			});
		};
		getAllCategories();
		
		$scope.addCategory = function() {
			if(!$scope.newCategory) return;
			var category = {
				value: $scope.newCategory,
				id: Utilities.getUniqueId() + '_category',
				attributes: []
			};
			
			APIRequest.createCategory(category.id, category.value).then(function(response) {
				$scope.categories.push(category);
				$scope.newCategory = '';
			}, function(err) {
				Utilities.throwApiException('on createCategory()', err);
			});
		};
		
		$scope.removeCategory = function(category) {
			APIRequest.deleteCategory(category.id).then(function(response) {
				$scope.categories.splice($scope.categories.indexOf(category), 1);
			}, function(err) {
				Utilities.throwApiException('on deleteCategory()', err);
			});
		};
		
		$scope.updateCategory = function(cid, value) {
			APIRequest.updateCategory(cid, value).then(function(response) {}, function(err) {
				Utilities.throwApiException('on updateCategory()', err);
			});
		};
		
		$scope.addAttribute = function(category) {
			if(!category.newAttribute) return;
			var attribute = {
				value: category.newAttribute,
				id: Utilities.getUniqueId() + '_categoryAttr',
				color: getRandomColor()
			};
			
			APIRequest.createCategoryAttribute(category.id, attribute).then(function(response) {
				category.attributes.push(attribute);
				category.newAttribute = '';
			}, function(err) {
				Utilities.throwApiException('on createCategoryAttribute()', err);
			});
		};
		
		$scope.removeAttribute = function(category, attribute) {
			APIRequest.deleteCategoryAttribute(category.id, attribute.id).then(function(response) {
				category.attributes.splice(category.attributes.indexOf(attribute), 1);
			}, function(err) {
				Utilities.throwApiException('on deleteCategoryAttribute()', err);
			});
		};
		
		$scope.updateAttribute = function(cid, id, value) {
			APIRequest.updateCategoryAttribute(category.id, attribute.id, value).then(function(response) {}, function(err) {
				Utilities.throwApiException('on updateCategoryAttribute()', err);
			});
		};
		
		$scope.updateColor = function(cid, id, value) {
			APIRequest.updateCategoryAttribute(cid, id, null, value).then(function(response) {}, function(err) {
				Utilities.throwApiException('on updateCategoryAttribute()', err);
			});
		};
		
		var getRandomColor = function () {
			var letters = '0123456789ABCDEF'.split('');
			var color = '#';
			for (var i = 0; i < 6; i++ ) {
				color += letters[Math.round(Math.random() * 15)];
			}
			return color;
        };
		
	});

webglControllers.controller('insertSourceCtrl', ['$scope', '$stateParams', 'FileUploader', 'neo4jRequest', 'Utilities', '$timeout', '$modal',
	function($scope, $stateParams, FileUploader, neo4jRequest, Utilities, $timeout, $modal) {
		
		
		// init
		var isInserting = false;
		
		var imageTypes = ['jpg','png','jpeg','bmp','gif','tiff'];
		var textTypes = ['pdf'];
		
		//$scope.insert = $scope.$parent.overlayParams;
		//$scope.insert.project = $scope.$parent.project;
		$scope.insert = {params: {type: 'text', attachTo: undefined}};
		$scope.insert.phpurl = '';
		
		$scope.uploadType = $scope.$parent.$parent.modalParams.type;
		$scope.attachTo = $scope.$parent.$parent.modalParams.attachTo;
		
		console.log('attach', $scope.attachTo);
		
		$scope.insert.formTitle = '';
		//console.log($scope.insert, $scope.$parent.project);
		
		$scope.globals = {};
		$scope.globals.type = $scope.insert.params.type;
		$scope.globals.author = '';
		$scope.globals.useAuthor = false;
		$scope.globals.creationDate = '';
		$scope.globals.useCreationDate = false;
		$scope.globals.creationPlace = '';
		$scope.globals.useCreationPlace = false;
		
		$scope.suggestions = [];
		$scope.archives = [];
		
		
		var uploader = $scope.uploader = new FileUploader({
            url: $scope.insert.phpurl
        });
		//uploader.queue = $scope.insert.params.queue;

        // FILTERS
		
		if($scope.uploadType == 'source') {
			uploader.filters.push({
				name: 'sourceFilter',
				fn: function(item, options) {
					var type = item.type.slice(item.type.lastIndexOf('/') + 1);
					return imageTypes.concat(textTypes).indexOf(type) !== -1;
				}
			});
		}
		else if($scope.uploadType == 'model') {
			uploader.filters.push({
				name: 'modelFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|dae|DAE|obj|'.indexOf(type) !== -1;
				}
			});
		}
		else if($scope.uploadType == 'zip') {
			uploader.filters.push({
				name: 'zipFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|zip|ZIP|'.indexOf(type) !== -1;
				}
			});
		}
		/*
		else if($scope.insert.uploadType == 'text') {
			uploader.filters.push({
				name: 'textFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|pdf|PDF|doc|docx|jpg|png|jpeg|'.indexOf(type) !== -1;
				}
			});
		}*/
		
		// CALLBACKS

        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
			$scope.$parent.alert.message = 'Nicht unterstütztes Format!';
			$scope.$parent.alert.showing = true;
        };
        uploader.onAfterAddingFile = function(item) {
            console.info('onAfterAddingFile', item);
			
			item.tid = new Utilities.Base62().encode(new Date().getTime());
			item.newFileName = item.tid + '_' + item.file.name.replace(/ /g, "_");
			
			if($scope.uploadType === 'source') {
				var type = item.file.type.slice(item.file.type.lastIndexOf('/') + 1);
				if(imageTypes.indexOf(type) !== -1) {
					item.sourceType = 'plan';
					item.url = 'php/uploadImage.php';
				}
				else if(textTypes.indexOf(type) !== -1) {
					item.sourceType = 'text';
					item.language = 'de';
					item.url = 'php/processText.php';
				}
				
				item.title = '';
				item.titleError = false;
				item.author = '';
				item.creationDate = '';
				item.comment = '';
				item.formExtend = false;
				item.archive = '';
				item.archiveNr = '';
				item.creationPlace = '';
				item.ocr = false;
				item.resample = false;
				item.primary = true;
				item.tags = [];
			}
			else if($scope.uploadType === 'model') {
				item.sourceType = 'model';
				item.url = 'php/processDAE.php';
			}
			else if($scope.uploadType === 'zip') {
				item.sourceType = 'plans/model';
				item.url = 'php/planmodelFromZip.php';
			}
			
			item.isInputError = false;
			item.isProcessing = false;
			item.isInserting = false;
			item.anzInserting = 0;
			item.anzInserted = 0;
			
			Utilities.sleep(1);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
			
			uploader.url = item.url;
			
			var formData = {
				sourceType: item.sourceType,
				
				title: item.title,
				author: ($scope.globals.useAuthor) ? $scope.globals.author : item.author,
				creationDate: ($scope.globals.useCreationDate) ? $scope.globals.creationDate : item.creationDate,
				comment: item.comment,
				
				archive: item.archive,
				archiveNr: item.archiveNr,
				creationPlace: ($scope.globals.useCreationPlace) ? $scope.globals.creationPlace : item.creationPlace,
				language: item.language,
				ocr: item.ocr,
				resample: item.resample,
				primary: item.primary,
				tags: item.tags,
				
				oldFileName: item.file.name,
				newFileName: item.newFileName,
				fileType: item.file.name.split(".").pop(),
				pureNewFileName: item.newFileName.slice(0, item.newFileName.lastIndexOf(".")),
				path: $stateParams.project+'/'+item.sourceType+'s/',
				tid: item.tid
			};
			item.formData.push(formData);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            console.info('onProgressItem', fileItem, progress);
			if(progress == 100)
				fileItem.isProcessing = true;
        };
        uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);
			
			fileItem.isProcessing = false;
			
			if(!(response instanceof Object)) {
				console.error(response);
				fileItem.isSuccess = false;
				fileItem.isError = true;
				return;
			}
			
			console.log(response);
			if(response.data && response.data.pages) {
				fileItem.formData[0].pages = response.data.pages;
			}
			
			fileItem.isInserting = true;
			
			if($scope.uploadType == 'source') {
				Utilities.waitfor(function(){return isInserting;}, false, 20, {}, function(params) {
					isInserting = true;
					neo4jRequest.insertDocument($stateParams.project, $stateParams.subproject, fileItem.formData[0]).then(function(response){
						if(response.data.exception) { console.error('neo4j failed on insertDocument()', response.data); return; }
						if(response.data.data.length > 0 ) console.log('insertDocument', response.data);
						else {
							console.error('no document inserted', response.data);
							fileItem.isSuccess = false;
							fileItem.isError = true;
						}
						isInserting = false;
						fileItem.isInserting = false;
					});
				});
			}
			
			else if($scope.uploadType == 'model') {
				
				/*function neo4jinsertNode(formData, params) {
					neo4jRequest.insertModel($stateParams.project, $stateParams.subproject, formData, params.obj).then(function(response){
						if(response.data.exception) { console.error('neo4j failed on insertModel()', response.data); return; }
						console.log('insertModel', response.data);
						//isInserting = false;
						fileItem.anzInserted++;
						console.log(fileItem.anzInserted, fileItem.anzInserting);
						if(fileItem.anzInserted == fileItem.anzInserting)
							fileItem.isInserting = false;
					});
					insertNodes(params.obj.children);
				}*/
				function insertNodes(nodes) {
					for(var i=0, l=nodes.length; i<l; i++) {
						fileItem.anzInserting++;
						neo4jRequest.insertModel($stateParams.project, $stateParams.subproject, fileItem.formData[0], nodes[i]).then(function(response){
							if(response.data.exception) { console.error('neo4j failed on insertModel()', response.data); return; }
							console.log('insertModel', response.data);
							//isInserting = false;
							fileItem.anzInserted++;
							console.log(fileItem.anzInserted, fileItem.anzInserting);
							if(fileItem.anzInserted == fileItem.anzInserting)
								fileItem.isInserting = false;
						});
						insertNodes(nodes[i].children);
					}
				}
				
				/*function neo4jinsertNode(formData, params) {
					//var obj = $.extend(true, {}, objData);
					neo4jRequest.insertModel($stateParams.project, $stateParams.subproject, formData, params.obj).then(function(response){
						if(response.data.exception) { console.error('neo4j failed on insertModel()', response.data); return; }
						console.log('insertModel', response.data);
						isInserting = false;
						
						insertNodes(params.obj.children);
						
						fileItem.anzInserted++;
						//console.log(params.index, params.length);
						console.log(fileItem.anzInserted, fileItem.anzInserting);
						if(fileItem.anzInserted == fileItem.anzInserting)
							fileItem.isInserting = false;
					});
				}
				
				function insertNodes(nodes) {
					for(var i=0, l=nodes.length; i<l; i++) {
						//if(nodes[i].type != 'object') continue;
						
						fileItem.anzInserting++;
						Utilities.waitfor(function(){return isInserting;}, false, 20, {obj: nodes[i]}, function(params) {
							isInserting = true;
							//fileItem.isInserting = true;
							neo4jinsertNode(fileItem.formData[0], params);
							/*neo4jRequest.insertModel($scope.$parent.project, fileItem.formData[0], nodes[i]).success(function(data, status){
								//var res = cleanData(data);
								console.log('insertModel', data);
								isInserting = false;
								insertNodes(nodes[i].children);
							});*
						});
					}
				}*/
				insertNodes(response);
			}
			
			else if($scope.uploadType == 'zip') {
				console.log('everything done - start cypher query');
				isInserting = true;
				neo4jRequest.attach3DPlan($stateParams.project, fileItem.formData[0], response, $scope.attachTo).then(function(response){
					if(response.data.exception) { console.error('neo4j failed on attach3DPlan()', response.data); return; }
					console.log('attach3DPlan', response.data);
					isInserting = false;
					fileItem.isInserting = false;
				});
			}
			
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            console.info('onCancelItem', fileItem, response, status, headers);
			fileItem.isProcessing = false;
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            //console.info('onCompleteItem', fileItem, response, status, headers);
        };
        uploader.onCompleteAll = function() {
            console.info('onCompleteAll');
        };
		
		console.info('uploader', uploader);
		
		for(var i=0; i<$scope.$parent.$parent.modalParams.queue.length; i++) {
			uploader.addToQueue($scope.$parent.$parent.modalParams.queue[i]._file);
		}
		
		// vor dem Hochladen Pflichtfelder überprüfen
		$scope.checkAndUploadAll = function() {
			// wait for responses and validate inputs
			$timeout(function() {
				if($scope.uploadType == 'source') {
					for(var i=0, l=uploader.queue.length; i<l; i++) {
						if(uploader.queue[i].title == '' || uploader.queue[i].titleError) {
							uploader.queue[i].isInputError = true;
							uploader.queue[i].titleError = true;
						}
						else
							uploader.queue[i].isInputError = false;
					}
				}
				uploader.uploadAll();
			}, 1000);
		}
		
		$scope.getArchives = function() {
			neo4jRequest.getArchives($scope.$parent.project).then(function(response){
				if(response.data.exception) { console.error('neo4j failed on getArchives()', response); return; }
				if(response.data) $scope.archives = Utilities.cleanNeo4jData(response.data);
				console.log('Archives:', $scope.archives);
			});
		}
		$scope.getArchives();
		
		$scope.addArchive = function() {
			var newscope = $scope.$new(false);
			newscope.modalParams = {
				modalType: 'small'
			};
			$modal({
				title: 'Archiv hinzufügen',
				templateUrl: 'partials/modals/_modalTpl.html',
				contentTemplate: 'partials/modals/addArchiveModal.html',
				controller: 'addArchiveCtrl',
				scope: newscope,
				show: true
			});
		};
		
		// typeahead input callbacks
		$scope.setTypeaheadArray = function(label, prop) {
			if(!label) return;
			neo4jRequest.getAllLabelProps($scope.$parent.project, label, prop).then(function(response){
				if(response.data.exception) { console.error('neo4j failed on setTypeaheadArray()', response); return; }
				$scope.suggestions = Utilities.cleanNeo4jData(response.data);
				//console.log($scope.suggestions);
			});
		};
		$scope.validateInput2 = function(item, params) {
			//console.log('blur', item, params);
			$scope.suggestions = [];
			
			if(params) {
				item.titleError = false;
				for(var i=0, l=uploader.queue.length; i<l; i++) {
					if(params.index == i) continue;
					if(uploader.queue[i][params.prop] == item[params.prop])
						item.titleError = true;
				}
				if(!item.titleError) {
					neo4jRequest.findNodeWithSpecificContent($scope.$parent.project, params.label, item[params.prop]).success(function(data, status){
						//console.log(data);
						if(data.data.length > 0)
							item.titleError = true;
					});
				}
			}
		};
		
		// autocomplete input callbacks
		$scope.getSuggestions = function(search, params) {
			//console.log(search, params);
			if(search < 1) return;
			
			neo4jRequest.searchForExistingNodes($scope.$parent.project, params.label, search).success(function(data, status){
				$scope.suggestions = cleanData(data);
				//console.log($scope.suggestions);
			});
		};
		$scope.selectSuggestion = function(search, params){
			//console.log('select', search, params);
		};
		$scope.validateInput = function(search, item, params) {
			//console.log('blur', search, params);
			$scope.suggestions = [];
			
			if(params.unique) {
				item.titleError = false;
				for(var i=0, l=uploader.queue.length; i<l; i++) {
					if(params.index == i) continue;
					if(uploader.queue[i][params.uniqueProp] == search)
						item.titleError = true;
				}
				if(!item.titleError) {
					neo4jRequest.findNodeWithSpecificContent($scope.$parent.project, params.label, search).success(function(data, status){
						//console.log(data);
						if(data.data.length > 0)
							item.titleError = true;
					});
				}
			}
		};
		
		$scope.validateInputs = function() {
			console.log($scope.inputs);
		};
		
		$scope.openFileDialog = function(event) {
			$timeout(function() {
				angular.element(event.delegateTarget).find('input').trigger('click');
			});
		};
		
		// tag input callbacks
		$scope.onTagAdded = function(tag) {
			tag.text = tag.text.toLowerCase();
		};
		$scope.getTags = function(query) {
			return neo4jRequest.searchTags($stateParams.project, query).then(function(response) {
				if(response.data.exception) { console.error('neo4j failed on getAllTags()', response.data); return; }
				return Utilities.extractArrayFromNeo4jData(response.data);
			});
		};
	}]);
	
webglControllers.controller('sourceTypeCtrl', ['$scope',
	function($scope) {
		
		console.log('sourceTypeCtrl init');
		
		
		
	}]);
webglControllers.controller('addArchiveCtrl', ['$scope', '$stateParams', 'neo4jRequest',
	function($scope, $stateParams, neo4jRequest) {
		
		console.log('addArchiveCtrl init', $scope);
		
		$scope.archive = {};
		$scope.archive.institution = '';
		$scope.archive.institutionAbbr = '';
		$scope.archive.collection = '';
		
		$scope.addArchive = function() {
			
			if($scope.archive.institution.length < 1) {
				console.log('inst einfügen')
				return;
			}
			if($scope.archive.collection.length < 1) {
				console.log('coll einfügen')
				return;
			}
			
			neo4jRequest.addArchive($stateParams.project, $scope.archive.collection, $scope.archive.institution, $scope.archive.institutionAbbr).then(function(response){
				if(response.data.exception) { console.error('neo4j failed on addArchive()', response); return; }
				$scope.$parent.$parent.$parent.getArchives();
				$scope.$parent.$hide();
			});
		};
	}]);
	
webglControllers.controller('screenshotDetailCtrl', ['$scope', '$stateParams', '$q', 'phpRequest', 'neo4jRequest', 'Utilities', '$timeout', '$alert',
	function($scope, $stateParams, $q, phpRequest, neo4jRequest, Utilities, $timeout, $alert) {
		
		console.log('screenshotDetailCtrl init');
		
		$scope.params = $scope.$parent.$parent.modalParams;
		$scope.showInputfields = 'false';
		console.log($scope.params);
		
		$scope.activeBtn = 'comment';
		
		$scope.scMode = 'marker';
		
		$scope.screenshotTitle = '';
		
		$scope.imgWidth = $scope.params.data.width;
		$scope.imgHeight = $scope.params.data.height;
		$scope.borderSize = 2;
		
		$timeout(function() {
			resizeModal();
		});
		
		$scope.paintOptions = {
			width: $scope.params.data.drawing ? $scope.params.data.drawing.width : $scope.imgWidth,
			height: $scope.params.data.drawing ? $scope.params.data.drawing.height : $scope.imgHeight,
			opacity: 1.0,
			color: 'rgba(255,255,0,1.0)', //'#ff0',
			backgroundColor: 'rgba(255,255,255,0.0)',
			lineWidth: 3,
			undo: true,
			imageSrc: $scope.params.data.drawing ? 'data/' + $scope.params.data.drawing.path + $scope.params.data.drawing.file : false
		};
		
		$scope.markers = [];
		var isExisting = false;
		
		if(!$scope.params.data.dataUrl) {
			$scope.params.data.dataUrl = 'data/' + $scope.params.data.path + $scope.params.data.file; 
			isExisting = true;
		}
		
		if($scope.params.data.markers) {
			for(var i=0; i<$scope.params.data.markers.length; i++) {
				var m = $scope.params.data.markers[i];
				$scope.markers.push({
					id: m.id,
					u: m.u,
					v: m.v,
					comment: m.comment,
					isInserted: true,
					styleMarker: {'width': 30, 'height': 30, 'left': m.u*$scope.imgWidth-15, 'top': m.v*$scope.imgHeight-30}
				});
			}
		}
		
		$scope.setMarker = function(event) {
			//console.log(event);
			if(event.target != event.delegateTarget || event.button !== 0) return;
			
			var tid = Utilities.getUniqueId();
			var offsetX = event.offsetX || event.originalEvent.layerX;
			var offsetY = event.offsetY || event.originalEvent.layerY;
			
			$scope.markers.push({
				id: tid+'_screenshotMarker',
				u: offsetX / $scope.imgWidth,
				v: offsetY / $scope.imgHeight,
				styleMarker: {'width': 30, 'height': 30, 'left': offsetX-16, 'top': offsetY-30},
				comment: '',
				isInserted: false
			});
			
			console.log($scope.markers);
			$timeout(function() {
				$scope.setFocusOnComment($scope.markers.length-1);
			});
			
		};
		
		$scope.saveScreenshot = function () {
			if(isExisting) {
				// sammle neue Marker und füge sie dem Screenshot an
				var newMarkers = [];
				for(var i=0; i<$scope.markers.length; i++) {
					if(!$scope.markers[i].isInserted)
						newMarkers.push($scope.markers[i]);
				}
				if(newMarkers.length < 1) {
					$scope.$parent.closeOverlayPanel();
					return;
				}
				neo4jRequest.insertScreenshotMarkers($scope.$parent.project, $scope.params, newMarkers).then(function(response){
					if(response.data.exception) { Utilities.throwNeo4jException('on insertScreenshotMarkers()', response); return; }
					$scope.$parent.$parent.closeModal('screenshot');
					$scope.$parent.$hide();
				});
			}
			else {
				// speichere Screenshot und füge komplett neue Nodes ein
				if($scope.screenshotTitle.length < 1) {
					Utilities.dangerAlert('Geben sie dem Screenshot einen Titel!');
					return;
				}
				
				var paintDataUrl = $('#pwCanvasMain')[0].toDataURL("image/png");
				var paintFilename = Utilities.getUniqueId() + '_paint.png';
				
				phpRequest.saveBase64Image($scope.params.data.path, $scope.params.data.filename, $scope.params.data.dataUrl, true)
					.then(function(response){
						if(response.data !== 'SUCCESS') {
							Utilities.throwException('PHP Exception', 'on saveBase64Image() Screenshot', response);
							return $q.reject();
						}
						return phpRequest.saveBase64Image($scope.params.data.path, paintFilename, paintDataUrl, false);
					})
					.then(function(response){
						if(response.data !== 'SUCCESS') {
							Utilities.throwException('PHP Exception', 'on saveBase64Image() Painting', response);
							return $q.reject();
						}
						return neo4jRequest.insertScreenshot($stateParams.project, $stateParams.subproject, $scope.params.data, $scope.markers, $scope.screenshotTitle, paintFilename);
					})
					.then(function(response){
						if(response.data.exception) { Utilities.throwNeo4jException('on insertScreenshot()', response); return; }
						if(response.data.data.length === 0) {Utilities.throwNeo4jException('no screenshot inserted', response); return; }
						console.log(response.data);
						$scope.$parent.$parent.closeModal('screenshot');
						$scope.$parent.$hide();
					});
			}
		};
		
		$scope.setFocusOnComment = function(m) {
			var index = (typeof m === 'number') ? m : $scope.markers.indexOf(m);
			if(index > -1)
				$('#markerComment'+index).focus();
		};
		
		$scope.updateMarker = function(position, marker) {
			//console.log('updateMarker', position, marker);
			if(marker) {
				marker.u = (position.left + 15) / $scope.imgWidth;
				marker.v = (position.top + 30) / $scope.imgHeight;
			}
		};
		
		$scope.deleteMarker = function(m) {
			var index = (typeof m === 'number') ? m : $scope.markers.indexOf(m);
			if(index > -1)
				$scope.markers.splice(index, 1);
				$scope.$apply();
		};
		
		$scope.undoPaint = function() {
			$scope.undoVersion--;
		};
		
		$scope.abort = function() {
			// TODO nur bei Änderungen fragen
			var scope = $scope.$new();
			scope.clickOk = function() { $scope.$parent.$hide(); };
			$alert({
				templateUrl: 'partials/alerts/abort.html',
				type: 'warning',
				title: 'Nicht gespeichert',
				content: 'Ohne speichern verlassen?',
				backdrop: 'static',
				scope: scope
			});
		};
		
		$(window).bind('resize', resizeModal);
		function resizeModal() {
			console.log('resizeModal');
			var mbody = $('.screenshotDetail')[0];
			
			$scope.imgWidth = $scope.params.data.width;
			$scope.imgHeight = $scope.params.data.height;
			
			if(mbody.offsetWidth - 30 - $scope.params.data.width < 400) {
				$scope.imgWidth = mbody.offsetWidth - 30 - 400;
				$scope.imgHeight = $scope.imgWidth * $scope.params.data.height / $scope.params.data.width;
			}
			if(mbody.offsetHeight - 30 - $scope.params.data.height < 75 && mbody.offsetHeight - 30 - $scope.imgHeight < 75) {
				$scope.imgHeight = mbody.offsetHeight - 30 - 75;
				$scope.imgWidth = $scope.imgHeight * $scope.params.data.width / $scope.params.data.height;
			}
			
			for(var i=0; i<$scope.markers.length; i++) {
				$scope.markers[i].styleMarker.left = $scope.markers[i].u * $scope.imgWidth - 15;
				$scope.markers[i].styleMarker.top = $scope.markers[i].v * $scope.imgHeight - 30;
			}
			$scope.$applyAsync();
		}
		
	}]);
	
webglControllers.controller('testCtrl', ['$scope', '$stateParams',
	function($scope, $stateParams) {
		
		$scope.members = [
			{name: 'Martin', tasks: []},
			{name: 'Jonas', tasks: []},
			{name: 'Markus', tasks: []}
		];
		
		$scope.tasks = [
			{name: 'task1', parent: null, children: [], editors: []},
			{name: 'task2', parent: null, children: [], editors: []},
			{name: 'task3', parent: 'task1', from: new Date(2015,11,12,8,0,0), to: new Date(2015,11,30,15,0,0), children: [], editors: ['Martin']},
			{name: 'task4', parent: 'task1', children: [], editors: []},
			{name: 'task5', parent: 'task2', children: [], editors: ['Markus']},
			{name: 'task6', parent: 'task4', children: [], editors: ['Martin']},
			{name: 'task7', parent: 'task4', children: [], editors: ['Jonas']}
		];
		
		$scope.data = [];
		
		function sortTasks() {
			for(var i=0; i<$scope.tasks.length; i++) {
				for(var j=0; j<$scope.tasks[i].editors.length; j++) {
					$scope.tasks[i].editors[j] = getMember($scope.tasks[i].editors[j]);
					$scope.tasks[i].editors[j].tasks.push($scope.tasks[i]);
				}
			}
			for(var i=0; i<$scope.tasks.length; i++) {
				if($scope.tasks[i].parent == null) continue;
				var p = getElementInHierarchy($scope.tasks[i], 'parent', $scope.tasks, 'name');
				//console.log(p);
				p.children.push($scope.tasks[i]);
				$scope.tasks[i].parent = p;
				for(var k=0; k<$scope.tasks[i].editors.length; k++) {
					pushToParents(p, $scope.tasks[i].editors[k]);
				}
				$scope.tasks.splice(i,1);
				i--;
			}
			
		}
		
		function pushToParents(p, e) {
			if(p == null) return;
			if(p.editors.indexOf(e) === -1)
				p.editors.push(e);
			pushToParents(p.parent, e);
		}
		
		function getElementInHierarchy(node, key, list, listkey) {
			for(var i=0; i<list.length; i++) {
				if(node[key] == list[i][listkey]) return list[i];
				var obj = getElementInHierarchy(node, key, list[i].children, listkey);
				if(obj !== undefined) return obj;
			}
			return undefined;
		}
		
		function getMember(name) {
			for(var i=0; i<$scope.members.length; i++) {
				if(name == $scope.members[i].name) return $scope.members[i];
			}
		}
		
		function generateRows() {
			var newid = 0;
			
			$.each($scope.members, function(i) {
				var member = $scope.members[i];
				var row = {
					id: newid,
					name: member.name,
					memberRef: member,
					isStaff: true,
					groups: false,
					children: [],
					tasks: []
				};
				$scope.data.push(row);
				newid++;
				
				$.each($scope.tasks, function(j) {
					if($scope.tasks[j].editors.indexOf(member) === -1)
						return true;
					var task = $scope.tasks[j]; //task ist Referenz auf Objekt in $scope.tasks[j]
					var rowTask = {
						id: newid,
						name: task.name,
						taskRef: task,
						parent: row.id,
						children: [],
						tasks: task.from ? [{name: task.name, from: task.from, to: task.to}] : []
					};
					$scope.data.push(rowTask); // übergibt auch Referrenz
					newid++;
					
					function pushChildTasks(parentTask, parentRow) {
						$.each(parentTask.children, function(k) {
							var childTask = parentTask.children[k];
							parentRow.children.push(newid);
							var childRow = {
								id: newid,
								name: childTask.name,
								taskRef: childTask,
								children: [],
								tasks: childTask.from ? [{name: childTask.name, from: childTask.from, to: childTask.to}] : []
							};
							$scope.data.push(childRow);
							newid++;
							pushChildTasks(childTask, childRow);
							console.log('task pushed');
						});
					}
					pushChildTasks(task, rowTask)
					
				});
			});
			
		}
		
		/*sortTasks();*/
		generateRows();
		console.log('members', $scope.members);
		console.log('tasks', $scope.tasks);
		console.log('data', $scope.data);
		
	}]);
	
webglControllers.controller('tasksCtrl', ['$scope','$stateParams', '$timeout', '$sce', 'phpRequest', 'mysqlRequest', 'neo4jRequest', '$http', 'Utilities','$aside', 
	function($scope, $stateParams, $timeout, $sce, phpRequest, mysqlRequest, neo4jRequest, $http, Utilities, $aside) {
	
		$scope.project = $stateParams.project;
		$scope.sortby = 'staff';
		$scope.parentIsStaff= 'false';
		$scope.staffArray = [];
		$scope.tasksArray= []; //extra tasksArray um unique zu nutzen
		$scope.tasksWithEditors=[];
		
		/*Mitarbeiter*/
		$scope.newStaff = new Object();
		
		$scope.newStaff.sid = '';
		$scope.newStaff.name = '';
		$scope.newStaff.surname = '';
		$scope.newStaff.mail = '';
		$scope.newStaff.role = '';
		$scope.newStaff.projects = '';
		$scope.staffExists= false;
		
		/*Tasks*/
		
		$scope.newTask = new Object();
		$scope.newTask.staffID = '';
		$scope.newTask.staff = '';
		$scope.newTask.isStaff = '';
		$scope.newTask.clickedElement = '';
		$scope.newTask.task = '';
		$scope.newTask.from = '';
		$scope.newTask.to = '';
		$scope.newTask.desc = '';
		
		$scope.staff = [];
		$scope.nameFound = false;
		$scope.taskExists = false;
		
		// Kommentare
		$scope.taskNameForComment;
		$scope.taskIdForComment;
		$scope.commentIndex;
		$scope.comments = [];
		
		
		
		/*Views*/
		
		$scope.views = new Object();
		$scope.views.activeSide = 'staff';
		
		$scope.newComment = new Object();
		$scope.newComment.text = '';
		
		/*Aufgaben umsortieren*/
 		 
 		 $scope.changeOrder = 'false';
 		 
		/*IndexDnd*/
		$scope.indexDnD;

		/*Children zählen*/
		$scope.childCounter = 0;
		
		$scope.dataTasks = [];
		
		/* $scope.data=[
		{"id":1,"name":"Jonas","isStaff":true,"groups":false,"children":[],"tasks":[],"highlight":false},
		{"id":2,"name":"Martin","isStaff":true,"groups":false,"children":[],"tasks":[],"highlight":false},
		{"id":3,"name":"test1","taskRef":[],"isStaff":false,"parent":1,"children":[5],"status":"erledigt","priority":"2","hasData":"false","editors":[1],"tasks":[],"highlight":false},
		{"id":4,"name":"test1","taskRef":[],"isStaff":false,"parent":2,"children":[6,12,"pvKejD7","pvKekso","pvKelri"],"status":"erledigt","priority":"2","hasData":"false","editors":[2],"tasks":[],"highlight":false},
		{"id":5,"name":"test2","isStaff":false,"status":"erledigt","children":[],"priority":"3","hasData":"false","editors":[1],"tasks":[{"name":"test2","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"3dd20ab4-e25a-e19d-1dbb-266c12960b06"}],"highlight":false},
		{"id":6,"name":"test2","isStaff":false,"status":"erledigt","children":[],"priority":"3","hasData":"false","editors":[2],"tasks":[{"name":"test2","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"65b11b16-c36e-14b7-2666-69874c92efc4"}],"highlight":false},
		{"id":7,"name":"test7","isStaff":false,"parent":2,"children":[8],"status":"erledigt","priority":"2","hasData":"false","editors":[2],"tasks":[],"highlight":false},{"id":8,"name":"test8","isStaff":false,"status":"erledigt","children":[],"priority":"3","hasData":"false","editors":[2],"tasks":[{"name":"test8","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"b348fae6-e426-b15a-0f70-72eba739901b"}],"highlight":false},
		{"id":9,"name":"test4","isStaff":false,"parent":1,"children":[],"status":"zu bearbeiten","priority":"1","editors":[1],"hasData":"false","tasks":[{"name":"test4","color":"#F1C232","from":"2015-12-21T07:00:00.000Z","to":"2015-12-25T14:00:00.000Z","progress":25,"id":"7b9ba63f-cb13-a1e6-acb2-0d066c17bf77"}],"highlight":false},
		{"id":10,"name":"test5","isStaff":false,"parent":1,"children":[],"status":"zu bearbeiten","priority":"2","editors":[1],"hasData":"false","tasks":[{"name":"test5","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"ecdeb010-480a-e0bc-0c99-7d92e4332275"}],"highlight":false},
		{"id":11,"name":"test6","isStaff":false,"parent":1,"children":[],"status":"zu bearbeiten","hasData":"true","editors":[1],"priority":"1","tasks":[{"name":"test6","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"0b0e9d7f-699c-345c-c496-8adbc22f7065"}],"highlight":false},
		{"id":12,"name":"test3","isStaff":false,"children":[],"status":"zu bearbeiten","hasData":"true","priority":"1","editors":[1],"tasks":[{"name":"test3","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"1ed2c928-67aa-3e63-fd0f-e79b2c388fc8"}],"highlight":false},
		{"id":"pvKejD7","name":"neue Unteraufgabe1","isStaff":false,"children":[],"priority":"1","status":"zu bearbeiten","tasks":[{"name":"neue Unteraufgabe1","color":"#F1C232","from":"2015-12-02T20:45:30.000Z","to":"2015-12-07T20:45:30.000Z","id":"841a06ba-e444-af11-1e1a-3b560b3c4c1b"}],"highlight":false},
		{"id":"pvKekso","name":"neue Unteraufgabe2","isStaff":false,"children":[],"priority":"1","status":"zu bearbeiten","tasks":[{"name":"neue Unteraufgabe2","color":"#F1C232","from":"2015-12-02T20:45:34.000Z","to":"2015-12-07T20:45:34.000Z","id":"18b116fe-5bef-e105-2770-d0089e493299"}],"highlight":false},
		{"id":"pvKelri","name":"neue Unteraufgabe3","isStaff":false,"children":[],"priority":"1","status":"zu bearbeiten","tasks":[{"name":"neue Unteraufgabe3","color":"#F1C232","from":"2015-12-02T20:45:37.000Z","to":"2015-12-07T20:45:37.000Z","id":"bf4a7bb7-6742-8c65-0dce-69240944b025"}],"highlight":false}];
		 */
	/* 	$scope.data = [ //falsche Reihenfolge!! --> aus dem Rechner
		{"name":"test4"					,"children":[],"editors":["Jonas"],"id":9,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"false","tasks":[{"name":"test4","color":"#F1C232","from":"2015-12-21T07:00:00.000Z","to":"2015-12-25T14:00:00.000Z","progress":25,"id":"7d011325-7a4a-cd10-9e84-6d225c380e16"}]},
		{"name":"neue Unteraufgabe3"	,"children":[],"editors":[""],"id":"pvK7G3P","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe3","color":"#F1C232","from":"2015-12-02T20:19:08.000Z","to":"2015-12-07T20:19:08.000Z","id":"c008c02f-a306-e573-3643-e1ea1d79fe25"}],"highlight":false},
		{"name":"test5"					,"children":[],"editors":["Jonas"],"id":10,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"2","hasData":"false","tasks":[{"name":"test5","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"2ad31c8a-0b14-4272-bc08-0db7225d35bc"}]},
		{"name":"test1"					,"children":[6,12,"pvK7DT1","pvK7Fay","pvK7G3P"],"editors":["Jonas","Martin"],"id":4,"isStaff":false,"parent":"","status":"erledigt","priority":"2","hasData":"false","tasks":[]},
		{"name":"neue Unteraufgabe2"	,"children":[],"editors":[""],"id":"pvK7Fay","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe2","color":"#F1C232","from":"2015-12-02T20:19:05.000Z","to":"2015-12-07T20:19:05.000Z","id":"694d70b7-959a-832e-1aec-3d7f2dfa2e57"}],"highlight":false},
		{"name":"neue Unteraufgabe1"	,"children":[],"editors":[""],"id":"pvK7DT1","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe1","color":"#F1C232","from":"2015-12-02T20:19:00.000Z","to":"2015-12-07T20:19:00.000Z","id":"f259a724-ec24-7d73-9a61-fe31c9868182"}],"highlight":false},
		{"name":"test3"				,"children":[],"editors":["Jonas"],"id":12,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"true","tasks":[{"name":"test3","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"46f16d23-8a8e-7b0a-c06a-cb653855aa7b"}],"highlight":false},
		{"name":"test6"				,"children":[],"editors":["Jonas"],"id":11,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"true","tasks":[{"name":"test6","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"883c0090-c35b-d341-c1ac-7a0647dc2a1a"}],"highlight":false},
		{"name":"test2"				,"children":[],"editors":["Jonas","Martin"],"id":6,"isStaff":false,"parent":"","status":"erledigt","priority":"3","hasData":"false","tasks":[{"name":"test2","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"4e696f72-248e-a7ad-6464-a9199a5caa0d"}],"highlight":false},
		{"name":"test7"				,"children":[8],"editors":["Martin"],"id":7,"isStaff":false,"parent":"","status":"erledigt","priority":"2","hasData":"false","tasks":[],"highlight":false},{"name":"test8","children":[],"editors":["Martin"],"id":8,"isStaff":false,"parent":"","status":"erledigt","priority":"3","hasData":"false","tasks":[{"name":"test8","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"ca0d8e5e-17fa-d097-f17a-57ce50f35292"}],"highlight":false}
		]; */
		
		/* $scope.data = [ //richtige Reihenfolge
		{"name":"test4"					,"children":[],"editors":["Jonas"],"id":9,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"false","tasks":[{"name":"test4","color":"#F1C232","from":"2015-12-21T07:00:00.000Z","to":"2015-12-25T14:00:00.000Z","progress":25,"id":"7d011325-7a4a-cd10-9e84-6d225c380e16"}]},
		{"name":"test5"					,"children":[],"editors":["Jonas"],"id":10,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"2","hasData":"false","tasks":[{"name":"test5","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"2ad31c8a-0b14-4272-bc08-0db7225d35bc"}]},
		{"name":"test1"					,"children":[6,12,"pvK7DT1","pvK7Fay","pvK7G3P"],"editors":["Jonas","Martin"],"id":4,"isStaff":false,"parent":"","status":"erledigt","priority":"2","hasData":"false","tasks":[]},
		{"name":"test6"					,"children":[],"editors":["Jonas"],"id":11,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"true","tasks":[{"name":"test6","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"883c0090-c35b-d341-c1ac-7a0647dc2a1a"}],"highlight":false},
		{"name":"test2"					,"children":[],"editors":["Jonas","Martin"],"id":6,"isStaff":false,"parent":"","status":"erledigt","priority":"3","hasData":"false","tasks":[{"name":"test2","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"4e696f72-248e-a7ad-6464-a9199a5caa0d"}],"highlight":false},
		{"name":"test3"					,"children":[],"editors":["Jonas"],"id":12,"isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","hasData":"true","tasks":[{"name":"test3","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","data":[{"message":"Lorem Ipsum","author":"Martin"},{"message":"123","author":"Martin"}],"id":"46f16d23-8a8e-7b0a-c06a-cb653855aa7b"}],"highlight":false},
		{"name":"neue Unteraufgabe1"	,"children":[],"editors":[""],"id":"pvK7DT1","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe1","color":"#F1C232","from":"2015-12-02T20:19:00.000Z","to":"2015-12-07T20:19:00.000Z","id":"f259a724-ec24-7d73-9a61-fe31c9868182"}],"highlight":false},
		{"name":"neue Unteraufgabe2"	,"children":[],"editors":[""],"id":"pvK7Fay","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe2","color":"#F1C232","from":"2015-12-02T20:19:05.000Z","to":"2015-12-07T20:19:05.000Z","id":"694d70b7-959a-832e-1aec-3d7f2dfa2e57"}],"highlight":false},
		{"name":"neue Unteraufgabe3"	,"children":[],"editors":[""],"id":"pvK7G3P","isStaff":false,"parent":"","status":"zu bearbeiten","priority":"1","tasks":[{"name":"neue Unteraufgabe3","color":"#F1C232","from":"2015-12-02T20:19:08.000Z","to":"2015-12-07T20:19:08.000Z","id":"c008c02f-a306-e573-3643-e1ea1d79fe25"}],"highlight":false},
		{"name":"test7"					,"children":[8],"editors":["Martin"],"id":7,"isStaff":false,"parent":"","status":"erledigt","priority":"2","hasData":"false","tasks":[],"highlight":false},{"name":"test8","children":[],"editors":["Martin"],"id":8,"isStaff":false,"parent":"","status":"erledigt","priority":"3","hasData":"false","tasks":[{"name":"test8","color":"#F1C232","from":"2015-12-12T07:00:00.000Z","to":"2015-12-30T14:00:00.000Z","id":"ca0d8e5e-17fa-d097-f17a-57ce50f35292"}],"highlight":false}
		];  */
		
	/*  $scope.data = [		  
    	{id: 1, name: 'Jonas', isStaff: true, 'groups': false, children: [], tasks: [] }, //Zeitstempel für Kommentar
    
    	{id: 2,name: 'Martin', isStaff: true, 'groups': false, children: [], tasks: []},
    	
    	{id: 3,name: 'test1', isStaff: false,  parent: 1, children: [5], status: 'erledigt',priority: '2', hasData: 'false', editors: [1], tasks: []},
    
    	{id: 4,name: 'test1', isStaff: false,  parent: 2, children: [6,12], status: 'erledigt',priority: '2', hasData: 'false', editors: [2], tasks: []},
		
		{id: 5,name: 'test2',  isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: 'false', editors: [1], tasks: [
		                            {name: 'test2', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
		{id: 6,name: 'test2', isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: 'false', editors: [2], tasks: [
		                            {name: 'test2', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
		                        
		{id: 7,name: 'test7',isStaff: false, parent: 2,children: [8],  status: 'erledigt',priority: '2', hasData: 'false', editors: [2],  tasks: []},
		
		{id: 8,name: 'test8', isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: 'false', editors: [2], tasks: [
		                            {name: 'test8', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]}, 
		   
		{id: 9, name: 'test4', isStaff: false, parent: 1, children: [], status: 'zu bearbeiten', priority: '1', editors: [1], hasData: 'false', tasks: [
		                            {name: 'test4', color: '#F1C232', from: new Date(2015, 11, 21, 8, 0, 0), to: new Date(2015, 11, 25, 15, 0, 0)}
		                        ]},
		 {id: 10,name: 'test5', isStaff: false, parent: 1, children: [], status: 'zu bearbeiten',priority: '2', editors: [1], hasData: 'false', tasks: [
		                            {name: 'test5', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
		{id: 11,name: 'test6', isStaff: false, parent: 1, children: [], status: 'zu bearbeiten', hasData: 'true', editors: [1], priority: '1', tasks: [
		                            {name: 'test6', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0), data: [{message: 'Lorem Ipsum', author:'Martin'},{message: '123', author:'Martin'}]}]},
		                            
		{id: 12,name: 'test3', isStaff: false, children: [], status: 'zu bearbeiten', hasData: 'true', priority: '1', editors: [1], tasks: [
			{name: 'test3', color: '#F1C232',from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0), data: [{message: 'Lorem Ipsum', author:'Martin'},{message: '123', author:'Martin'}]}]},
		];  */
		 
		$scope.data = [		
		/* {id: 1, name: 'Jonas', isStaff: true, 'groups': false, children: [], tasks: []},
    
    	{id: 2, name: 'Martin', isStaff: true,'groups': false, children: [], tasks: []},
    
    	{id: 3, name: 'test1', isStaff: false, parent: 1, children: [4], status: 'erledigt',priority: '2', hasData: false, editors: [1],data: [], tasks: []},
                            
	
		{id: 4, name: 'test2', isStaff: false, children: [], status: 'erledigt',priority: '3', hasData: false,editors: [1], data: [], tasks: [
		                            {name: 'test2', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
			
		{id: 5,name: 'test1', isStaff: false,  parent: 2, children: [6,12], status: 'erledigt',priority: '2', hasData: false, editors: [2], data: [], tasks: []},
		
		{id: 6,name: 'test2', isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: false, editors: [2], data: [], tasks: [
		                            {name: 'test2', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0)}
		                        ]},
		 
		{id: 7, name: 'test4', isStaff: false,parent: 1,children: [], status: 'zu bearbeiten', priority: '1',hasData: false,editors: [1], data: [],tasks: [
		                            {name: 'test4', color: '#F1C232', from: new Date(2015, 09, 21, 8, 0, 0), to: new Date(2015, 10, 25, 15, 0, 0), progress: 25}
		                        ]},
		{id: 8, name: 'test5', isStaff: false,parent: 2, children: [], status: 'zu bearbeiten',priority: '2',hasData: false, editors: [2], data: [], tasks: [
		                            {name: 'test5', color: '#F1C232', from: new Date(2015, 10, 12, 8, 0, 0), to: new Date(2015, 10, 30, 15, 0, 0)}
		                        ]},
		{id: 9, name: 'test6', isStaff: false, parent: 2, children: [], status: 'zu bearbeiten',priority: '1',hasData: true, editors: [2],data: [{message: 'Lorem Ipsum', author:'Martin'},{message: '123', author:'Martin'}],  tasks: [
		                            {name: 'test6', color: '#F1C232', from: new Date(2015, 10, 12, 8, 0, 0), to: new Date(2015, 10, 30, 15, 0, 0)}]},
		
		{id: 10,name: 'test7',isStaff: false, parent: 2,children: [11],  status: 'erledigt',priority: '2', hasData: false, editors: [2], data: [], tasks: []},
		
		{id: 11,name: 'test8', isStaff: false, status: 'erledigt', children: [],priority: '3', hasData: false, editors: [2], data: [], tasks: [
		                            {name: 'test8', color: '#F1C232', from: new Date(2015, 11, 12, 8, 0, 0), to: new Date(2015, 11, 30, 15, 0, 0), }
		                        ]},  */
]		
		
		$scope.options = {
			useData: $scope.data,
			allowSideResizing: true,
			fromDate:  getFormattedDate(new Date()),
			toDate: getFormattedDate(addDays(new Date(),30)),
			columns: ['trash', 'model.priority', 'model.status'],
			treeTableColumns: [ 'status'],
			columnsHeaders: {'trash': 'Löschen', 'model.priority': 'Priorität',  'model.status': 'Status', 'model.editors': 'Bearbeiter'},
			
			columnsClasses: {'model.name' : 'gantt-column-name', 'from': 'gantt-column-from', 'to': 'gantt-column-to', 'model.status': 'gantt-column-status'},
			columnsFormatters: {
					                'from': function(from) {
					                    return from !== undefined ? from.format("DD.MM") : undefined;
					                },
					                'to': function(to) {
					                    return to !== undefined ? to.format("DD.MM") : undefined;
					                }
					            },
            
            
            columnsHeaderContents: {
            	'model.editors': '<i class="fa fa-users"></i>',
            	'trash': '<i class="glyphicon glyphicon-trash"></i>',
                'model.priority': '<i class="fa fa-exclamation"></i>',
                'model.status': '<i  class="fa fa-flag"></i>'
            },
           labelsEnabled: true,
           columnsContents: {
          'model.editors': '<div>{{getValue()}}</div>',
          'trash': '<i class="glyphicon glyphicon-trash" ng-click = "scope.deleteTask(row)" ></i>',      
          'model.priority': '<i ng-switch= "getValue()" ng-click="scope.changePriority(row.model)"><i ng-switch-when="1" class="fa fa-flag" id="lowPriority"></i><i ng-switch-when="2" class="fa fa-flag" id="mediumPriority"></i><i ng-switch-when="3" class="fa fa-flag" id="highPriority"></i></i>',
          'model.status': '<i ng-class="getValue() == \'erledigt\' ? \'glyphicon glyphicon-ok\' : \'glyphicon glyphicon-cog\'" ng-click="scope.changeStatus(row.model)"></i>',
            },
            filterTask: '',
            filterRow: '',
            contentTooltips: 'von: {{task.model.from.format("DD.MM")}}	 bis: {{task.model.to.format("DD.MM")}}',
            scale: 'day',
            sortMode: undefined,
            maxHeight: true,
            width: true,
            rowContent: '<i ng-hide ="row.model.isStaff" ng-class="row.model.hasData == true ?  \'fa fa-commenting-o\' : \'fa fa-pencil\'" \
							ng-click="scope.showAsideForComment(row)"></i><a href="#" ng-class = "row.model.isStaff == true ? \'parent\': \'\' "  \
							editable-text ="row.model.name" e-style="width: 60px; height: 20px" buttons = "no" onbeforesave="scope.editTask($data,row)"> \
							{{row.model.name}}</a> <i class= "fa fa-plus" ng-click="scope.showAsideForTask(row)"></i> ',
							/*<i class="glyphicon glyphicon-trash" ng-click="scope.deleteTask(row.model)"></i>*/
            taskContent: '{{task.model.name}}', 
            zoom: 1.3,
             api: function(api) {
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

	              api.core.on.ready($scope, function(){
	              	api.core.on.ready($scope, logReadyEvent);
	              	/* api.data.on.change($scope.dataTasks, $scope.data); */
					api.data.on.remove($scope, addEventName('data.on.remove', logDataEvent));
	     	              
	              if (api.tasks.on.moveBegin) {
                        api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', changeTask));
                        api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', changeTask));
                    }
                    
	              });
                }
           };
		
		function getFormattedDate(date) {
    		var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes				() + ":" + date.getSeconds();
		    return str;
		}

		function addDays(date, days) {
		    var result = new Date(date);
		    result.setDate(date.getDate() + days);
		    return result;
		}

		
		$scope.canAutoWidth = function(scale) {
            if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
                return false;
            }
            return true;
        };

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

		$scope.getStaffInGantt = function(){
			//alle Bearbeiter suchen
			$.each($scope.options.useData,function(index){
					if($scope.options.useData[index].isStaff == true){
						$scope.staffArray.push($scope.data[index].id);
						/* console.log('push'); */
					}	
				});
		}
		/*Tasks*/
		
		
		$scope.fillDataObject = function(){
			//Mitarbeiter einfügen
			neo4jRequest.getStaffFromProject($stateParams.project).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on getTasksFromProject()', response.data); return; }
					 if(response.data){
						 $.each(Utilities.cleanNeo4jData(response.data),function(index){
							//console.log({name: Utilities.cleanNeo4jData(response.data)[index].editorName});
							$scope.data.push({id: Utilities.cleanNeo4jData(response.data)[index].editorId,
											name: Utilities.cleanNeo4jData(response.data)[index].editorName,
											isStaff: true,
											'groups': false,
											children: [],
											tasks: []
											});
							});
							
						}
			});
			//AUfgaben einfügen
			neo4jRequest.getTasksFromSubproject($stateParams.project,$stateParams.subproject).then(function(response){
				if(response.data.exception) { console.error('neo4jRequest Exception on getTasksFromSubproject()', response.data); return; }
					 if(response.data){
						 /* console.log(response.data.data); */
						 var root = Utilities.createHierarchy(response.data,['name','desc','editors','from','to'], false)[0];
						 console.log(root.children); 
						 
						 $.each(root.children, function(indexC) {
							var rowTask = {
								id: root.children[indexC].content,
								name: root.children[indexC].name,
								isStaff: false,
								parent: root.children[indexC].editors,
								children: [],
								// status: 'erledigt',
								// priority: '2',
								data: [],
								editors: root.children[indexC].editors,
								tasks: [{name: root.children[indexC].name,
										color: '#F1C232',
										from: root.children[indexC].from,
										to: root.children[indexC].to}] 
								};
							
							$scope.data.push(rowTask);

							//console.log(root.children[indexC].children.length);
							if(root.children[indexC].children.length>0){
								pushChildren(root.children[indexC].children, rowTask);
							}
						 
						 
						 function pushChildren(children, parentRow) {
							
							console.log(children);
							console.log(parentRow);
							//console.log(children[0].content); 
							
							$.each(children,function(indexR){
							
								/* console.log(indexR);
								console.log(children[indexR].content);  */
								
								parentRow.children.push(children[indexR].content);
								//console.log(parentRow);
								
								if(children[indexR].editors.length == 1){
								var newRow = {id: children[indexR].content,
												name: children[indexR].name,
												isStaff: false,
												parent: [],
												children: [],
												// status: 'erledigt',
												// priority: '2',
												data: [],
												editors: children[indexR].editors,
												tasks: [{name: children[indexR].name,
														color: '#F1C232',
														from: children[indexR].from,
														to: children[indexR].to}] 
												};
								}
								//console.log(newRow);
								$scope.data.push(newRow);
								//console.log(children[indexR]);
								pushChildren(children[indexR].children, newRow); 
								
							});	
						}	
						});
					 }
						//id: 3, name: 'test1', isStaff: false, parent: 1, children: [4], status: 'erledigt',priority: '2', hasData: false, editors: [1],data: [], tasks: []
				});
				console.log($scope.data);
				
		}
				
		$scope.addNewTask = function (row){	
			
			var tid = Utilities.getUniqueId(row);
			var hier= $scope.api.tree.getHierarchy();
			/* console.log(hier.ancestors(row)[hier.ancestors(row).length-1].model.name); */
			if($scope.sortby == 'staff'){
				$.each($scope.data,function(index){
					if($scope.data[index].name == 'neue Aufgabe' ||  $scope.data[index].name == 'neue Unteraufgabe'){
						$scope.taskExists = 'true';
						return false;
					}
				});	
				
					if($scope.taskExists == 'true'){
						alert('Diese Aufgabe existiert leider schon! Bitte benennen Sie sie um!');
						$scope.taskExists = false;
					}
					
					else{
							if($scope.newTask.isStaff == true){ //wenn auf Bearbeiter geklickt wurde
								$scope.data.push({id: tid, name: $scope.newTask.task, isStaff: false, parent: $scope.newTask.staffID, children: [], editors: [$scope.newTask.staffID], priority: '1', status: 'zu bearbeiten', data: [],
												  tasks: [{name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});
								console.log($scope.newTask.staffID);
								//anhängen an Subprojekt -->$stateParams.subproject
									neo4jRequest.addTask($stateParams.project, $stateParams.subproject, tid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.staffID
														,getFormattedDate(new Date()), getFormattedDate(addDays(new Date(),5)),'priority_high', 'status_todo')
										.then(function(response){
										console.log(response.data);
								});
							}
								
							 else{ // wenn auf Aufgabe oder Unteraufgabe geklickt wurde
							 	//hinzufügen der Unteraufgabe
								$scope.data.push({id: tid, name: $scope.newTask.task,isStaff: false, children: [], editors: [$scope.newTask.staffID], priority: '1', status: 'zu bearbeiten',data: [],
												  tasks: [{name: $scope.newTask.task, color: '#F1C232', from: getFormattedDate($scope.newTask.from), to: getFormattedDate($scope.newTask.to)}]});
								//als child zu übergeordnetem Element hinzufügen
								console.log($scope.newTask.clickedElement.model);
								$scope.newTask.clickedElement.model.children.push(tid);
								//anhängen an parenttask --> statt $stateParams.subproject --> clickedElement
								
								
								 neo4jRequest.addTask($stateParams.project, $scope.newTask.clickedElement.model.id, tid, $scope.newTask.task,$scope.newTask.desc,$scope.newTask.staffID
													, getFormattedDate($scope.newTask.from), getFormattedDate($scope.newTask.to),'priority_high', 'status_todo')
										.then(function(response){
										console.log(response.data);
										})
									/* 	.then(){
										}); */
								
								$scope.newTask.clickedElement.tasks = []; //daten aus parent für gruppierung löschen
								console.log($scope.newTask.clickedElement.model.id);
								
								 neo4jRequest.deleteTaskDates($stateParams.project, $scope.newTask.clickedElement.model.id)
										.then(function(response){
										console.log('element gelöscht')
										console.log(response.data);
									});
								 
								
								$scope.taskExists = false;

								}
						}
	
						$scope.newTask.staffID = '';
						$scope.newTask.staff = '';
						$scope.newTask.isStaff = '';
						$scope.newTask.clickedElement = '';
						$scope.newTask.task = '';
						$scope.newTask.from = '';
						$scope.newTask.to = '';
						$scope.newTask.desc = '';
					
				}
		else{
			alert('Bitte ändern Sie die Sortierung!');
			}
		}
				
		
		$scope.getIndex = function(event, ui, indexStaff){
			/*console.log(indexStaff);*/
			$scope.indexDnD = indexStaff;
		}
		
		$scope.addNewStaffToGantt = function(){
			/*Mitarbeiter existiert bereits?*/	
		if($scope.sortby == 'staff'){
			$.each($scope.data,function(index){
				/*console.log("data" + $scope.data[index].name);
				console.log("staff" + $scope.staff[$scope.indexDnD].name);*/
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
					$scope.data.push({id: $scope.staff[$scope.indexDnD].sid, name: $scope.staff[$scope.indexDnD].name, isStaff: true, 'groups': false, children: [], tasks:[]});
					$scope.staffArray.push($scope.staff[$scope.indexDnD].sid);
					
					neo4jRequest.addStaffToGraph($stateParams.project, $scope.staff[$scope.indexDnD].sid, $scope.staff[$scope.indexDnD].name) .then(function(response){
					if(response.data.exception) { console.error('neo4jRequest Exception on addStaffToGraph()', response.data); return; }
					 if(response.data){
						 console.log('Bearbeiter hinzugefügt');
						}
						
					}); 
					
					$scope.staffExists = false;
				}
			}
			
			else{
				alert('Bitte ändern Sie die Sortierung!');
			}
		
		}
		
		$scope.editTask = function(data, row){
			
			var isChanged = false;
			var found = false;
				//name in linker und rechter Spalte ändern
				$.each($scope.options.useData,function(index){ //prüfen, ob bereits vorhandene Aufgabe leer ist
					console.log($scope.options.useData[index].name);
					if($scope.options.useData[index].name == data && isChanged == false){
						console.log('gefunden');
						if(confirm('Diese Aufgabe existiert bereits, wollen Sie die Daten übernehmen?') ){
							row.model.name = data;
							row.model.tasks[0].name = $scope.options.useData[index].tasks[0].name;
							row.model.tasks[0].from = $scope.options.useData[index].tasks[0].from;
							row.model.tasks[0].to = $scope.options.useData[index].tasks[0].to;
							isChanged = true; //nur einmal fragen
							found = true;
						}
					}
				});
				
				if(!found){
					row.model.name = data;
					row.model.tasks[0].name = data;
				}
		}
		
		$scope.sortByTasks = function(){	
	
			if($scope.sortby == 'staff'){
			$.each($scope.data,function(index){ // Array mit Aufgaben anlegen
					if($scope.data[index].isStaff == false/* && $scope.parentIsStaff($scope.data[index].parent)*/){// ist Oberaufgabe
						$scope.tasksArray.push($scope.data[index].name);
					}
				});
			
			console.log($scope.tasksArray);
			$scope.tasksArray = $.unique($scope.tasksArray);	
			$scope.tasksArray.reverse();
			console.log($scope.tasksArray);
			
			
			//array mit tasks und editors bauen
				//tasksArray einträge werden aufgabenobjekte
				$.each($scope.tasksArray,function(indexT){
					$scope.dataTasks.push({name: $scope.tasksArray[indexT], children: [], editors: []});
					
				});
				
				console.log($scope.dataTasks);
				
				//aufgabenobjekte bekommen editors
				/*	console.log($scope.data);*/
			$.each($scope.dataTasks,function(indexT){
				$.each($scope.data,function(indexD){ 
				//Oberaufgaben bekommen als Editor Parentobjekte
					if($scope.dataTasks[indexT].name == $scope.data[indexD].name /* && $scope.parentIsStaff($scope.data[indexD].parent) */){
						$scope.dataTasks[indexT].id= $scope.data[indexD].id;
						$scope.dataTasks[indexT].isStaff= $scope.data[indexD].isStaff;
						$scope.dataTasks[indexT].parent= '';
						$scope.dataTasks[indexT].children = $scope.dataTasks[indexT].children.concat($scope.data[indexD].children);
						$scope.dataTasks[indexT].status= $scope.data[indexD].status;
						$scope.dataTasks[indexT].priority= $scope.data[indexD].priority;
						$scope.dataTasks[indexT].hasData= $scope.data[indexD].hasData;
						$scope.dataTasks[indexT].tasks = $scope.data[indexD].tasks;
						$scope.dataTasks[indexT].editors = $scope.dataTasks[indexT].editors.concat($scope.getStaffById($scope.data[indexD].editors));
					}
				});
			});	
			//children auf dopplungen prüfen
			$.each($scope.dataTasks,function(indexD){
				$scope.removeDoubleChildren($scope.dataTasks[indexD].children);
			});
			
			console.log($scope.dataTasks);
			//Datenarray umschalten, Spalte hinzufügen
			$scope.options.columns.push('model.editors');
			$scope.options.useData = $scope.dataTasks;
			$scope.sortby = 'task';
			console.log($scope.dataTasks);
			};
		}
		
		$scope.sortByStaff = function(){
			if($scope.sortby == 'task'){
				$scope.tasksArray= [];
				$scope.tasksWithEditors= [];
				$scope.dataTasks= [];
				$scope.options.useData = $scope.data;
				$scope.options.columns.splice($scope.options.columns.length-1,1);
				$scope.sortby = 'staff';
			};
		}

		$scope.getStaffById= function(pid){
			/*console.log('pid' + pid);*/
			var tmp = '';
				$.each($scope.data, function(indexD){
					if(pid == $scope.data[indexD].id){
						tmp = $scope.data[indexD].name;
						/*console.log(tmp);*/
					}
			});	
			return tmp;
		}

		$scope.removeDoubleChildren = function(children){ 
			//existiert childid in Datenobjekt, wenn nicht entfernen
			//Länge anpassen
			var length = children.length;
			for(i = 0; i<length-1; i++){
					if(!$scope.childExists(children[i])){
						children.splice(i,1);
						length--;
						}
			};
		}
		
		$scope.childExists = function(childID){
			found = false;
			$.each($scope.dataTasks, function(index){
				if(childID == $scope.dataTasks[index].id){
					found = true;
				}
			});
			
			return found;
		}

		/* $scope.getChildrensEditor = function(id){
			var editors = [];
	
				$.each($scope.data,function(indexD){
						//jedes childrenobjekt mit id vergleichen
						if($scope.data[indexD].children.indexOf(id) !== -1){
						//console.log('child gefunden');
						editors.push($scope.getParentById($scope.data[indexD].parent)); //$scope.getParentById($scope.data[indexD].parent)
						//console.log('editors ' + editors);
					 	}
				});	
			
			//rückgabe array aller bearbeiter
			return editors;
		} */
		
		$scope.parentIsStaff = function(pid){ 
				if($scope.staffArray.indexOf(pid)!== -1){
				return true;
			}	
			else{
				return false;
			}
				
			
		}
		
		$scope.changeStatus = function(rowName){
			if($scope.sortby == 'staff'){
				$.each($scope.data,function(index){
					if(rowName.id == $scope.data[index].id){
						
						if($scope.data[index].status == 'zu bearbeiten'){
							if(confirm("Ist die Aufgabe wirklich erledigt?")){
								$scope.data[index].status = 'erledigt';
								$scope.data[index].tasks[0].color = '#24ff6b';
							}
							else{
								$scope.data[index].status = 'zu bearbeiten';
								$scope.data[index].tasks[0].color = '#F1C232';
							}
							return false;
								
						}
						
						if($scope.data[index].status == 'erledigt'){
							$scope.data[index].status = 'zu bearbeiten';
							$scope.data[index].tasks[0].color = '#F1C232';
							return false;				
						}
					}
				});
			}
			else{
				alert('Bitte ändern Sie die Sortierung!');
			}
		};
		
		$scope.changePriority = function(rowModel){
			
			if($scope.sortby == 'staff'){
				$.each($scope.data,function(index){
					if(rowModel.id == $scope.data[index].id){
						
						if($scope.data[index].priority == '1'){
							$scope.data[index].priority = 2;
							return false;
						}
						
						if($scope.data[index].priority == '2'){
							$scope.data[index].priority = 3;
							return false;
						}
						
						if($scope.data[index].priority == '3'){
							$scope.data[index].priority = 1;
							return false;
						}
					}
				});
			}
		else{
				alert('Bitte ändern Sie die Sortierung!');
			}
		};	
		
		
		$scope.deleteTask = function(row) {
			
			//console.log('data vorher');
			//console.log($scope.data);
			
			var dataToRemove= [];
			var hier= $scope.api.tree.getHierarchy();
			
			if(confirm("Wollen Sie diese Aufgabe wirklich löschen?")){
				if(hier.children(row)){ //wenn oberaufgabe gelöscht werden soll
				console.log(hier.descendants(row));
					$.each(hier.descendants(row),function(indexC){ //alle childrenobjekte raussuchen und zum löschen übergeben
						dataToRemove.push({'id': hier.descendants(row)[indexC].model.id});
						console.log(dataToRemove);
					});
					dataToRemove.splice(0,0,{'id': row.model.id}); //Elternobjekt zum löschen übergeben
					console.log(dataToRemove);
					
				}
				else{
					dataToRemove.push({'id': row.model.id}); 
					if(hier.children(row)){
						hier.parent(row).model.children.splice(hier.parent(row).model.children.indexOf(row.model.id,1)); //childrenobjekt in parent löschen
					}
				}
				$scope.api.data.remove(dataToRemove);
				
				//dataToRemove = dataToRemove.reverse();
				
				$.each(dataToRemove,function(indexD){
					neo4jRequest.deleteTask($stateParams.project,dataToRemove[indexD].id)
						.then(function(response){
							console.log($stateParams.project);
							console.log(dataToRemove[indexD]);
						console.log(response.data);
						}); 
				});
				
				console.log('data nacher');
				console.log($scope.data);
			}
			
        };
		
		$scope.countChildren = function(row,length, hier){
			console.log(hier.parent(row).model.name);
				for (i= 0; i < length; i++) {
					if(hier.parent(row).model.name == $scope.data[i].parent){
						$scope.childCounter++;
						}
					}
			
		}
		
		$scope.showAsideForTask = function(row){
			var hier= $scope.api.tree.getHierarchy();
			if(row.model.isStaff == true){
				$scope.newTask.staffID= row.model.id; //klcik auf Bearbeiter speichert BearbeiterId direkt
				$scope.newTask.staff= row.model.name;
				$scope.newTask.isStaff = row.model.isStaff;
			}
			
			else{
				$scope.newTask.staffID= hier.ancestors(row)[hier.ancestors(row).length-1].model.id ////klcik auf Aufgabe ermittelt root-Element -->Bearbeiter
				$scope.newTask.staff= hier.ancestors(row)[hier.ancestors(row).length-1].model.name;
				$scope.newTask.clickedElement= row;
				$scope.newTask.isStaff = row.model.isStaff;
			}
			console.log($scope.newTask.clickedElement);
			var aside = $aside({scope: $scope, templateUrl: 'partials/aside/asideTasks.html', placement: 'right', animation: 'am-fade-and-slide-right', container: '.tasksLeft' , backdrop: false});
			aside.show();
		}
		
		$scope.showAsideForComment = function(row){
			$scope.taskNameForComment= row.model.name;
			$scope.taskIdForComment= row.model.id; //--> dient der Indexermittlung der Aufgabe
			/* console.log($scope.taskNameForComment);*/
			// console.log($scope.taskIdForComment); 
			
		/* 	$.each($scope.data,function(index){
				if($scope.data[index].id == $scope.taskIdForComment){ //-->in allen Aufgaben mit gleichem Namen steht Kommenta
					$scope.commentIndex = index;
					console.log($scope.commentIndex);
				}
			}); */
			
			neo4jRequest.getCommentsFromTask(row.model.id)
						.then(function(response){
							if(response.data.exception) { console.error('neo4jRequest Exception on getCommentFromTask()', response.data); return; }
							if(response.data){
								$scope.comments = Utilities.cleanNeo4jData(response.data);
								console.log($scope.comments);
								}
						});
			
			var aside = $aside({scope: $scope, templateUrl: 'partials/aside/asideComments.html', placement: 'right', animation: 'am-fade-and-slide-right', container: '.tasksLeft' , backdrop: false});
			aside.show();
		}
		
		$scope.addComment = function(){
			$.each($scope.data,function(index){
				if($scope.data[index].name == $scope.taskNameForComment){ //-->in allen Aufgaben mit gleichem Namen steht Kommentar					
					// $scope.data[index].data.push({message: $scope.newComment.text, author: 'Jonas', date: new Date(new Date().getTime())});
					
					neo4jRequest.addCommentToTask($stateParams.project,$scope.taskIdForComment, $scope.newComment.text)
						.then(function(response){
											console.log(response.data);
										});
					$scope.data[index].hasData = true;
				}
			});
			
			/*$scope.views.activeSide = 'comments';*/	
		}
				
	/*Mitarbeiter*/
		
		$scope.getAllStaff = function() {
			mysqlRequest.getAllStaff().success(function(obj, status){
					$scope.staff = obj.data;
					//console.log($scope.staff);
			});
		};
		
		$scope.removeStaff = function(id) {
			mysqlRequest.removeStaff(id).success(function(answer, status){
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
						console.error('Mitarbeiter gelöscht');
						$scope.getAllStaff();
					});
		};
			
		$scope.addNewStaffToProject = function() {
			mysqlRequest.addNewStaff($scope.newStaff.name, $scope.newStaff.surname, $scope.newStaff.mail, $scope.newStaff.role).success(function(answer, status){
					//alert(answer);
						if(answer != 'SUCCESS') {
							console.error(answer);
							
							return;
						}
						$scope.getAllStaff();
			});
			
		}
		
		$scope.updateName = function(data,id) {
			mysqlRequest.updateName(data,id).success(function(answer, status){
				
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
						$scope.getAllStaff();
			});
			
			
		}
		
		$scope.updateSurname = function(data,id) {
		
			mysqlRequest.updateSurname(data,id).success(function(answer, status){
				
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
							$scope.getAllStaff();
			});
		}
				
		$scope.updateMail = function(data,id) {
			mysqlRequest.updateMail(data,id).success(function(answer, status){
				
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
					$scope.getAllStaff();	
			});
		}
		
		$scope.updateRole = function(data,id) {
			mysqlRequest.updateRole(data,id).success(function(answer, status){
				
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
				$scope.getAllStaff();
			});
		}

		var changeTask = function(eventName, task) {
		 	$.each($scope.options.useData,function(index){
					if($scope.options.useData[index].name == task.model.name){
							$scope.options.useData[index].tasks[0].from = task.model.from ;
							$scope.options.useData[index].tasks[0].to = task.model.to;
					}
				});
			$scope.api.groups.refresh();
        };
        
		var logReadyEvent = function() {
           // $log.info('[Event] core.on.ready');
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
	
	//initiiere Staff
	$scope.getAllStaff();
	$scope.fillDataObject();
	console.log()
	$scope.getStaffInGantt();
	
	
	/* neo4jRequest.EditorExists($stateParams.project, $stateParams.subproject,"072c2b97-06db-e018-dc32-8722993017cd").then(function(response){
										response.data.data.length;
									}); */
	 //generateRows();
	/*console.log('parents ' + $scope.staffArray);*/
	}]);

function extractData(data) {
	var results = [];
	for(var i=0; i<data.data.length; i++) {
		var object = new Object();
		for(var j=0; j<data.columns.length; j++) {
			if(data.data[i][j] == null)
				//object[data.columns[j]] = 'unbekannt';
				object[data.columns[j]] = null;
			else
				object[data.columns[j]] = data.data[i][j].data;
				//object[data.columns[j]] = data.data[i][j].data.content;
		}
		results.push(object);
	}
	return results;
}

function cleanData(data, selected) {
	selected = selected || false;
	var results = [];
	for(var i=0; i<data.data.length; i++) {
		var obj = new Object();
		for(var j=0; j<data.columns.length; j++) {
			if(data.data[i][j] == null)
				//obj[data.columns[j]] = 'unbekannt';
				obj[data.columns[j]] = null;
			else
				obj[data.columns[j]] = data.data[i][j];
		}
		if(selected)
			obj.selected = false;
		results.push(obj);
	}
	return results;
}

function createHierarchy(data) {
	var results = [];
	for(var i=0, l=data.data.length; i<l; i++) {
		var parent = {};
		/*parent.file = data.data[i][0].file.data;
		parent.obj = data.data[i][0].obj.data;*/
		parent.content = data.data[i][0].parent.data.content;
		parent.children = [];
		for(var j=0, m=data.data[i][1].length; j<m; j++) {
			var child = {};
			child.file = data.data[i][1][j].file.data;
			child.obj = data.data[i][1][j].obj.data;
			child.content = data.data[i][1][j].child.data.content;
			child.children = [];
			parent.children.push(child);
		}
		results.push(parent);
	}
	for(var i=0; i<results.length; i++) {
		for(var j=0, m=results.length; j<m; j++) {
			if(i===j) continue;
			var p = getElementInHierarchy(results[j], results[i].content);
			if(p !== undefined) {
				p.children = results[i].children;
				results.splice(i,1);
				i--;
				break;
			}
		}
	}
	return results;
}
function getElementInHierarchy(node, content) {
	if(node.content === content) return node;
	for(var i=0, l=node.children.length; i<l; i++) {
		var obj = getElementInHierarchy(node.children[i], content);
		if(obj !== undefined) return obj;
	}
	return undefined;
}
