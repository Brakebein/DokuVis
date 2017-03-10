/**
 * Service responsible for checking the user status.<br/>
 * From tutorial: http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543
 *
 * @ngdoc factory
 * @name AuthenticationFactory
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 */
angular.module('dokuvisApp').factory('AuthenticationFactory', ['$window',
	function($window) {
		return {
			/**
			 * A variable stating, if user is logged in or not.
			 * @ngdoc property
			 * @name AuthenticationFactory#isLogged
			 * @type {boolean} false
			 */
			isLogged: false,

			/**
			 * Check, if token and user are set in localstorage.
			 * @ngdoc method
			 * @name AuthenticationFactory#check
			 * @returns {boolean} true, if logged in
			 */
			check: function() {
				if($window.localStorage.token && $window.localStorage.user) {
					this.isLogged = true;
					return true;
				}
				else {
					this.isLogged = false;
					delete this.user;
					return false;
				}
			}
		};
	}])

/**
 * Service responsible for contacting the login endpoint and validating the user (and logging out the user).<br/>
 * From tutorial: http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543
 *
 * @ngdoc factory
 * @name UserAuthFactory
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://docs.angularjs.org/api/ng/service/$http $http
 * @requires AuthenticationFactory
 * @requires API
 * @requires https://github.com/mikemclin/angular-acl AclService
 */
.factory('UserAuthFactory', ['$window', '$state', '$http', 'AuthenticationFactory', 'API', 'AclService',
	function($window, $state, $http, AuthenticationFactory, API, AclService) {
		return {
			/**
			 * API HTTP POST request to login user.
			 * @ngdoc method
			 * @name UserAuthFactory#login
			 * @param email {string} email
			 * @param password {string} password 
			 * @returns {Promise} Returns a valid token, if login was successful.
			 */
			login: function(email, password) {
				return $http.post(API + 'login', {
					email: email,
					password: password
				});
			},
			/**
			 * Flush all relevant data to logout user.
			 * @ngdoc method
			 * @name UserAuthFactory#logout
			 */
			logout: function() {
				if(AuthenticationFactory.isLogged) {
					AuthenticationFactory.isLogged = false;
					delete AuthenticationFactory.user;
					delete AuthenticationFactory.userName;
					//delete AuthenticationFactory.userRole;
					
					delete $window.localStorage.token;
					delete $window.localStorage.user;
					delete $window.localStorage.userName;
					//delete $window.localStorage.userRole;
					
					AclService.flushRoles();
					AclService.attachRole('guest');
					
					$state.go('home');
				}
			},
			/**
			 * API HTTP POST request to register new user.
			 * @ngdoc method
			 * @name UserAuthFactory#register
			 * @param email {string} email
			 * @param username {string} username
			 * @param password {string} password
			 * @returns {Promise} $http promise
			 */
			register: function(email, username, password) {
				return $http.post(API + 'register', {
					email: email,
					username: username,
					password: password
				});
			},
			/**
			 * Check, if JWT (JavaScript Web Token) is valid.
			 * @ngdoc method
			 * @name UserAuthFactory#checkJWT
			 * @returns {Promise} $http promise
			 */
			checkJWT: function() {
				return $http.get(API + 'auth/checkJWT');
			}
		};
	}])

/**
 * Service responsible for sending in the access token and the key along with each request to the server.<br/>
 * From tutorial: http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543
 *
 * @ngdoc factory
 * @name TokenInterceptor
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 */
.factory('TokenInterceptor', ['$q', '$window',
	function($q, $window) {
		return {
			request: function(config) {
				config.headers = config.headers || {};
				if($window.localStorage.token) {
					config.headers['X-Access-Token'] = $window.localStorage.token;
					config.headers['X-Key'] = $window.localStorage.user;
					config.headers['Content-Type'] = "application/json";
				}
				return config || $q.when(config);
			},
			response: function(response) {
				return response || $q.when(response);
			}
		};
	}]);
