var express = require('express');
var router = express.Router();

var auth = require('./auth');
//var user = require('./user');
var projects = require('./projects');

// routes that can be accessed by any one
router.post('/login', auth.login);
router.post('/register', auth.register);

// routes that can be only accessed by authenticated users

// routes that can be only accessed by authenticated & authorized users

router.get('/auth/projects', projects.getAll);
router.get('/auth/projects/:id', projects.getOne);
// router.post('/auth/projects', projects.create);
// router.put('/auth/projects/:id', projects.update);
// router.delete('/auth/projects/:id', projects.delete);

module.exports = router;