// worker code

'use strict';

angular.module('hybrid.search', [])
.factory('SearchWorker', function ($q) {
	function SearchWorker() {
		this.worker = new Worker('./scripts/search-worker.js');
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