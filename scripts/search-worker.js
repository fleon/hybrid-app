importScripts('../bower_components/lunr.js/lunr.js');

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

this.addEventListener('message', function (e) {
	var cmd = e.data[0];
	var what = e.data[1];
	switch (cmd) {
		case 'createIndex':
			index = lunr(fnFromString(what));
			break;
		case 'loadIndex':
			var t = Date.now();
			index = lunr.Index.load(JSON.parse(what));
			break;
		case 'add':
			index.add(what);
			break;
		case 'search':
			var t = Date.now();
			this.postMessage(['searchComplete', what, index.search(what)]);
			throw new Error('search complete (' + what + '): ' + (Date.now() - t));
			break;
	}
});