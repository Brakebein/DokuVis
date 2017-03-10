/**
 * Modal controller for creating or editing information assets ({@link ProjInfo}) of projects/subprojects.
 * @ngdoc controller
 * @name newProjInfoModalCtrl
 * @module dokuvisApp
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires Utilities
 * @requires ProjInfo
 */
angular.module('dokuvisApp').controller('newProjInfoModalCtrl', ['$scope', '$state', '$stateParams', 'Utilities', '$timeout', 'ProjInfo',
	function ($scope, $state, $stateParams, $timeout, Utilities, ProjInfo) {

		var note = $stateParams.note;

		/**
		 * Title translation id
		 * @ngdoc property
		 * @name newProjInfoModalCtrl#title
		 * @type {string}
		 */
		$scope.title = note ? 'Info bearbeiten' : 'Neue Info';
		/**
		 * Model for the textarea field
		 * @ngdoc property
		 * @name newProjInfoModalCtrl#input
		 * @type {string}
		 */
		$scope.input = note ? note.info : '';

		/**
		 * Saves the input data by either creating new or updating nodes.
		 * @ngdoc method
		 * @name newProjInfoModalCtrl#save
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
		 * Closes the modal and destroys the scope.
		 * @ngdoc method
		 * @name newProjInfoModalCtrl#close
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
