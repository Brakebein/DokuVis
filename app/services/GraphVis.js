/**
 * Created by Brakebein on 07.04.2016.
 */

angular.module('dokuvisApp').factory('GraphVis', ['$http', 'API', '$stateParams',
	function($http, API, $stateParams) {

		return {

			getNodeNeighbours: function (id) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/graph/' + id);
			},
			
			getNodeTitle: function (id, label) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/graph/' + id + '/' + label);
			}

		};

	}]);