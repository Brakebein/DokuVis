angular.module('dokuvisApp').factory('Project', ['$http', 'API', '$stateParams', 'AuthenticationFactory', 'Utilities',
	/**
	 * $http methods for project related tasks
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Project
	 * @author Brakebein
	 * @param $http {$http} Angular HTTP request service
	 * @param API {API} API url constant
	 * @param AuthenticationFactory {AuthenticationFactory} AuthenticationFactory
	 * @param Utilities {Utilities} Utilities
	 * @returns {Object} collection of methods
	 */
	function ($http, API, AuthenticationFactory, Utilities) {
		
		return {

			/**
			 * Create a new project
			 * @memberof Project
			 * @function create
			 * @param name {string} project name
			 * @param desc {string} description (can also be empty)
			 * @returns {Promise} $http promise
			 */
			create: function (name, desc) {
				return $http.post(API + 'auth/project', {
					proj: 'Proj_' + Utilities.getUniqueId(),
					name: name,
					description: desc,
					email: AuthenticationFactory.user,
					username: AuthenticationFactory.userName
				});
			},

			/**
			 * Get data of project with given ID
			 * @memberof Project
			 * @function get
			 * @param prj {string} project ID
			 * @returns {Promise} $http promise
			 */
			get: function (prj) {
				return $http.get(API + 'auth/project/' + prj, { cache: true });
			},

			/**
			 * Delete Project
			 * @memberof Project
			 * @function delete
			 * @param prj {string} project ID
			 * @returns {Promise} $http promise
			 */
			delete: function (prj) {
				return $http.delete(API + 'auth/project/' + prj);
			},

			/**
			 * Update name and description of the project
			 * @memberof Project
			 * @function update
			 * @param prj {string} project ID
			 * @param name {string} new project name
			 * @param desc {string} new project description
			 * @returns {Promise} $http promise
			 */
			update: function (prj, name, desc) {
				return $http.put(API + 'auth/project/' + prj, {
					name: name,
					description: desc
				});
			},

			/**
			 * Get all available projects
			 * @memberof Project
			 * @function getAll
			 * @returns {Promise} $http promise
			 */
			getAll: function () {
				return $http.get(API + 'auth/projects');
			}
			
		};
		
	}]);
