'use strict';

angular.module('hybrid.directives', [])

.directive('smartScroll', ['$parse', function ($parse) {
	return {
		restrict: 'A',
		scope: true,
		compile: function compileFn(element, attrs) {
			var repeater = attrs.smartScroll;
			if (!repeater) { return; }
			repeater = repeater.split(' as ');

			var finiteListName = repeater[1],
				actualListName = repeater[0],
				getActualList = $parse(repeater[0]),
				smartScrollOptions = $parse(attrs.smartScrollOptions),
				limit = smartScrollOptions.limit || 20,
				gap = smartScrollOptions.gap || 10;

			return function link(scope, element) {
				smartScrollOptions = smartScrollOptions(scope) || {};

				// Reference to the ngRepeat container using the selector provided.
				// Default to the element this directive is added on otherwise.
				var ngRepeatContainer = (smartScrollOptions.ngRepeatContainer ? angular.element(smartScrollOptions.ngRepeatContainer, element) : element);

				// Reference to the container that has a scrollbar somehow (using overflow:scroll or whatever)
				// If the value is 'window', window will be considered as the scrollable element.
				if (smartScrollOptions.scrollContainer === 'window') {
					smartScrollOptions.scrollContainer = window;
				}
				var scrollContainer = (smartScrollOptions.scrollContainer ? angular.element(smartScrollOptions.scrollContainer) : element);

				// Required for height expansion element (below) to work properly
				ngRepeatContainer.css('position', 'relative');

				// An element to be inserted in the ngRepeatContainer to increase its height
				var elementName;
				switch (ngRepeatContainer[0].nodeName.toLowerCase()) {
					case 'ul':
					case 'ol':
						elementName = 'li';
						break;
					case 'dl':
						elementName = 'dd';
						break;
					case 'tbody':
					case 'tfoot':
					case 'thead':
						elementName = 'tr';
						break;
					case 'tr':
						elementName = 'td';
						break;
					default:
						elementName = 'span';
						break;
				}

				// By adding this element to the ngRepeat container, its scrollable area becomes as large
				// as its height would have been had all the campaigns been rendered
				// This gives an illusion that all the campaigns are present on the page, when they're not
				var heightExpansionElement = document.createElement(elementName);
				heightExpansionElement = angular.element(heightExpansionElement);
				heightExpansionElement.css({ display: 'block', position: 'absolute' }).html('&nbsp;').addClass('heightExpansionElement');
				ngRepeatContainer.prepend(heightExpansionElement);

				// scrollTop fix for firefox
				// - scroll to bottom of the campaigns list in firefox, refresh
				// - scrollTop remains the old value in firefox, and must be reset to 0.
				ngRepeatContainer[0].scrollTop = 0;

				// Whenever the reference to the actual list changes, reset the limit and the finite elements
				// And re-render.
				scope.$watchCollection(actualListName, function (actualList) {
					if (!angular.isArray(actualList)) { return; }

					// reset the initial limit, the initial number of elements
					limit = smartScrollOptions.limit || 10;
					scope[finiteListName] = actualList.slice(0, limit);

					// and redo the scrollbar fixing hack
					scrollbarFixed = false;

					// (hack) Keep calling onscroll repeatedly until the scrollbar's height fixes
					var scrollbarFixTimer = setInterval(function () {
						if (scrollbarFixed) {
							clearTimeout(scrollbarFixTimer);
						}
						onscroll();
					}, 10);
				});

				var scrollbarFixed = false,
					scrollContainerRect,
					disableHoverTimeout;

				function onscroll() {
					var actualList = getActualList(scope);
					if (scrollContainer[0] === window) {
						scrollContainerRect = scrollContainerRect || {
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							width: window.innerWidth,
							height: window.innerHeight
						};
					} else {
						scrollContainerRect = scrollContainerRect || scrollContainer[0].getBoundingClientRect();
					}

					clearTimeout(disableHoverTimeout);
					if (!ngRepeatContainer.hasClass('disable-hover')) {
						ngRepeatContainer.addClass('disable-hover');
					}

					disableHoverTimeout = setTimeout(function setTimeoutCallback() {
						ngRepeatContainer.removeClass('disable-hover');
					}, 500);

					var ngRepeatContainerRect = ngRepeatContainer[0].getBoundingClientRect();
					if (!ngRepeatContainerRect.height) { return; }

					// Hack to adjust the height of the scrollbar on initial load
					var ngRepeatContainerChildren = ngRepeatContainer.children();

					// Make sure the ngRepeat has rendered at least one element
					if (ngRepeatContainerChildren.length > 1 && actualList.length && !scrollbarFixed) {
						heightExpansionElement.css({
							marginTop: Math.floor(
								// subtract 1 to exclude the height expansion element itself
								ngRepeatContainerRect.height / (ngRepeatContainerChildren.length - 1) * actualList.length
							)
						});
						scrollbarFixed = true;
					}

					var lastChildRect = ngRepeatContainer[0].lastElementChild.getBoundingClientRect();
					if (!lastChildRect.height) { return; }

					var newGap = Math.ceil((scrollContainerRect.bottom + lastChildRect.height - lastChildRect.bottom) / lastChildRect.height);

					if (newGap <= 0) { return; }
					limit += Math.max(newGap, gap);

					scope[finiteListName] = actualList.slice(0, limit);
					if (!scope.$$phase) {
						scope.$digest();
					}
				}

				scrollContainer.on('scroll', onscroll);
			};
		}
	};
}]);