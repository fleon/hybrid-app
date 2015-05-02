// hack
importScripts(location.origin + '/hybrid-app/bower_components/lunr.js/lunr.js');
//importScripts(location.origin + '/bower_components/lunr.js/lunr.js');

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
			var t = performance.now();
			index = lunr.Index.load(JSON.parse(what));
			console.log('index load', performance.now() - t);
			break;
		case 'add':
			index.add(what);
			break;
		case 'search':
			var t = performance.now();
			this.postMessage(['searchComplete', what, index.search(what)]);
			console.log('search complete', performance.now() - t);
			break;
	}
});