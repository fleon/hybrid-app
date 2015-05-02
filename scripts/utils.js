// worker code

'use strict';

angular.module('hybrid.utils', [])
.service('functionUtils', function ($timeout) {
	function debounce(func, wait, immediate) {
		var timeout, args, context, timestamp, result;

		var later = function () {
			var last = Date.now() - timestamp;
			if (last < wait) {
				timeout = $timeout(later, wait - last);
			} else {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
					context = args = null;
				}
			}
		};

		return function () {
			context = this;
			args = arguments;
			timestamp = Date.now();
			var callNow = immediate && !timeout;
			if (!timeout) {
				timeout = $timeout(later, wait);
			}
			if (callNow) {
				result = func.apply(context, args);
				context = args = null;
			}

			return result;
		};
	}

	return {
		debounce: debounce
	};
});