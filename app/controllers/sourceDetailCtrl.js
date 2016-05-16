angular.module('dokuvisApp').controller('sourceDetailCtrl', ['$scope', '$state', '$stateParams', '$previousState', '$http', 'Utilities', 'Source', 'Comment', '$timeout',
	function($scope, $state, $stateParams, $previousState, $http, Utilities, Source, Comment, $timeout) {
		
		console.log('sourceDetailCtrl init');
		$previousState.memo('modalInvoker');
		
		$scope.horizontalImage = false;
		$scope.pageNr = 0; // für Textdokumente
		
		function loadSource(id) {
			Source.get(id).then(function (response) {
				console.log(response.data);
				if(response.data) {
					$scope.item = response.data;
					prepareItem();
				}
				else
					$scope.close();
			}, function(err) {
				Utilities.throwApiException('on Source.get()', err);
			});
		}
		loadSource($stateParams.sourceId);

		function prepareItem() {
			if($scope.item.type =='picture' || $scope.item.type =='plan') {
				var img = new Image();
				img.onload = function() {
					$scope.horizontalImage = this.width/this.height > 2;
					$scope.$apply();
				};
				img.src = 'data/'+$scope.item.file.path+ ($scope.item.file.display || $scope.item.file.name);
			}
			else {
				$scope.horizontalImage = false;
				$scope.pageNr = 0;
			}

			$scope.comments = [];
			loadComments();
		}

		function loadComments() {
			Comment.get($scope.item.eid).then(function(response) {
				console.log(response);
				$scope.comments = response.data;
			}, function(err) {
				Utilities.throwApiException('on Comment.get()', err);
			});
		}

		$scope.nextItem = function(incr) {
			var length = Source.results.filtered.length;
			var oldIndex = 0;
			while(Source.results.filtered[oldIndex].eid !== $scope.item.eid) {
				oldIndex++;
			}
			var newIndex = ((oldIndex + incr) % length + length) % length;
			$state.go('project.explorer.source.id', { sourceId: Source.results.filtered[newIndex].eid });
		};
		
		$scope.nextPage = function(incr) {
			$scope.pageNr = (($scope.pageNr + incr) % $scope.item.file.display.length + $scope.item.file.display.length) % $scope.item.file.display.length;
		};
		
		$scope.highlight = function(event) {
			if(event.target.className !== 'ocrx_word') return;
			
			var values = $('.displayText').find('.ocr_page')[0].attributes.title.value.match(/bbox (\d+) (\d+) (\d+) (\d+);/);
			var global = [values[1], values[2], values[3], values[4]];
			
			values = event.target.attributes.title.value.match(/^bbox (\d+) (\d+) (\d+) (\d+); x_wconf (\d+)$/);
			var bbox = [values[1], values[2], values[3], values[4]];
			
			var img = $('.displayText').find('img');
			
			var left = Math.floor( bbox[0] * img.width() / global[2] );
			var width = Math.ceil( bbox[2] * img.width() / global[2] ) - left + 1;
			var top = Math.floor( bbox[1] * img.height() / global[3] );
			var height = Math.ceil( bbox[3] * img.height() / global[3] ) - top + 1;
			
			//console.log(left, width, top, height);
			
			$('#wordRect').css({
				left: left+'px',
				top: top+'px',
				width: width+'px',
				height: height+'px'
			});
		};
		
		$scope.toggleConfidence = function() {
			$scope.showConfidence = !$scope.showConfidence;
			
			var words = $('.displayText').find('.ocrx_word');
			for(var i=0, l=words.length; i<l; i++) {
				if($scope.showConfidence) {
					var values = words[i].attributes.title.value.match(/^bbox (\d+) (\d+) (\d+) (\d+); x_wconf (\d+)$/);
					var wconf = values[5];
					var hue = Math.floor((wconf-50)/50 * 120);
					$(words[i]).css('background', 'hsl('+hue+',100%,85%)');
				}
				else
					$(words[i]).css('background', 'none');
			}
		};
		
		$scope.editText = function() {
			//$scope.textEdit = !$scope.textEdit;
			
			$http.get('data/' + $scope.item.file.path + $scope.item.file.display[$scope.pageNr]).then(function(response) {
				console.log(response);
				$scope.editorInput = response.data;
				$scope.textEdit = true;
			});
			
		};
		
		$scope.saveText = function() {
			console.log($scope.editorInput);
		};
		
		// Kommentare
		$scope.postComment = function() {
			if($scope.newCommentInput.length < 1) return;
			Comment.create($scope.newCommentInput, $scope.item.eid, 'source').then(function(response) {
				console.log(response);
				$scope.newCommentInput = '';
				var newComment = response.data[0];
				if(newComment) {
					newComment.answers = [];
					$scope.comments.push(newComment);
				}
			}, function(err) {
				Utilities.throwApiException('on Comment.create()', err);
			});
		};

		$scope.postAnswer = function(comment) {
			if(comment.newAnswerInput.length < 1) return;
			Comment.create(comment.newAnswerInput, comment.id, 'answer').then(function(response) {
				comment.newAnswerInput = '';
				comment.answering = false;
				if(response.data[0])
					comment.answers.push(response.data[0]);
			}, function(err) {
				Utilities.throwApiException('on Comment.create()', err);
			})
		};

		// TODO: Kommentare/Antworten editieren und löschen


		$scope.enterGraph = function (id) {
			this.$hide();
			this.$destroy();
			$state.go('project.graph.node', { startNode: id })
		};

		$scope.$on('$stateChangeSuccess', function (event, toState, toParams) {
			console.log('source state changed', toParams);
			if(toParams.sourceId)
				loadSource(toParams.sourceId);
			else
				$timeout(function () {
					$scope.close();
				});
		});

		// closing
		$scope.close = function () {
			this.$hide();
			this.$destroy();

			if($previousState.get('modalInvoker').state)
				$previousState.go('modalInvoker');
			else
				$state.go('project.explorer');
		};

		$scope.$on('$destroy', function (event) {
			console.log('destroy sourceDetail');
		});
	}]);