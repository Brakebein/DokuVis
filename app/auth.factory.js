/**
 * Service responsible for checking the user status.<br/>
 * From tutorial: http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543
 *
 * @ngdoc factory
 * @name AuthenticationFactory
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 * @requires https://docs.angularjs.org/api/ng/service/$http $http
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires API
 */
angular.module('dokuvisApp').service('AuthenticationFactory', ['$window', '$http', '$q', 'API',
	function($window, $http, $q, API) {

		var scope = this;

		/**
		 * A variable stating, if user is logged in or not.
		 * @ngdoc property
		 * @name AuthenticationFactory#isLogged
		 * @type {boolean} false
		 */
		this.isLogged = false;

		/**
		 * Check, if token and user are set in localstorage and if token is valid.
		 * @ngdoc method
		 * @name AuthenticationFactory#check
		 * @returns {Promise} Resolved, if token and user are set and token is still valid.
		 */
		this.check = function() {
			if ($window.localStorage.token && $window.localStorage.user) {
				return $http.get(API + 'auth/check')
					.then(function () {
						scope.set();
						return $q.resolve();
					})
					.catch(function () {
						scope.flush();
						return $q.reject('Invalid token');
					});
			}
			else {
				this.flush();
				return $q.reject('$window.localStorage not set');
			}
		};

		/**
		 * Set token and user data at $window.localStorage.
		 * @ngdoc method
		 * @name AuthenticationFactory#set
		 * @param data {Object=} Object with token and user data
		 */
		this.set = function(data) {
			if (data) {
				$window.localStorage.token = data.token;
				$window.localStorage.user = data.user.email;
				$window.localStorage.userName = data.user.name;
			}

			if ($window.localStorage.token && $window.localStorage.user) {
				this.isLogged = true;
				this.user = $window.localStorage.user;
				this.userName = $window.localStorage.userName;
			}
		};

		/**
		 * Unset token and user data at $window.localStorage.
		 * @ngdoc method
		 * @name AuthenticationFactory#flush
		 */
		this.flush = function() {
			this.isLogged = false;
			delete this.user;
			delete this.userName;

			delete $window.localStorage.token;
			delete $window.localStorage.user;
			delete $window.localStorage.userName;
		};

	}])

/**
 * Service responsible for contacting the login endpoint and validating the user (and logging out the user).<br/>
 * From tutorial: http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543
 *
 * @ngdoc factory
 * @name UserAuthFactory
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/service/$http $http
 * @requires AuthenticationFactory
 * @requires API
 * @requires https://github.com/mikemclin/angular-acl AclService
 */
.factory('UserAuthFactory', ['$http', 'AuthenticationFactory', 'API', 'AclService',
	function($http, AuthenticationFactory, API, AclService) {
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
				})
					.then(function (response) {
						AuthenticationFactory.set(response.data);
					});
			},
			/**
			 * Flush all relevant data to logout user.
			 * @ngdoc method
			 * @name UserAuthFactory#logout
			 */
			logout: function() {
				if(AuthenticationFactory.isLogged) {
					AuthenticationFactory.flush();
					
					AclService.flushRoles();
					AclService.attachRole('guest');
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
				})
					.then(function (response) {
						AuthenticationFactory.set(response.data);
					});
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
