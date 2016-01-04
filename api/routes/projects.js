var config = require('../config');
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database
});

var projects = {
	
	getAll: function(req, res) {
		connection.query('SELECT pid, proj_tstamp AS proj, name, description FROM projects', function(err, rows, fields) {
			res.json(rows);
		});
	},
	
	getOne: function(req, res) {
		var sql = mysql.format('SELECT * FROM projects WHERE proj_tstamp = ?', [req.params.id]);
		connection.query(sql, function(err, rows, fields) {
			res.json(rows[0]);
		});
	}
};

module.exports = projects;