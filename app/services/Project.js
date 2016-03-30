angular.module('dokuvisApp').factory('Project', ['$http', 'API', '$stateParams',
	function($http, API, $stateParams) {
		
		return {
			
			// neues Projekt anlegen
			create: function(proj, name, desc, email, username) {
				return $http.post(API + 'auth/project', {
					proj: proj,
					name: name,
					description: desc,
					email: email,
					username: username
				});
			},
			
			// Projekt Info
			get: function(prj) {
				return $http.get(API + 'auth/project/' + prj);
			},
			
			// Projekt löschen
			delete: function(prj) {
				return $http.delete(API + 'auth/project/' + prj);
			},
			
			// alle Projekte auflisten
			getAll: function() {
				return $http.get(API + 'auth/projects');
			}
			
		};
		
	}]);