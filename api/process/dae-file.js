const config = require('../config');
const utils = require('../utils');
const fs = require('fs-extra-promise');
const XmlStream = require('xml-stream');
const xmlbuilder = require('xmlbuilder');
const Promise = require('bluebird');
const npath = require('path');
const exec = require('child_process').exec;
const LineByLineReader = require('line-by-line');
const JSZip = require('jszip');
const THREE = require('../modules/three');
const CTMLoader = require('../modules/CTMLoader');

const log4js = require('log4js');
const logger = log4js.getLogger('DAE PROCESS');
log4js.replaceConsole(logger);

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

var ctmlloader = new CTMLoader();

var effects = {},
	materials = {},
	images = {},
	nodes = [],
	geoIds = [],
	geometryFiles = {},
	upAxis = '',
	unit = {};

/*	1. extract geometries
	2. parse DAE file
	3. convert to CTM
	4. return nodes
*/

extractGeometries();

function extractGeometries() {
	//TODO: convert to <triangles> if necessary
	var geoState = {
		NONE: 0,
		GEOMETRY: 1,
		MESH: 2
	};
	var currentState = geoState.NONE;
	var currentId = null;

	var wstream;
	var linereader = new LineByLineReader( file );

	linereader.on('error', function (err) {
		console.error('lr error', err);
	});

	linereader.on('end', function () {
		console.debug('lr finished');
		parseDAE();
	});

	linereader.on('line', function (line) {
		if(currentState === geoState.NONE) {
			// <geometry id="geom-foo">
			if(/<geometry/.test(line)) {
				var capt = /<geometry.*id="([^"]+)"/.exec(line);
				currentId = utils.replace(capt[1]);
				currentState = geoState.GEOMETRY;
			}
		}
		else if(currentState === geoState.GEOMETRY) {
			// <mesh>
			if(/<mesh>/.test(line)) {
				wstream = fs.createWriteStream( config.path.tmp + '/' + tid + '_' + currentId + '.dae' );
				wstream.write('<?xml version="1.0" encoding="utf-8"?>' + "\n");
				wstream.write('<COLLADA>' + "\n" + '<library_geometries>' + "\n" + '<geometry id="' + currentId + '">' + "\n");
				wstream.write(line + "\n");

				geoIds.push({ id: currentId });
				currentState = geoState.MESH;
			}
			// </geometry>
			else if(/<\/geometry>/.test(line)) {
				currentId = null;
				currentState = geoState.NONE;
			}
		}
		else if(currentState === geoState.MESH) {
			// </mesh>
			if(/<\/mesh>/.test(line)) {
				wstream.write(line + "\n");
				wstream.end('</geometry>' + "\n" + '</library_geometries>' + "\n" + '</COLLADA>');

				currentState = geoState.GEOMETRY;
			}
			else {
				wstream.write(line + "\n");
			}
		}

	});
}

function parseDAE() {
	var stream = fs.createReadStream(file);
	stream.on('close', function () {
		console.debug('readstream closed');
	});

	var xml = new XmlStream(stream);

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
	
	xml.on('updateElement: image', function (image) {
		images[image.$.id] = image.init_from.split(/[\/\\]/).pop();
	});

	xml.collect('node');
	xml.on('endElement: visual_scene', function (scene) {
		for (var i = 0; i < scene.node.length; i++) {
			if (scene.node[i].$.id)
				nodes.push(scene.node[i]);
		}
	});

	// return data and close
	xml.on('end', function () {
		finalize();
	});
}

// return data and close
function finalize() {

	Promise.mapSeries(geoIds, function (geo) {
		
		if(geo.error) return Promise.reject(geo.error);
		
		var fname = tid + '_' + geo.id;
		var daefile = config.path.tmp + '/' + fname + '.dae';
		var ctmfile = config.path.tmp + '/' + fname + '.ctm';

		geometryFiles[geo.id] = { ctm: fname + '.ctm' };

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
				//if (result.stderr) console.log('ctmconv.exe stderr', result.stderr);
				if (result.stderr) return Promise.reject(result.stderr);

				// delete dae file
				return fs.unlinkAsync(daefile);
			})
			.then(function () {
				// copy ctm file into project folder
				return fs.renameAsync(ctmfile, path + fname + '.ctm');
			})
			.then(function () {
				return generateEdges(path, fname);
			})
			.then(function (edgesFile) {
				geometryFiles[geo.id].edges = edgesFile;
		});

	}).then(function () {
		// copy base dae file into project folder
		return fs.renameAsync(file, path + npath.basename(file));
	}).then(function () {
		prepareNodes(nodes, null)

	}).then(function () {
		process.send({ nodes: nodes, axis: upAxis, unit: unit, images: images });
		process.exit();
	})
	.catch(function (err) {
		console.error(err);
		console.debug('deleting files...');

		// delete all files
		Promise.map(geoIds, function (geo) {
			var fname = tid + '_' + geo.id;
			var prjCtmfile = path + fname + '.ctm';
			var prjZipfile = path + fname + '.ctm.zip';
			var tmpDaefile = config.path.tmp + '/' + fname + '.dae';
			var tmpCtmfile = config.path.tmp + '/' + fname + '.ctm';
		
			return fs.statAsync(prjCtmfile).then(function () {
				return fs.unlinkAsync(prjCtmfile);
			}).catch(function (err) {
				if(err && err.code === 'ENOENT') return Promise.resolve();
				else return Promise.reject(err);
			}).then(function () {
				return fs.statAsync(prjZipfile);
			}).then(function () {
				return fs.unlinkAsync(prjZipfile);
			}).catch(function (err) {
				if(err && err.code === 'ENOENT') return Promise.resolve();
				else return Promise.reject(err);
			}).then(function () {
				return fs.statAsync(tmpCtmfile);
			}).then(function () {
				return fs.unlinkAsync(tmpCtmfile);
			}).catch(function (err) {
				if(err && err.code === 'ENOENT') return Promise.resolve();
				else return Promise.reject(err);
			}).then(function () {
				return fs.statAsync(tmpDaefile);
			}).then(function () {
				return fs.unlinkAsync(tmpDaefile);
			}).catch(function (err) {
				if(err && err.code === 'ENOENT') return Promise.resolve();
				else return Promise.reject(err);
			});
		}).then(function () {
			var prjDaefile = path + npath.basename(file);
			return fs.statAsync(prjDaefile).then(function () {
				return fs.unlinkAsync(prjDaefile);
			}).catch(function (err) {
				if(err && err.code === 'ENOENT') return Promise.resolve();
				else return Promise.reject(err);
			}).then(function () {
				return fs.statAsync(file);
			}).then(function () {
				return fs.unlinkAsync(file);
			}).catch(function (err) {
				if(err && err.code === 'ENOENT') return Promise.resolve();
				else return Promise.reject(err);
			});
		}).catch(function (err) {
			console.error('deleting files failed', err);
		}).then(function () {
			process.send({ error: 'dae-file-process failed', effects: effects, materials: materials, nodes: nodes, geo: geometryFiles, geoIds: geoIds, axis: upAxis, unit: unit });
			process.exit();
		});

		// process.send({ error: 'dae-file-process failed', effects: effects, materials: materials, nodes: nodes, geo: geometryFiles, geoIds: geoIds, axis: upAxis, unit: unit });
		// process.exit();
		
	});

}

function prepareNodes(nodes, parentid) {

	for(var i=0; i<nodes.length; i++) {

		var n = nodes[i];
		n.id = n.$.id;
		n.name = n.$.name;
		n.layer = n.$.layer || undefined;
		n.unit = +unit.meter;
		n.upAxis = upAxis;
		n.parentid = parentid;

		//console.warn(n);
		if(n.matrix instanceof Object)
			var m = n.matrix.$text.split(/\s+/);
		else
			m = n.matrix.split(/\s+/);
		n.matrix = [ +m[0], +m[1], +m[2], +m[3], +m[4], +m[5], +m[6], +m[7], +m[8], +m[9], +m[10], +m[11], +m[12], +m[13], +m[14], +m[15] ];

		// if pivot offset is represented in extra node
		if(n.node && n.node[0] && (!n.node[0].$ || !n.node[0].$.id)) {
			var pivot = n.node[0];
			m = pivot.matrix.split(/\s+/);
			var pivotMatrix = [ +m[0], +m[1], +m[2], +m[3], +m[4], +m[5], +m[6], +m[7], +m[8], +m[9], +m[10], +m[11], +m[12], +m[13], +m[14], +m[15] ];

			n.matrix = multiplyMatrices(pivotMatrix, n.matrix);
			delete pivot.matrix;
			delete n.node;

			for(var key in pivot) { n[key] = pivot[key]; }
		}

		// geometry
		if(n.instance_geometry) {
			n.geometryUrl = n.instance_geometry.$.url.substring(1);
			n.files = geometryFiles[utils.replace(n.geometryUrl)];
			n.type = 'object';
			
			// material
			if(n.instance_geometry.bind_material && n.instance_geometry.bind_material.technique_common.instance_material) {
				n.material = {
					id: n.instance_geometry.bind_material.technique_common.instance_material.$.target.substring(1)
				};
				n.material.name = materials[n.material.id].$.name;
				
				var effect = effects[materials[n.material.id].instance_effect.$.url.substring(1)];
				var shading = effect.phong || effect.blinn || effect.lambert;
				
				if(shading.diffuse.color) {
					var color = shading.diffuse.color instanceof Object ? shading.diffuse.color.$text.split(/\s+/) : shading.diffuse.color.split(/\s+/);
					n.material.color = [ +color[0], +color[1], +color[2], +color[3] ];
				}
				else if(shading.diffuse.texture) {
					n.material.map = images[shading.diffuse.texture.$.texture];
				}
				if(shading.transparent && shading.transparent.texture) {
					n.material.alphaMap = images[shading.transparent.texture.$.texture];
				}
			}

			delete n.instance_geometry;
		}
		else if(n.instance_light) {
			n.type = 'light';
			continue;
		}
		else if(n.instance_camera) {
			n.type = 'camera';
			continue;
		}
		else {
			n.type = 'group';
		}

		delete n.$;
		delete n.extra;
		if(n.node) {
			n.children = n.node;
			delete n.node;
		}
		else 
			n.children = [];

		prepareNodes(n.children, n.id);
	}

}

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

function multiplyMatrices(ae, be) {
	var te = new Array(16).fill(0);

	var a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
	var a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
	var a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
	var a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

	var b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
	var b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
	var b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
	var b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

	te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
	te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
	te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
	te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

	te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
	te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
	te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
	te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

	te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
	te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
	te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
	te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

	te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
	te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
	te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
	te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

	return te;
}

function generateEdges(path, fname) {
	return new Promise(function (resolve, reject) {

		ctmlloader.load(path + fname + '.ctm', function (geo) {

			if(!geo) {
				console.warn('No ctm loaded');
				reject('NOGEO');
			}

			var edgesGeo = new THREE.EdgesGeometry(geo, 24.0);
			delete edgesGeo.parameters;
			
			var json = edgesGeo.toJSON();
			var array = json.data.attributes.position.array;
			for(var i=0, l=array.length; i<l; i++) {
				array[i] = parseFloat(array[i].toFixed(3));
			}

			var zip = new JSZip();
			zip.file(fname + '.ctm.json', JSON.stringify(json));
			zip.generateNodeStream({ compression: 'DEFLATE', compressionOptions: { level: 9 } })
				.pipe(fs.createWriteStream(path + fname + '.ctm.zip'))
				.on('finish', function () {
					edgesGeo.dispose();
					resolve(fname + '.ctm.zip');
				})
				.on('error', function (err) {
					edgesGeo.dispose();
					reject(err);
				});

		}, { useWorker: false });

	});
}
