const jwt = require('jwt-simple');
const Promise = require('bluebird');
const bcrypt = require('bcryptjs');
const config = require('../config');
const mysql = require('../mysql-request');

var auth = {
	
	login: function (req, res) {
		
		var email = req.body.email || '';
		var password = req.body.password || '';
		
		if(email === '' || password === '') {
			res.status(401);
			res.json({
				"status": 401,
				"message": 'Invalid credentials #6'
			});
			return;
		}
		
		// Fire a query to your DB and check if the credentials are valid
		auth.validate(email, password)
			.then(function (dbUserObj) {
				// If authentication is success, we will generate a token
				// and dispatch it to the client
				if (dbUserObj)
					res.json(genToken(dbUserObj));
			})
			.catch(function (reason) {
				if (reason) {
					res.status(500);
					res.json({
						"status": 500,
						"message": reason
					});
				}
				else {
					res.status(401);
					res.json({
						"status": 401,
						"message": 'Invalid credentials #7'
					});
				}
			});
	},
	
	register: function (req, res) {
		
		var email = req.body.email || '';
		var username = req.body.username || '';
		var password = req.body.password || '';
		
		console.log('email: ' + email);
		
		if (email === '' || username === '' || password === '') {
			res.status(401);
			res.json({
				"status": 401,
				"message": 'Invalid credentials #1'
			});
			return;
		}
		
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(password, salt);
		
		mysql.query('INSERT INTO users(email, name, password) VALUES(?,?,?)', [email, username, hash])
			.then(function (result) {
				console.log('id: ' + result.insertId);
				
				// Fire a query to your DB and check if the credentials are valid
				return auth.validate(email, password);
			})
			.then(function (dbUserObj) {
				// If authentication is success, we will generate a token
				// and dispatch it to the client
				if (dbUserObj)
					res.json(genToken(dbUserObj));
			})
			.catch(function (reason) {
				if (reason) {
					res.status(500);
					res.json({
						"status": 500,
						"message": reason
					});
				}
				else {
					res.status(401);
					res.json({
						"status": 401,
						"message": 'Invalid credentials #7'
					});
				}
			});
	},
	
	validate: function (email, password) {
		return mysql.query('SELECT email, name, password FROM users WHERE email = ?', [email])
			.then(function (rows) {
				if (rows.length === 0) return Promise.reject();
				else {
					return bcrypt.compare(password, rows[0].password)
						.then(function (result) {
							if (result) return rows[0];
							else return Promise.reject();
						});
				}
			})
			.catch(function (err) {
				return Promise.reject(err);
			});
	},
	
	validateUser: function (email) {
		return mysql.query('SELECT email, name, password FROM users WHERE email = ?', [email])
			.then(function (rows) {
				if(rows.length === 0) return Promise.reject();
				else return rows[0];
			})
			.catch(function (err) {
				return Promise.reject(err);
			});
	},
	
	checkJWT: function (req, res) {
		res.status(200);
		res.send(null);
	}
	
};

function genToken (user) {
	var expires = expiresIn(31);
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
