angular.module('dokuvisApp').controller('resourcesCtrl', ['$scope', '$stateParams', 'Person', 'Archive',
	function($scope, $stateParams, Person, Archive) {

		$scope.persons = [];
		$scope.archives = [];

		function getPersons() {
			Person.getAll().then(function (response) {
				console.log(response);
				$scope.persons = response.data;
			});
		}

		function getArchives() {
			Archive.getAll().then(function (response) {
				console.log(response.data);
				$scope.archives = response.data;
			});
		}

		// init
		getPersons();
		getArchives();

	}]);
