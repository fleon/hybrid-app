'use strict';

angular.module('hybrid.directives', [])

.directive('bindDynamicHtml', function($compile) {
	return {
		restrict: 'A',
		replace: true,
		link: function (scope, element, attrs) {
			scope.$watch(attrs.bindDynamicHtml, function (html) {
				element.html(html);
				$compile(element.contents())(scope);
			});
		}
	}
});
