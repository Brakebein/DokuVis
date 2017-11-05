/**
 * Services and factories for authentication.
 *
 * The implementation was inspired by this tutorial: http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543
 *
 * ### Module Dependencies
 * * [ui.router](https://ui-router.github.io/ng1/docs/0.3.2/#/api)
 * * [mm.acl](https://github.com/mikemclin/angular-acl)
 *
 * @ngdoc module
 * @name dokuvis.auth
 * @module dokuvis.auth
 */
angular.module('dokuvis.auth', [
	'ui.router',
	'mm.acl'
])

/**
 * Service responsible for checking the user status.
 *
 * @ngdoc factory
 * @name AuthenticationFactory
 * @module dokuvis.auth
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 * @requires https://docs.angularjs.org/api/ng/service/$http $http
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires API
 */
.service('AuthenticationFactory', ['$window', '$http', '$q', 'API',
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
 * Service responsible for contacting the login endpoint and validating the user (and logging out the user).
 *
 * @ngdoc factory
 * @name UserAuthFactory
 * @module dokuvis.auth
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
 * Service responsible for sending in the access token and the key along with each request to the server.
 *
 * @ngdoc factory
 * @name TokenInterceptor
 * @module dokuvis.auth
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
	}])

/**
 * Resolver: Check for valid token and user data.
 *
 * @ngdoc factory
 * @name ValidateResolve
 * @module dokuvis.auth
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires AuthenticationFactory
 * @requires https://github.com/mikemclin/angular-acl AclService
 */
.factory('ValidateResolve', ['$q', 'AuthenticationFactory', 'AclService',
	function ($q, AuthenticationFactory, AclService) {
		return function () {
			var defer = $q.defer();

			AuthenticationFactory.check()
				.then(function () {
					AclService.flushRoles();
					AclService.attachRole('member');
					defer.resolve();
				})
				.catch(function (reason) {
					console.log(reason);
					defer.resolve();
				});

			return defer.promise;
		};
	}])

/**
 * Resolver: No access, if user is not logged in.
 *
 * @ngdoc factory
 * @name AuthenticateResolve
 * @module dokuvis.auth
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires AuthenticationFactory
 * @requires ValidateResolve
 */
.factory('AuthenticateResolve', ['$state', '$q', '$timeout', 'AuthenticationFactory', 'ValidateResolve',
	function ($state, $q, $timeout, AuthenticationFactory, ValidateResolve) {
		return function () {
			var defer = $q.defer();

			ValidateResolve().then(function () {
				if (AuthenticationFactory.isLogged) {
					console.log('auth resolve');
					defer.resolve();
				}
				else {
					console.log('auth reject');
					defer.reject();
					$timeout(function () {
						$state.go('home');
					});
				}
			});

			return defer.promise;
		};
	}])

/**
 * Resolver: If the user is already logged in, take him to the home page.
 *
 * @ngdoc factory
 * @name SkipResolve
 * @module dokuvis.auth
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires AuthenticationFactory
 * @requires ValidateResolve
 */
.factory('SkipResolve', ['$state', '$q', '$timeout', 'AuthenticationFactory', 'ValidateResolve',
	function ($state, $q, $timeout, AuthenticationFactory, ValidateResolve) {
		return function () {
			var defer = $q.defer();

			ValidateResolve().then(function () {
				if (!AuthenticationFactory.isLogged) {
					console.log('skip resolve');
					defer.resolve();
				}
				else {
					defer.reject();
					console.log('skip reject');
					$timeout(function () {
						$state.go('home');
					});
				}
			});

			return defer.promise;
		};
	}]);
