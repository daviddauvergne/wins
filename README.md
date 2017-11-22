V1.0.0

# wins (wins is not service)

## install

	npm install

## Arguments '{JSON data}'

```json
{
	"watchdir": "/path/to/watch [repuired]",
	"savedir": "/path/to/save [optional]",
	"log": {
		"type": "file [repuired]",
		"dir": "/path/log/save [repuired]"
	},
	"data" : "Mixed [optional]"
}
```
## getArguments()

Get start process Arguments

## addPile(data)

@data : mixed

## init(definition)

return logger

```javascript
var logger = wins.init({
	winsID: 'XXXXX', // wins identify
	fncPromise : function(data) {// return a promise
		return new Promise(function (resolve, reject) {
			// ...
			resolve([data]);// file(s)
		});
	},
	removeFiles: false,// if true need server [Redis](https://redis.io/)
	watcher : {// [chokidar module](https://github.com/paulmillr/chokidar)
		options : {}, // chokidar option
		events : {
			add: function(path, stats){
				// create data to add pile
				wins.addPile(path);
			}
			// events: add, addDir, change, unlink, unlinkDir, ready, raw, error
		}
	}
});
```
