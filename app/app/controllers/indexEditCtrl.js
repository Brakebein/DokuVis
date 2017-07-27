angular.module('dokuvisApp').controller('indexEditCtrl', ['$scope', '$stateParams', 'phpRequest',
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

		$scope.loadIndex = function () {
			getIndex();
			getBlacklist();
		};

		$scope.logIndex = function() {
			phpRequest.getIndex($stateParams.project).then(function(response){
				console.log(response.data);
			});
		};
		$scope.indexDocuments = function() {
			phpRequest.indexDocuments($stateParams.project).then(function(response){
				console.log(response.data);
			});
		};
		$scope.searchIndex = function() {
			if(!$scope.searchTerm) return;
			phpRequest.searchText($stateParams.project, $scope.searchTerm).then(function(response){
				console.log(response.data);
			});
		};

		// init
		$scope.loadIndex();

	}]);