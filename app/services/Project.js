angular.module('dokuvisApp').factory('Project', ['$http', 'API', '$stateParams',

	/**
	 * $http methods for project related tasks
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Project
	 * @param $http {service} Angular HTTP request service
	 * @param API {service} API url constant
	 * @returns {{create: Project.create, get: Project.get, delete: Project.delete, getAll: Project.getAll}}
	 */
	function($http, API) {
		
		return {

			/**
			 * Create a new project
			 * @memberof Project
			 * @function create
			 * @param proj {string} new project ID
			 * @param name {string} project name
			 * @param desc {string} description (can also be empty)
			 * @param email {string} email of the user
			 * @param username {string} username
			 * @returns {Promise} $http promise
			 */
			create: function(proj, name, desc, email, username) {
				return $http.post(API + 'auth/project', {
					proj: proj,
					name: name,
					description: desc,
					email: email,
					username: username
				});
			},

			/**
			 * Get data of projekt with given ID
			 * @memberof Project
			 * @function get
			 * @param prj {string} project ID
			 * @returns {Promise} $http promise
			 */
			get: function(prj) {
				return $http.get(API + 'auth/project/' + prj, { cache: true });
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
