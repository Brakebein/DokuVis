module.exports = {
	
	database: {
		host: '127.0.0.1',
		user: 'root',
		password: '',
		database: 'db_dokuvis'
	},
	
	neo4j: {
		uriCypher: 'http://127.0.0.1:7474/db/data/cypher',
		uriTransaction: 'http://127.0.0.1:7474/db/data/transaction/commit',
		auth: 'Basic bmVvNGo6Y2F2YWxlcmE='
	},
	
	secret: function() {
		return 'verysecretkey'
	},
	
	paths: {
		data: 'C:/xampp/htdocs/DokuVis/data'
	}
	
};