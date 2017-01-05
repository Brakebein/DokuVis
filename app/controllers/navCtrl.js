angular.module('dokuvisApp').controller('navCtrl', ['$scope', '$state', '$window', 'UserAuthFactory', 'AuthenticationFactory', 'Utilities',
	/**
	 * Controller for the navbar (visible at start page and project list page).
	 * @memberof dokuvisApp
	 * @ngdoc controller
	 * @name navCtrl
	 * @author Brakebein
	 */
	function($scope, $state, $window, UserAuthFactory, AuthenticationFactory, Utilities) {

		$scope.user = {
			email: '',
			password: ''
		};

		/**
		 * Login action.
		 * @memberof navCtrl
		 * @method login
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
		 * @memberof navCtrl
		 * @method logout
		 */
		$scope.logout = function() {
			UserAuthFactory.logout();
		};

	}]);
