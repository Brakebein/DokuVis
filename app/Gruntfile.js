module.exports = function (grunt) {

	// load plugins
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-usemin');
	grunt.loadNpmTasks('grunt-wiredep');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('dgeni-alive');
	grunt.loadNpmTasks('grunt-version');
	
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
			ng: {
				src: ['app/*', 'app/directives/webglView/webglView.js'],
				options: {
					destination: '../docs/docs',
					configure: 'node_modules/angular-jsdoc/common/conf.json',
					template: '../docs/docs/angular-template-custom',
					tutorials: '../docs/docs/tutorials',
					readme: '../docs/docs/README.md',
					private: true
				}
			},
			dv3d: {
				src: ['lib/dv3d/*.js'],
				options: {
					destination: '../docs/docs2',
					configure: 'node_modules/jsdoc-baseline/baseline-config.json',
					template: 'node_modules/jsdoc-baseline',
					private: true
				}
			}
		},

		'dgeni-alive':  {
			options: {
				packages: [
					'dgeni-packages/jsdoc',
					'dgeni-packages/ngdoc'
				]
			},
			api: {
				title: 'DokuVis Docs',
				expand: false,
				dest: '../docs/docs3/',
				src: [
					'app/**/*.js',
					'components/**/*.js',
					'../docs/docs3/content/**/*.ngdoc'
				]
			}
		},

		version: {
			js: {
				options: {
					prefix: '@version\\s*',
					prereleaseIdentifier: 'alpha'
				},
				src: ['app/app.js']
			},
			packages: {
				options: {
					prereleaseIdentifier: 'alpha'
				},
				src: ['package.json', 'bower.json']
			}
		}
	});

	// tasks
	grunt.registerTask('default', ['wiredep']);
	grunt.registerTask('testmin', ['useminPrepare', 'copy', 'concat', 'uglify', 'usemin']);

};
