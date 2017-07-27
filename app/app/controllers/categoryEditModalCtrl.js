/**
 * Modal controller for managing {@link Category categories} and their {@link CategoryAttribute attributes}.
 * @ngdoc controller
 * @name categoryEditModalCtrl
 * @module dokuvisApp
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$stateParams $stateParams
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$timeout $timeout
 * @requires Utilities
 * @requires Category
 * @requires CategoryAttribute
 */
angular.module('dokuvisApp').controller('categoryEditModalCtrl', ['$scope', '$state', '$stateParams', '$timeout', 'Utilities', 'Category', 'CategoryAttribute',
	function($scope, $state, $stateParams, $timeout, Utilities, Category, CategoryAttribute) {

		/**
		 * List of all categories
		 * @ngdoc property
		 * @name categoryEditModalCtrl#categories
		 * @type {Array}
		 */
		$scope.categories = [];
		/**
		 * Color picker settings
		 * @ngdoc property
		 * @name categoryEditModalCtrl#minicolors
		 * @type {Object}
		 */
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

		/**
		 * Create a new category.
		 * @ngdoc method
		 * @name categoryEditModalCtrl#addCategory
		 */
		$scope.addCategory = function() {
			if(!$scope.newCategory) return;
			
			Category.save({ value: $scope.newCategory }).$promise.then(function (result) {
				$scope.categories.push(result);
				$scope.newCategory = '';
			}, function (err) {
				Utilities.throwApiException('on Category.save()', err);
			});
		};

		/**
		 * Save new name of the category.
		 * @ngdoc method
		 * @name categoryEditModalCtrl#updateCategory
		 * @param category {Object} Category Resource object
		 */
		$scope.updateCategory = function(category) {
			category.$update().catch(function (err) {
				Utilities.throwApiException('on Category.update()', err);
			});
		};

		/**
		 * Delete category and its attributes.
		 * @ngdoc method
		 * @name categoryEditModalCtrl#removeCategory
		 * @param category {Object} Category Resource object
		 */
		$scope.removeCategory = function(category) {
			category.$delete().then(function () {
				$scope.categories.splice($scope.categories.indexOf(category), 1);
			}, function (err) {
				Utilities.throwApiException('on Category.delete()', err);
			});
		};

		/**
		 * Create new attribute for category.
		 * @ngdoc method
		 * @name categoryEditModalCtrl#addAttribute
		 * @param category {Object} Category Resource object
		 */
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

		/**
		 * Save new name and color of the attribute.
		 * @ngdoc method
		 * @name categoryEditModalCtrl#updateAttribute
		 * @param attribute {Object} Attribute Resource object
		 */
		$scope.updateAttribute = function(attribute) {
			attribute.$update().catch(function (err) {
				Utilities.throwApiException('on CategoryAttribute.update()', err);
			});
		};

		/**
		 * Delete attribute.
		 * @ngdoc method
		 * @name categoryEditModalCtrl#removeAttribute
		 * @param category {Object} Category Resource object
		 * @param attribute {Object} Attribute Resource object
		 */
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
		 * Closes the modal and destroys the scope.
		 * @ngdoc method
		 * @name categoryEditModalCtrl#close
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
