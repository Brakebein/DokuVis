/**
 * Translates mousewheel event into horizontal scroll movement.
 * 
 * @ngdoc directive
 * @name horizontalScroll
 * @module dokuvisApp
 * @author Brakebein
 * @restrict A
 * @param horizontalScroll {boolean}
 */
angular.module('dokuvisApp').directive('horizontalScroll',
	function() {
		return {
			restrict: 'A',
			link: function(scope, element) {
				function mousewheelHorizontalScroll(event) {
					var delta =  - event.originalEvent.deltaY || event.originalEvent.wheelDelta || 0;
					var sl = element.scrollLeft();
					if (delta > 0)
						element.scrollLeft(sl - 100);
					else if (delta < 0)
						element.scrollLeft(sl + 100);
				}
				element.on('wheel', mousewheelHorizontalScroll);
			}
		};
	});

angular.module('dokuvisApp').directive('alert', ['$timeout',
	function($timeout) {
		return {
			restrict: 'A',
			scope: {
				alert: '='
			},
			template: '<span class="glyphicon glyphicon-exclamation-sign"></span> {{alert.message}}',
			link: function(scope, element) {
				element.hide().fadeIn(300);
				$timeout(function() {
					element.fadeOut({duration: 1000, done: function() {
						scope.$parent.alert.showing = false;
						scope.$apply();
					}});
				}, 5000);
			}
		};
	}]);

// zum Anpassen des Layouts
angular.module('dokuvisApp').directive('resizer', ['$document',
	function($document) {
		return {
			scope: {
				resizerEnd: '=',
				resizerAnim: '='
			},
			link: function(scope, element, attrs) {
				
				var offset = 0;
				var space = 0;
				var endPosition = 0;
				
				element.on('mousedown', function(event) {
					event.preventDefault();
					
					if(!(attrs.resizer === 'vertical' || attrs.resizer === 'horizontal')) return;
					
					$document.bind('mousemove', rMousemove);
					$document.bind('mouseup', rMouseup);
					
					if(attrs.resizer === 'vertical') {
						offset = event.pageX - event.offsetX - event.delegateTarget.offsetLeft;
						space = element.parent()[0].offsetWidth;
					}
					else {
						offset = event.pageY - event.offsetY - event.delegateTarget.offsetTop;
						space = element.parent()[0].offsetHeight;
					}
				});

				function init() {
					if(attrs.resizer ==='vertical') {
						var x = $(attrs.resizerRight).css('left');
						element.css({
							left: x
						});
						$(attrs.resizerLeft).css({
							width: x
						});
						$(attrs.resizerRight).css({
							left: x
						});
					}
				}
				init();

				function rMousemove(event) {
					if(attrs.resizer === 'vertical') {
						// handle vertical resizer
						var x = event.pageX - offset;
						
						if(attrs.resizerLeftMin && x < attrs.resizerLeftMin) {
							x = parseInt(attrs.resizerLeftMin);
						}
						if(attrs.resizerRightMin && x > space - attrs.resizerRightMin) {
							x = space - parseInt(attrs.resizerRightMin);
						}
						
						element.css({
							left: x + 'px'
						});
						$(attrs.resizerLeft).css({
							width: x + 'px'
						});
						$(attrs.resizerRight).css({
							left: (x + element.width()) + 'px'
						});
						endPosition = x;
					}
					else {
						// handle horizontal resizer
						var y = space - event.pageY - offset;
						
						if(attrs.resizerTopMin && y > space - attrs.resizerTopMin) {
							y = space - parseInt(attrs.resizerTopMin);
						}
						if(attrs.resizerBottomMin && y < attrs.resizerBottomMin) {
							y = parseInt(attrs.resizerBottomMin);
						}
						
						element.css({
							bottom: y + 'px'
						});
						$(attrs.resizerTop).css({
							bottom: (y + element.height()) + 'px'
						});
						$(attrs.resizerBottom).css({
							height: y + 'px'
						});
						endPosition = y;
					}
				}
				
				function rMouseup() {
					$document.unbind('mousemove', rMousemove);
					$document.unbind('mouseup', rMouseup);
					if(scope.resizerEnd) scope.resizerEnd();
					//scope.resizerAnim = endPosition;
					//scope.$apply();
				}
				
				scope.$watch('resizerAnim', function(newValue, oldValue) {
					//console.log(newValue, oldValue);
					
					if(attrs.resizer === 'vertical') {
						space = element.parent()[0].offsetWidth;
						var x = newValue;
						
						if(attrs.resizerLeftMin && x < attrs.resizerLeftMin) {
							x = parseInt(attrs.resizerLeftMin);
						}
						if(attrs.resizerRightMin && x > space - attrs.resizerRightMin) {
							x = space - parseInt(attrs.resizerRightMin);
						}
						
						element.animate({
							left: x + 'px'
						}, 500);
						$(attrs.resizerLeft).animate({
							width: x + 'px'
						}, 500);
						$(attrs.resizerRight).animate({
							left: (x + element.width()) + 'px'
						}, 500);
					}
					else {
						space = element.parent()[0].offsetHeight;
						var y = newValue;
						
						if(attrs.resizerTopMin && y > space - attrs.resizerTopMin) {
							y = space - parseInt(attrs.resizerTopMin);
						}
						if(attrs.resizerBottomMin && y < attrs.resizerBottomMin) {
							y = parseInt(attrs.resizerBottomMin);
						}
						
						element.animate({
							bottom: y + 'px'
						}, 500);
						$(attrs.resizerTop).animate({
							bottom: (y + element.height()) + 'px'
						}, 500);
						$(attrs.resizerBottom).animate({
							height: y + 'px'
						}, 500);
					}
				});
			}
		};
	}]);

angular.module('dokuvisApp').directive('ngWheel', ['$parse',
	function($parse) {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				var fn = $parse(attr.ngWheel);
				function mousewheel(event) {
					scope.$apply(function() {
						fn(scope, {$event: event});
					});
				}
				element.bind('mousewheel', mousewheel);
				element.bind('DOMMouseScroll', mousewheel); // firefox
			}
		};
	}]);

angular.module('dokuvisApp').directive('syncScroll',
	function() {
		
		return {
			restrict: 'A',
			replace: false,
			link: function(scope, element, attrs) {
				var scrollTop = 0;
				var scrollHeight = 0;
				var offsetHeight = 0;
				
				var elements = element.find('.'+attrs.syncScroll);
				
				elements.on('scroll', function(e) {
					if(e.isTrigger) {
						e.target.scrollTop = Math.round(scrollTop * (e.target.scrollHeight - e.target.offsetHeight) / (scrollHeight - offsetHeight));
					}
					else {
						scrollTop = e.target.scrollTop;
						scrollHeight = e.target.scrollHeight;
						offsetHeight = e.target.offsetHeight;
						elements.each(function(element) {
							if(!this.isSameNode(e.target)) {
								$(this).trigger('scroll');
							}
						});
					}
				});
			}
		};
	});

angular.module('dokuvisApp').directive('convertToNumber',
 function() {

	return {
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        ngModel.$parsers.push(function(val) {
          return parseInt(val, 10);
        });
        ngModel.$formatters.push(function(val) {
          return '' + val;
        });
      }
    };
  });

angular.module('dokuvisApp').directive('noContextMenu', function () {
	return {
		compile: function (element) {
			element.bind('contextmenu', function (event) {
				event.preventDefault();
			});
		}
	};
});

angular.module('dokuvisApp').directive('userInitials', function () {
	return {
		template: '<span></span>',
		restrict: 'AE',
		scope: {
			userInitials: '<'
		},
		link: function (scope, element) {

			var initials = '';

			var names = scope.userInitials.toUpperCase().split(/\s+/);
			names.forEach(function (n) {
				initials += n[0];
			});

			var n0 = initials[0];

			if (initials.length > 1)
				var n1 = initials[1];
			else if (names[0].length > 1)
				n1 = names[0][1];
			else
				n1 = 'Z';

			if (initials.length > 2)
				var n2 = initials[2];
			else if (names[0].length > 2)
				n2 = names[0][2];
			else
				n2 = 'Z';

			n0 = Math.min(Math.max(n0.charCodeAt(0), 65), 90);
			n1 = Math.min(Math.max(n1.charCodeAt(0), 65), 90);
			n2 = Math.min(Math.max(n2.charCodeAt(0), 65), 90);

			var c0 = Math.round((n0 - 60) / 30 * 200);
			var c1 = Math.round((n1 - 60) / 30 * 200);
			var c2 = Math.round((n2 - 60) / 30 * 200);

			var hex = '#' + c0.toString(16) + c1.toString(16) + c2.toString(16);

			element.css('background-color', hex);
			element.attr('title', scope.userInitials);
			element.find('span').text(initials);

		}
	};
});
