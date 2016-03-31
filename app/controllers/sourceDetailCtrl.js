webglControllers.controller('sourceDetailCtrl', ['$scope', '$http', 'Utilities', 'Comment',
	function($scope, $http, Utilities, Comment) {
		
		console.log('sourceDetailCtrl init');
		
		$scope.horizontalImage = false;
		$scope.pageNr = 0;
		
		var items = $scope.$parent.filteredSourceResults;
		$scope.itemindex = $scope.$parent.modalParams.index;
		
		$scope.nextItem = function(incr) {
			$scope.itemindex = (($scope.itemindex + incr) % items.length + items.length) % items.length;
			$scope.item = items[$scope.itemindex];
			
			if($scope.item.type =='picture' || $scope.item.type =='plan') {
				var img = new Image();
				img.onload = function() {
					if(this.width/this.height > 2)
						$scope.horizontalImage = true;
					else
						$scope.horizontalImage = false;
					$scope.$apply();
				}
				img.src = 'data/'+$scope.item.file.path+ ($scope.item.file.display || $scope.item.file.name);
			}
			else {
				$scope.horizontalImage = false;
				$scope.pageNr = 0;
			}
			
			loadComments();
		};
		
		$scope.nextPage = function(incr) {
			$scope.pageNr = (($scope.pageNr + incr) % $scope.item.file.display.length + $scope.item.file.display.length) % $scope.item.file.display.length;
		};
		
		$scope.nextItem(0);
		
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
			Comment.create($scope.newComment, $scope.item.eid, 'source').then(function(response) {
				console.log(response);
			}, function(err) {
				Utilities.throwApiException('on Comment.create()', err);
			});
		};
		
		function loadComments() {
			Comment.get($scope.item.eid).then(function(response) {
				console.log(response);
				$scope.comments = response.data;
			}, function(err) {
				Utilities.throwApiException('on Comment.get()', err);
			});
		}
		
	}]);