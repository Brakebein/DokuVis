const jwt = require('jwt-simple');
const validateUser = require('../routes/auth').validateUser;

module.exports = function (req, res, next) {
	
	var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
	var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];
	
	if (token || key) {
		try {
			var decoded = jwt.decode(token, require('../config').secret());

			if (decoded.exp <= Date.now()) {
				res.status(400);
				res.json({
					"status": 400,
					"message": "Token Expired #1"
				});
				return;
			}

			// authorize the user to see if he can access our resources
			
			// the key would be logged in user's username
			return validateUser(key).then(function () {
				next();
			}, function(reason) {
				if (reason) {
					res.status(500);
					res.json({
						"status": 500,
						"message": reason
					});
				}
				else {
					// no user with this name exists
					res.status(401);
					res.json({
						"status": 401,
						"message": "Invalid User #3"
					});
				}
			});
		}
		catch (err) {
			res.status(500);
			res.json({
				"status": 500,
				"message": "Oops something went wrong #1",
				"error": err
			});
		}
	}
	else {
		res.status(401);
		res.json({
			"status": 401,
			"message": "Invalid Token or Key #4"
		});
	}
	
};
