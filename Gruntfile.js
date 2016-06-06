module.exports = function (grunt) {

	// load plugins
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-wiredep');
	
	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		wiredep: {
			target: {
				src: 'index.html'
			}
		}
	});

	// tasks
	grunt.registerTask('default', ['wiredep']);

};
