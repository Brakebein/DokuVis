const utils = require('../utils');
const neo4j = require('../neo4j-request');

module.exports = {
	
	query: function (req, res) {
		var q = 'MATCH (n:' + req.params.label + ':' + req.params.id + ')<--(:' + req.params.from + ') \
			RETURN n.' + req.params.prop + ' AS content';
		
		neo4j.transaction(q)
			.then(function (response) {
				if(response.errors.length) { utils.error.neo4j(res, response.exception, '#typeahead.query'); return; }
				res.json(neo4j.extractTransactionData(response.results[0]));
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#cypher');
			});
	},

	queryTags: function (req, res) {
		var q = 'MATCH (n:TAG:'+req.params.id+') \
				WHERE n.content =~ $regex \
				RETURN n.content as tag ORDER BY tag';

		var params = {
			regex: '.*' + req.query.search + '.*'
		};

		neo4j.readTransaction(q, params)
			.then(function (result) {
				res.json(result);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#typeahead.queryTags');
			});
	}
	
};
