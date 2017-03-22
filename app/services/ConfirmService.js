/**
 * Service providing a dialog with two buttons to confirm or abort an action.
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
 * @ngdoc factory
 * @name ConfirmService
 * @module dokuvisApp
 * @requires http://mgcrea.github.io/angular-strap/#/alerts $alert
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$q $q
 * @requires https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translate $translate
 * 
 * @param customAlertOptions {Object} Custom text and captions
 * @param customAlertDefaults {Object=} Custom templateUrl etc.
 * @returns {Promise} Resolves, if action has been confirmed, or rejects, if aborted
 * @example
 * ```
 * ConfirmService({
 *     headerText: 'Projekt löschen',
 *     bodyText: 'Soll das Projekt wirklich gelöscht werden?'
 * }).then(function () {
 *     // do something, if confirm button has been pressed
 * }, function () {
 *     // do something, if abort button has been pressed
 * });
 * ```
 */
angular.module('dokuvisApp').factory('ConfirmService', ['$alert', '$q', '$translate',
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

		// TODO: translate text when factory is called
		$translate('abort').then(function (abort) {
			alertOptions.abortButtonText = abort;
		});

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

		return function (customAlertOptions, customAlertDefaults) {
			if(!customAlertDefaults) customAlertDefaults = {};
			return show(customAlertOptions, customAlertDefaults);
		}

	}]);
