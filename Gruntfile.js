module.exports = function (grunt) {

	// load plugins
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-usemin');
	grunt.loadNpmTasks('grunt-wiredep');
	grunt.loadNpmTasks('grunt-jsdoc');
	
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
		},
		
		jsdoc: {
			dist: {
				src: ['app/*', 'app/directives/webglView/webglView.js'],
				options: {
					destination: 'docs/docs',
					configure: 'node_modules/angular-jsdoc/common/conf.json',
					template: 'docs/docs/angular-template-custom',
					tutorials: 'docs/docs/tutorials',
					readme: 'docs/docs/README.md',
					private: true
				}
			}
		}
	});

	// tasks
	grunt.registerTask('default', ['wiredep']);
	grunt.registerTask('testmin', ['useminPrepare', 'copy', 'concat', 'uglify', 'usemin']);

};
