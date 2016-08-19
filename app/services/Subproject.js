angular.module('dokuvisApp').factory('Subproject', ['$http', 'API', '$stateParams', 'Utilities',
	function($http, API, $stateParams, Utilities) {

		return {
			
			create: function (name, desc) {
				return $http.post(API + 'auth/project/' + $stateParams.project + '/subproject', {
					id: Utilities.getUniqueId(),
					name: name,
					desc: desc
				});
			},
			
			getAll: function () {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/subprojects');
			},
			
			get: function (id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/subproject/' + id, { cache: true });
			},
			
			change: function (id, name, desc) {
				return $http.put(API + 'auth/project/' + $stateParams.project + '/subproject/' + id, {
					name: name,
					desc: desc
				});
			},

			check: function (prjId, subId) {
				return $http.get(API + 'auth/project/' + prjId + '/subproject/' + subId, { cache: true });
			}
			
		};

		// TODO: subproject editieren
		// TODO: subproject löschen
		
	}]);
