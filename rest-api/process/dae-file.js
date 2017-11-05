const config = require('../config');
const utils = require('../utils');
const fs = require('fs-extra-promise');
const XmlStream = require('xml-stream');
const xmljs = require('xml-js');
const xmlbuilder = require('xmlbuilder');
const Promise = require('bluebird');
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

// catch uncaught exception and exit properly
process.on('uncaughtException', function (err) {
	console.error('Uncaught Exception', err);
	process.exit(1);
});


// get arguments
var file = process.argv[2];
var tid = process.argv[3];
var path = process.argv[4];

if (!(file && tid && path)) {
	process.send({ error: 'arguments missing' });
	process.exit();
}

var ctmlloader = new CTMLoader();

// maps/arrays to collect elements
var effects = {},
	materials = {},
	images = {},
	newparams = {},
	nodes = [],
	geometryFiles = {},
	upAxis = '',
	unit = {};


/*	0. clean geometries from <lines>
    1. triangulation and optimization with Assimp
	2. extract geometries
	3. parse DAE file
	4. convert to CTM
	5. prepare nodes
	6. return nodes
*/

var cleanFile = path + 'clean_' + tid + '.dae';
var assimpFile = path + 'assimp_' + tid + '.dae';

cleanGeometries();

// 0. clean geometries from unwanted objects like <lines>
function cleanGeometries() {
	var linereader = new LineByLineReader( file );
	var wstream = fs.createWriteStream( cleanFile );

	var lineState = false;

	linereader.on('error', function (err) {
		process.send({ error: 'LineReader', data: err });
		process.exit();
	});

	linereader.on('end', function () {
		console.debug('lr clean finished');
		wstream.end();
		convertAssimp();
	});

	linereader.on('line', function (line) {
		if (!lineState) {
			if (/<lines/.test(line))
				lineState = true;
			else
				wstream.write(line + "\n");
		}
		else {
			if (/<\/lines>/.test(line))
				lineState = false;
		}
	});
}



// 1. convert with Assimp
function convertAssimp() {
	exec(config.exec.Assimp, ['export', cleanFile, assimpFile, '-fi', '-tri', '-rrm', '-jiv'])
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
			process.send({error: 'Assimp/fs', data: err});
		});
}

// 2. extract geometries
function extractGeometries() {
	var geoState = {
		NONE: 0,
		GEOMETRY: 1,
		MESH: 2,
		POLYLIST: 3,
		LINES: 4
	};
	var currentState = geoState.NONE;
	var currentId = null;

	var wstream;
	var linereader = new LineByLineReader( assimpFile );

	var tmpPolylist = null;

	linereader.on('error', function (err) {
		process.send({ error: 'LineReader', data: err });
		process.exit();
	});

	linereader.on('end', function () {
		console.debug('lr extract finished');
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
			// <lines>
			if (/<lines/.test(line)) {
				currentState = geoState.LINES;
			}
			// <polylist>
			else if (/<polylist/.test(line)) {
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
		else if (currentState === geoState.LINES) {
			// skip lines
			if (/<\/lines>/.test(line))
				currentState = geoState.MESH;
		}
		else if (currentState === geoState.POLYLIST) {
			// </polylist>
			if (/<\/polylist>/.test(line)) {
				tmpPolylist += line;

				var jsPoly = xmljs.xml2js(tmpPolylist);

				// transform <polylist> into <triangles>
				var elPoly = jsPoly.elements[0];
				elPoly.name = 'triangles';

				var inputCount = 0;

				for (var i = 0; i < elPoly.elements.length; i++) {
					if (elPoly.elements[i].name === 'input') {
						elPoly.elements[i].attributes.offset = inputCount;
						inputCount++;
					}
					else if (elPoly.elements[i].name === 'vcount') {
						elPoly.elements.splice(i, 1);
						i--;
					}
					else if (elPoly.elements[i].name === 'p') {
						var pArray = elPoly.elements[i].elements[0].text.trim().split(/\s+/);
						pArray = fillTrianglesArray(pArray, inputCount);
						elPoly.elements[i].elements[0].text = pArray.join(' ');
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

// assimp<>ctm workaround, <triangles> index array
// duplicate index values to match the number of index values * number of <input> elements
function fillTrianglesArray(pArray, count) {
	var result = [];

	pArray.forEach(function (value) {
		for (var i = 0; i < count; i++)
			result.push(value);
	});

	return result;
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
		images[image.$.id] = decodeURIComponent(image.init_from.split(/[\/\\]/).pop());
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

				// delete dae tmp file
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
			prepareNodes(nodes, null);

			// remove assimp dae file
			fs.unlinkAsync(assimpFile).catch(function (err) {
				console.error('Unlink failed:', assimpFile, err);
			});
			// remove clean dae file
			fs.unlinkAsync(cleanFile).catch(function (err) {
				console.error('Unlink failed:', cleanFile, err);
			});
		})
		.then(function () {
			// everything went well
			// 6. return nodes and other data
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
}

// extract data from dae xml object and prepare nodes
function prepareNodes(nodes, parentid) {

	for (var i=0; i<nodes.length; i++) {

		var n = nodes[i];
		n.id = n.$.id;
		n.name = n.$.name;
		n.layer = n.$.layer || undefined;
		n.unit = +unit['meter'];
		n.up = upAxis;
		n.parentid = parentid;

		if (n.matrix instanceof Object)
			var m = n.matrix.$text.split(/\s+/);
		else
			m = n.matrix.split(/\s+/);
		var matrix = new THREE.Matrix4().set(
			+m[0], +m[1], +m[2], +m[3],
			+m[4], +m[5], +m[6], +m[7],
			+m[8], +m[9], +m[10], +m[11],
			+m[12], +m[13], +m[14], +m[15]);
		n.matrix = matrix.toArray();

		// if pivot offset is represented in extra node -> merge nodes
		if (n.node && n.node[0] && (!n.node[0].$ || !n.node[0].$.id)) {
			var pivot = n.node[0];
			m = pivot.matrix.split(/\s+/);
			var pivotMatrix = new THREE.Matrix4().set(
				+m[0], +m[1], +m[2], +m[3],
				+m[4], +m[5], +m[6], +m[7],
				+m[8], +m[9], +m[10], +m[11],
				+m[12], +m[13], +m[14], +m[15]);
			n.matrix = pivotMatrix.multiply(matrix).toArray();

			delete pivot.matrix;
			delete n.node;

			for (var key in pivot) {
				if (pivot.hasOwnProperty(key))
					n[key] = pivot[key];
			}
		}

		// geometry
		if (n['instance_geometry']) {
			for (var j = 0; j < n['instance_geometry'].length; j++) {
				n.type = 'object';

				var ig = extractInstanceGeometry(n['instance_geometry'][j]);

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
			delete n['instance_geometry'];
		}

		else if (n['instance_light']) {
			n.type = 'light';
			continue;
		}
		else if (n['instance_camera']) {
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
