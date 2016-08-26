const config = require('../config');
const fs = require('fs-extra-promise');
const XmlStream = require('xml-stream');
const xmlbuilder = require('xmlbuilder');
const Promise = require('bluebird');
const streamToPromise = require('stream-to-promise');
const exec = require('child-process-promise').exec;

process.on('message', function (m) {
	console.log('CHILD got message:', m);
});

var file = process.argv[2];
var tid = process.argv[3];
var path = process.argv[4];

if(!(file && tid && path)) {
	process.send('arguments missing');
	process.exit();
}

var promises = [];

var stream = fs.createReadStream( file );
stream.on('close', function () {
	console.log('readstream closed');
});
var xml = new XmlStream(stream);

var effects = {},
	materials = {},
	 nodes = [],
	geometries = {},
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

	var fname = tid + '_' + geo.$.id;
	var daefile = config.path.tmp + '/' + fname + '.dae';
	var ctmfile = config.path.tmp + '/' + fname + '.ctm';

	var wstream = fs.createWriteStream(daefile);
	var pstream = streamToPromise(wstream);
	promises.push(pstream);
	
	pstream
		.then(function () {
			return exec(config.exec.CTMconv + ' ' + daefile + ' ' + ctmfile + ' --method MG2 --level 1 --vprec 0.001 --nprec 0.01 --no-colors');
		})
		.then(function (result) {
			//if (result.stdout) console.log('ctmconv.exe stdout', result.stdout);
			if (result.stderr) console.log('ctmconv.exe stderr', result.stderr);

			return fs.unlinkAsync(daefile);
		})
		.then(function () {
			return fs.renameAsync(ctmfile, path + fname + '.ctm');
		})
		.then(function () {

			geometries[geo.$.id] = fname + '.ctm';

			Promise.resolve();
		})
		.catch(function (err) {
			console.error('ERROR:', err);
			return Promise.reject();
		});
	
	var writer = xmlbuilder.streamWriter(wstream);
	geoxml.end(writer);
	wstream.end();
	
});

// return data and close
xml.on('end', function () {
	// TODO: prepare nodes
	Promise.all(promises)
		.then(function () {
			process.send({ effects: effects, materials: materials, nodes: nodes, geo: geometries, axis: upAxis, unit: unit });
			process.exit();
		})
		.catch(function (err) {
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
