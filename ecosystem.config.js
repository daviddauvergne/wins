const path = require('path');

var toArgs = function (args) {
	return "'" + JSON.stringify(args) + "'";
};

const DIRS = {
	watch_dir: path.join(__dirname, 'test', 'watch_dir'),
	logs: path.join(__dirname, 'test', 'logs')
};

module.exports = {
	apps: [{
		name: 'wins_test',
		script: './test.js',
		args: toArgs({
			winsID: 'TEST',
			watchdir: DIRS.watch_dir,
			log: {
				type: 'file',
				dir: DIRS.logs
			},
			data: {
				usePolling: false // NFS
			}
		})
	}]
};
