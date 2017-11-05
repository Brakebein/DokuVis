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
		uriBolt: 'bolt://127.0.0.1:7687',
		auth: 'Basic bmVvNGo6Y2F2YWxlcmE=',
		user: 'neo4j',
		password: 'pw'
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
		CTMconv: "\"C:/Program Files (x86)/OpenCTM 1.0.3/bin/ctmconv.exe\"",
		Assimp: "C:/ServerTools/assimp_3.1.1_x64/assimp.exe",
		DLT: "C:/ServerTools/DLT/DLT.exe",
		CloudCompare: "C:/ServerTools/CloudCompare_v2.8.1_bin_x64/CloudCompare.exe",
		PotreeConv: "C:/ServerTools/PotreeConverter_1.5_windows_x64/PotreeConverter.exe"
	}
	
};
