// worker code

'use strict';

function worker() {
	// hack
	//importScripts(location.origin + '/hybrid-app/bower_components/lunr.js/lunr.js');
	importScripts(location.origin + '/bower_components/lunr.js/lunr.js');

	function fnFromString(str) {
		try {
			var fn;
			eval('fn=' + str);
			return fn;
		} catch (e) {
			return function () {};
		}
	}

	var index;

	if (self.searchIndex) {
		index = lunr.Index.load(self.searchIndex);
	}

	self.addEventListener('message', function (e) {
		var cmd = e.data[0];
		var what = e.data[1];
		switch (cmd) {
			case 'createIndex':
				index = lunr(fnFromString(what));
				break;
			case 'loadIndex':
				var t = performance.now();
				index = lunr.Index.load(JSON.parse(what));
				console.log('index load', performance.now() - t);
				break;
			case 'add':
				index.add(what);
				break;
			case 'search':
				var t = performance.now();
				self.postMessage(['searchComplete', what, index.search(what)]);
				console.log('search complete', performance.now() - t);
				break;
		}
	});
}

angular.module('hybrid.search', [])
.factory('SearchWorker', function ($q) {
	function SearchWorker() {
		var blob = new Blob(['(' + worker.toString() + ')();']);
		var blobURL = window.URL.createObjectURL(blob);
		this.worker = new Worker(blobURL);
	}

	SearchWorker.prototype.createIndex = function (fn) {
		this.worker.postMessage(['createIndex', fn.toString()]);
	};

	SearchWorker.prototype.loadIndex = function (what) {
		this.worker.postMessage(['loadIndex', what]);
	};

	SearchWorker.prototype.addToIndex = function (what) {
		this.worker.postMessage(['add', what]);
	};

	SearchWorker.prototype.search = function (what) {
		var d = $q.defer(),
			that = this;
		this.worker.addEventListener('message', function onMessage(e) {
			if (e.data[0] === 'searchComplete' && e.data[1] === what) {
				d.resolve(e.data[2]);
			}
			that.worker.removeEventListener('message', onMessage);
		});
		this.worker.postMessage(['search', what]);
		return d.promise;
	};

	return SearchWorker;
});