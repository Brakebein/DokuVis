var fs = require('fs-extra-promise');
var Promise = require('bluebird');
var config = require('../config');
var utils = require('../utils');
var mysql = require('promise-mysql');
var neo4j = require('../neo4j-request');

var connection;
mysql.createConnection({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database
}).then(function(conn) {
	connection = conn;
});

var projects = {
	
	getAll: function(req, res) {
		var email = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];
		var sql = '\
			SELECT p.pid, p.proj_tstamp AS proj, p.name, p.description, role FROM projects p \
			INNER JOIN user_project_role ON p.pid = project_id \
			INNER JOIN roles ON roles.id = role_id \
			INNER JOIN users ON users.id = user_id \
			AND email = ?';
		
		connection.query(sql, [email]).then(function(rows, fields) {
			res.json(rows);
		}).catch(function(err) {
			if(err) utils.error.mysql(res, err, '#projects.getAll');
		});
	},
	
	getOne: function(req, res) {
		var email = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];
		var sql = '\
			SELECT p.pid, p.proj_tstamp AS proj, p.name, p.description, role FROM projects p \
			INNER JOIN user_project_role ON p.pid = project_id \
			INNER JOIN roles ON roles.id = role_id \
			INNER JOIN users ON users.id = user_id \
			AND email = ? \
			AND proj_tstamp = ?';
		
		connection.query(sql, [email, req.params.id]).then(function(rows, fields) {
			if(rows.length > 0)
				res.json(rows[0]);
			else
				res.send('NO ENTRY');
		}).catch(function(err) {
			if(err) utils.error.mysql(res, err, '#projects.getOne');
		});
	},
	
	create: function(req, res) {
		
		var prj = req.body.proj;
		var pProj = config.path.data + '/' + prj;
		
		// Ordner anlegen
		fs.mkdirsSync(pProj);
		fs.mkdirsSync(pProj + '/models/maps');
		fs.mkdirsSync(pProj + '/pictures/_thumbs');
		fs.mkdirsSync(pProj + '/texts/_thumbs');
		fs.mkdirsSync(pProj + '/screenshots/_thumbs');
		fs.mkdirsSync(pProj + '/plans/_thumbs');
		fs.mkdirsSync(pProj + '/plans/models/maps');
		
		// swish.config kopieren und editieren
		fs.copyAsync(config.path.data + '/default_swish.config', pProj + '/swish.config').then(function() {
			var addLines = "\nIgnoreWords File: " + pProj + "/blacklist.txt";
			addLines += "\nBuzzwords File: " + pProj + "/whitelist.txt";
			return fs.appendFileAsync(pProj + '/swish.config', addLines.replace(/\//g,"\\"));
		}).then(function() {
			
			// blacklist und whitelist erstellen
			return fs.openAsync(pProj + '/blacklist.txt', 'w');
		}).then(function(fd) {
			fs.closeSync(fd);
			return fs.openAsync(pProj + '/whitelist.txt', 'w');
		}).then(function(fd) {
			fs.closeSync(fd);
			console.log(prj+': folders created');
			return Promise.resolve();
		}).catch(function(err) {
			if(err) utils.error.server(res, err, '#file system create');
			return Promise.reject();
			
		}).then(function() {
			// init project in neo4j database
			return neo4j.cypher('CREATE CONSTRAINT ON (p:'+prj+') ASSERT p.content IS UNIQUE');
		}).then(function(response) {
			if(response.exception) {
				utils.error.neo4j(res, response, '#projects.create constraint');
				return Promise.reject();
			}
			console.log(prj+': constraint created');
			
			var query =	// project
				'CREATE (proj:E7:'+prj+' {content: {master}}), \
				(root:E22:'+prj+' {content:"e22_root_master"}), \
				(tproj:E55:'+prj+' {content:"project"}), \
				(tsubproj:E55:'+prj+' {content:"subproject"}), \
				(tpdesc:E55:'+prj+' {content:"projDesc"}), \
				(tpinfo:E55:'+prj+' {content:"projInfo"}), \
				(proj)-[:P15]->(root), \
				(proj)-[:P2]->(tproj), '
				// source
			  + '(tsource:E55:'+prj+' {content:"sourceType"}), \
				(tplan:E55:'+prj+' {content:"plan"}), \
				(tpic:E55:'+prj+' {content:"picture"}), \
				(ttext:E55:'+prj+' {content:"text"}), \
				(tsource)<-[:P127]-(tplan), \
				(tsource)<-[:P127]-(tpic), \
				(tsource)<-[:P127]-(ttext), \
				(tprime:E55:'+prj+' {content:"primarySource"}), \
				(tsins:E55:'+prj+' {content:"sourceInsertion"}), \
				(tsrepros:E55:'+prj+' {content:"sourceRepros"}), \
				(tscomment:E55:'+prj+' {content:"sourceComment"}), '
				// screenshot
			  + '(tscreen:E55:'+prj+' {content:"screenshot"}),\
				(tscreencomment:E55:'+prj+' {content:"screenshotComment"}), \
				(tudrawing:E55:'+prj+' {content:"userDrawing"}), '
				// model
			  + '(tmodel:E55:'+prj+' {content:"model"}), \
				(tmodelplan:E55:'+prj+' {content:"model/plan"}), '
				// category
			  + '(tcateg:E55:'+prj+' {content:"category"}), '
				// task
			  + '(ttask:E55:'+prj+' {content:"task"}), \
				(ttdesc:E55:'+prj+' {content:"taskDesc"}), \
				(ttprior:E55:'+prj+' {content:"taskPriority"}), \
				(ttphigh:E55:'+prj+' {content:"priority_high"}), \
				(ttpmedium:E55:'+prj+' {content:"priority_medium"}), \
				(ttplow:E55:'+prj+'{content:"priority_low"}), \
				(ttprior)<-[:P127]-(ttphigh), \
				(ttprior)<-[:P127]-(ttpmedium), \
				(ttprior)<-[:P127]-(ttplow), \
				(ttstatus:E55:'+prj+' {content:"taskStatus"}), \
				(ttsdone:E55:'+prj+' {content:"status_done"}), \
				(ttstodo:E55:'+prj+' {content:"status_todo"}), \
				(ttstatus)<-[:P127]-(ttsdone), \
				(ttstatus)<-[:P127]-(ttstodo), '
				// comments
			  +	'(ctype:E55:'+prj+' {content: "commentType"}), \
				(:E55:'+prj+' {content: "commentGeneral"})-[:P127]->(ctype), \
				(:E55:'+prj+' {content: "commentSource"})-[:P127]->(ctype), \
				(:E55:'+prj+' {content: "commentAnswer"})-[:P127]->(ctype), \
				(:E55:'+prj+' {content: "commentModel"})-[:P127]->(ctype), \
				(:E55:'+prj+' {content: "commentTask"})-[:P127]->(ctype), '
				// personal
			  + '(tpproj:E55:'+prj+' {content:"projectPerson"}), \
				(tphist:E55:'+prj+' {content:"historicPerson"}), '
				// user
			  + '(user:E21:'+prj+' {content:"e21_"+{userEmail}}), \
				(username:E82:'+prj+' {content:"e82_"+{userEmail}, value: {userName}}), \
				(user)-[:P2]->(tpproj), \
				(user)-[:P131]->(username)'
				// return
			  + 'RETURN proj';
			
			var params = {
				master: prj,
				userEmail: req.body.email,
				userName: req.body.username
			};
		
			return neo4j.cypher(query, params);
		}).then(function(response) {
			if(response.exception) {
				utils.error.neo4j(res, response, '#projects.create nodes');
				return Promise.reject();
			}
			console.log(prj+': nodes created');
			return Promise.resolve();
		}).catch(function(err) {
			if(err) utils.error.neo4j(res, err, '#projects.create');
			return Promise.reject();
			
		}).then(function() {
			// insert into mysql database
			return connection.beginTransaction();
		}).then(function() {
			return connection.query('SELECT id INTO @roleid FROM roles WHERE role = "superadmin"');
		}).then(function(result) {
			return connection.query('SELECT id INTO @userid FROM users WHERE email = ?', [req.body.email]);
		}).then(function(result) {
			return connection.query('INSERT INTO projects(proj_tstamp, name, description) VALUES(?,?,?)', [prj, req.body.name, req.body.description]);
		}).then(function(result) {
			return connection.query('INSERT INTO user_project_role(user_id, project_id, role_id) VALUES(@userid, ?, @roleid)', [result.insertId]);
		}).then(function(result) {
			return connection.commit();
		}).then(function() {
			console.log(prj+': mysql insert');
			res.send('SUCCESS');
		}).catch(function(err) {
			if(err) {
				connection.rollback();
				utils.error.mysql(res, err, '#projects.create');
			}
		});
		
	},
	
	delete: function(req, res) {
		
		var prj = req.params.id;
		
		// delete from mysql database
		connection.beginTransaction().then(function() {
			return connection.query('DELETE FROM projects WHERE proj_tstamp = ?', [prj]);
		}).then(function(result) {
			return connection.commit();
		}).then(function() {
			console.log(prj+': mysql delete');
			return Promise.resolve();
		}).catch(function(err) {
			if(err) {
				connection.rollback();
				utils.error.mysql(res, err, '#projects.delete');
			}
			
		}).then(function() {
			// delete nodes in neo4j database
			return neo4j.cypher('MATCH (n:'+prj+') DETACH DELETE n');
		}).then(function(response) {
			if(response.exception) {
				utils.error.neo4j(res, response, '#projects.delete nodes');
				return Promise.reject();
			}
			console.log(prj+': nodes deleted');
			return neo4j.cypher('DROP CONSTRAINT ON (p:'+prj+') ASSERT p.content IS UNIQUE');
		}).then(function(response) {
			if(response.exception) {
				utils.error.neo4j(res, response, '#projects.delete constraint');
				return Promise.reject();
			}
			console.log(prj+': constraint dropped');
			return Promise.resolve();
		}).catch(function(err) {
			if(err) utils.error.neo4j(res, err, '#projects.delete');
			return Promise.reject();
			
		}).then(function() {
			// Ordner löschen
			return fs.removeAsync(config.path.data + '/' + prj);
		}).then(function() {
			console.log(prj+': folders deleted');
			res.send('SUCCESS');
		}).catch(function(err) {
			if(err) utils.error.server(res, err, '#file system delete');
		});
		
	},
	
	cypher: function(req, res) {
		neo4j.cypher(req.body.query, req.body.params)
			.then(function(response) {
				res.json(response);
			}).catch(function(err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	}
	
};

module.exports = projects;