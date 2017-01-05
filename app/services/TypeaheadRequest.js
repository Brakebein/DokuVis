angular.module('dokuvisApp').factory('TypeaheadRequest', ['$http', 'API', '$stateParams',
	function ($http, API, $stateParams) {
		
		return {
		
			query: function (label, from, prop) {
				var url = API + 'auth/project/' + $stateParams.project + '/typeahead/' + label + '/' + prop + '/' + from;
				return $http.get(url);
			}
			
		};
		
	}]);
