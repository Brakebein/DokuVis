const config = require('../config');
const utils = require('../utils');
const neo4j = require('../neo4j-request');
const mysql = require('../mysql-request');
const Promise = require('bluebird');

module.exports = {
	
	query: function (req, res) {
		utils.checkPermission(req, res, 'admin').then(function () {
			var sql = '\
				SELECT p.name, email, users.name, role FROM projects p \
				INNER JOIN user_project_role ON p.pid = project_id \
				INNER JOIN roles ON roles.id = role_id \
				INNER JOIN users ON users.id = user_id \
				AND p.proj_tstamp = ?';
	
			return mysql.query(sql, [req.params.id]);
		}).then(function (rows) {
			res.json(rows);
		}).catch(function(err) {
			if(err) utils.error.mysql(res, err, '#staff.query');
		});
	},
	
	create: function (req, res) {
		if (!req.body.user) {
			utils.abort.missingData(res, 'body.user');
			return;
		}
		if (!req.body.role) {
			utils.abort.missingData(res, 'body.role');
			return;
		}

		var prj = req.params.id,
			user = req.body.user,
			role = req.body.role;
		var connection;
		
		utils.checkPermission(req, res, 'admin').then(function () {
			var sql = 'SELECT proj_tstamp, email, users.name AS name, role FROM projects, users, roles \
			WHERE proj_tstamp = ? AND email = ? AND role = ?';

			return mysql.query(sql, [prj, user, role]);
		}).catch(function (err) {
			utils.error.mysql(res, err, '#staff.create');
			return Promise.reject();
		}).then(function (rows) {
			if (rows.length !== 1) return Promise.reject('User {' + user + '} doesn\'t exist!');

			var q = 'MATCH (tpproj:E55:' + prj + ' {content:"projectPerson"}) \
				CREATE (user:E21:' + prj + ' {content:"e21_"+{userEmail}}), \
				(username:E82:' + prj + ' {content:"e82_"+{userEmail}, value: {userName}}), \
				(user)-[:P2]->(tpproj), \
				(user)-[:P131]->(username)';
			var params = {
				userEmail: user,
				userName: rows[0].name
			};

			return neo4j.transaction(q, params);
		}).catch(function (err) {
			if(err) utils.error.neo4j(res, err, '#staff.create');
			return Promise.reject();
		}).then(function () {
			return mysql.getConnection();
		}).then(function (conn) {
			connection = conn;
			return connection.beginTransaction();
		}).then(function () {
			return connection.query('SELECT id INTO @userid FROM users WHERE email = ?', [user]);
		}).then(function () {
			return connection.query('SELECT pid INTO @projectid FROM projects WHERE proj_tstamp = ?', [prj]);
		}).then(function () {
			return connection.query('SELECT id INTO @roleid FROM roles WHERE role = ?', [role]);
		}).then(function () {
			return connection.query('INSERT INTO user_project_role(user_id, project_id, role_id) VALUES(@userid, @projectid, @roleid)');
		}).then(function () {
			return connection.commit();
		}).then(function () {
			return mysql.releaseConnection(connection);
		}).then(function () {
			var message = 'User {' + user + '} joined project {' + prj + '} as {' + role + '}';
			console.log(message);
			res.json({ message: message, status: 'SUCCESS' });
		}).catch(function (err) {
			if(err) {
				connection.rollback();
				utils.error.mysql(res, err, err);
			}
		});
	},

	queryRoles: function (req, res) {
		mysql.query('SELECT role FROM roles').then(function (rows) {
			var roles = [];
			for(var i=0; i<rows.length; i++) {
				roles.push(rows[i].role);
			}
			res.json(roles);
		}).catch(function (err) {
			if(err)
				utils.error.mysql(res, err, '#staff.queryRoles');
		});
	}
	
};
