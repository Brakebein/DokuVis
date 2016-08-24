var dateFormat = require('dateformat');

module.exports = {
	
	error: {
		mysql: function(res, err, code){
			var message = 'MySQL failure';
			if(code) message += ' ' + code;
			res.status(500);
			res.json({
				message: message,
				originalErr: err
			});
		},
		neo4j: function(res, err, code){
			var message = 'Neo4j failure';
			if(code) message += ' ' + code;
			res.status(500);
			res.json({
				message: message,
				originalErr: err
			});
		},
		server: function(res, err, code){
			var message = 'server failure';
			if(code) message += ' ' + code;
			res.status(500);
			res.json({
				message: message,
				originalErr: err
			});
		},
		general: function (res, err) {
			res.status(500);
			res.json({
				message: 'ERROR',
				error: err
			});
		}
	},
	
	log: {
		fileupload: function (files) {
			files.forEach(function (f) {
				console.log(dateFormat(new Date(), 'isoDateTime'), 'File Upload:', f.originalname, f.path + f.filename, f.size);
			});
		}
	}
	
};
