/**
 * Controller for the navbar (visible at start page and project list page).
 * @ngdoc controller
 * @name navCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$window $window
 * @requires UserAuthFactory
 * @requires AuthenticationFactory
 * @requires Utilities
 */
angular.module('dokuvisApp').controller('navCtrl', ['$scope', '$state', '$window', 'UserAuthFactory', 'AuthenticationFactory', 'Utilities',
	function ($scope, $state, $window, UserAuthFactory, AuthenticationFactory, Utilities) {

		/**
		 * Model for user credentials from `<input>` fields
		 * 
		 * `{ email: 'string', password: 'string' }`
		 * @ngdoc property
		 * @name navCtrl#user
		 * @type {Object}
		 */
		$scope.user = {
			email: '',
			password: ''
		};

		/**
		 * Login action.
		 * @ngdoc method
		 * @name navCtrl#login
		 */
		$scope.login = function() {
			var email = $scope.user.email,
				password = $scope.user.password;

			if(email.length === 0) { Utilities.dangerAlert('Ungültige Emailadresse!'); return; }
			if(password.length === 0) { Utilities.dangerAlert('Ungültiges Passwort!'); return; }

			UserAuthFactory.login(email, password)
				.then(function(response) {
					var data = response.data;
					AuthenticationFactory.isLogged = true;
					AuthenticationFactory.user = data.user.email;
					AuthenticationFactory.userName = data.user.name;
					//AuthenticationFactory.userRole = data.user.role;

					$window.localStorage.token = data.token;
					$window.localStorage.user = data.user.email;
					$window.localStorage.userName = data.user.name;
					//$window.localStorage.userRole = data.user.role;

					$state.go('projectlist');
				}, function(err) {
					Utilities.throwException('Login', 'failed', err);
				});
		};

		/**
		 * Logout action.
		 * @ngdoc method
		 * @name navCtrl#logout
		 */
		$scope.logout = function() {
			UserAuthFactory.logout();
		};

	}]);
