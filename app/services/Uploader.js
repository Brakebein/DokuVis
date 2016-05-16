angular.module('dokuvisApp').factory('Uploader', ['FileUploader',
	function(FileUploader) {
		
		return new FileUploader();
		
	}]);