angular.module('dokuvisApp').factory('Comment', ['$http', 'API', '$stateParams', '$q', 'Utilities', 'AuthenticationFactory',
	function($http, API, $stateParams, $q, Utilities, AuthenticationFactory) {
		
		return {

			/**
			 * create comment
			 * @param {string} type - type of comment
			 * @param {string} text - user's comment text
			 * @param {string} title - title of the comment
			 * @param {(string|string[])} targets - ids of the items the comment is attached to
			 * @param {(string|string[])} [refs] - ids of any references
			 * @param {(Object|Object[])} [screenshots] - screenshots and user drawings
			 * @returns {(HttpPromise|Promise)}
			 */
			create: function(type, text, title, targets, refs, screenshots) {
				if(!targets)
					targets = [];
				if(!Array.isArray(targets))
					targets = [targets];
				if(!targets.length) {
					Utilities.dangerAlert('Der Kommentar ist keinem Objekt zugewiesen!');
					return $q.reject('No valid arguments');
				}
				if(!refs)
					refs = [];
				if(!screenshots) {
					screenshots = [];
				}

				return $http.post(API + 'auth/project/' + $stateParams.project + '/comment', {
					id: Utilities.getUniqueId(),
					targets: targets,
					text: text,
					type: type,
					title: title,
					user: AuthenticationFactory.user,
					date: moment().format(),
					refs: refs,
					screenshots: screenshots,
					path: $stateParams.project + '/screenshots/'
				});
			},

			/**
			 * get the comments of an item
			 * @param {string} targetId - id of the item the comments are attached to
			 * @returns {HttpPromise}
			 */
			get: function(targetId) {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/comment/' + targetId);
			},
			
			getAll: function () {
				return $http.get(API + 'auth/project/' + $stateParams.project + '/comments');
			}
			
		};
		
	}]);
