'use strict';

angular.module('hybrid.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $http, SearchWorker) {
	// Form data for the login modal
	$scope.loginData = {};
	$scope.articlesHash = {};

	// get all articles initially
	$http.get('data/articles.json').then(function (res) {
		$scope.articles = res.data.data;
		$scope.allArticles = $scope.articles.slice(0);

		for (var i = 0; i < $scope.articles.length; i++) {
			$scope.articlesHash[$scope.articles[i].id] = $scope.articles[i];
			$scope.searchWorker.add($scope.articles[i]);
		}
	});

	$scope.searchWorker = new SearchWorker();

	$scope.searchWorker.index(function () {
		this.field('title', { boost: 200 });
		this.field('keywords', { boost: 100 });
		this.field('description', { boost: 10 });
		this.field('content');

		this.ref('id');
	});
})

.controller('ArticlesCtrl', function () {
})

.controller('ArticleCtrl', function($scope, $stateParams, $sce) {
	$scope.$watchCollection('articles', function () {
		$scope.article = $scope.articlesHash[$stateParams.id];
	});

	$scope.trust = function (content) {
		return $sce.trustAsHtml(content);
	};
})

.controller('SearchCtrl', function ($scope, $timeout) {
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
	$scope.$watch('searchTerms', debounce(function (searchTerms) {
		if (!searchTerms || !searchTerms.length) {
			$scope.articles.length = 0;
			$scope.articles.push.apply($scope.articles, $scope.allArticles);
			return;
		}
		var promise = $scope.searchWorker.search(searchTerms);
		$scope.searching = true;
		promise.then(function (results) {
			if ($scope.searchTerms !== searchTerms) {
				return;
			}
			$scope.articles.length = 0;
			$scope.articles.push.apply($scope.articles, results.map(function (result) {
				return $scope.articlesHash[result.ref];
			}));
			$scope.searching = false;
		});
	}, 400));
})
;
