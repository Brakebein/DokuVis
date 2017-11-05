const config = require('../config');
const utils = require('../utils');
const fs = require('fs-extra-promise');
const exec = require('child-process-promise').execFile;

const log4js = require('log4js');
log4js.configure({
	appenders: [{
		type: 'stdout'
	}, {
		type: 'file', filename: 'logs/pointcloud-process.log'
	}]
});
const logger = log4js.getLogger('POINTCLOUD PROCESS');
log4js.replaceConsole(logger);

var file = process.argv[2];

if (!file) {
	process.send({ error: 'arguments missing' });
	process.exit();
}

var subsampleSpacing = 0.02;

exec(config.exec.CloudCompare, [
	'-C_EXPORT_FMT', 'LAS',
	'-O', filename,
	'-SS', 'SPATIAL', subsampleSpacing
]);

exec(config.exec.PotreeConv, [filename, '-o', folder]);
