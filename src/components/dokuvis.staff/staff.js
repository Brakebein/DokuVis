/**
 * Components to display and configurate users who are working on the project.
 *
 * ### Module Dependencies
 * * [ngResource](https://docs.angularjs.org/api/ngResource)
 *
 * @ngdoc module
 * @name dokuvis.staff
 * @module dokuvis.staff
 */
angular.module('dokuvis.staff', [
	'ngResource'
])

/**
 * $resource for staff.
 * @ngdoc factory
 * @name Staff
 * @module dokuvis.staff
 * @requires https://docs.angularjs.org/api/ngResource/service/$resource $resource
 * @requires ApiParams
 * @requires ApiStaff
 * @requires ApiRoles
 */
.factory('Staff', ['$resource', 'ApiParams', 'ApiStaff', 'ApiRoles',
	function ($resource, ApiParams, ApiStaff, ApiRoles) {

		return $resource(ApiStaff + '/:id', angular.extend({ id: '@email' }, ApiParams), {
			/**
			 * Get all available roles.
			 * ```
			 * Staff.queryRoles().$promise
			 *   .then(function (roles) {...});
			 * ```
			 * @ngdoc method
			 * @name Staff#queryRoles
			 * @return {Array<string>} List of roles.
			 */
			queryRoles: {
				url: ApiRoles,
				method: 'GET',
				isArray: true
			}
		});

		/**
		 * Get all users, who are working on this project.
		 * ```
		 * Staff.query({ search: 'user' }).$promise
		 *   .then(function (staff) {...});
		 * ```
		 * @ngdoc method
		 * @name Staff#query
		 * @param search {Object=} Object with property `search` to search for staff that contain the search term.
		 * @return {Array<Resource>} Array of all users.
		 */

		/**
		 * Get user by id.
		 * ```
		 * Staff.get({ id: <id> }).$promise
		 *   .then(function (user) {...});
		 * ```
		 * @ngdoc method
		 * @name Staff#get
		 * @param id {Object} Object with `id` property
		 * @return {Resource} User as Resource object.
		 */

		/**
		 * Add a new (existing) user to the project.
		 * ```
		 * Staff.save({
		 *   user: <string>  // email of the user
		 *   role: <string>  // role (available from Staff.queryRoles())
		 * }).$promise
		 *   .then(function (user) {...});
		 * ```
		 * @ngdoc method
		 * @name Staff#save
		 * @param data {Object} Object with data
		 * @return {Resource} User as Resource object.
		 * */

	}
])

/**
 * Directive displaying all users working on this project. Config buttons are optionally displayed.
 * @ngdoc directive
 * @name staffList
 * @module dokuvis.staff
 * @requires Staff
 * @requires Utilities
 * @restrict E
 * @scope
 * @param [config] {string[]} Show config buttons in additional column. Available buttons are displayed by following strings: `edit`, `remove`, more to come...
 */
.directive('staffList', ['Staff', 'Utilities',
	function (Staff, Utilities) {

		return {
			restrict: 'E',
			templateUrl: 'components/dokuvis.staff/staffList.tpl.html',
			scope: {
				configArray: '<config'
			},
			link: function (scope) {

				scope.config = {
					edit: false,
					remove: false
				};

				angular.forEach(scope.configArray, function (value) {
					scope.config[value] = true;
				});

				scope.staff = [];

				function queryStaff() {
					Staff.query().$promise
						.then(function (results) {
							scope.staff = results;
						})
						.catch(function (reason) {
							Utilities.throwApiException('#Task.query', reason);
						});
				}

				// init
				queryStaff();

				// listen to staffUpdate event
				scope.$on('staffUpdate', function () {
					queryStaff();
				});

				// TODO: Rolle des Mitarbeiters ändern

			}
		};

	}
])

/**
 * Controller for the modal to add users to the project.
 * @ngdoc controller
 * @name staffModalCtrl
 * @module dokuvis.staff
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $scope
 * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
 * @requires https://ui-router.github.io/ng1/docs/0.321/index.html#/api/ui.router.state.$state $state
 * @requires Staff
 * @requires Utilities
 */
.controller('staffModalCtrl', ['$scope', '$rootScope', '$state', 'Staff', 'Utilities',
	function ($scope, $rootScope, $state, Staff, Utilities) {

		$scope.title = 'Mitarbeiter/Beobachter hinzufügen';

		$scope.user = '';
		$scope.role = 'visitor';

		/**
		 * Save user to the project.
		 * @ngdoc method
		 * @name staffModalCtrl#save
		 */
		$scope.save = function () {

			if (!$scope.user.length) {
				Utilities.dangerAlert('Geben sie dem Projekt einen Namen!');
				return;
			}

			Staff.save({ user: $scope.user, role: $scope.role }).$promise
				.then(function (result) {
					console.log(result);
					staffUpdate(result);
					$scope.close();
				})
				.catch(function (err) {
					if (err.data && typeof err.data.originalErr === 'string') var message = err.data.originalErr;
					else message = '#Staff.save';
					Utilities.throwApiException(message, err);
				});

		};

		function queryRoles() {
			Staff.queryRoles().$promise
				.then(function (results) {
					$scope.roles = results;
				})
				.catch(function (err) {
					Utilities.throwApiException('#Staff.queryRoles', err);
				});
		}

		// init
		queryRoles();

		/**
		 * Event that gets fired, when a new user was added to the project.
		 * @ngdoc event
		 * @name staffModalCtrl#staffUpdate
		 * @eventType broadcast on $rootScope
		 * @param user {Staff=} Newly added user
		 */
		function staffUpdate(user) {
			$rootScope.$broadcast('staffUpdate', user);
		}

		/**
		 * Close the modal and go to parent state.
		 * @ngdoc method
		 * @name staffModalCtrl#close
		 */
		$scope.close = function () {
			$state.go('^');
		};

	}
]);
