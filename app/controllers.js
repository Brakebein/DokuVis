var webglControllers = angular.module('webglControllers', ['uiSlider', 'angularFileUpload', 'pw.canvas-painter',
	'gantt',
	'gantt.table',
	'gantt.movable', 
	'gantt.tooltips',
	'gantt.labels',
	'gantt.sortable',
    'gantt.drawtask',
    'gantt.bounds',
    'gantt.progress',
    'gantt.tree',
    'gantt.groups',
    'gantt.overlap',
    'gantt.resizeSensor',
	'ang-drag-drop'
]);

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
					subprj: m.subprj,
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
				taskID: '',
				isInserted: false,
				activeBtn: 'comment',
				editor: '',
				to: '',
				from: '',
				taskName: '',
			});
			
			console.log($scope.markers);
			
			$timeout(function() {
				$scope.setFocusOnComment($scope.markers.length-1);
			});
			
		};
		
		/* $scope.changeMarkerStatus = function (id, status){
			$.each($scope.markers, function(indexM){
				if($scope.markers[indexM].id==id ){
					$scope.markers[indexM].activeBtn = status;
					return false;
				}
			})
		} */
		
		$scope.saveScreenshot = function () {
			var tid = Utilities.getUniqueId();
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
					
					
						$.each($scope.markers,function(indexN){ //marker durchgehen und entweder Kommentar an Aufgabe hängen oder neue Aufgabe einfügen
							//Kommentar einfügen
							console.log($scope.markers[indexN].taskID,$scope.markers[indexN].comment);
							
								if($scope.markers[indexN].activeBtn == 'comment'){
									if($scope.markers[indexN]!= ''){
										neo4jRequest.addCommentToTask($scope.$parent.project,$scope.markers[indexN].taskID,$scope.markers[indexN].comment).success(function(data, status){
												console.log(data, 'neo4j comment inserted');
												if(data.exception == 'SyntaxException') {
													console.error('ERROR: Neo4j SyntaxException');
												}
											});
									}
								}
								
								else{
									//Aufgabe einfügen
									console.log('taskID' + $scope.markers[indexN].taskID)	
									if($scope.markers[indexN].taskID == ''){ 
									//Wenn Masterprojekt, Aufgabe an ausgewähltes Subprojekt anhängen
									
										if($stateParams.subproject == 'master'){
											neo4jRequest.addTask($stateParams.project, $scope.markers[indexN].subprj, tid, $scope.markers[indexN].taskName, $scope.markers[indexN].comment,$scope.markers[indexN].editor
																, Utilities.getFormattedDate($scope.markers[indexN].from), Utilities.getFormattedDate($scope.markers[indexN].to),'priority_high', 'status_todo')
													.then(function(response){
													console.log(response.data);
													})
										}
										//andernfalls an aktives Subprojekt
										else{
											neo4jRequest.addTask($stateParams.project, $stateParams.subproject, tid, $scope.markers[indexN].taskName, $scope.markers[indexN].comment,$scope.markers[indexN].editor
															, Utilities.getFormattedDate($scope.markers[indexN].from), Utilities.getFormattedDate($scope.markers[indexN].to),'priority_high', 'status_todo')
												.then(function(response){
												console.log(response.data);
												})
										}
									}
									else{ //als Unteaufgabe an Aufgabe anhängen
										neo4jRequest.addTask($stateParams.project, $scope.markers[indexN].taskID, tid, $scope.markers[indexN].taskName, $scope.markers[indexN].comment,$scope.markers[indexN].editor
														, Utilities.getFormattedDate($scope.markers[indexN].from), Utilities.getFormattedDate($scope.markers[indexN].to),'priority_high', 'status_todo')
											.then(function(response){
											console.log(response.data);
											})
									}
									
								}
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
	
webglControllers.controller('configCtrl', ['$scope', '$stateParams', 'mysqlRequest', 'Utilities', 'neo4jRequest',
	function($scope, $stateParams, mysqlRequest, Utilities, neo4jRequest) {
		
		/*Mitarbeiter*/
		$scope.staffInGantt = [];
		$scope.newStaff = new Object();
		$scope.newStaff.sid = '';
		$scope.newStaff.name = '';
		$scope.newStaff.surname = '';
		$scope.newStaff.mail = '';
		$scope.newStaff.role = '';
		$scope.newStaff.projects = '';
		$scope.staffExists= false;
		$scope.staff = [];
		$scope.roles = [];
		
		
		$scope.getPid = function(){
			mysqlRequest.getProjectEntry($stateParams.project).then(function(response) {
				if(!response.data) { console.error('mysqlRequest failed on getProjectEntry()', response); return; }
				$scope.pid = response.data.pid;		
				$scope.getAllStaff($scope.pid);
				console.log(response);
			});
		}
		
		$scope.getAllStaff = function(pid) {
			
			mysqlRequest.getAllStaff(pid).then(function(response){
				if(!response.data) { console.error('mysqlRequest failed on getAllStaff()', response); return; }
				$scope.staff = response.data;
				console.log($scope.staff);
			});
		};
		
		$scope.removeStaff = function(staffId,roleId) {
			mysqlRequest.removeStaff(staffId,roleId,$scope.pid).then(function(response){
						if(response.data != 'SUCCESS') {
							console.error(response);
							return;
						}
						console.log('Mitarbeiter gelöscht');
						$scope.getAllStaff($scope.pid);
					});
		};
			
		$scope.addNewStaffToProject = function() {
			var id = Utilities.getUniqueId();	
			mysqlRequest.addNewStaff(id, $scope.newStaff.name, $scope.newStaff.surname, $scope.newStaff.mail, $scope.newStaff.role, $scope.pid).then(function(response){
						if(response.data != 'SUCCESS') {
							console.error(response);
							return;
						}
						$scope.getAllStaff($scope.pid);
						
						neo4jRequest.addStaffToGraph($stateParams.project, id, $scope.newStaff.name) .then(function(response){
							console.log($scope.newStaff.name);
							if(response.data.exception) { console.error('neo4jRequest Exception on addStaffToGraph()', response.data); return; }
							 if(response.data){
								 console.log('Bearbeiter hinzugefügt');
								$scope.newStaff.name = '';
								$scope.newStaff.surname = '';
								$scope.newStaff.mail = '';
								$scope.newStaff.role = '';
								}
						
					});
						
						console.log($scope.staff);
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
						
		$scope.updateMail = function(data,id) {
			mysqlRequest.updateMail(data,id).success(function(answer, status){
				
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
					$scope.getAllStaff();	
			});
		}
				
		$scope.getAllRoles = function() {			
			mysqlRequest.getAllRoles().then(function(response){
				if(!response.data) { console.error('mysqlRequest failed on getAllRoles()', response); return; }
					$scope.roles = response.data;
				console.log($scope.roles);
				});
		}
		
		$scope.getPid();
		$scope.getAllRoles();
		console.log($scope.staff);
		
	}]);
	
webglControllers.controller('tasksCtrl', ['$scope','$stateParams', '$timeout', '$sce', 'phpRequest', 'mysqlRequest', 'neo4jRequest', '$http', 'Utilities','$modal', 'ganttUtils', 'GanttObjectModel', 'ganttMouseOffset', 'ganttDebounce', 'moment',
	function($scope, $stateParams, $timeout, $sce, phpRequest, mysqlRequest, neo4jRequest, $http, Utilities, $modal,utils, ObjectModel, mouseOffset, debounce, moment) {
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
		$scope.newStaff = new Object();
		$scope.newStaff.sid = '';
		$scope.newStaff.name = '';
		$scope.newStaff.surname = '';
		$scope.newStaff.mail = '';
		$scope.newStaff.role = '';
		$scope.newStaff.projects = '';
		$scope.staffExists= false;
		
		//Overlay
		$scope.overlayParams = {url: '', params: {}};
		
		/*alle Rollen*/
		$scope.roles = [];

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
		$scope.views = new Object();
		$scope.views.activeSide = 'staff';
		
		$scope.newComment = new Object();
		$scope.newComment.text = '';
		
		/*Aufgaben umsortieren*/
 		 $scope.changeOrder = 'false';
 		 
		/*IndexDnd*/
		$scope.indexDnD;

		/*alle Unterprojekte abrufen*/
		$scope.subprojects = [];
		
		/*zweites Datenobjekt zum umsortieren*/
		$scope.dataTask = [];
		
		$scope.data = [		//hier werden alle Aufgaben gespeichert
		 {id: 1, name: 'Usabilitytest', isStaff: true, type: 'project', editors: ['Martin','Jonas'], 'groups': false, children: [], tasks: []},
    
		{id: 2, name: 'Unterprojekt 1', parent: 1, type: 'project', editors: ['Martin'], isStaff: true,'groups': false, children: [], tasks: []},  
    
    	{id: 9, name: 'Aufgabe1', isStaff: false, type: 'task', parent: 2, editors: ['Martin'], children: [], status: 'zu bearbeiten',priority: 1,hasData: true, editors: [2], tasks: [{name: 'Aufgabe1', color: '#F1C232', from: '2016-4-20', to: '2016-5-25'}]},
		
		{id: 10, name: 'Aufgabe2',isStaff: false, type: 'task', parent: 2, editors: ['Martin'],children: [],  status: 'erledigt',priority: 3,  tasks: [{name: 'Aufgabe2', color: '#F1C232', from: '2016-4-20', to: '2016-4-25'}]},
		 
		{id: 3, name: 'Unterunterprojekt 1',parent: 2, type: 'project', editors: ['Martin'], groups: 'false', isStaff: true, children: []},
		 
		{id: 5, name: 'Aufgabe3', isStaff: false, type: 'task',  parent: 3, editors: ['Martin'], status: 'zu bearbeiten', priority: 3, tasks: [{name: 'Aufgabe3', color: '#F1C232', from: '2016-4-20', to: '2016-5-01'}]},
          
		{id: 4, name: 'Unterunterprojekt 2',parent: 2, type: 'project', editors: ['Jonas','Martin'], groups: 'false', isStaff: true, children: []},                 

		{id: 7,name: 'Aufgabe4', isStaff: false, type: 'task',  parent: 4, children: [], status: 'erledigt', priority: 2, hasData: false, editors: ['Jonas'],  data: [], tasks: [{name: 'Aufgabe4', color: '#24ff6b', from: '2016-4-20', to: '2016-5-15'}]},
		
		{id: 6, name: 'Unterprojekt 2', type: 'project',  isStaff: true, parent: 1, children: [], groups: 'false', status: 'erledigt',priority: 3, hasData: false, editors: ['Jonas','Martin'], tasks: []},
		
		{id: 8,name: 'Aufgabe5', isStaff: false, parent: 6, type: 'task', children: [9], status: 'erledigt',priority: 2, hasData: true, editors: ['Jonas','Martin'], tasks: []},

		{id: 9, name: 'Aufgabe6', isStaff: false, parent: '', type: 'task', children: [], status: 'zu bearbeiten',priority: 2, hasData: false, editors: ['Martin'], tasks:[{name: 'Aufgabe6', color: '#F1C232', from: '2016-3-20', to: '2016-4-25'}]},
		
		]		
		
		$scope.options = { // dient der Konfiguration der Tabelle
			useData: $scope.data, // welches Datenobjekt
            scale: 'day',			// Skalierung--> Tage, Wochen, Monate, Jahre
            sortMode: undefined,	// Sortierun nach Priorität, Datum,...
            sideMode: 'TreeTable', 	// 
			canDraw: function(event) { //Möglichkeit zum Zeichnen von Aufgaben
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
			draw: true,
            daily: false,
			fromDate:  getFormattedDate(new Date()),
			toDate: getFormattedDate(addDays(new Date(),30)),
			currentDateValue: new Date(),
            maxHeight: false,
            width: false,
            columns: [/* 'trash', 'model.priority','model.status',*/ 'model.editors' ], //Inhalt der Spalten, wird mit Eigenschaft der Aufgabe gefüllt
			columnsHeaders: {'trash': 'Löschen', 'model.priority': 'Priorität',  'model.status': 'Status', 'model.editors': 'Bearbeiter', 'model.subprj' : 'Unterprojekt'}, // Beschriftung der Kopfzeile
            columnsClasses: {'model.name' : 'gantt-column-name', 'from': 'gantt-column-from', 'to': 'gantt-column-to', 'model.status': 'gantt-column-status'}, // Zuweisen von CSS-Klassen zu Spalten, nicht genutzt
			columnsFormatters: {	// dient zum Formatieren der angezeigten Werte in den Spalten, kann gneutzt werden, um Bearbeiter durch Icons zu ersetzten--> Funktion geht nicht richtig
									/* 'model.editors': function(editors) { 
										if(editors){
											for (i = 0; i < editors.length; i++) { 
												console.log(editors[i].name);
												return  editors[i].name;
											}											
										}
									}   */
					            },
            treeHeaderContent: 'Projektstruktur', //Überschrift erste Spalte
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
            autoExpand: 'none',
            taskOutOfRange: 'truncate',
			fromDate:  getFormattedDate(new Date()),
			toDate: getFormattedDate(addDays(new Date(),30)),
            rowContent: '	<!--<i ng-hide ="row.model.isStaff" ng-class="row.model.hasData == true ?  \'fa fa-comment-o\' : \'fa fa-comment-o\'" \ //Inhalt eines Eintrages in der Tabelle
							ng-click="scope.showAsideForComment(row)" bs-tooltip="tooltip[7]"> </i> -->\
							<i ng-switch = "row.model.type" > <i ng-switch-when = \'project\' ng-class = "\'glyphicon glyphicon-folder-open\'" ng-click="scope.openDescAndComments(row)"></i><i ng-switch-when = \'task\' ng-class = "row.model.hasData == true ? \'fa fa-envelope\' : \'glyphicon glyphicon-file\'" ng-click="scope.openDescAndComments(row)"></i></i>\
							<i ng-class = "row.model.isStaff == true ? \'parent\': \'child\'" ng-click = scope.openEditTaskForm(row)>{{row.model.name}}</i>\
							<i class="fa fa-plus" id="row" bs-tooltip="tooltip[1]" ng-click="scope.openNewTaskForm(row)" ></i>',
            taskContent: '{{task.model.name}}',  //Eintrag im Balken
            zoom: 1.3, 
			contentTooltips: 'von: {{task.model.from.format("DD.MM")}}	 bis: {{task.model.to.format("DD.MM")}}', //Inhalt der Tooltips
            allowSideResizing: true, //Möglichkeit, Seitenleiste zu verschieben
            labelsEnabled: true,
            currentDate: 'line',
            groupDisplayMode: 'group',
            filterTask: '', //durchsucht Taskmodel --> Balken rechts
            filterRow: '', //durchsucht Rowmodel --> Tabelle links
			api: function(api) { //Eventsteuerung
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

	              api.core.on.ready($scope, function(){
	              	api.core.on.ready($scope, logReadyEvent);
	           
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
		}
		
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
		
		function addDays(date, days) {
		    var result = new Date(date);
		    result.setDate(date.getDate() + days);
		    return result;
		}

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
								 
							};
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
		} 
		
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
			
			
		
		}
		
		$scope.extractEditorData = function(){	// extrahiert Editordaten aus Eintrag
			$.each($scope.newTask.clickedElement.editors,function(i){
				$scope.editorNames.push($scope.newTask.clickedElement.editors[i].name);
				$scope.editorIds.push($scope.newTask.clickedElement.editors[i].sid);			
			});
			console.log($scope.editorIds);
			console.log($scope.editorNames);
		}
		
		$scope.openNewTaskForm = function(row) { // öffnet Popup für neue Aufgaben
					
			//$scope.newTask.clickedElement = '';
			$scope.newTask.clickedElement= row;
			console.log($scope.newTask.clickedElement);
			
			$scope.modalParams = {
				modalType: 'medium',
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
		}
		
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
		
		$scope.showAsideForComment = function(row){ //Seitenmenü für Kommentare
		
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
					$scope.options.sortMode === 'model.priority' ? $scope.options.sortMode = '-model.priority' : $scope.options.sortMode = 'model.priority';;
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
	
		$scope.closeAside = function(){ //schließt Seitenmnü
			$scope.resizerValue = $scope.resizerIn;
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
				alert($scope.pid);
				$scope.getAllStaff($scope.pid);				
			});
		}
		
		$scope.getAllStaff = function(pid) {
			
			mysqlRequest.getAllStaff(pid).then(function(response){
				if(!response.data) { console.error('mysqlRequest failed on getAllStaff()', response); return; }
				$scope.staff = response.data;
				console.log($scope.staff);
			});
		};
		
		$scope.removeStaff = function(staffId,roleId) {
			mysqlRequest.removeStaff(staffId,roleId,$scope.pid).then(function(response){
						if(response.data != 'SUCCESS') {
							console.error(response);
							return;
						}
						console.log('Mitarbeiter gelöscht');
						$scope.getAllStaff($scope.pid);
					});
		};
			
		$scope.addNewStaffToProject = function() {
			var id = Utilities.getUniqueId();
			alert($scope.pid);
			mysqlRequest.addNewStaff(id, $scope.newStaff.name, $scope.newStaff.mail, $scope.newStaff.role,$scope.pid).then(function(response){
						if(response.data != 'SUCCESS') {
							console.error(response);
							return;
						}
						$scope.getAllStaff($scope.pid);
			});
			
			$scope.newStaff.name = '';
			$scope.newStaff.mail = '';
			$scope.newStaff.role = '';
			
			//$scope.resizerValue = $scope.resizerIn;
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
		
		$scope.updateMail = function(data,id) {
			mysqlRequest.updateMail(data,id).success(function(answer, status){
				
						if(answer != 'SUCCESS') {
							console.error(answer);
							return;
						}
					$scope.getAllStaff();	
			});
		}
		
		$scope.getAllRoles = function() {			
			mysqlRequest.getAllRoles().then(function(response){
				if(!response.data) { console.error('mysqlRequest failed on getAllRoles()', response); return; }
					$scope.roles = response.data;
				//console.log($scope.roles);
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
	
	//initiiere alles
	$scope.getPid();
	console.log($scope.pid);
	$scope.getAllSubprojects();
	$scope.getAllRoles();
	$scope.fillDataObject('task');
	//$scope.getStaffFromGraph();
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

