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

// routes that can be accessed by any one
router.post('/login', auth.login);
router.post('/register', auth.register);


// routes that can be only accessed by authenticated users
router.get('/auth/checkJWT', auth.checkJWT);

router.post('/auth/cypher', project.cypher);
router.post('/auth/graph', graph.getPaths);

// routes that can be only accessed by authenticated & authorized users

// project management
router.get('/auth/projects', project.getAll);
router.get('/auth/project/:id', project.getOne);
router.post('/auth/project', project.create);
// router.put('/auth/project/:id', project.update);
router.delete('/auth/project/:id', project.delete);

// models
router.get('/auth/project/:id/:subprj/models', models.getTree);
router.post('/auth/project/:id/:subprj/assignCategory', models.assignCategory);

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

// comments
router.post('/auth/project/:id/comment', comment.create);

module.exports = router;