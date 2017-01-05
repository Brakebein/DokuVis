angular.module('dokuvisApp').factory('AuthenticationFactory', ['$window',
	/**
	 * Service responsible for checking the user status.<br/>
	 * From tutorial: {@link http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543}
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name AuthenticationFactory
	 */
	function($window) {
		return {
			// /**
			//  * A variable stating, if user is logged in or not.
			//  * @memberof AuthenticationFactory
			//  * @property {boolean} isLogged
			//  */
			isLogged: false,

			/**
			 * Check, if token and user are set in localstorage.
			 * @memberof AuthenticationFactory
			 * @function check
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

.factory('UserAuthFactory', ['$window', '$state', '$http', 'AuthenticationFactory', 'API', 'AclService',
	/**
	 * Service responsible for contacting the login endpoint and validating the user (and logging out the user).<br/>
	 * From tutorial: {@link http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543}
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name UserAuthFactory
	 */
	function($window, $state, $http, AuthenticationFactory, API, AclService) {
		return {
			/**
			 * API HTTP POST request to login user.
			 * @memberof UserAuthFactory
			 * @function login
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
			 * @memberof UserAuthFactory
			 * @function logout
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
			 * @memberof UserAuthFactory
			 * @function register
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
			 * @memberof UserAuthFactory
			 * @function checkJWT
			 * @returns {Promise} $http promise
			 */
			checkJWT: function() {
				return $http.get(API + 'auth/checkJWT');
			}
		};
	}])

.factory('TokenInterceptor', ['$q', '$window',
	/**
	 * Service responsible for sending in the access token and the key along with each request to the server.<br/>
	 * From tutorial: {@link http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543}
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name TokenInterceptor
	 */
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
