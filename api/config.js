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
	
	path: {
		data: 'C:/xampp/htdocs/DokuVis/data',
		tmp: 'C:/xampp/htdocs/DokuVis/tmp'
	},
	
	exec: {
		ImagickConvert: "C:/ServerTools/ImageMagick-6.9.2-4-Q16-x64/convert.exe",
		ImagickMogrify: "C:/ServerTools/ImageMagick-6.9.2-4-Q16-x64/mogrify.exe",
		ImagickIdentify: "C:/ServerTools/ImageMagick-6.9.2-4-Q16-x64/identify.exe",
		CTMconv: "\"C:/Program Files (x86)/OpenCTM 1.0.3/bin/ctmconv.exe\""
	}
	
};
