/**
 * Controller of the Project Home view, organizing subprojects and project/subproject information.
 * @ngdoc controller
 * @name projHomeCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires neo4jRequest
 * @requires Utilities
 * @requires Project
 * @requires Subproject
 * @requires ProjInfo
 * @requires ConfirmService
 * @requires https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translatePartialLoader $translatePartialLoader
 */
angular.module('dokuvisApp').controller('projHomeCtrl', ['$scope', '$stateParams', 'neo4jRequest', 'Utilities', 'Project', 'Subproject', 'ProjInfo', 'ConfirmService', '$translatePartialLoader',
	function ($scope, $stateParams, neo4jRequest, Utilities, Project, Subproject, ProjInfo, ConfirmService, $translatePartialLoader) {

		$translatePartialLoader.addPart('projects');

		/**
		 * Indicates, if the current state is in subproject or master project.
		 * @ngdoc property
		 * @name projHomeCtrl#isMaster
		 * @type {boolean}
		 */
		$scope.isMaster = $stateParams.subproject === 'master';

		/**
		 * Object containing project infos
		 * @ngdoc property
		 * @name projHomeCtrl#projInfo
		 * @type {Object}
		 */
		$scope.projInfo = {};

		/**
		 * Array of available subprojects
		 * @ngdoc property
		 * @name projHomeCtrl#subprojects
		 * @type {Array}
		 */
		$scope.subprojects = [];

		function getProjectInfoFromTable() {
			Project.get({ id: $stateParams.project }).$promise.then(function (result) {
				$scope.projInfo.name = result.name;
				$scope.projInfo.description = result.description;
			}, function (err) {
				Utilities.throwApiException('on Project.get()', err);
			});
		}

		function getProjectInfoFromNodes() {
			ProjInfo.query().$promise.then(function (result) {
				$scope.projInfo.notes = result;
				console.log($scope.projInfo);
			}, function (err) {
				Utilities.throwApiException('on ProjInfo.query()', err);
			});
		}

		function getSubprojectInfo() {
			Subproject.get({ id: $stateParams.subproject }).$promise.then(function (result) {
				$scope.projInfo.name = result.name; 
				$scope.projInfo.description = result.desc; 
			}, function (err) {
				Utilities.throwApiException('on Subproject.get()', err);
			});
		}

		function querySubprojects() {
			Subproject.query().$promise.then(function (result) {
				$scope.subprojects = result;
				console.log($scope.subprojects);
			}, function (err) {
				Utilities.throwApiException('on Subproject.query()', err);
			});
		}

		/**
		 * Removes the given ProjInfo item.
		 * @ngdoc method
		 * @name projHomeCtrl#removeProjInfo
		 * @param note {Object} ProjInfo Resource object
		 */
		$scope.removeProjInfo = function(note) {
			ConfirmService({
				headerText: 'Info löschen',
				bodyText: 'Soll die Info gelöscht werden?'
			}).then(function () {
				note.$delete().then(function (result) {
					console.log(result);
					getProjectInfoFromNodes();
				}, function (err) {
					Utilities.throwApiException('on ProjInfo.delete()', err);
				});
			});
		};

		/**
		 * Swap the order of a ProjInfo object with another one.
		 * @ngdoc method
		 * @name projHomeCtrl#swapInfoOrder
		 * @param oldIndex {number} Current index of ProjInfo item
		 * @param newIndex {number} New index of ProjInfo item
		 */
		$scope.swapInfoOrder = function(oldIndex, newIndex) {
			ProjInfo.swap({
				from: $scope.filteredInfos[oldIndex].id,
				to: $scope.filteredInfos[newIndex].id
			}).$promise.then(function (result) {
				console.log(result);
				getProjectInfoFromNodes();
			}, function (err) {
				Utilities.throwApiException('on ProjInfo.swap()', err);
			});
		};

		// init
		if($stateParams.subproject === 'master') {
			getProjectInfoFromTable();
			querySubprojects();
		}
		else
			getSubprojectInfo();
		getProjectInfoFromNodes();

		$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
			if(fromState.name === 'project.home.subproject')
				querySubprojects();
			else if(fromState.name === 'project.home.infoedit')
				getProjectInfoFromNodes();
		});

	}]);
