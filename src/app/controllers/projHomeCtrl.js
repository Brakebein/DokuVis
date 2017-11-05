/**
 * Controller of the Project Home view, organizing subprojects and project/subproject information.
 * @ngdoc controller
 * @name projHomeCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires Utilities
 * @requires Project
 * @requires Subproject
 * @requires https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translatePartialLoader $translatePartialLoader
 */
angular.module('dokuvisApp').controller('projHomeCtrl', ['$scope', '$stateParams', 'Utilities', 'Project', 'Subproject', '$translatePartialLoader',
	function ($scope, $stateParams, Utilities, Project, Subproject, $translatePartialLoader) {

		$translatePartialLoader.addPart('projects');

		/**
		 * Indicates, if the current state is in subproject or master project.
		 * @ngdoc property
		 * @name projHomeCtrl#isMaster
		 * @type {boolean}
		 */
		$scope.isMaster = $stateParams.subproject === 'master';

		function getMainProject() {
			Project.get({ id: $stateParams.project }).$promise
				.then(function (result) {
					$scope.projectName = result.name;
					$scope.projectDesc = result.description;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Project.get', err);
				});
		}

		function getSubproject() {
			Subproject.get({ id: $stateParams.subproject }).$promise
				.then(function (result) {
					$scope.projectName = result.name;
					$scope.projectDesc = result.description;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Subproject.get', err);
				});
		}


		// init
		if($stateParams.subproject === 'master')
			getMainProject();
		else
			getSubproject();


	}]);
