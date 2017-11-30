// doc with docGenerator
const path = require('path');
const pjson = require('./package.json');
module.exports = {
	version: pjson.version,
	files: [
		path.join(__dirname, 'wins.js'),
		path.join(__dirname, 'test.js')
	],
	save: path.join(__dirname, 'README.md')
};
