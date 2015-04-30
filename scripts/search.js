// worker code

'use strict';

function worker() {
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

	self.addEventListener('message', function (e) {
		var cmd = e.data[0];
		var what = e.data[1];
		switch (cmd) {
			case 'index':
				index = lunr(fnFromString(what));
				break;
			case 'add':
				index.add(what);
				break;
			case 'search':
				self.postMessage(['searchComplete', what, index.search(what)]);
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

	SearchWorker.prototype.index = function (fn) {
		this.worker.postMessage(['index', fn.toString()]);
	};

	SearchWorker.prototype.add = function (what) {
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