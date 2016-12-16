angular.module('dokuvisApp').controller('newSubprojectModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Utilities', 'Subproject',
	/**
	 * Modal controller for creating or editing subprojects
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name newSubprojectModalCtrl
	 * @author Brakebein
	 * @param $scope {$scope} controller scope
	 * @param $state {$state} ui.router state
	 * @param $stateParams {$stateParams} ui.router stateParams
	 * @param $timeout {$timeout} Angular timeout
	 * @param Utilities {Utilities} Utilities
	 * @param Subproject {Subproject} Subproject http
	 */
	function($scope, $state, $stateParams, $timeout, Utilities, Subproject) {

		var sub = $stateParams.sub;
		
		$scope.title = sub ? 'subproject_edit' : 'subproject_new';
		$scope.name = sub ? sub.name : '';
		$scope.desc = sub ? sub.desc : '';

		/**
		 * Saves the input data by either creating new subproject or updating nodes
		 * @memberof newSubprojectModalCtrl
		 * @function save
		 */
		$scope.save = function () {
			if(!$scope.name.length) {
				Utilities.dangerAlert('Keinen Namen angegeben!');
				return;
			}

			if(sub) {
				sub.name = $scope.name;
				sub.desc = $scope.desc;
				sub.$update().then(function () {
					//console.log('subproject changed');
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Subproject.update()', err);
				});
			}
			else {
				Subproject.save({ name: $scope.name, desc: $scope.desc }).$promise.then(function () {
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
		 * @memberof newSubprojectModalCtrl
		 * @function close
		 */
		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^');
		};
		
	}]);
