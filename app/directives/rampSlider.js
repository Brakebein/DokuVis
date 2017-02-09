/**
 * A slider visualized as a box with a color ramp as background.
 * @memberof dokuvisApp
 * @ngdoc directive
 * @name rampSlider
 * @author Brakebein
 * @requires $document
 * @attr ng-model {Number} Value the directive is bound to [0..1]
 * @attr [ng-change] {Expression} Expression to be evaluated after the value has changed
 * @attr [rs-color] {string} Left (or base) color as hexadecimal color value
 * @attr [rs-color-end] {string} Right color as hexadecimal color value
 * @example
 * <div ramp-slider
 *     ng-model="opacity"
 *     ng-change="setOpacity()"
 *     rs-color="#ddd"
 *     rs-color-end="#bbb" >
 * </div>
 */
angular.module('dokuvisApp').directive('rampSlider', ['$document',
	function($document) {
		return {
			require: 'ngModel',
			template: '<div ng-style="{width: rsModel*100+\'%\'}"></div>',
			link: function(scope, element, attrs, ngModelCtrl) {

				var colorStart = attrs.rsColor || '#aaa';
				var colorEnd = attrs.rsColorEnd || colorStart;

				element.css('position', 'relative');
				element.find('div').css({
					position: 'absolute',
					top: 0,
					bottom: 0,
					background: 'linear-gradient(to right, '+colorStart+', '+colorEnd+')'
				});

				element.on('mousedown', function(event) {
					event.preventDefault();
					$document.bind('mousemove', jQuery.throttle(100, rampSliderMousemove) );
					$document.bind('mouseup', rampSliderMouseup);
				});

				function rampSliderMousemove(event) {
					applyChange(event);
				}

				function rampSliderMouseup() {
					applyChange(event);
					$document.unbind('mousemove', rampSliderMousemove);
					$document.unbind('mouseup', rampSliderMouseup);
				}

				function applyChange(event) {
					scope.rsModel = parseFloat(((event.pageX - element.offset().left) / element[0].offsetWidth ).toFixed(2));
					if(scope.rsModel > 0.9) scope.rsModel = 1.0;
					else if(scope.rsModel < 0.1) scope.rsModel = 0.0;

					ngModelCtrl.$setViewValue(scope.rsModel);
				}

				scope.$watch(function () {
					return ngModelCtrl.$modelValue;
				}, function (newValue) {
					scope.rsModel = newValue;
				});
			}
		};
	}]);
