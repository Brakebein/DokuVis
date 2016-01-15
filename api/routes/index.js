var express = require('express');
var router = express.Router();

var auth = require('./auth');
//var user = require('./user');
var projects = require('./projects');
var models = require('./models');
var category = require('./category');

// routes that can be accessed by any one
router.post('/login', auth.login);
router.post('/register', auth.register);


// routes that can be only accessed by authenticated users

router.post('/auth/cypher', projects.cypher);

// routes that can be only accessed by authenticated & authorized users

// project management
router.get('/auth/projects', projects.getAll);
router.get('/auth/project/:id', projects.getOne);
router.post('/auth/project', projects.create);
// router.put('/auth/project/:id', projects.update);
router.delete('/auth/project/:id', projects.delete);

// models
router.get('/auth/project/:id/:subprj/models', models.getTree);

// categories
router.get('/auth/project/:id/categories', category.getAll);
router.post('/auth/project/:id/category', category.create);
router.put('/auth/project/:id/category/:cid', category.update);
router.delete('/auth/project/:id/category/:cid', category.delete);
router.post('/auth/project/:id/category/:cid/attribute', category.createAttr);
router.put('/auth/project/:id/category/:cid/attribute/:aid', category.updateAttr);
router.delete('/auth/project/:id/category/:cid/attribute/:aid', category.deleteAttr);

module.exports = router;