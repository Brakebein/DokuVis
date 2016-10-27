angular.module('dokuvisApp').controller('projHomeCtrl', ['$scope', '$stateParams', 'neo4jRequest', 'Utilities', 'Project', 'Subproject', 'ProjInfo', 'ConfirmService',
	/**
	 * Controller of the Project Home view, organizing subprojects and project/subproject information
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name projHomeCtrl
	 * @author Brakebein
	 * @param $scope {$scope} controller scope
	 * @param $stateParams {$stateParams} ui.router stateParams
	 * @param neo4jRequest {neo4jRequest} neo4jRequest DEPRECATED
	 * @param Utilities {Utilities} Utilities
	 * @param Project {Project} Project http
	 * @param Subproject {Subproject} Subproject http
	 * @param ProjInfo {ProjInfo} ProjInfo $resource
	 * @param ConfirmService {ConfirmService} confirm dialog
	 */
	function($scope, $stateParams, neo4jRequest, Utilities, Project, Subproject, ProjInfo, ConfirmService) {

		$scope.isMaster = $stateParams.subproject === 'master';

		/**
		 * Object containing project infos
		 * @var {Object} projInfo
		 * @memberof projHomeCtrl
		 */
		$scope.projInfo = {};
		
		/**
		 * Array of available subprojects
		 * @var {Array} subprojects
		 * @memberof projHomeCtrl
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
			Subproject.get($stateParams.subproject).then(function (response) {
				$scope.projInfo.name = response.data[0].name;
				$scope.projInfo.description = response.data[0].desc;
				console.log(response);
			}, function (err) {
				Utilities.throwApiException('on Subproject.get()', err);
			});
		}

		function getAllSubprojects() {
			Subproject.getAll().then(function (response) {
				$scope.subprojects = response.data;
				console.log($scope.subprojects);
			}, function (err) {
				Utilities.throwApiException('on Subproject.getAll()', err);
			});
		}

		$scope.removeProjInfo = function(note) {
			ConfirmService.showAlert({
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
			getAllSubprojects();
		}
		else
			getSubprojectInfo();
		getProjectInfoFromNodes();

		$scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
			if(fromState.name === 'project.home.subproject.new' || fromState.name === 'project.home.subproject.edit')
				getAllSubprojects();
			else if(fromState.name === 'project.home.infoedit')
				getProjectInfoFromNodes();
		});

	}]);
