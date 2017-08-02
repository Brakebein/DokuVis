/**
 * Modal controller for creating or editing projects.
 * @ngdoc controller
 * @name projectModalCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires Utilities
 * @requires Project
 */
angular.module('dokuvisApp').controller('projectModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Utilities', 'Project',
	function ($scope, $state, $stateParams, $timeout, Utilities, Project) {

		var prj = $stateParams.prj;

		/**
		 * Title translation id
		 * @ngdoc property
		 * @name projectModalCtrl#title
		 * @type {string}
		 */
		$scope.title = prj ? 'project_edit' : 'project_new';
		/**
		 * Model for name input field
		 * @ngdoc property
		 * @name projectModalCtrl#name
		 * @type {string}
		 */
		$scope.name = prj ? prj.name : '';
		/**
		 * Model for description input field
		 * @ngdoc property
		 * @name projectModalCtrl#desc
		 * @type {string}
		 */
		$scope.desc = prj ? prj.description : '';

		/**
		 * Saves input data by either creating a new project or updating database entries.
		 * @ngdoc method
		 * @name projectModalCtrl#save
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
					projectsUpdate(prj);
					$scope.close();
				}, function (err) {
					Utilities.throwApiException('on Project.update()', err);
				});
			}
			else {
				Project.save({ name: $scope.name, description: $scope.desc }).$promise.then(function(result) {
					console.log(result);
					projectsUpdate(result);
					$scope.close();
				}, function(err) {
					Utilities.throwApiException('on Project.create()', err);
				});
			}
		};

		/**
		 * Event that gets fired, when a new project has been created or an exiting one has been updated.
		 * @ngdoc event
		 * @name projectModalCtrl#projectsUpdate
		 * @eventType broadcast on $rootScope
		 * @param {Project} project New or updated project entry.
		 */
		function projectsUpdate(project) {
			$scope.$root.$broadcast('projectsUpdate', project);
		}

		/**
		 * Closes the modal and destroys the scope.
		 * @ngdoc method
		 * @name projectModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^');
		};

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		});
		
	}]);
