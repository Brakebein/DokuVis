angular.module('dokuvisApp').controller('resourcesCtrl', ['$scope', '$stateParams', 'Person', 'Archive', 'Utilities',
	function($scope, $stateParams, Person, Archive, Utilities) {

		$scope.persons = [];
		$scope.archives = [];

		function getPersons() {
			Person.getAll().then(function (response) {
				console.log(response);
				$scope.persons = response.data;
			});
		}

		function queryArchives() {
			Archive.query().$promise.then(function (response) {
				console.log(response);
				$scope.archives = response;
			}, function (err) {
				Utilities.throwApiException('on Archive.query()', err);
			});
		}

		// init
		getPersons();
		queryArchives();

	}]);
