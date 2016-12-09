angular.module('dokuvisApp').service('ConfirmService', ['$alert', '$q', '$translate',
	/**
	 * Service providing a dialog with two buttons to confirm or abort an action
	 * ```
	 * // default values
	 * alertDefaults = {
	 *     backdrop: 'static',
	 *     templateUrl: 'partials/alerts/confirmAlert.html',
	 *     show: true
	 * };
	 * alertOptions = {
	 *     abortButtonText: 'Abbrechen',
	 *     actionButtonText: 'OK',
	 *     headerText: 'Fortfahren?',
	 *     bodyText: 'Sind Sie sicher?',
	 *     type: 'warning'
	 * };
	 * ```
	 * @memberof dokuvisApp
	 * @ngdoc service
	 * @name ConfirmService
	 * @param $alert {$alert} ngStrap alert dialog service
	 * @param $q {$q} Angular promise service
	 * @param $translate {$translate} $translate service
	 * @example
	 * ConfirmService.showAlert({
	 *     headerText: 'Projekt löschen',
	 *     bodyText: 'Soll das Projekt wirklich gelöscht werden?'
	 * }).then(function () {
	 *     // do something, if confirm button has been pressed
	 * }, function () {
	 *     // do something, if abort button has been pressed
	 * });
	 */
	function ($alert, $q, $translate) {

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

		$translate('abort').then(function (abort) {
			alertOptions.abortButtonText = abort;
		});

		/**
		 * Triggers the alert/dialog to show
		 * @memberof ConfirmService
		 * @function showAlert
		 * @param customAlertOptions {Object} custom text and captions
		 * @param [customAlertDefaults] {Object} Optional: custom templateUrl etc.
		 * @returns {Promise} Resolves, if action has been confirmed, rejects, if aborted
		 */
		this.showAlert = function (customAlertOptions, customAlertDefaults) {
			if(!customAlertDefaults) customAlertDefaults = {};
			return show(customAlertOptions, customAlertDefaults);
		};

		function show(customAlertOptions, customAlertDefaults) {
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
		}

	}]);
