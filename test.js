/*

## example

### start with pm2 (ecosystem.config.js)

```javascript
module.exports = {
	apps : [{
		name:   "win_test",
		script: "./test.js",
		args:   toArgs({
			winsID:     	"TEST",
			watchdir:     DIRS.watch_dir,
			log: {
				type:       "file",
				dir:        DIRS.logs
			},
			data: {
				usePolling: false // NFS
			}
		})
	}]
};
```
*/
const wins = require('./wins');

var argv = wins.getArguments();

var logger = wins.init({
	fncPromise : function(data) {// return a promise
		return new Promise(function (resolve, reject) {
			setTimeout(function () {
				logger.debug('process',{link:data});
				resolve([data]);
			}, 500);
		});
	},
	removeFiles: true,
	watcher : {// [chokidar module](https://github.com/paulmillr/chokidar)
		options : { // chokidar option
			usePolling: argv.data.usePolling // NFS
		},
		events : {
			add: function(path, stats){
				wins.addPile(path);
			}
			// events: add, addDir, change, unlink, unlinkDir, ready, raw, error
		}
	}
});
