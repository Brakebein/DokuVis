var config = require('./config');
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');

var mysql = require('mysql');
var connection = mysql.createConnection({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database
});

var app = express();
var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;
	
	console.log('API listening at http://%s:%s', host, port);
});
app.use(bodyParser.json()),
app.use(bodyParser.urlencoded({ extended: true }));

function cypher(query, params, cb) {
	request.post({
		uri: config.cypher.uri,
		headers: {
			'Authorization': config.cypher.auth
		},
		json: {
			query: query,
			params: params
		}
	},
	function(err, res) { cb(err,res.body)});
}



app.get('/', function(req, res) {
	cypher('match (root:E22:Proj_puuD1TP {content:"e22_root_master"}) return root', {}, function(err, result) {
		res.send(result);
	});
});

app.get('/projects', function(req, res) {
	connection.query('SELECT * FROM projects', function(err, rows, fields) {
		res.send(rows);
	});
});

app.get('/projects/:tstamp', function(req, res) {
	var sql = 'SELECT * FROM projects WHERE proj_tstamp = ' + connection.escape(req.params.tstamp);
	connection.query(sql , function(err, rows, fields) {
		res.send(rows);
	});
});
app.post('/projects/new', function(req, res) {
	var sql = mysql.format('INSERT INTO projects(proj_tstamp, name, description) VALUES(?,?,?)', [req.body.proj, req.body.name, req.body.description]);
	connection.query(sql, function(err, results) {
		res.send('done');
	});
});

app.use(function(req, res) {
	res.send('INVALID');
});

process.on('uncaughtException', function(err) {
	console.log(err);
});