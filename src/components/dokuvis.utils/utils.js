/**
 * Common used components and utilities.
 *
 * ### Module Dependencies
 * * [mgcrea.ngStrap](http://mgcrea.github.io/angular-strap/)
 * * [pascalprecht.translate](https://angular-translate.github.io/)
 *
 * @ngdoc module
 * @name dokuvis.utils
 * @module dokuvis.utils
 */
angular.module('dokuvis.utils', [
	'mgcrea.ngStrap',
	'pascalprecht.translate'
])

/**
 * This factory provides some helpful functions.
 * @ngdoc factory
 * @name Utilities
 * @module dokuvis.utils
 * @author Brakebein
 * @requires http://mgcrea.github.io/angular-strap/#/alerts $alert
 */
.factory('Utilities2', ['$alert',
	function ($alert) {

		var f = {};

		/**
		 * Wait until condition is met.
		 * @ngdoc method
		 * @name Utilities#waitfor
		 * @param test {function} Function that returns a value
		 * @param expectedValue {string|number|boolean} Value of the test function we are waiting for
		 * @param msec {number} Delay between the calls to test
		 * @param params {Object} Parameters to be passed to the callback function
		 * @param callback {function} Function to execute when the condition is met
		 */
		f.waitfor = function(test, expectedValue, msec, params, callback) {
			// check if condition met. if not, re-check later
			if (test() !== expectedValue) {
				setTimeout(function() {
					f.waitfor(test, expectedValue, msec, params, callback);
				}, msec);
				return;
			}
			// condition finally met. callback() can be executed
			callback(params);
		};

		///// ALERTS

		/**
		 * Shows a danger alert for 5 seconds.
		 * @ngdoc method
		 * @name Utilities#dangerAlert
		 * @param message {string} Message to show
		 */
		f.dangerAlert = function(message) {
			$alert({
				content: message,
				type: 'danger',
				duration: 5
			});
		};

		///// EXCEPTIONS

		/**
		 * Shows a danger alert.
		 * @ngdoc method
		 * @name Utilities#throwException
		 * @param title {string} Title of the alert
		 * @param message {string} Message to show
		 * @param data {*=} Addtional data to be shown within the console
		 */
		f.throwException = function(title, message, data) {
			$alert({
				title: title+':',
				content: message,
				type: 'danger',
				duration: 5
			});
			console.error(title+': '+message, data, "\n"+(new Error).stack.split("\n")[2]);
		};

		/**
		 * Shows a danger alert titled with `API Exception`.
		 * @ngdoc method
		 * @name Utilities#throwApiException
		 * @param message {string} Message to show
		 * @param data {*} Addtional data to be shown within the console
		 */
		f.throwApiException = function(message, data) {
			if (data.status === 403)
				message = 'Access denied ' + message + ' (' + data.statusText + ' ' + data.status + ')';
			$alert({
				title: 'API Exception:',
				content: message,
				type: 'danger',
				duration: 5
			});
			console.error('API Exception: ' + message, data, "\n" + (new Error).stack.split("\n")[2]);
		};

		return f;

	}
])

/**
 * Service providing a dialog with two buttons to confirm or abort an action.
 *
 * @ngdoc factory
 * @name ConfirmDialog
 * @module dokuvis.utils
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires http://mgcrea.github.io/angular-strap/#/alerts $alert
 *
 * @param customAlertOptions {Object} Custom text and captions
 * @param customAlertDefaults {Object=} Custom templateUrl, etc.
 * @return {Promise} Resolves, if action has been confirmed, or rejects, if aborted.
 * @example
 * #### Available options and their defaults:
 * ```
 * // default values
 * alertDefaults = {
 *     backdrop: 'static',
 *     templateUrl: 'partials/alerts/confirmAlert.html',
 *     show: true
 * };
 * alertOptions = {
 *     abortButtonText: 'abort',
 *     actionButtonText: 'OK',
 *     headerText: 'continue?',
 *     bodyText: 'Sind Sie sicher?',
 *     type: 'warning',
 *     translationData: {}
 * };
 * ```
 * Button labels, header and body text can be overwritten. For header and body text, HTML syntax is supported. Also, a translation ID can be passed. For [variable replacement](https://angular-translate.github.io/docs/#/guide/06_variable-replacement) in translate filter, varibales can be bound to `translationData` object. Be sure that the parameter names match the variable names in your translations.
 *
 * #### Normal usage:
 * ```
 * ConfirmDialog({
 *     headerText: 'Projekt löschen',
 *     bodyText: 'Soll das Projekt wirklich gelöscht werden?'
 * }).then(function () {
 *     // do something, if confirm button has been pressed
 * }.catch(function () {
 *     // do something, if abort button has been pressed
 * });
 * ```
 * #### Usage with translation IDs:
 * ```
 * // en-US.json
 * {
 *   "project_delete": "Delete project",
 *   "project_delete_text": "Are you sure that project <b>{{name}}</b> should be deleted? All data will be lost!"
 * }
 *
 * // controller.js
 * ConfirmDialog({
 *     headerText: 'project_delete',        // results in -> Delete project
 *     bodyText: 'project_delete_text'      // results in -> Are you sure that project Sample Project should be deleted? All data will be lost!
 *     translationData: {
 *         name: project.name               // = 'Sample Project'
 *     }
 * }).then(function () {
 *     // do something, if confirm button has been pressed
 *     project.$delete();
 * }.catch(function () {
 *     // do something, if abort button has been pressed
 * });
 * ```
 */
.factory('ConfirmDialog', ['$q', '$alert',
	function ($q, $alert) {

		var alertDefaults = {
			backdrop: 'static',
			templateUrl: 'components/dokuvis.utils/confirmAlert.tpl.html',
			show: true
		};

		var alertOptions = {
			abortButtonText: 'abort',
			actionButtonText: 'OK',
			headerText: 'continue?',
			bodyText: 'Sind Sie sicher?',
			type: 'warning',
			translationData: {}
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

		return function (customAlertOptions, customAlertDefaults) {
			if(!customAlertDefaults) customAlertDefaults = {};
			return show(customAlertOptions, customAlertDefaults);
		};

	}
])

/**
 * A grey area, where someone can drop a file passed to a [FileUploader](https://github.com/nervgh/angular-file-upload). On click, a file dialog opens to select a file or multiple files.
 * @ngdoc directive
 * @name fileDropArea
 * @module dokuvis.utils
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires https://ui-router.github.io/ng1/docs/0.3.2/index.html#/api/ui.router.state.$state $state
 * @param fileDropArea {boolean}
 * @param uploader {FileUploader} Instance of [FileUploader](https://github.com/nervgh/angular-file-upload)
 * @param labelBefore {string} Some text displayed next (before/above) to a plus sign
 * @param labelAfter {string} Some text displayed next (after/below) to a plus sign
 * @param uiSref {string=} On click, it doesn't open the file dialog, but it transitions to given state. After adding file via file drop, it transitions to given state.
 * @param multiple {boolean=} If set, multiple files are sele
 * @param column {boolean=} Show labels and plus sign on top of each other
 * @param fontSize {string=} Control the size of the font, e.g. "small" -> 14px, unset -> 16px
 * @restrict AE
 * @scope
  */
.directive('fileDropArea', ['$timeout', '$state',
	function ($timeout, $state) {

		return {
			restrict: 'AE',
			scope: {
				uploader: '=',
				labelBefore: '@',
				labelAfter: '@'
			},
			link: function (scope, element, attrs) {

				// init
				$timeout(function () {
					var el = angular.element(element);

					if ('uiSref' in attrs) {
						// remove input if ui-sref
						el.find('input').remove();
						// trigger state change after adding file
						scope.uploader.onAfterAddingAll = function () {
							if (!$state.includes(attrs['uiSref']) && !$state.includes('**' + attrs['uiSref']))
								$state.go(attrs['uiSref']);
						};
					}

					// set multiple attribute
					if ('multiple' in attrs)
						el.find('input').attr('multiple', true);

					// set flex-direction
					if ('column' in attrs)
						el.children().css('flex-direction', 'column');
				});

				// trigger click event on hidden file input element1
				scope.openFileDialog = function () {
					$timeout(function () {
						angular.element(element).find('input').trigger('click');
					});
				};
			},
			template: '<div ng-if="uploader" data-uploader="uploader" nv-file-drop nv-file-over ng-click="openFileDialog()">\n\t<input type="file" ng-hide="1" data-uploader="uploader" nv-file-select ng-click="$event.stopPropagation()"/>\n\t<div>{{labelBefore|translate}}</div>\n\t<svg x="0px" y="0px" viewBox="0 0 10 10" enable-background="new 0 0 10 10" xml:space="preserve">\n\t\t<path d="M3.746,10V6.283H0V3.717h3.746V0h2.497v3.717H10v2.566H6.243V10H3.746z"/>\n\t</svg>\n\t<div>{{labelAfter|translate}}</div>\n</div>'
		}

	}
]);
