// responsible for checking the user status
dokuvisApp.factory('AuthenticationFactory',
	function($window) {
		var auth = {
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
		}
		return auth;
	});

// responsible for contacting the login endpoint and validating the user (and logging out the user)	
dokuvisApp.factory('UserAuthFactory',
	function($window, $state, $http, AuthenticationFactory) {
		return {
			login: function(email, password) {
				return $http.post('api/login', {
					email: email,
					password: password
				});
			},
			logout: function() {
				if(AuthenticationFactory.isLogged) {
					AuthenticationFactory.isLogged = false;
					delete AuthenticationFactory.user;
					delete AuthenticationFactory.userName;
					delete AuthenticationFactory.userRole;
					
					delete $window.localStorage.token;
					delete $window.localStorage.user;
					delete $window.localStorage.userName;
					delete $window.localStorage.userRole;
					
					$state.go('home');
				}
			}
		};
	});
	
// responsible for sending in the access token and the key along with each request to the server
dokuvisApp.factory('TokenInterceptor',
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