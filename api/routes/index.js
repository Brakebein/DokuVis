const config = require('../config');
const express = require('express');
const router = express.Router();

// multer
const multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, config.path.tmp);
	},
	filename: function (req, file, cb) {
		if(req.body.newFileName)
			cb(null, req.body.newFileName);
		else
			cb(null, 'file-' + Date.now());
	}
});
var mUpload = multer({ storage: storage });

// index
var auth = require('./auth');
//var user = require('./user');
var project = require('./project');
var subproject = require('./subproject');
var models = require('./models');
var category = require('./category');
var source = require('./source');
var comment = require('./comment');
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

// project management
router.get('/auth/project', project.query);
router.get('/auth/project/:id', project.get);
router.post('/auth/project', project.create);
router.put('/auth/project/:id', project.update);
router.delete('/auth/project/:id', project.delete);

// subproject
router.post('/auth/project/:id/subproject', subproject.create);
router.get('/auth/project/:id/subprojects', subproject.getAll);
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
router.post('/auth/project/:id/:subprj/models', models.insert);
router.post('/auth/project/:id/:subprj/assignCategory', models.assignCategory);
router.get('/auth/project/:id/:subprj/model/:modelId/connect', models.getConnections);
router.post('/auth/project/:id/:suprj/model/upload', mUpload.any(), upload.model);

// categories
router.get('/auth/project/:id/category', category.query);
router.post('/auth/project/:id/category', category.create);
router.put('/auth/project/:id/category/:cid', category.update);
router.delete('/auth/project/:id/category/:cid', category.delete);
router.post('/auth/project/:id/category/:cid/attribute', category.createAttr);
router.put('/auth/project/:id/category/:cid/attribute/:aid', category.updateAttr);
router.delete('/auth/project/:id/category/:cid/attribute/:aid', category.deleteAttr);

// sources
router.get('/auth/project/:id/:subprj/sources', source.getAll);
router.get('/auth/project/:id/:subprj/source/:sourceId', source.get);
router.post('/auth/project/:id/:subprj/source/:sourceId/connect', source.createConnections);
router.get('/auth/project/:id/:subprj/source/:sourceId/connect', source.getConnections);

// comments
router.post('/auth/project/:id/comment', comment.create);
router.get('/auth/project/:id/comment/:targetId', comment.get);
router.get('/auth/project/:id/comments', comment.getAll);

// graph
router.get('/auth/project/:id/graph/:nodeId', graph.getPaths);
router.get('/auth/project/:id/graph/:nodeId/:label', graph.getTitle);
router.get('/auth/project/:id/graph/:nodeId/:label', graph.getAbstractNodes);
router.get('/auth/project/:id/graph/:nodeId/e22', graph.getE22Name);

// persons
router.get('/auth/project/:id/persons', person.getAll);

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
