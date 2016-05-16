// responsible for checking the user status
angular.module('dokuvisApp').factory('AuthenticationFactory',
	function($window) {
		return {
			isLogged: false,
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
	})

// responsible for contacting the login endpoint and validating the user (and logging out the user)	
.factory('UserAuthFactory',
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
	})
	
// responsible for sending in the access token and the key along with each request to the server
.factory('TokenInterceptor',
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
	});