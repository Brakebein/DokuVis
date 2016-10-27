angular.module('dokuvisApp').controller('projectModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Utilities', 'Project',
	/**
	 * Modal controller for creating or editing projects
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name projectModalCtrl
	 * @author Brakebein
	 * @param $scope {$scope} controller scope
	 * @param $state {$state} ui.router state
	 * @param $stateParams {$stateParams} ui.router stateParams
	 * @param $timeout {$timeout} Angular timeout
	 * @param Utilities {Utilities} Utilities
	 * @param Project {Project} Project http
	 */
	function ($scope, $state, $stateParams, $timeout, Utilities, Project) {

		var prj = $stateParams.prj;

		$scope.title = prj ? 'Projekt editieren' : 'Neues Projekt';
		$scope.name = prj ? prj.name : '';
		$scope.desc = prj ? prj.description : '';

		/**
		 * Saves input data by either creating a new project or updating database entries
		 * @memberof projectModalCtrl
		 * @function save
		 */
		$scope.save = function () {
			if(!$scope.name.length) {
				Utilities.dangerAlert('Geben sie dem Projekt einen Namen!');
				return;
			}
			
			if(prj) {
				prj.name = $scope.name;
				prj.description = $scope.desc;
				prj.$update().then(function () {
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Project.update()', err);
				});
			}
			else {
				Project.save({ name: $scope.name, description: $scope.desc }).$promise.then(function(result) {
					console.log(result);
					$scope.close();
				}, function(err) {
					Utilities.throwApiException('on Project.create()', err);
				});
			}
		};

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		});

		/**
		 * Closes the modal and destroys the scope
		 * @memberof projectModalCtrl
		 * @function close
		 */
		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^.^');
		};
		
	}]);
