(function () {

	'use strict';

	function $debounce($rootScope, $timeout) {

		return function (callback, delay, leading, invokeApply) {

			var context, args, timeout, result;

			var later = function () {
				timeout = null;
				if (leading === false) {
					if (invokeApply !== false) $rootScope.$applyAsync();
					result = callback.apply(context, args);
				}
			};

			function debounce() {

				context = this;
				args = arguments;

				var callNow = leading && !timeout;

				if (timeout)
					$timeout.cancel(timeout);

				timeout = $timeout(later, delay, false);

				if (callNow) {
					if (invokeApply !== false) $rootScope.$applyAsync();
					result = callback.apply(context, args);
				}

				return result;
			}

			debounce.cancel = function () {
				$timeout.cancel(timeout);
				timeout = null;
			};

			return debounce;
		};
	}

	function $throttle($rootScope, $timeout) {

		return function (callback, delay, leading, trailing, invokeApply) {

			var context, args, timeout, result;
			var previous = 0;

			var later = function () {
				previous = leading === false ? 0 : (new Date().getTime());
				timeout = null;

				if (invokeApply === true) $rootScope.$applyAsync();
				result = callback.apply(context, args);

				if (!timeout)
					context = args = null;
			};

			var throttled = function () {

				context = this;
				args = arguments;

				var now = (new Date().getTime());

				if (!previous && leading === false)
					previous = now;

				var remaining = delay - (now - previous);

				if (remaining <= 0 || remaining > delay) {
					if (timeout) {
						$timeout.cancel(timeout);
						timeout = null;
					}
					previous = now;

					if (invokeApply === true) $rootScope.$applyAsync();
					result = callback.apply(context, args);

					if (!timeout)
						context = args = null;
				}
				else if (!timeout && trailing !== false) {
					timeout = $timeout(later, remaining, false);
				}

				return result;
			};

			throttled.cancel = function () {
				$timeout.cancel(timeout);
				previous = 0;
				timeout = context = args = null;
			};

			return throttled;
		};
	}

	angular.module('ngDebounceThrottle', [])
		.factory('$debounce', ['$rootScope', '$timeout', $debounce])
		.factory('$throttle', ['$rootScope', '$timeout', $throttle]);

})();
