angular.module('dokuvisApp').service('ConfirmService', ['$alert', '$q',
	function ($alert, $q) {

		var alertDefaults = {
			backdrop: 'static',
			templateUrl: 'partials/alerts/confirmAlert.html',
			show: true
		};

		var alertOptions = {
			abortButtonText: 'Abbrechen',
			actionButtonText: 'OK',
			headerText: 'Fortfahren?',
			bodyText: 'Sind Sie sicher?',
			type: 'warning'
		};

		this.showAlert = function(customAlertOptions, customAlertDefaults) {
			if(!customAlertDefaults) customAlertDefaults = {};
			return this.show(customAlertOptions, customAlertDefaults);
		};

		this.show = function (customAlertOptions, customAlertDefaults) {
			var tempAlertDefaults = {};
			var tempAlertOptions = {};

			angular.extend(tempAlertDefaults, alertDefaults, customAlertDefaults);
			angular.extend(tempAlertOptions, alertOptions, customAlertOptions);

			tempAlertDefaults.alertOptions = tempAlertOptions;
			var deferred = $q.defer();

			tempAlertDefaults.controller = function ($scope) {
				$scope.alertOptions = tempAlertOptions;
				$scope.alertOptions.ok = function () {
					$scope.$hide();
					deferred.resolve();
				};
				$scope.alertOptions.abort = function () {
					$scope.$hide();
					deferred.reject();
				};
			};

			$alert(tempAlertDefaults);

			return deferred.promise;
		};

	}]);
