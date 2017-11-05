/**
 * Components to integrate categories for 3D objects.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 * * [ui.router](https://ui-router.github.io/ng1/docs/0.3.2/#/api)
 * * [xeditable](https://vitalets.github.io/angular-xeditable)
 * * [minicolors](https://github.com/kaihenzler/angular-minicolors)
 *
 * ### Requirements
 * Add `categories.js` and `categories.css` to your `index.html` and add `dokuvis.categories` as dependency.
 *
 * In your application, define a constant named `ApiCategory` to specify the REST-API url. The url will be extended by `/:cid` for `Category` and `/:cid/attribute/:aid` for `CategoryAttribute`. Don't forget to set your {@link ApiParams}.
 * ```
 * // example
 * var myApp = angular.module('myApp', ['dokuvis.categories']);
 * myApp.constant('ApiCategory', 'api/auth/project/:project/category');
 * ```
 *
 * @ngdoc module
 * @name dokuvis.categories
 * @module dokuvis.categories
 */
angular.module('dokuvis.categories', [
	'ngResource',
	'ngAnimate',
	'ui.router',
	'xeditable',
	'minicolors'
])

/**
 * $resource for Category. A category can have multiple attributes ({@link CategoryAttribute}), which can be assigned to models.
 * @ngdoc factory
 * @name Category
 * @module dokuvis.categories
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiCategory
 * @requires CategoryAttribute
 */
.factory('Category', ['$resource', 'ApiParams', 'ApiCategory', 'CategoryAttribute',
	function ($resource, ApiParams, ApiCategory, CategoryAttribute) {

		function setAttributeResource(json) {
			var data = angular.fromJson(json);

			for (var i = 0; i < data.length; i++) {
				for (var j = 0; j < data[i].attributes.length; j++) {
					data[i].attributes[j] = new CategoryAttribute(data[i].attributes[j]);
					data[i].attributes[j].cid = data[i].id;
				}
			}

			return data;
		}

		return $resource(ApiCategory + '/:cid', angular.extend({ cid: '@id' }, ApiParams), {
			/**
			 * Get all categories and their attributes. Attributes are transformed to instances of {@link CategoryAttribute}.
			 * ```
			 * Category.query().$promise
			 *   .then(function (categories) {...});
			 * ```
			 * @ngdoc method
			 * @name Category#query
			 */
			query: {
				method: 'GET',
				isArray: true,
				transformResponse: setAttributeResource
			},
			/**
			 * Saves changes to the name and the color.
			 * ```
			 * category.$update()
			 *   .then(function (category) {...});
			 * ```
			 * @ngdoc method
			 * @name Category#$update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Create a new (empty) category.
		 * ```
		 * Category.save({
		 *   value: <string>  // name of the new category
		 * }).$promise
		 *   .then(function (category) {...});
		 * ```
		 * @ngdoc method
		 * @name Category#save
		 * @param data {Object} Object with data
		 */

		/**
		 * Deletes this category and its attributes.
		 * ```
		 * category.$delete()
		 *   .then(function () {...});
		 * ```
		 * @ngdoc method
		 * @name Category#$delete
		 */

	}
])

/**
 * $resource for CategoryAttribute, that can be assigned to models. Usually in combination with {@link Category}.
 * @ngdoc factory
 * @name CategoryAttribute
 * @module dokuvis.categories
 * @author Brakebein
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiCategory
 */
.factory('CategoryAttribute', ['$resource', 'ApiParams', 'ApiCategory',
	function ($resource, ApiParams, ApiCategory) {

		return $resource(ApiCategory + '/:cid/attribute/:aid', angular.extend({ cid: '@cid', aid: '@id' }), {
			/**
			 * Saves changes to the name.
			 * ```
			 * attribute.$update()
			 *   .then(function (attribute) {...});
			 * ```
			 * @ngdoc method
			 * @name CategoryAttribute#$update
			 */
			update: { method: 'PUT' }
		});

		/**
		 * Saves a new attribute.
		 * ```
		 * CategoryAttribute.save({
		 *   cid: <id>,       // id of the category, the attribute should be part of
		 *   value: <string>, // name of the new attribute
		 *   color: <string>  // hexadecimal, e.g. '#ffdd44'
		 * }).$promise
		 *   .then(function (attribute) {...});
		 * ```
		 * @ngdoc method
		 * @name CategoryAttribute#save
		 * @param data {Object} Object with data
		 */

		/**
		 * Deletes this attribute.
		 * ```
		 * attribute.$delete()
		 *   .then(function () {...});
		 * ```
		 * @ngdoc method
		 * @name CategoryAttribute#$delete
		 */

	}
])

/**
 * Directive displaying all categories and their attributes. Categories can be activated to color the 3D objects respectively.
 * @ngdoc directive
 * @name categoryList
 * @module dokuvis.categories
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires Category
 * @requires Utilities
 * @restrict E
 * @scope
 */
.directive('categoryList', ['$rootScope', 'Category', 'Utilities',
	function ($rootScope, Category, Utilities) {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.categories/categoryList.tpl.html',
			scope: {},
			link: function (scope) {

				scope.categories = [];

				var activated = false;

				// query all categories and their attributes
				function queryCategories() {
					Category.query().$promise
						.then(function (categories) {
							for (var i = 0; i < categories.length; i++) {
								categories[i].attributes.push({id: 0, value: '<Nicht zugewiesen>'});
								categories[i].attributes.push({id: -1, value: '<Beibehalten>'});
								//categories[i].selected = null;
							}
							scope.categories = categories;
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Category#query', reason);
						});
				}
				queryCategories();

				scope.assignAttribute = function () {

				};

				scope.activateCategory = function (category) {
					categoryActivate(category);
					activated = true;
				};

				// listen to categoryUpdate event
				scope.$on('categoryUpdate', function () {
					queryCategories();
				});

				/**
				 * This event signals that the given category has been activated.
				 * @ngdoc event
				 * @name categoryList#categoryActivate
				 * @eventType broadcast on $rootScope
				 * @param category {Category} Activated category
				 */
				function categoryActivate(category) {
					$rootScope.$broadcast('categoryActivate', category);
				}

				function categoryAttributeAssign() {
					$rootScope('categoryAttributeAssign');
				}
			}
		};

	}
])

/**
 * Directive showing all categories and their attributes. It is possible to add/remove new categories and attributes and to change name and colors.
 * @ngdoc directive
 * @name categoryConfig
 * @module dokuvis.categories
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires Category
 * @requires CategoryAttribute
 * @requires Utilities
 * @restrict E
 * @scope
 */
.directive('categoryConfig', ['$rootScope', 'Category', 'CategoryAttribute', 'Utilities',
	function ($rootScope, Category, CategoryAttribute, Utilities) {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.categories/categoryConfig.tpl.html',
			scope: {},
			link: function (scope) {

				scope.categories = [];

				// color picker settings
				scope.minicolors = {
					control: 'wheel',
					opacity: true,
					position: 'bottom left',
					format: 'rgb',
					changeDelay: 200
				};

				function queryCategories() {
					Category.query().$promise
						.then(function (categories) {
							scope.categories = categories;
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Category.query', reason);
						});
				}
				queryCategories();

				// create a new category
				scope.addCategory = function () {
					if (!scope.newCategory) return;

					Category.save({ value: scope.newCategory }).$promise
						.then(function (category) {
							scope.categories.push(category);
							scope.newCategory = '';
							categoryUpdate(category);
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Category.save', reason);
						});
				};

				// save new name if the category
				scope.updateCategory = function (category) {
					category.$update()
						.then(function () {
							categoryUpdate(category);
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Category.update', reason);
						});
				};

				// delete category and its attributes
				scope.removeCategory = function (category) {
					category.$delegate()
						.then(function () {
							scope.categories.splice(scope.categories.indexOf(category), 1);
							categoryUpdate();
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Category.delete', reason);
						});
				};

				// create new attribute for category
				scope.addAttribute = function (category) {
					if (!category.newAttribute) return;

					CategoryAttribute.save({
						cid: category.id,
						value: category.newAttribute,
						color: getRandomColor()
					}).$promise
						.then(function (attribute) {
							category.attributes.push(attribute);
							category.newAttribute = '';
							categoryUpdate(category);
						})
						.catch(function (reason) {
							Utilities.throwApiException('#CategoryAttribute.save', reason);
						});
				};

				// save new name and color of the attribute
				scope.updateAttribute = function (attribute) {
					attribute.$update()
						.then(function () {
							categoryUpdate();
						})
						.catch(function (reason) {
							Utilities.throwApiException('#CategoryAttribute.update', reason);
						});
				};

				// delete attribute
				scope.removeAttribute = function (category, attribute) {
					attribute.$delete()
						.then(function () {
							category.attributes.splice(category.attributes.indexOf(attribute), 1);
							categoryUpdate();
						})
						.catch(function (reason) {
							Utilities.throwApiException('#CategoryAttribute.delete', reason);
						});
				};

				/**
				 * Event that gets fired, when a category/attribute has been created, update or removed.
				 * @ngdoc event
				 * @name categoryConfig#categoryUpdate
				 * @eventType broadcast on $rootScope
				 * @param category {Category=} New or altered category
				 */
				function categoryUpdate(category) {
					$rootScope.$broadcast('categoryUpdate', category);
				}

				// generate random color
				var getRandomColor = function () {
					var letters = '0123456789ABCDEF'.split('');
					var color = '#';
					for (var i = 0; i < 6; i++ ) {
						color += letters[Math.round(Math.random() * 15)];
					}
					return color;
				};

			}
		};

	}
])

.directive('categoryLegend', [
	function () {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.categories/categoryLegend.tpl.html',
			scope: {},
			link: function (scope, element, attrs) {

				attrs.$addClass('ng-hide');

				console.log('link', element, attrs);

				scope.$on('categoryActivate', function (event, category) {
					attrs.$removeClass('ng-hide');
					scope.category = category;
					console.log(category, scope);
				});

				scope.$on('categoryDeactivate', function () {
					attrs.$addClass('ng-hide');
				});

				scope.hide = function () {
					attrs.$addClass('ng-hide');
				};

				scope.show = function () {
					attrs.$removeClass('ng-hide');
				};

				// TODO: fix animation ng-hide

			}
		}

	}
]);
