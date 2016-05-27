angular.module('dokuvisApp').controller('uploadCtrl', ['$scope', '$state', '$stateParams', '$previousState', 'Uploader', 'neo4jRequest', 'Utilities', '$timeout', '$modal', 'Source', 'Model', 'Archive',
	function($scope, $state, $stateParams, $previousState, Uploader, neo4jRequest, Utilities, $timeout, $modal, Source, Model, Archive) {

        $previousState.memo('modalInvoker');

		// init
		var isInserting = false;

		var imageTypes = ['jpg','JPG','png','PNG','jpeg','bmp','gif','tiff'];
		var textTypes = ['pdf'];

		//$scope.insert = $scope.$parent.overlayParams;
		//$scope.insert.project = $scope.$parent.project;
		$scope.insert = {params: {type: 'text', attachTo: undefined}};
		$scope.insert.phpurl = '';

		$scope.uploadType = $stateParams.uploadType; //$scope.$parent.$parent.modalParams.type;
		$scope.attachTo = $stateParams.attachTo; //$scope.$parent.$parent.modalParams.attachTo;

		console.log('$stateParams', $stateParams);
		console.log('attach', $scope.attachTo);

		//$scope.insert.formTitle = '';
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

		var uploader = Uploader;

		/*var uploader = $scope.uploader = new FileUploader({
			url: $scope.insert.phpurl
		});*/
		//uploader.queue = $scope.insert.params.queue;

		// FILTERS

		if($scope.uploadType == 'source') {
			$scope.title = 'Quelle einfügen';
			uploader.filters.push({
				name: 'sourceFilter',
				fn: function(item, options) {
					var type = item.type.slice(item.type.lastIndexOf('/') + 1);
					return imageTypes.concat(textTypes).indexOf(type) !== -1;
				}
			});
		}
		else if($scope.uploadType == 'model') {
			$scope.title = 'Modell einfügen';
			uploader.filters.push({
				name: 'modelFilter',
				fn: function(item, options) {
					var type = '|' + item.name.slice(item.name.lastIndexOf('.') + 1) + '|';
					return '|dae|DAE|obj|'.indexOf(type) !== -1;
				}
			});
		}
		else if($scope.uploadType == 'zip') {
			$scope.title = '3D-Plan hinzufügen';
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

		uploader.onWhenAddingFileFailed = function(item, filter, options) {
			console.info('onWhenAddingFileFailed', item, filter, options);
			Utilities.dangerAlert('Nicht unterstütztes Format!');
			//$scope.$parent.alert.message = 'Nicht unterstütztes Format!';
			//$scope.$parent.alert.showing = true;
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
				item.repros = '';
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
				repros: item.repros,
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
				var objDatas = [];
				function insertNodes(nodes) {
					for(var i=0, l=nodes.length; i<l; i++) {
						objDatas.push(nodes[i]);
						/*fileItem.anzInserting++;
						neo4jRequest.insertModel($stateParams.project, $stateParams.subproject, fileItem.formData[0], nodes[i]).then(function(response){
							if(response.data.exception) { console.error('neo4j failed on insertModel()', response.data); return; }
							console.log('insertModel', response.data);
							//isInserting = false;
							fileItem.anzInserted++;
							console.log(fileItem.anzInserted, fileItem.anzInserting);
							if(fileItem.anzInserted == fileItem.anzInserting)
								fileItem.isInserting = false;
						});*/
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
				console.log(fileItem.formData[0], objDatas);
				Model.insert(fileItem.formData[0], objDatas).then(function(response) {
					console.log('insertModel', response.data);
					fileItem.isInserting = false;
				}, function(err) {
					Utilities.throwApiException('on Model.insert()', err);
				});
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
        $scope.uploader = uploader;
		/*for(var i=0; i<Source.results.queue.length; i++) {
			uploader.addToQueue(Source.results.queue[i]);
		}*/

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
		};

		$scope.getArchives = function() {
			Archive.getAll().then(function(response){
				$scope.archives = response.data;
				console.log('Archives:', $scope.archives);
			}, function (err) {
				Utilities.throwApiException('on Archive.getAll()', err);
			});
		};
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
			neo4jRequest.getAllLabelProps($stateParams.project, label, prop).then(function(response){
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
					neo4jRequest.findNodeWithSpecificContent($stateParams.project, params.label, item[params.prop]).success(function(data, status){
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

			neo4jRequest.searchForExistingNodes($stateParams.project, params.label, search).success(function(data, status){
				$scope.suggestions = Utilities.cleanNeo4jData(data);
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
					neo4jRequest.findNodeWithSpecificContent($stateParams.project, params.label, search).success(function(data, status){
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

		$scope.$on('$stateChangeStart', function (event, toState, toParams) {
            $timeout(function () {
                $scope.close();
            });
		});

		// closing
		$scope.close = function () {
			this.$hide();
            Uploader.clearQueue();
			Uploader.filters.pop();
			this.$destroy();

			if($previousState.get('modalInvoker').state)
				$previousState.go('modalInvoker');
			else
				$state.go('project.explorer');
		};

	}]);