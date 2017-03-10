/**
 * Controller for register view.
 * @ngdoc controller
 * @name registerCtrl
 * @module dokuvisApp
 * @author Brakebein
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/type/$rootScope.Scope $scope
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$window $window
 * @requires UserAuthFactory
 * @requires AuthenticationFactory
 * @requires Utilities
 */
angular.module('dokuvisApp').controller('registerCtrl', ['$scope', '$state', '$window', 'UserAuthFactory', 'AuthenticationFactory', 'Utilities',
	function ($scope, $state, $window, UserAuthFactory, AuthenticationFactory, Utilities) {

		/**
		 * Model for input fields
		 * ```
		 * {
		 *   email: 'string',
		 *   name: 'string',
		 *   password1: 'string',
		 *   password2: 'string'
		 * }
		 * ```
		 * @ngdoc property
		 * @name registerCtrl#userRegister
		 * @type {Object}
		 */
		$scope.userRegister = {
			email: '',
			name: '',
			password1: '',
			password2: ''
		};

		/**
		 * Register form submit action.
		 * @ngdoc method
		 * @name registerCtrl#register
		 */
		$scope.register = function() {
			var email = $scope.userRegister.email,
				username = $scope.userRegister.name,
				password1 = $scope.userRegister.password1,
				password2 = $scope.userRegister.password2;

			if(password1 !== password2) { Utilities.dangerAlert('Die Passwörter stimmen nicht überein!'); return; }
			if(email.length === 0) { Utilities.dangerAlert('Bitte geben Sie eine Emailadresse ein!'); return; }
			if(username.length === 0) { Utilities.dangerAlert('Bitte geben Sie einen Nutzernamen ein!'); return; }
			if(password1.length < 5) { Utilities.dangerAlert('Passwort hat nicht genügend Zeichen (mind. 6)!'); return; }

			UserAuthFactory.register(email, username, password1)
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

					AclService.flushRoles();
					AclService.attachRole('member');

					$state.go('projectlist');
				}, function(err) {
					Utilities.throwException('Register', 'failed', err);
				});
		};

	}]);
