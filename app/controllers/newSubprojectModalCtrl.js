/**
 * Modal controller for creating or editing subprojects.
 * @ngdoc controller
 * @name newSubprojectModalCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires Utilities
 * @requires Subproject
 */
angular.module('dokuvisApp').controller('newSubprojectModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Utilities', 'Subproject',
	function ($scope, $state, $stateParams, $timeout, Utilities, Subproject) {

		var sub = $stateParams.sub;

		/**
		 * Title translation id
		 * @ngdoc property
		 * @name newSubprojectModalCtrl#title
		 * @type {string}
		 */
		$scope.title = sub ? 'subproject_edit' : 'subproject_new';
		/**
		 * Model for name input field
		 * @ngdoc property
		 * @name newSubprojectModalCtrl#name
		 * @type {string}
		 */
		$scope.name = sub ? sub.name : '';
		/**
		 * Model for description input field
		 * @ngdoc property
		 * @name newSubprojectModalCtrl#desc
		 * @type {string}
		 */
		$scope.desc = sub ? sub.desc : '';

		/**
		 * Saves the input data by either creating new subproject or updating nodes.
		 * @ngdoc method
		 * @name newSubprojectModalCtrl#save
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
		
		/**
		 * Closes the modal and destroys the scope.
		 * @ngdoc method
		 * @name newSubprojectModalCtrl#close
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
