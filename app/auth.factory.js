angular.module('dokuvisApp').factory('AuthenticationFactory', ['$window',
	/**
	 * Service responsible for checking the user status
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name AuthenticationFactory
	 * @param $window {$window} Angular window service
	 */
	function($window) {
		return {
			/**
			 * A variable stating, if user is logged in or not
			 * @type {boolean}
			 * @memberof AuthenticationFactory
			 */
			isLogged: false,

			/**
			 * Check, if token and user are set in localstorage
			 * @memberof AuthenticationFactory
			 */
			check: function() {
				if($window.localStorage.token && $window.localStorage.user) {
					this.isLogged = true;
				}
				else {
					this.isLogged = false;
					delete this.user;
				}
			}
		};
	}])

.factory('UserAuthFactory', ['$window', '$state', '$http', 'AuthenticationFactory', 'API',
	/**
	 * Service responsible for contacting the login endpoint and validating the user (and logging out the user)
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name UserAuthFactory
	 * @param $window {$window} Angular $window service
	 * @param $state {$state} ui.router $state
	 * @param $http {$http} Angular http request service
	 * @param AuthenticationFactory {AuthenticationFactory} [AuthenticationFactory]{@link dokuvisApp.AuthenticationFactory.html}
	 * @param API {API} API url constant
	 */
	function($window, $state, $http, AuthenticationFactory, API) {
		return {
			login: function(email, password) {
				return $http.post(API + 'login', {
					email: email,
					password: password
				});
			},
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
					
					$state.go('home');
				}
			},
			register: function(email, username, password) {
				return $http.post(API + 'register', {
					email: email,
					username: username,
					password: password
				});
			},
			checkJWT: function() {
				return $http.get(API + 'auth/checkJWT');
			}
		};
	}])

.factory('TokenInterceptor', ['$q', '$window',
	/**
	 * Service responsible for sending in the access token and the key along with each request to the server<br/>
	 * from tutorial: {@link http://code.tutsplus.com/tutorials/token-based-authentication-with-angularjs-nodejs--cms-22543}
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name TokenInterceptor
	 * @param $q {$q} Angular promise service
	 * @param $window {$window} Angular $window service
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
