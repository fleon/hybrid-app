'use strict';

angular.module('hybrid', ['ionic', 'hybrid.controllers', 'hybrid.search', 'hybrid.utils', 'hybrid.directives'])

.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if (window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if (window.StatusBar) {
			// org.apache.cordova.statusbar required
			StatusBar.styleDefault();
		}
	});
})

.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider

	.state('app', {
		url: '/app',
		abstract: true,
		templateUrl: 'templates/menu.html',
		controller: 'AppCtrl'
	})

	.state('app.articles', {
		url: '/articles',
		views: {
			'menuContent': {
				templateUrl: 'templates/articles.html',
				controller: 'ArticlesCtrl'
			}
		}
	})

	.state('app.article', {
		url: '/article/:id',
		views: {
			'menuContent': {
				templateUrl: 'templates/article.html',
				controller: 'ArticleCtrl'
			}
		}
	});
	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/app/articles');
});
