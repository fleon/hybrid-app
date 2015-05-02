'use strict';

angular.module('hybrid.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $http, SearchWorker, $q) {
	// Form data for the login modal
	$scope.loginData = {};
	$scope.articlesHash = {};

	// get all articles and search index initially
	$q.all([
		$http.get('data/articles.json'),
		$http({
			url: 'data/search-index.json',
			method: 'GET',
			transformResponse: angular.identity
		})
	]).then(function (res) {
		$scope.articles = res[0].data.data;
		$scope.allArticles = $scope.articles.slice(0);

		for (var i = 0; i < $scope.articles.length; i++) {
			$scope.articlesHash[$scope.articles[i].id] = $scope.articles[i];
		}

		$scope.searchWorker.loadIndex(res[1].data);
	});

	$scope.searchWorker = new SearchWorker();
})

.controller('ArticlesCtrl', function ($scope) {
	$scope.settings = {
		itemsLimit: 50
	};

	$scope.increaseItemsLimit = function () {
		$scope.settings.itemsLimit += 50;
		$scope.$broadcast('scroll.infiniteScrollComplete');
	};
})

.controller('ArticleCtrl', function($scope, $stateParams, $sce) {
	$scope.$watchCollection('articles', function () {
		$scope.article = $scope.articlesHash[$stateParams.id];
	});

	$scope.trust = function (content) {
		return $sce.trustAsHtml(content);
	};
})

.controller('SearchCtrl', function ($scope, functionUtils) {
	$scope.$watch('searchTerms', functionUtils.debounce(function (searchTerms) {
		if (!$scope.articles) { return; }
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
	}, 500));
})
;
