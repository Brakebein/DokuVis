var express = require('express');
var router = express.Router();

var auth = require('./auth');
//var user = require('./user');
var project = require('./project');
var models = require('./models');
var category = require('./category');
var source = require('./source');
var comment = require('./comment');
var graph = require('./graph');
var person = require('./person');
var archive = require('./archive');

// routes that can be accessed by any one
router.post('/login', auth.login);
router.post('/register', auth.register);


// routes that can be only accessed by authenticated users
router.get('/auth/checkJWT', auth.checkJWT);

router.post('/auth/cypher', project.cypher);

// routes that can be only accessed by authenticated & authorized users

// project management
router.get('/auth/projects', project.getAll);
router.get('/auth/project/:id', project.getOne);
router.post('/auth/project', project.create);
// router.put('/auth/project/:id', project.update);
router.delete('/auth/project/:id', project.delete);

// models
router.get('/auth/project/:id/:subprj/models', models.getTree);
router.post('/auth/project/:id/:subprj/models', models.insert);
router.post('/auth/project/:id/:subprj/assignCategory', models.assignCategory);
router.get('/auth/project/:id/:subprj/model/:modelId/connect', models.getConnections);

// categories
router.get('/auth/project/:id/categories', category.getAll);
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

// graph
router.get('/auth/project/:id/graph/:nodeId', graph.getPaths);
router.get('/auth/project/:id/graph/:nodeId/:label', graph.getTitle);
router.get('/auth/project/:id/graph/:nodeId/:label', graph.getAbstractNodes);
router.get('/auth/project/:id/graph/:nodeId/e22', graph.getE22Name);

// persons
router.get('/auth/project/:id/persons', person.getAll);

// archives
router.get('/auth/project/:id/archives', archive.getAll);

module.exports = router;