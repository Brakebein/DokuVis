angular.module('dokuvisApp').controller('subprojectModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Utilities', 'Subproject',
	/**
	 * Modal controller for creating or editing subprojects
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name subprojectModalCtrl
	 * @author Brakebein
	 * @param $scope {$scope} controller scope
	 * @param $state {$state} ui.router state
	 * @param $stateParams {$stateParams} ui.router stateParams
	 * @param $timeout {$timeout} Angular timeout
	 * @param Utilities {Utilities} Utilities
	 * @param Subproject {Subproject} Subproject http
	 */
	function($scope, $state, $stateParams, $timeout, Utilities, Subproject) {

		$scope.title = $state.includes('project.home.subproject.edit') ? 'Unterprojekt editieren' : 'Neues Unterprojekt';
		$scope.name = $stateParams.name || '';
		$scope.desc = $stateParams.desc || '';

		/**
		 * Saves the input data by either creating new subproject or updating nodes
		 * @memberof subprojectModalCtrl
		 * @function save
		 */
		$scope.save = function () {
			if(!$scope.name.length) {
				Utilities.dangerAlert('Keinen Namen angegeben!');
				return;
			}

			if($stateParams.subId) {
				Subproject.update($stateParams.subId, $scope.name, $scope.desc).then(function () {
					//console.log('subproject changed');
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Subproject.change()', err);
				});
			}
			else {
				Subproject.create($scope.name, $scope.desc).then(function () {
					//console.log('subproject created');
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Subproject.create()', err);
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
		 * @memberof subprojectModalCtrl
		 * @function close
		 */
		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^.^');
		};
		
	}]);
