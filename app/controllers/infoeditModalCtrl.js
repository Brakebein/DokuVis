angular.module('dokuvisApp').controller('infoeditModalCtrl', ['$scope', '$state', '$stateParams', 'Utilities', 'ProjInfo',
	function ($scope, $state, $stateParams, Utilities, ProjInfo) {

		var note = $stateParams.note;
		
		$scope.title = note ? 'Info bearbeiten' : 'Neue Info';
		$scope.input = note ? note.info : '';

		/**
		 * Saves the input data by either creating new or updating nodes
		 * @memberof infoeditModalCtrl
		 * @function save
		 */
		$scope.save = function () {
			if(!$scope.input.length) {
				Utilities.dangerAlert('Bitte geben Sie Text ein!');
				return;
			}
			
			if(note) {
				note.info = $scope.input;
				note.$update().then(function () {
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on ProjInfo.update()', err);
				});
			}
			else {
				ProjInfo.save({	info: $scope.input }).$promise.then(function () {
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on ProjInfo.save()', err);
				});
			}
		};

		/**
		 * Closes the modal and destroys the scope
		 * @memberof infoeditModalCtrl
		 * @function close
		 */
		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^');
		};

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		});
		
	}]);
