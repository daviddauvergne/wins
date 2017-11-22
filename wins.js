/*
# wins (wins is not service)

## install

	npm install

*/
const path = require('path');
const fs = require('fs');

/*
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
*/

var argv = process.argv.slice(2);

var command = [];
for (var i = 0; i < 2; i++) {
	command.push(path.basename(process.argv[i]));
}
command.push("'{JSON data}'");
command = command.join(' ');
var errorCommand = function(err){
	console.log('Usage: ' + command + '\n');
	console.log(err.message);
	process.exit(1);
};

var pathExist = function(p){
	if(fs.existsSync(p))
		return true;
	errorCommand({message:'Path doesn\'t exist: '+p});
};

var requiredArgs = ['watchdir','log'];
var logTypeValid = ['file'];
var eventWatcherValid = ['add', 'addDir', 'change', 'unlink', 'unlinkDir', 'ready', 'raw', 'error'];

try {
	argv = JSON.parse(argv);
	requiredArgs.forEach(function(arg){
		if(!argv[arg])
			errorCommand({message:'Missing required argument: '+arg});
	});

	// watchdir exist
	if(pathExist(argv.watchdir)){
		if(argv.savedir){// savedir exist
			pathExist(argv.savedir);
		}
		// log.tyoe exist
		if(!argv.log.type)
			errorCommand({message:'Log type undefined'});

		if(logTypeValid.indexOf(argv.log.type) === -1)
			errorCommand({message:'Log type invalid'});

		if(argv.log.type=='file'){
			if(!argv.log.dir)
				errorCommand({message:'Log dir undefined'});

			pathExist(argv.log.dir);
		}
	}
} catch (err) {
	errorCommand(err);
}
// init wins =============================================================
const chokidar = require('chokidar');

var logger;
var winsID = null;
var fncPromise = null;
var removeFiles = null;
var redis = null;
var clientRedis = null;
var timestamp = 0;

var pile = [];

// logger -----------------------------

var logFormatter = function(args){
	var date = new Date().toLocaleDateString(undefined,{
		day : 'numeric',
		month : 'numeric',
		year : 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
	var msg = '';
	if(Object.keys(args.meta).length !== 0){
		msg += '\n' + JSON.stringify(args.meta,null,'\t');
	}
	return date+' - '+args.level.toUpperCase()+' - '+winsID+' - '+args.message + msg;
};

var loggerInit = function(){
	const winston = require('winston');
	if(argv.log.type=='file'){
		logger = new winston.Logger({
				transports: [
						new (winston.transports.File)({
							name: 'error-file-' + winsID,
							level: 'debug',
							filename: argv.log.dir + '/' + winsID + '.log',
							handleExceptions: true,
							json: false,
							maxsize: 1000000,
							maxFiles: 5,
							colorize: false,
							formatter : logFormatter
						})
				],
				exitOnError: false
		});
	}
};

var next = function(){
	pile.shift();
	if(pile.length>=1)
		looper();
};

var looper = function(){
	fncPromise(pile[0]).then(function(data){
		if(removeFiles){
			data.forEach(function(file){
				fs.unlink(file,function(errUnlink){
					if(errUnlink)
						logger.error(errUnlink);
				});
			});
		} else {
			clientRedis.set(winsID,data);
		}
		next();
	}).catch(function (err) {
		logger.error(err);
		next();
	});
};

var addPile = function(val){
	pile.push(val);
	if(pile.length===1)
		looper();
};

var bootstrap = function(definition){
	fs.readdir(argv.watchdir, function(errfile, files) {
		if (errfile){
			logger.error(errfile);
		} else {
			files.forEach(function(file){
				var fullPathFile = argv.watchdir + '/' + file;
				fs.stat(fullPathFile, function(errStat, stat) {
					if(errStat){
						logger.error(errStat);
					} else {
						if(!removeFiles){
							if(stat.mtime.getTime()>timestamp){
								definition.watcher.events.add(fullPathFile,stat);
							}
						} else {
							definition.watcher.events.add(fullPathFile,stat);
						}
					}
				});
			});
		}
	});
};

module.exports = {

/*
## getArguments()

Get start process Arguments

*/
	getArguments: function(){
		return argv;
	},

/*
## addPile(data)

@data : mixed

*/
	addPile: addPile,

/*

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
*/
	init: function(definition){
		if(!definition.winsID)
			errorCommand({message:'winsID undefined'});

		winsID = definition.winsID;

		loggerInit();

		if(!definition.fncPromise)
			errorCommand({message:'fncPromise undefined'});

		if(typeof definition.fncPromise != 'function')
			errorCommand({message:'fncPromise is not a function'});

		fncPromise = definition.fncPromise;

		if(definition.removeFiles === undefined)
			errorCommand({message:'removeFiles undefined'});

		if(typeof definition.removeFiles != 'boolean')
			errorCommand({message:'removeFiles is not a boolean'});

		removeFiles = definition.removeFiles;

		if(typeof definition.watcher.options != 'object')
			errorCommand({message:'watcher.options is not an object'});

		definition.watcher.options.ignoreInitial = true;
		var watcher = chokidar.watch(argv.watchdir,definition.watcher.options);

		var eventKeys = Object.keys(definition.watcher.events);

		if(eventKeys.length===0)
			errorCommand({message:'watcher.events as no event'});

		eventKeys.forEach(function(ev){
			if(eventWatcherValid.indexOf(ev) === -1){
				errorCommand({message:'watcher.events.' + ev + ' is not a valid event'});
			} else {
				if(typeof definition.watcher.events[ev] != 'function')
					errorCommand({message:'watcher.events.' + ev + ' is not a function'});

				watcher.on(ev,definition.watcher.events[ev]);
			}
		});

		if(!removeFiles){
			redis = require("redis");
			clientRedis = redis.createClient();
			clientRedis.on("error", function (error) {
				errorCommand(error);
			});
			clientRedis.on('connect', function() {
				clientRedis.get(winsID, function(err, reply) {
					if(reply)
						timestamp = reply;
					bootstrap(definition);
				});
			});
		} else {
			bootstrap(definition);
		}
		return logger;
	}
};
