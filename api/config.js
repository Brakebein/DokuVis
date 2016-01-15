module.exports = {
	
	database: {
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'db_dokuvis'
	},
	
	neo4j: {
		uriCypher: 'http://localhost:7474/db/data/cypher',
		uriTransaction: 'http://localhost:7474/db/data/transaction/commit',
		auth: 'Basic bmVvNGo6Y2F2YWxlcmE='
	},
	
	secret: function() {
		return 'verysecretkey'
	},
	
	paths: {
		data: 'C:/xampp/htdocs/DokuVis/data'
	}
	
};