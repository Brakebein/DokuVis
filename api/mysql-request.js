const mysql = require('promise-mysql');
const config = require('./config');

var pool = mysql.createPool({
	host: config.database.host,
	user: config.database.user,
	password: config.database.password,
	database: config.database.database
});

process.on('exit', function () {
	pool.end();
});

module.exports = pool;
