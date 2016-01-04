module.exports = {
	database: {
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'db_dokuvis'
	},
	cypher: {
		uri: 'http://localhost:7474/db/data/cypher',
		auth: 'Basic bmVvNGo6Y2F2YWxlcmE='
	},
	secret: function() {
		return 'verysecretkey'
	}
}