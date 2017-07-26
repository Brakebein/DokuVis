(function () {

	'use strict';

	function $debounce($timeout) {

		return function (callback, delay, leading, invokeApply) {

			var context, args, timeout, result;

			var later = function () {
				timeout = null;
				if (leading === false)
					result = callback.apply(context, args);
			};

			function debounce() {

				context = this;
				args = arguments;

				var callNow = leading && !timeout;

				if (timeout)
					$timeout.cancel(timeout);

				timeout = $timeout(later, delay, invokeApply !== false);

				if (callNow)
					result = callback.apply(context, args);

				return result;
			}

			debounce.cancel = function () {
				$timeout.cancel(timeout);
				timeout = null;
			};

			return debounce;
		};
	}

	function $throttle($timeout) {

		return function (callback, delay, leading, trailing, invokeApply) {

			var context, args, timeout, result;
			var previous = 0;

			var later = function () {
				previous = leading === false ? 0 : (new Date().getTime());
				timeout = null;
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
					result = callback.apply(context, args);
					if (!timeout)
						context = args = null;
				}
				else if (!timeout && trailing !== false) {
					timeout = $timeout(later, remaining, invokeApply === true);
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
		.factory('$debounce', ['$timeout', $debounce])
		.factory('$throttle', ['$timeout', $throttle]);

})();
