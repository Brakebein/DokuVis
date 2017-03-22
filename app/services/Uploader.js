/**
 * This factory creates an instance of `FileUploader` ([angular-file-upload](https://github.com/nervgh/angular-file-upload)), so it can be used in multiple controllers. Authentication headers are set for uploading.
 * @ngdoc factory
 * @name Uploader
 * @module dokuvisApp
 * @requires https://github.com/nervgh/angular-file-upload FileUploader
 * @requires https://docs.angularjs.org/api/ng/service/$window $window
 */
angular.module('dokuvisApp').factory('Uploader', ['FileUploader', '$window',
	function(FileUploader, $window) {

		var headers = {};
		if($window.localStorage.token) {
			headers['X-Access-Token'] = $window.localStorage.token;
			headers['X-Key'] = $window.localStorage.user;
		}

		return new FileUploader({
			headers: headers,
			alias: 'uploadFile'
		});
		
	}]);
