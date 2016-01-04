var jwt = require('jwt-simple');
var bcrypt = require('bcryptjs');
var config = require('../config');
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database
});

var validateSql = '\
	SELECT email, name, password, role FROM users \
	INNER JOIN user_role ON users.id = user_role.user_id \
	INNER JOIN roles ON roles.id = user_role.role_id \
	AND email = ?';

var auth = {
	
	login: function(req, res) {
		
		var email = req.body.email || '';
		var password = req.body.password || '';
		
		if(email == '' || password == '') {
			res.status(401);
			res.json({
				"status": 401,
				"message": 'Invalid credentials #6'
			});
			return;
		}
		
		// Fire a query to your DB and check if the credentials are valid
		auth.validate(email, password, function(dbUserObj) {
		
			if(!dbUserObj) {
				res.status(401);
				res.json({
					"status": 401,
					"message": 'Invalid credentials #7'
				});
				return;
			}
			
			if(dbUserObj) {
				// If authentication is success, we will generate a token
				// and dispatch it to the client
				res.json(genToken(dbUserObj));
			}
		});
	},
	
	register: function(req, res) {
		
		var email = req.body.email || '';
		var username = req.body.username || '';
		var password = req.body.password || '';
		
		console.log('email: ' + email);
		
		if(email == '' || username == '' || password == '') {
			res.status(401);
			res.json({
				"status": 401,
				"message": 'Invalid credentials #1'
			});
			return;
		}
		
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(password, salt);
		
		var sql = mysql.format('INSERT INTO users(email, name, password) VALUES(?,?,?)', [email, username, hash]);
		connection.query(sql, function(err, results) {
			if(err) throw err;
			console.log(results.insertId);
			
			// Fire a query to your DB and check if the credentials are valid
			auth.validate(email, password, function(dbUserObj) {
				console.log(dbUserObj);
				
				if(!dbUserObj) {
					res.status(401);
					res.json({
						"status": 401,
						"message": 'Invalid credentials #2'
					});
					return;
				}
				
				if(dbUserObj) {
					// If authentication is success, we will generate a token
					// and dispatch it to the client
					res.json(genToken(dbUserObj));
				}
			});
		});
	},
	
	validate: function(email, password, next) {
		var sql = mysql.format(validateSql, [email]);
		connection.query(sql , function(err, rows, fields) {
			if(rows.length === 0) next(null);
			else {
				if(bcrypt.compareSync(password, rows[0].password))
					next(rows[0]);
				else
					next(null);
			}
		});
	},
	
	validateUser: function(email) {
		var sql = mysql.format(validateSql, [email]);
		return connection.query(sql , function(err, rows, fields) {
			if(rows.length === 0) return null;
			else return rows[0];
		});
	}
	
};

function genToken(user) {
	var expires = expiresIn(7);
	var token = jwt.encode({
		exp: expires
	}, config.secret());
	
	return {
		token: token,
		expires: expires,
		user: user
	}
}

function expiresIn(numDays) {
	var dateObj = new Date();
	return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports = auth;