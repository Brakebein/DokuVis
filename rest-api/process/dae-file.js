const config = require('../config');
const utils = require('../utils');
const fs = require('fs-extra-promise');
const XmlStream = require('xml-stream');
const xmljs = require('xml-js');
const xmlbuilder = require('xmlbuilder');
const Promise = require('bluebird');
const npath = require('path');
const exec = require('child-process-promise').execFile;
const LineByLineReader = require('line-by-line');
const JSZip = require('jszip');
const THREE = require('../modules/three');
const CTMLoader = require('../modules/CTMLoader');

const log4js = require('log4js');
log4js.configure({
	appenders: [{
		type: 'stdout'
	}, {
		type: 'file', filename: 'logs/dae-process.log'
	}]
});
const logger = log4js.getLogger('DAE PROCESS');
log4js.replaceConsole(logger);

process.on('message', function (m) {
	console.debug('CHILD got message:', m);
});

// catch uncaught exception and exit properly
process.on('uncaughtException', function (err) {
	console.error('Uncaught Exception', err);
	process.exit(1);
});

// process.on('unhandledRejection', function (reason, promise) {
// 	console.error('UR:', reason);
// });

var file = process.argv[2];
var tid = process.argv[3];
var path = process.argv[4];

if(!(file && tid && path)) {
	process.send({ error: 'arguments missing' });
	process.exit();
}

var ctmlloader = new CTMLoader();

var effects = {},
	materials = {},
	images = {},
	newparams = {},
	nodes = [],
	geometryFiles = {},
	upAxis = '',
	unit = {};

/*	1. triangulation and optimization with Assimp
	2. extract geometries
	3. parse DAE file
	4. convert to CTM
	5. prepare nodes
	6. return nodes
*/

// 1. convert with Assimp
var assimpFile = path + 'assimp_' + tid + '.dae';
exec(config.exec.Assimp, ['export', file, assimpFile, '-tri', '-rrm', '-fi', '-jiv'])
	.then(function (result) {
		if (result.stderr)
			return Promise.reject(result.stderr);
		else
			return fs.existsAsync(assimpFile);
	})
	.then(function (exists) {
		if (exists)
			extractGeometries();
		else
			return Promise.reject('No assimp file generated');
	})
	.catch(function (err) {
		process.send({ error: 'Assimp/fs', data: err });
	});

// 2. extract geometries
function extractGeometries() {
	//TODO: convert to <triangles> if necessary
	var geoState = {
		NONE: 0,
		GEOMETRY: 1,
		MESH: 2,
		POLYLIST: 3
	};
	var currentState = geoState.NONE;
	var currentId = null;

	var wstream;
	var linereader = new LineByLineReader( assimpFile ); //TODO: assimpfile

	var tmpPolylist = null;

	linereader.on('error', function (err) {
		process.send({ error: 'LineReader', data: err });
		process.exit();
	});

	linereader.on('end', function () {
		console.debug('lr finished');
		parseDAE();
	});

	linereader.on('line', function (line) {
		if (currentState === geoState.NONE) {
			// <geometry id="geom-foo">
			if (/<geometry/.test(line)) {
				var capt = /<geometry.*id="([^"]+)"/.exec(line);
				currentId = utils.replace(capt[1]);
				currentState = geoState.GEOMETRY;
			}
		}
		else if (currentState === geoState.GEOMETRY) {
			// <mesh>
			if (/<mesh>/.test(line)) {
				var basename = tid + '_' + currentId;
				var daetmp = basename + '_tmp.dae';

				wstream = fs.createWriteStream( path + daetmp );
				wstream.write('<?xml version="1.0" encoding="utf-8"?>' + "\n");
				wstream.write('<COLLADA>' + "\n" + '<library_geometries>' + "\n" + '<geometry id="' + currentId + '">' + "\n");
				wstream.write(line + "\n");

				geometryFiles[currentId] = {
					id: currentId,
					basename: basename,
					dae: daetmp
				};
				currentState = geoState.MESH;
			}
			// </geometry>
			else if (/<\/geometry>/.test(line)) {
				currentId = null;
				currentState = geoState.NONE;
			}
		}
		else if (currentState === geoState.MESH) {
			// <polylist>
			if (/<polylist/.test(line)) {
				tmpPolylist = line;
				currentState = geoState.POLYLIST;
			}
			// </mesh>
			else if (/<\/mesh>/.test(line)) {
				wstream.write(line + "\n");
				wstream.end('</geometry>' + "\n" + '</library_geometries>' + "\n" + '</COLLADA>');

				currentState = geoState.GEOMETRY;
			}
			else {
				wstream.write(line + "\n");
			}
		}
		else if (currentState === geoState.POLYLIST) {
			// </polylist>
			if (/<\/polylist>/.test(line)) {
				tmpPolylist += line;

				var jsPoly = xmljs.xml2js(tmpPolylist);

				var elPoly = jsPoly.elements[0];
				elPoly.name = 'triangles';
				for (var i=0; i<elPoly.elements.length; i++) {
					if (elPoly.elements[i].name === 'vcount') {
						elPoly.elements.splice(i, 1);
						break;
					}
				}
				wstream.write(xmljs.js2xml(jsPoly, { spaces: 2 }) + "\n");

				tmpPolylist = null;
				currentState = geoState.MESH;
			}
			else {
				tmpPolylist += line;
			}
		}

	});
}

// 3. parse DAE file
function parseDAE() {
	var stream = fs.createReadStream(assimpFile);
	stream.on('close', function () {
		console.debug('readstream closed');
	});

	var xml = new XmlStream(stream);

	// collect data
	xml.on('updateElement: up_axis', function (axis) {
		switch (axis.$text) {
			case 'X_UP': upAxis = 'X'; break;
			case 'Z_UP': upAxis = 'Z'; break;
			default: upAxis = 'Y';
		}
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

	xml.on('updateElement: newparam', function (newparam) {
		newparams[newparam.$.sid] = newparam;
	});

	xml.collect('node');
	xml.collect('instance_geometry');
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
	// TODO: delete assimpFile
	const cpexec = require('child_process').exec;
	Promise.mapSeries(Object.keys(geometryFiles),
		function (geoId) {

			var geofile = geometryFiles[geoId];
			geofile.ctm = geofile.basename + '.ctm';

			// 4. convert to CTM and generate edges
			return new Promise(function (resolve, reject) {
				var args = [
					path + geofile.dae, path + geofile.ctm,
					'--method', 'MG2',
					'--level', '1',
					'--vprec', '0.001',
					'--nprec', '0.01',
					'--no-colors'
				];
				cpexec(config.exec.CTMconv + ' ' + args.join(' '), function (error, stdout, stderr) {
					if (error) reject(error);
					else resolve({ stdout: stdout, stderr: stderr });
				});
			})
			.then(function (result) {
				if (result.stderr)
					return Promise.reject(result.stderr);

				// delete dae file
				return fs.unlinkAsync(path + geofile.dae);
			})
			.then(function () {
				// generate edges file
				return generateEdges(path, geofile);
			})
			.then(function (edgesFile) {
				geofile.edges = edgesFile;
			});

		})
		.then(function () {
			// 5. prepare nodes
			prepareNodes(nodes, null)

		})
		.then(function () {
			// everything went well
			// 6. return nodes
			process.send({ nodes: nodes, axis: upAxis, unit: unit, images: images });
			process.exit();
		})
		.catch(function (err) {
			// something went wrong
			process.send({
				error: 'dae-file-process failed',
				data: err,
				effects: effects,
				materials: materials,
				nodes: nodes,
				geo: geometryFiles,
				axis: upAxis,
				unit: unit
			});
			process.exit();
		});
	// .catch(function (err) {
	// 	console.error(err);
	// 	console.debug('deleting files...');
	//
	// 	// delete all files
	// 	Promise.map(geoIds, function (geo) {
	// 		var fname = tid + '_' + geo.id;
	// 		var prjCtmfile = path + fname + '.ctm';
	// 		var prjZipfile = path + fname + '.ctm.zip';
	// 		var tmpDaefile = config.path.tmp + '/' + fname + '.dae';
	// 		var tmpCtmfile = config.path.tmp + '/' + fname + '.ctm';
	//
	// 		return fs.statAsync(prjCtmfile).then(function () {
	// 			return fs.unlinkAsync(prjCtmfile);
	// 		}).catch(function (err) {
	// 			if(err && err.code === 'ENOENT') return Promise.resolve();
	// 			else return Promise.reject(err);
	// 		}).then(function () {
	// 			return fs.statAsync(prjZipfile);
	// 		}).then(function () {
	// 			return fs.unlinkAsync(prjZipfile);
	// 		}).catch(function (err) {
	// 			if(err && err.code === 'ENOENT') return Promise.resolve();
	// 			else return Promise.reject(err);
	// 		}).then(function () {
	// 			return fs.statAsync(tmpCtmfile);
	// 		}).then(function () {
	// 			return fs.unlinkAsync(tmpCtmfile);
	// 		}).catch(function (err) {
	// 			if(err && err.code === 'ENOENT') return Promise.resolve();
	// 			else return Promise.reject(err);
	// 		}).then(function () {
	// 			return fs.statAsync(tmpDaefile);
	// 		}).then(function () {
	// 			return fs.unlinkAsync(tmpDaefile);
	// 		}).catch(function (err) {
	// 			if(err && err.code === 'ENOENT') return Promise.resolve();
	// 			else return Promise.reject(err);
	// 		});
	// 	}).then(function () {
	// 		var prjDaefile = path + npath.basename(file);
	// 		return fs.statAsync(prjDaefile).then(function () {
	// 			return fs.unlinkAsync(prjDaefile);
	// 		}).catch(function (err) {
	// 			if(err && err.code === 'ENOENT') return Promise.resolve();
	// 			else return Promise.reject(err);
	// 		}).then(function () {
	// 			return fs.statAsync(file);
	// 		}).then(function () {
	// 			return fs.unlinkAsync(file);
	// 		}).catch(function (err) {
	// 			if(err && err.code === 'ENOENT') return Promise.resolve();
	// 			else return Promise.reject(err);
	// 		});
	// 	}).catch(function (err) {
	// 		console.error('deleting files failed', err);
	// 	}).then(function () {
	// 		process.send({ error: 'dae-file-process failed', effects: effects, materials: materials, nodes: nodes, geo: geometryFiles, geoIds: geoIds, axis: upAxis, unit: unit });
	// 		process.exit();
	// 	});
	//
	// 	// process.send({ error: 'dae-file-process failed', effects: effects, materials: materials, nodes: nodes, geo: geometryFiles, geoIds: geoIds, axis: upAxis, unit: unit });
	// 	// process.exit();
		
	// });

}

// extract data from dae xml object and prepare nodes
function prepareNodes(nodes, parentid) {

	for (var i=0; i<nodes.length; i++) {

		var n = nodes[i];
		n.id = n.$.id;
		n.name = n.$.name;
		n.layer = n.$.layer || undefined;
		n.unit = +unit.meter;
		n.up = upAxis;
		n.parentid = parentid;

		//console.warn(n);
		if (n.matrix instanceof Object)
			var m = n.matrix.$text.split(/\s+/);
		else
			m = n.matrix.split(/\s+/);
		n.matrix = [ +m[0], +m[1], +m[2], +m[3], +m[4], +m[5], +m[6], +m[7], +m[8], +m[9], +m[10], +m[11], +m[12], +m[13], +m[14], +m[15] ];

		// if pivot offset is represented in extra node
		if (n.node && n.node[0] && (!n.node[0].$ || !n.node[0].$.id)) {
			var pivot = n.node[0];
			m = pivot.matrix.split(/\s+/);
			var pivotMatrix = [ +m[0], +m[1], +m[2], +m[3], +m[4], +m[5], +m[6], +m[7], +m[8], +m[9], +m[10], +m[11], +m[12], +m[13], +m[14], +m[15] ];

			n.matrix = multiplyMatrices(pivotMatrix, n.matrix);
			delete pivot.matrix;
			delete n.node;

			for(var key in pivot) { n[key] = pivot[key]; }
		}

		// geometry
		if (n.instance_geometry) {
			for (var j = 0; j < n.instance_geometry.length; j++) {
				n.type = 'object';

				var ig = extractInstanceGeometry(n.instance_geometry[j]);

				// geometryUrl
				if (!n.geometryUrl)
					n.geometryUrl = ig.geometryUrl;
				else if (Array.isArray(n.geometryUrl))
					n.geometryUrl.push(ig.geometryUrl);
				else {
					n.geometryUrl = [n.geometryUrl];
					n.geometryUrl.push(ig.geometryUrl);
				}

				// file
				if (!n.files)
					n.files = ig.files;
				else if (Array.isArray(n.files))
					n.files.push(ig.files);
				else {
					n.files = [n.files];
					n.files.push(ig.files);
				}

				// material
				if (!n.material)
					n.material = ig.material;
				else if (Array.isArray(n.material))
					n.material.push(ig.material);
				else {
					n.material = [n.material];
					n.material.push(ig.material);
				}
			}
			delete n.instance_geometry;
		}

		else if (n.instance_light) {
			n.type = 'light';
			continue;
		}
		else if (n.instance_camera) {
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

function extractInstanceGeometry(ig) {
	var data = {};
	data.geometryUrl = ig.$.url.substring(1);
	data.files = geometryFiles[utils.replace(data.geometryUrl)];

	// material
	if(ig.bind_material && ig.bind_material.technique_common.instance_material) {

		var material = {
			id: ig.bind_material.technique_common.instance_material.$.target.substring(1)
		};
		material.name = materials[material.id].$.name;

		var effect = effects[materials[material.id].instance_effect.$.url.substring(1)];
		var shading = effect.phong || effect.blinn || effect.lambert;

		if (shading.diffuse.color) {
			var color = shading.diffuse.color instanceof Object ? shading.diffuse.color.$text.split(/\s+/) : shading.diffuse.color.split(/\s+/);
			material.color = [ +color[0], +color[1], +color[2], +color[3] ];
		}
		else if (shading.diffuse.texture) {
			var texId = shading.diffuse.texture.$.texture;
			if (texId in images)
				material.map = images[texId];
			else {
				while (!(texId in images)) {
					if (!(texId in newparams)) break;
					var np = newparams[texId];
					if (np.sampler2D && np.sampler2D.source)
						texId = np.sampler2D.source;
					else if (np.surface && np.surface.init_from)
						texId = np.surface.init_from;
				}
				material.map = images[texId];
			}
		}
		if (shading.transparent && shading.transparent.texture) {
			texId = shading.transparent.texture.$.texture;
			if (texId in images)
				material.alphaMap = images[texId];
			else {
				while (!(texId in images)) {
					if (!(texId in newparams)) break;
					np = newparams[texId];
					if (np.sampler2D && np.sampler2D.source)
						texId = np.sampler2D.source;
					else if (np.surface && np.surface.init_from)
						texId = np.surface.init_from;
				}
				material.alphaMap = images[texId];
			}
		}
	}
	data.material = material;

	return data;
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

// load ctm, compute EdgesGeometry by angle, and save as zipped json
function generateEdges(path, geofile) {
	return new Promise(function (resolve, reject) {

		ctmlloader.load(path + geofile.ctm, function (geo) {

			if (!geo) {
				console.warn('No ctm loaded');
				reject('NO_GEO');
			}

			var edgesGeo = new THREE.EdgesGeometry(geo, 24.0);
			delete edgesGeo.parameters;
			
			var json = edgesGeo.toJSON();
			var array = json.data.attributes.position.array;
			// shorten numbers
			for (var i=0, l=array.length; i<l; i++) {
				array[i] = parseFloat(array[i].toFixed(3));
			}

			var zipfile = geofile.basename + '.json.zip';

			var zip = new JSZip();
			zip.file(geofile.basename + '.json', JSON.stringify(json));

			zip.generateNodeStream({ compression: 'DEFLATE', compressionOptions: { level: 9 } })
				.pipe(fs.createWriteStream(path + zipfile))
				.on('finish', function () {
					edgesGeo.dispose();
					resolve(zipfile);
				})
				.on('error', function (err) {
					edgesGeo.dispose();
					reject(err);
				});

		}, { useWorker: false });

	});
}
