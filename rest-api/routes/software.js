const utils = require('../utils');
const neo4j = require('../neo4j-request');

module.exports = {

	query: function (req, res) {
		var prj = req.params.prj;

		var q = 'MATCH (sw:D14:'+prj+')\
			WHERE sw.value =~ $search\
			RETURN sw.content AS id,\
				sw.value AS name';

		var params = {
			search: req.query.search ? '.*' + req.query.search + '.*' : '.*'
		};

		neo4j.readTransaction(q, params)
			.then(function (results) {
				res.json(results);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#software.query');
			});
	}

};
