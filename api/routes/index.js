const config = require('../config');
const utils = require('../utils');
const express = require('express');
const router = express.Router();

// multer
const multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, config.path.tmp);
	},
	filename: function (req, file, cb) {
		if(req.body.tid)
			cb(null, req.body.tid + '_' + utils.replace(file.originalname));
		else if(req.body.newFileName)
			cb(null, req.body.newFileName);
		else
			cb(null, file.fieldname + '-' + Date.now());
	}
});
var mUpload = multer({ storage: storage });

// index
var auth = require('./auth');
//var user = require('./user');
var project = require('./project');
var models = require('./models');
var graph = require('./graph');
var person = require('./person');
var upload = require('./upload');

// routes that can be accessed by any one
router.post('/login', auth.login);
router.post('/register', auth.register);


// routes that can be only accessed by authenticated users
router.get('/auth/checkJWT', auth.checkJWT);

router.post('/auth/cypher', project.cypher);

// routes that can be only accessed by authenticated & authorized users

// project
router.get('/auth/project', project.query);
router.get('/auth/project/:id', project.get);
router.post('/auth/project', project.create);
router.put('/auth/project/:id', project.update);
router.delete('/auth/project/:id', project.delete);

// subproject
var subproject = require('./subproject');
router.get('/auth/project/:id/subproject', subproject.query);
router.post('/auth/project/:id/subproject', subproject.create);
router.get('/auth/project/:id/subproject/:subId', subproject.get);
router.put('/auth/project/:id/subproject/:subId', subproject.update);

// project infos
var projinfo = require('./projinfo');
router.get('/auth/project/:id/:subprj/projinfo', projinfo.query);
router.post('/auth/project/:id/:subprj/projinfo', projinfo.create);
router.put('/auth/project/:id/:subprj/projinfo/:piId', projinfo.update);
router.delete('/auth/project/:id/:subprj/projinfo/:piId', projinfo.delete);
router.put('/auth/project/:id/:subprj/projinfo', projinfo.swap);

// models
router.get('/auth/project/:id/:subprj/models', models.getTree);
router.get('/auth/project/:id/model/:modelId', models.get);
router.put('/auth/project/:id/model/:modelId', models.update);
router.post('/auth/project/:id/:subprj/models', models.insert);
router.post('/auth/project/:id/:subprj/assignCategory', models.assignCategory);
router.get('/auth/project/:id/:subprj/model/:modelId/connect', models.getConnections);
router.post('/auth/project/:id/:subprj/model/upload', mUpload.any(), upload);

// categories
var category = require('./category');
router.get('/auth/project/:id/category', category.query);
router.post('/auth/project/:id/category', category.create);
router.put('/auth/project/:id/category/:cid', category.update);
router.delete('/auth/project/:id/category/:cid', category.delete);
router.post('/auth/project/:id/category/:cid/attribute', category.createAttr);
router.put('/auth/project/:id/category/:cid/attribute/:aid', category.updateAttr);
router.delete('/auth/project/:id/category/:cid/attribute/:aid', category.deleteAttr);

// sources
var source = require('./source');
router.get('/auth/project/:id/:subprj/source', source.query);
router.get('/auth/project/:id/:subprj/source/:sourceId', source.get);
router.post('/auth/project/:id/:subprj/source', mUpload.single('uploadFile'), source.create);
router.post('/auth/project/:id/:subprj/source/:sourceId/connect', source.link);
router.get('/auth/project/:id/:subprj/source/:sourceId/connect', source.getLinks);
router.put('/auth/project/:id/:subprj/source/:sourceId/:type/spatial', source.setSpatial);
router.get('/auth/project/:id/:subprj/source/:sourceId/:type/spatial', source.getSpatial);

// comments
var comment = require('./comment');
router.get('/auth/project/:id/:subprj/comment', comment.query);
router.post('/auth/project/:id/:subprj/comment', comment.create);
router.get('/auth/project/:id/:subprj/comment/target/:targetId', comment.queryTarget);

// graph
router.get('/auth/project/:id/graph/:nodeId', graph.getPaths);
router.get('/auth/project/:id/graph/:nodeId/:label', graph.getTitle);
router.get('/auth/project/:id/graph/:nodeId/:label', graph.getAbstractNodes);
router.get('/auth/project/:id/graph/:nodeId/e22', graph.getE22Name);

// persons
router.get('/auth/project/:id/persons', person.query);

// archives
var archive = require('./archive');
router.get('/auth/project/:id/archive', archive.query);
router.post('/auth/project/:id/archive', archive.create);

// staff
var staff = require('./staff');
router.get('/auth/project/:id/staff', staff.query);
router.post('/auth/project/:id/staff', staff.create);
router.get('/roles', staff.queryRoles);

var typeahead = require('./typeahead');
router.get('/auth/project/:id/typeahead/:label/:prop/:from', typeahead.query);

module.exports = router;
