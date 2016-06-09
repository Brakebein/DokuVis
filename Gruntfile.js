module.exports = function (grunt) {

	// load plugins
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-usemin');
	grunt.loadNpmTasks('grunt-wiredep');
	
	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		wiredep: {
			target: {
				src: 'index.html'
			}
		},

		copy: {
			dist: {
				files: [{src: 'index.html', dest: 'dist/index.html'}]
			}
		},

		'useminPrepare': {
			options: {
				dest: 'dist'
			},
			html: 'index.html'
		},

		usemin: {
			html: ['dist/index.html']
		}
	});

	// tasks
	grunt.registerTask('default', ['wiredep']);
	grunt.registerTask('testmin', ['useminPrepare', 'copy', 'concat', 'uglify', 'usemin']);

};
