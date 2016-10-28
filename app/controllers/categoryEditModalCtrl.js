angular.module('dokuvisApp').controller('categoryEditModalCtrl', ['$scope', '$state', '$stateParams', 'Utilities', 'Category', 'CategoryAttribute',
	function($scope, $state, $stateParams, Utilities, Category, CategoryAttribute) {

		$scope.categories = [];

		// color picker settings
		$scope.minicolors = {
			control: 'wheel',
			opacity: true,
			position: 'bottom left',
			format: 'rgb',
			changeDelay: 200
		};


		function getAllCategories() {
			Category.query().$promise.then(function (result) {
				console.log('categories', result);
				$scope.categories = result;
			}, function (err) {
				Utilities.throwApiException('on Category.query()', err);
			});
		}
		getAllCategories();

		$scope.addCategory = function() {
			if(!$scope.newCategory) return;
			
			Category.save({ value: $scope.newCategory }).$promise.then(function (result) {
				$scope.categories.push(result);
				$scope.newCategory = '';
			}, function (err) {
				Utilities.throwApiException('on Category.save()', err);
			});
		};

		$scope.updateCategory = function(category) {
			category.$update().catch(function (err) {
				Utilities.throwApiException('on Category.update()', err);
			});
		};

		$scope.removeCategory = function(category) {
			category.$delete().then(function () {
				$scope.categories.splice($scope.categories.indexOf(category), 1);
			}, function (err) {
				Utilities.throwApiException('on Category.delete()', err);
			});
		};

		$scope.addAttribute = function(category) {
			if(!category.newAttribute) return;
			
			CategoryAttribute.save({
				cid: category.id,
				value: category.newAttribute,
				color: getRandomColor()
			}).$promise.then(function (result) {
				category.attributes.push(result);
				category.newAttribute = '';
			}, function (err) {
				Utilities.throwApiException('on CategoryAttribute.save()', err);
			});
		};

		$scope.updateAttribute = function(attribute) {
			attribute.$update().catch(function (err) {
				Utilities.throwApiException('on CategoryAttribute.update()', err);
			});
		};

		$scope.removeAttribute = function(category, attribute) {
			attribute.$delete().then(function () {
				category.attributes.splice(category.attributes.indexOf(attribute), 1);
			}, function (err) {
				Utilities.throwApiException('on CategoryAttribute.delete()', err);
			});
		};

		var getRandomColor = function () {
			var letters = '0123456789ABCDEF'.split('');
			var color = '#';
			for (var i = 0; i < 6; i++ ) {
				color += letters[Math.round(Math.random() * 15)];
			}
			return color;
		};

		/**
		 * Closes the modal and destroys the scope
		 * @memberof categoryEditModalCtrl
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
