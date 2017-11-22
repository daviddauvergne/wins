/*
node test.js '{"watchdir":"/path/to/testDir","log":{"type":"file","dir":"/path/to/logDir"}}'
*/
const wins = require('./wins');

var argv = wins.getArguments();

var logger = wins.init({
	winsID: 'XXXXX', // wins identify
	fncPromise : function(data) {// return a promise
		return new Promise(function (resolve, reject) {
			setTimeout(function () {
				logger.debug('process',{link:data});
				resolve([data]);
			}, 500);
		});
	},
	removeFiles: false,
	watcher : {// [chokidar module](https://github.com/paulmillr/chokidar)
		path: argv.watchdir,//  dirs to be watched recursively, or glob patterns
		options : {}, // chokidar option
		events : {
			add: function(path, stats){
				wins.addPile(path);
			}
			// events: add, addDir, change, unlink, unlinkDir, ready, raw, error
		}
	}
});
