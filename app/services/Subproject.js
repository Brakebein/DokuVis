angular.module('dokuvisApp').factory('Subproject', ['$http', 'API', '$stateParams', 'Utilities',
	/**
	 * $http methods for subproject related tasks
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name Subproject
	 * @author Brakebein
	 * @param $http {$http} Angular HTTP request service
	 * @param API {API} API url constant
	 * @param $stateParams {$stateParams} ui.router stateParams
	 * @param Utilities {Utilities} Utilities
	 * @returns {Object} collection of methods
	 */
	function($http, API, $stateParams, Utilities) {

		return {

			/**
			 * Create a new subproject
			 * @memberof Subproject
			 * @function create
			 * @param name {string} name of subproject
			 * @param desc {string} description
			 * @returns {Promise} $http Promise
			 * @example
			 * Subproject.create($scope.name, $scope.desc).then(function () {
			 *     console.log('subproject created');
			 * }, function (err) {
			 *     console.error('subproject not created');
			 * });
			 */
			create: function (name, desc) {
				return $http.post(API + 'auth/project/' + $stateParams.project + '/subproject', {
					id: Utilities.getUniqueId(),
					name: name,
					desc: desc
				});
			},

			/**
			 * Get all subprojects
			 * @memberof Subproject
			 * @function getAll
			 * @returns {Promise} $http Promise
			 */
			getAll: function () {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/subprojects');
			},

			/**
			 * Get id, name, and description of subproject
			 * @memberof Subproject
			 * @function get
			 * @param id {string} subproject ID
			 * @returns {Promise} $http Promise
			 */
			get: function (id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/subproject/' + id, { cache: true });
			},

			/**
			 * Update name and description of the subproject
			 * @memberof Subproject
			 * @function update
			 * @param id {string} subproject ID
			 * @param name {string} new name
			 * @param desc {string} new description
			 * @returns {Promise} $http Promise
			 */
			update: function (id, name, desc) {
				return $http.put(API + 'auth/project/' + $stateParams.project + '/subproject/' + id, {
					name: name,
					desc: desc
				});
			},

			/**
			 * Check, if subproject exists
			 * @memberof Subproject
			 * @function check
			 * @param prjId {string} project ID
			 * @param subId {string} subproject ID
			 * @returns {Promise} $http Promise
			 */
			check: function (prjId, subId) {
				return $http.get(API + 'auth/project/' + prjId + '/subproject/' + subId, { cache: true });
			}
			
		};

		// TODO: subproject löschen
		// TODO: $resource

	}]);
