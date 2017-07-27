angular.module('dokuvisApp').controller('modelModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Model', 'Utilities',
	function ($scope, $state, $stateParams, $timeout, Model, Utilities) {

		var initUpdate = true;
		$scope.updated = false;

		$scope.minicolors = {
			control: 'wheel',
			opacity: true,
			position: 'bottom left',
			format: 'rgb',
			changeDelay: 200
		};

		var oldColor = [];

		function getModel() {
			Model.get($stateParams.modelId).then(function (response) {
				$scope.model = response.data;

				$scope.color = 'rgba('+Math.round(255*$scope.model.obj.materialColor[0])+','+Math.round(255*$scope.model.obj.materialColor[1])+','+Math.round(255*$scope.model.obj.materialColor[2])+','+$scope.model.obj.materialColor[3]+')';
				oldColor = $scope.model.obj.materialColor;
				console.log($scope.model);
				console.log($scope.model.obj.materialColor);
			}, function (err) {
				Utilities.throwApiException('on Model.get()', err);
			});
		}

		$scope.updateValue = function (value) {
			console.log(value);

			$scope.updated = true;
			initUpdate = false;
		};

		$scope.updateColor = function () {
			if(initUpdate) initUpdate = false;
			else {
				var match = $scope.color.match(/([0-9]*\.[0-9]+|[0-9]+)/g);
				$scope.model.obj.materialColor = [+(match[0]/255).toFixed(7), +(match[1]/255).toFixed(7), +(match[2]/255).toFixed(7), +match[3]];

				console.log('color', $scope.model.obj.materialColor);
				$scope.updated = true;
			}
		};
		
		$scope.save = function () {
			Model.update($scope.model).then(function (response) {
				console.log(response);
				$scope.close();
			}, function (err) {
				Utilities.throwApiException('on Model.update()', err);
			});
		};

		// init
		getModel();

		/**
		 * Closes the modal and destroys the scope.
		 * @ngdoc method
		 * @name modelModalCtrl#close
		 */
		$scope.close = function () {
			this.$hide();
			this.$destroy();
			$state.go('^.^');
		};

		$scope.$on('$stateChangeSuccess', function () {
			$timeout(function () {
				$scope.$hide();
				$scope.$destroy();
			});
		});
		
	}]);
