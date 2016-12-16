angular.module('dokuvisApp').factory('Category', ['$resource', 'API', '$stateParams', 'Utilities', 'CategoryAttribute',
	function ($resource, API, $stateParams, Utilities, CategoryAttribute) {
		
		function setAttributeResource(json) {
			var data = angular.fromJson(json);

			for(var i=0; i<data.length; i++) {
				for(var j=0; j<data[i].attributes.length; j++) {
					data[i].attributes[j] = new CategoryAttribute(data[i].attributes[j]);
					data[i].attributes[j].cid = data[i].id;
				}
			}

			return data;
		}

		return $resource(API + 'auth/project/:project/category/:id', {
			project: function () {
				return $stateParams.project;
			},
			id: '@id'
		}, {
			query: {
				method: 'GET',
				isArray: true,
				transformResponse: setAttributeResource
			},
			save: {
				method: 'POST',
				transformRequest: function (data) {
					return angular.toJson(angular.extend(data, { id: Utilities.getUniqueId() + '_category' }));
				}
			},
			update: { method: 'PUT' }
		});

	}]);
