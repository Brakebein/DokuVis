angular.module('dokuvisApp').factory('Comment', ['$http', 'API', '$stateParams', 'Utilities', 'AuthenticationFactory',
	function($http, API, $stateParams, Utilities, AuthenticationFactory) {
		
		return {
			
			create: function(text, targetId, type) {
				return $http.post(API + 'auth/project/' + $stateParams.project + '/comment', {
					id: Utilities.getUniqueId(),
					targetId: targetId,
					text: text,
					type: type,
					user: AuthenticationFactory.user,
					date: moment().format()
				});
			},
			
			get: function(targetId) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/comment/' + targetId);
			}
			
		};
		
	}]);