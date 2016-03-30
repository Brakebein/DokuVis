var jwt = require('jwt-simple');
var Promise = require('bluebird');
var bcrypt = require('bcryptjs');
var config = require('../config');
var mysql = require('promise-mysql');

var connection;
mysql.createConnection({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database
}).then(function(conn) {
	connection = conn;
});

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
		auth.validate(email, password)
			.then(function(dbUserObj) {
				// If authentication is success, we will generate a token
				// and dispatch it to the client
				if(dbUserObj)
					res.json(genToken(dbUserObj));
			}, function(reason) {
				res.status(401);
				res.json({
					"status": 401,
					"message": 'Invalid credentials #7'
				});
				return;
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
		
		connection.query('INSERT INTO users(email, name, password) VALUES(?,?,?)', [email, username, hash])
			.then(function(result) {
				console.log('id: ' + result.insertId);
				
				// Fire a query to your DB and check if the credentials are valid
				return auth.validate(email, password);
			})
			.then(function(dbUserObj) {
				// If authentication is success, we will generate a token
				// and dispatch it to the client
				if(dbUserObj)
					res.json(genToken(dbUserObj));
			}, function(reason) {
				res.status(401);
				res.json({
					"status": 401,
					"message": 'Invalid credentials #7'
				});
				return;
			})
			.catch(function(err) {
				if(err) throw err;
			});
	},
	
	validate: function(email, password) {
		return connection.query('SELECT email, name, password FROM users WHERE email = ?', [email])
			.then(function(rows) {
				if(rows.length === 0) return Promise.reject();
				else {
					if(bcrypt.compareSync(password, rows[0].password))
						return rows[0];
					else
						return Promise.reject();
				}
			});
	},
	
	validateUser: function(email) {
		return connection.query('SELECT email, name, password FROM users WHERE email = ?', [email])
			.then(function(rows) {
				if(rows.length === 0) return Promise.reject();
				else return rows[0];
			});
	},
	
	checkJWT: function(req, res) {
		res.status(200);
		res.send();
		return;
	}
	
};

function genToken(user) {
	var expires = expiresIn(1);
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