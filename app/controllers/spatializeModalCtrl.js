angular.module('dokuvisApp').controller('spatializeModalCtrl', ['$scope', '$state', '$stateParams', 'webglInterface', 'SpatializeInterface', 'Source', 'Utilities',
	function ($scope, $state, $stateParams, webglInterface, SpatializeInterface, Source, Utilities) {

		$scope.source = $stateParams.source;
		
		$scope.save = function () {
			$scope.source.dlt = SpatializeInterface.getDLTInputs();
			if(!$scope.source.dlt) {
				Utilities.dangerAlert('Missing markers!');
				return;
			}
			
			Source.spatialize({
				id: $scope.source.eid,
				type: $scope.source.type
			}, $scope.source).$promise.then(function (response) {
				console.log(response);
				delete $scope.source.dlt;

				response.spatial.source = $scope.source;
				SpatializeInterface.callFunc['spatial'].loadSpatializeImage(response.spatial, true)
					.then(function (entry) {
						webglInterface.callFunc['spatial'].setImageView(entry.object);
					});
				
			}, function (err) {
				Utilities.throwApiException('on Source.spatialize()', err);
			});
		};
		
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
