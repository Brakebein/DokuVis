var webglDirectives = angular.module('webglDirectives', ['urish']);

webglDirectives.directive('horizontalScroll',
	function() {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				function mousewheelHorizontalScroll(event) {
					var delta = event.originalEvent.wheelDelta || -event.originalEvent.detail*40 || 0;
					var sl = element.scrollLeft();
					element.scrollLeft(sl -= delta);
				}
				element.bind('mousewheel', mousewheelHorizontalScroll);
				element.bind('DOMMouseScroll', mousewheelHorizontalScroll); // firefox
			}
		};
	});

webglDirectives.directive('alert', ['$timeout',
	function($timeout) {
		return {
			restrict: 'A',
			scope: {
				alert: '='
			},
			template: '<span class="glyphicon glyphicon-exclamation-sign"></span> {{alert.message}}',
			link: function(scope, element, attr) {
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
	

webglDirectives.directive('dragMarker', ['$compile', '$timeout',
	function($compile, $timeout) {
		return {
			restrict: 'A',
			scope: {
				dragData: '=',
				dragEnabled: '=',
				dragComplete: '=',
				dragAbort: '=',
				dragLeaveParent: '='
			},
			link: function(scope, element, attr) {
				
				var isEnabled = (typeof scope.dragEnabled === 'undefined') ? true : scope.dragEnabled;
				var isDragging = false;
				var oldPosition = null;
				
				function mousedown(event) {
					event.preventDefault();
					if(isEnabled && event.button === 0) {
						isDragging = true;
						element.parent().toggleClass('cursor_pointer', true);
						oldPosition = element.position();
					}
				}
				
				function mousemove(event) {
					
					if(!isDragging) return;
					
					var movementX = event.originalEvent.movementX || event.originalEvent.mozMovementX || event.originalEvent.webkitMovementX || 0;
					var movementY = event.originalEvent.movementY || event.originalEvent.mozMovementY || event.originalEvent.webkitMovementY || 0;
					var offset = element.position();
					element.css('left', offset.left+movementX);
					element.css('top', offset.top+movementY);
				}
				
				function mouseup(event) {
					if(isDragging) {
						event.preventDefault();
						element.parent().toggleClass('cursor_pointer', false);
						var newPosition = element.position();
						if(oldPosition.left == newPosition.left && oldPosition.top == newPosition.top) {
							if(scope.dragAbort) scope.dragAbort(scope.dragData);
						}
						else {
							if(scope.dragComplete) scope.dragComplete(element.position(), scope.dragData);
						}
						isDragging = false;
					}
				}
				
				function mouseleave(event) {
					if(isDragging) {
						element.parent().toggleClass('cursor_pointer', false);
						if(scope.dragLeaveParent) scope.dragLeaveParent(scope.dragData);
						isDragging = false;
					}
				}
				
				element.bind('mousedown', mousedown);
				element.parent().bind('mousemove', mousemove);
				element.bind('mouseup', mouseup);
				element.parent().bind('mouseleave', mouseleave);
			
			}	
		};
	}]);
                                                                                                                                                                                                                                                                             
// zum Anpassen des Layouts
webglDirectives.directive('resizer',
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
					
					if(!(attrs.resizer == 'vertical' || attrs.resizer == 'horizontal')) return;
					
					$document.bind('mousemove', rMousemove);
					$document.bind('mouseup', rMouseup);
					
					if(attrs.resizer == 'vertical') {
						offset = event.pageX - event.offsetX - event.delegateTarget.offsetLeft;
						space = element.parent()[0].offsetWidth;
					}
					else {
						offset = event.pageY - event.offsetY - event.delegateTarget.offsetTop;
						space = element.parent()[0].offsetHeight;
					}
					console.log(event);
				});
				
				function rMousemove(event) {
					if(attrs.resizer == 'vertical') {
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
					scope.resizerAnim = endPosition;
					scope.$apply();
				}
				
				scope.$watch('resizerAnim', function(newValue, oldValue) {
					//console.log(newValue, oldValue);
					
					if(attrs.resizer == 'vertical') {
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
	});
	
webglDirectives.directive('rampSlider',
	function($document) {
		return {
			scope: {
				rsModel: '=',
				rsOnchange: '='
			},
			template: '<div ng-style="{width: rsModel*100+\'%\'}""></div>',
			link: function(scope, element, attrs) {
				
				var colorStart = attrs.rsColor || '#aaa';
				var colorEnd = attrs.rsColorTwo || colorStart;
				
				element.css('position', 'relative');
				var ramp = element.find('div');
				ramp.css({
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
					
					scope.rsOnchange(scope.rsModel);
					scope.$applyAsync();
				}
			}
		};
	});

webglDirectives.directive('ngWheel',
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
	});
	
webglDirectives.directive('syncScroll',
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
	
webglDirectives.directive('convertToNumber',
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