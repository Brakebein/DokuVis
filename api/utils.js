//var dateFormat = require('dateformat');
const mysql = require('./mysql-request');
const Promise = require('bluebird');
const log4js = require('log4js');

var logger = log4js.getLogger('API');
log4js.replaceConsole(logger);

var utils = {

	error: {
		mysql: function (res, err, code) {
			var message = 'MySQL failure';
			if (code) message += ' ' + code;
			console.error(message);
			res.status(500);
			res.json({
				message: message,
				originalErr: err
			});
		},
		neo4j: function (res, err, code) {
			var message = 'Neo4j failure';
			if (code) message += ' ' + code;
			console.error(message);
			res.status(500);
			res.json({
				message: message,
				originalErr: err
			});
		},
		server: function (res, err, code) {
			var message = 'server failure';
			if (code) message += ' ' + code;
			console.error(message);
			res.status(500);
			res.json({
				message: message,
				originalErr: err
			});
		},
		general: function (res, err) {
			console.error(err);
			res.status(500);
			res.json({
				message: 'ERROR',
				error: err
			});
		}
	},

	abort: {
		missingData: function (res, add) {
			var message = 'Missing essential data';
			if (add) message += ' | ' + add;
			console.warn(message);
			res.status(510);
			res.json({
				message: message
			});
		}
	},

	log: {
		fileupload: function (files) {
			files.forEach(function (f) {
				//console.log(dateFormat(new Date(), 'isoDateTime'), 'File Upload:', f.originalname, f.path, f.size);
				console.log('File Upload:', f.originalname, f.path, f.size);
			});
		}
	},
	
	replace: function (string) {
		return string.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
	}

};
	
utils.checkPermission = function (req, res, role) {
	var user = req.headers['x-key'] || '';
	var prj = req.params.id;

	if(!(role instanceof Array)) role = [role];
	
	var roles = ['superadmin'];
	if(role.indexOf('admin') !== -1) roles.push('admin');
	if(role.indexOf('historian') !== -1) roles.push('historian');
	if(role.indexOf('modeler') !== -1) roles.push('modeler');
	if(role.indexOf('visitor') !== -1) roles.push('admin', 'historian', 'modeler', 'visitor');

	var sql = '\
		SELECT p.proj_tstamp, u.email, r.role FROM users u \
		INNER JOIN user_project_role upr ON u.id = upr.user_id AND u.email = ? \
		INNER JOIN projects p ON p.pid = upr.project_id AND p.proj_tstamp = ? \
		INNER JOIN roles r ON r.id = upr.role_id AND r.role IN ?';

	return mysql.query(sql, [user, prj, [roles]]).catch(function (err) {
		utils.error.mysql(res, err, '#utils.checkPermission');
		return Promise.reject();
	}).then(function (rows) {
		if(rows.length === 1) return Promise.resolve();
		else {
			var message = 'No Permission ' + user + ' ' + prj + ' ' + req.method + ' ' + req.originalUrl;
			console.warn(message);
			res.status(403);
			res.json({
				message: 'No Permission!',
				error: message
			});
			return Promise.reject();
		}
	});
};
	
module.exports = utils;
