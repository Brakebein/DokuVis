/**
 * Controller for the modal to display detailed information about sources.
 * @ngdoc controller
 * @name sourceDetailCtrl
 * @module dokuvisApp
 * @author Brakebein
 */
angular.module('dokuvisApp').controller('sourceDetailCtrl', ['$scope', '$state', '$stateParams', '$previousState', '$http', 'Utilities', 'Source', 'Comment', '$timeout', '$translatePartialLoader',
	function($scope, $state, $stateParams, $previousState, $http, Utilities, Source, Comment, $timeout, $translatePartialLoader) {
		
		$translatePartialLoader.addPart('source');
		$previousState.memo('modalInvoker');
		$scope.switchable = $state.includes('project.explorer');

		$scope.horizontalImage = false;
		$scope.pageNr = 0; // für Textdokumente

		console.log('selection', $stateParams.selection);

		function loadSource(id) {
			Source.get({ id: id }).$promise.then(function (data) {
				console.log(data);
				if(data.eid) {
					$scope.item = data;

					$scope.pageNr = 0;
					$scope.comments = [];
					loadComments();
				}
				else
					$scope.close();
			}, function(err) {
				Utilities.throwApiException('on Source.get()', err);
			});
		}
		loadSource($stateParams.sourceId);

		function loadComments() {
			Comment.queryTarget({ targetId: $scope.item.eid }).$promise.then(function (result) {
				console.log(result);
				$scope.comments = result;
			}, function(err) {
				Utilities.throwApiException('on Comment.get()', err);
			});
		}

		/**
		 * Load next (or previous, if negative) item. `incr` is relative to the current item.
		 * So `2` will load the next but one, `-1` will load the previous one.
		 * @ngdoc method
		 * @name sourceDetailCtrl#nextIten
		 * @param incr {Number} number of steps to move (usually `1`)
		 */
		$scope.nextItem = function(incr) {
			var length = $stateParams.selection.length;
			var oldIndex = 0;

			while($stateParams.selection[oldIndex].eid !== $scope.item.eid) {
				oldIndex++;
			}

			var newIndex = ((oldIndex + incr) % length + length) % length;

			$state.go('project.explorer.source.id', { sourceId: $stateParams.selection[newIndex].eid });
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

		/**
		 * Save a new comment about the current item.
		 * @ngdoc method
		 * @name sourceDetailCtrl#postComment
		 */
		$scope.postComment = function() {
			if($scope.newCommentInput.length < 1) return;
			Comment.save({
				type: 'source',
				text: $scope.newCommentInput,
				targets: $scope.item.eid
			}).$promise.then(function (newComment) {
				console.log('newComment', newComment);
				$scope.newCommentInput = '';
				if(newComment) {
					newComment.answers = [];
					$scope.comments.push(newComment);
				}
			}, function (err) {
				Utilities.throwApiException('on Comment.save()', err);
			});
		};

		/**
		 * Save a new comment of type `answer`.
		 * @ngdoc method
		 * @name sourceDetailCtrl#postAnswer
		 * @param comment {Object} parent comment
		 */
		$scope.postAnswer = function(comment) {
			if(comment.newAnswerInput.length < 1) return;
			Comment.save({
				type: 'answer',
				text: comment.newAnswerInput,
				targets: comment.id
			}).$promise.then(function (newAnswer) {
				comment.newAnswerInput = '';
				comment.answering = false;
				if(newAnswer)
					comment.answers.push(newAnswer);
			}, function (err) {
				Utilities.throwApiException('on Comment.save()', err);
			});
		};

		// TODO: Kommentare/Antworten editieren und löschen


		/**
		 * Closes and destroys this modal and changes to GraphSearch state.
		 * @ngdoc method
		 * @name sourceDetailCtrl#enterGraph
		 * @param id {Number} GraphSearch start Id
		 */
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
		
		/**
		 * Closes the modal and destroys the controller instance/scope.
		 * @ngdoc method
		 * @name sourceDetailCtrl#close
		 */
		$scope.close = function () {
			this.$hide();
			this.$destroy();

			if($previousState.get('modalInvoker').state && !$state.includes('project.explorer.source'))
				$previousState.go('modalInvoker');
			else
				$state.go('^.^');
		};

	}]);
