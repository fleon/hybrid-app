// worker code

'use strict';

angular.module('hybrid.search', [])
.factory('SearchWorker', function ($q) {
	function SearchWorker() {
		this.worker = new Worker('./scripts/search-worker.js');

		this.worker.addEventListener('message', function onMessage(e) {
			if (e.data[0] === 'searchComplete') {
				this.searchDeferreds[e.data[1]].resolve(e.data[2]);
			}
		}.bind(this));

		this.searchDeferreds = {};
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
		what = what.toLowerCase();
		if (this.searchDeferreds[what]) {
			return this.searchDeferreds[what];
		}

		var d = $q.defer();

		this.searchDeferreds[what] = d;
		this.worker.postMessage(['search', what]);

		return d.promise;
	};

	return SearchWorker;
});