angular.module('dokuvisApp').factory('TypeaheadRequest', ['$http', 'API', '$stateParams',
	function ($http, API, $stateParams) {
		
		return {
		
			query: function (label, from, prop) {
				var url = API + 'auth/project/' + $stateParams.project + '/typeahead/' + label + '/' + prop + '/' + from;
				return $http.get(url);
			},

			queryTags: function (search) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/typeahead/tag', {
					params: {
						search: search
					}
				})
					.then(function (response) {
						var data = response.data;
						var tags = [];
						for (var i=0; i<data.length; i++) {
							tags.push(data[i].tag);
						}
						return tags;
					});
			}
			
		};
		
	}]);
