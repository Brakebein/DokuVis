const config = require('../config');
const fs = require('fs-extra-promise');
const XmlStream = require('xml-stream');
const xmlbuilder = require('xmlbuilder');
const Promise = require('bluebird');
//require('any-promise/register/bluebird');
const eos = require('end-of-stream');
//const streamToPromise = require('stream-to-promise');
const npath = require('path');
const exec = require('child_process').exec;

process.on('message', function (m) {
	console.debug('CHILD got message:', m);
});

// process.on('unhandledRejection', function (reason, promise) {
// 	console.error('UR:', reason);
// });

var file = process.argv[2];
var tid = process.argv[3];
var path = process.argv[4];

if(!(file && tid && path)) {
	process.send('arguments missing');
	process.exit();
}

var stream = fs.createReadStream( file );
stream.on('close', function () {
	console.debug('readstream closed');
});
var xml = new XmlStream( stream );

var effects = {},
	materials = {},
	nodes = [],
	geoIds = [],
	upAxis = '',
	unit = {};

// collect data
xml.on('updateElement: up_axis', function (axis) {
	upAxis = axis.$text;
});

xml.on('updateElement: unit', function (u) {
	unit = u.$;
});

xml.on('updateElement: effect', function (effect) {
	effects[effect.$.id] = effect.profile_COMMON.technique;
});

xml.on('updateElement: material', function (material) {
	materials[material.$.id] = material;
});

xml.collect('node');
xml.on('endElement: visual_scene', function (scene) {
	for(var i=0; i<scene.node.length; i++) {
		if(scene.node[i].$.id)
			nodes.push(scene.node[i]);
	}
});

// convert geometries
xml.collect('source');
xml.collect('input');
xml.collect('param');
xml.on('endElement: geometry', function (geo) {

	var geoxml = buildXml(geo);

	var daefile = config.path.tmp + '/' + tid + '_' + geo.$.id + '.dae';

	var wstream = fs.createWriteStream(daefile);

	var pstream = new Promise(function (resolve, reject) {
		eos(wstream, function (err) {
			if(err) reject(err);
			else resolve();
		})
	});
	pstream.then(function () {
		geoIds.push({ id: geo.$.id });
	});
	pstream.catch(function (err) {
		console.error(err);
		geoIds.push({ id: geo.$.id, error: err });
	});

	var writer = xmlbuilder.streamWriter(wstream);
	geoxml.end(writer);
	wstream.end();
	
});

// return data and close
xml.on('end', function () {

	var geometries = {};

	Promise.map(geoIds, function (geo) {
		
		if(geo.error) return Promise.reject(geo.error);
		
		var fname = tid + '_' + geo.id;
		var daefile = config.path.tmp + '/' + fname + '.dae';
		var ctmfile = config.path.tmp + '/' + fname + '.ctm';

		geometries[geo.id] = fname + '.ctm';

		return new Promise(
			function (resolve, reject) {
				var args = [daefile, ctmfile, '--method', 'MG2', '--level', '1', '--vprec', '0.001', '--nprec', '0.01', '--no-colors'];
				exec(config.exec.CTMconv + ' ' + args.join(' '), function (error, stdout, stderr) {
					if (error) reject(error);
					else resolve({stdout: stdout, stderr: stderr});
				});
			})
			.then(function (result) {
				//if (result.stdout) console.log('ctmconv.exe stdout', result.stdout);
				if (result.stderr) console.log('ctmconv.exe stderr', result.stderr);

				// delete dae file
				return fs.unlinkAsync(daefile);
			})
			.then(function () {
				// copy ctm file into project folder
				return fs.renameAsync(ctmfile, path + fname + '.ctm');
		});

	}).then(function () {
		// copy base dae file into project folder
		return fs.renameAsync(file, path + npath.basename(file));
	}).then(function () {
		// TODO: prepare nodes

		

	}).then(function () {
		process.send({ effects: effects, materials: materials, nodes: nodes, geo: geometries, axis: upAxis, unit: unit });
		process.exit();
	})
	.catch(function (err) {
		console.error(err);
		process.send('something went wrong');
		process.exit();
	});

});

// build xml from xml-stream object
function buildXml(geo) {
	var root = xmlbuilder.create('COLLADA', { version: '1.0', encoding: 'utf-8' });
	var lib = root.ele('library_geometries');

	buildNode('geometry', geo, lib);

	return root;
}

function buildNode(name, obj, parent) {
	var node = parent.ele(name);

	if(obj instanceof Object) {

		for (var key in obj) {
			if (key === '$') {
				for (var $id in obj.$) {
					node.att($id, obj.$[$id]);
				}
			}
			else if (key === '$text') {
				node.txt(obj.$text);
			}
			else {
				if (obj[key] instanceof Array) {
					for (var i = 0; i < obj[key].length; i++) {
						buildNode(key, obj[key][i], node);
					}
				}
				else {
					buildNode(key, obj[key], node);
				}
			}
		}

	}
	
	else {
		node.txt(obj);
	}

	node.up();
}
