angular.module('dokuvisApp').factory('Uploader', ['FileUploader', '$window',
	function(FileUploader, $window) {

		var headers = {};
		if($window.localStorage.token) {
			headers['X-Access-Token'] = $window.localStorage.token;
			headers['X-Key'] = $window.localStorage.user;
		}

		return new FileUploader({ headers: headers });
		
	}]);
