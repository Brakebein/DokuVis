module.exports = function (grunt) {

	// load plugins
	grunt.loadNpmTasks('grunt-babel');

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-filerev');
	grunt.loadNpmTasks('grunt-usemin');
	grunt.loadNpmTasks('grunt-string-replace');

	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('dgeni-alive');

	grunt.loadNpmTasks('grunt-version');
	grunt.loadNpmTasks('grunt-wiredep');
	
	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// convert ES6 scripts to ES5
		babel: {
			options: {
				sourceMap: true,
				presets: ['env']
			},
			es5: {
				files: {
					'src/lib/potree/potree.es5.js': 'src/lib/potree/potree.js'
				}
			}
		},

		///// build project

		// clean folders
		clean: {
			tmp: ['.tmp'],
			dist: ['dist/*']
		},

		// copy files from src to dist folder
		copy: {
			dist: {
				files: [
					{expand: true, cwd: 'src/', src: 'index.html', dest: 'dist/'},
					{expand: true, cwd: 'src/', src: 'favicon.ico', dest: 'dist/'},
					{expand: true, cwd: 'src/', src: 'i18n/**/*', dest: 'dist/'},
					{expand: true, cwd: 'src/', src: 'fonts/**/*', dest: 'dist/'},
					{expand: true, cwd: 'src/', src: 'pdf/**/*', dest: 'dist/'},
					{expand: true, cwd: 'src/', src: 'img/**/*.{png,jpg,svg,gif}', dest: 'dist/'},
					{expand: true, cwd: 'src/', src: 'components/**/*.html', dest: 'dist/'},
					{expand: true, cwd: 'src/', src: 'partials/**/*.html', dest: 'dist/'}
				]
			}
		},

		cssmin: {
			options: {
				root: 'src'
			}
		},

		// static asset revisioning through file content hash
		filerev: {
			options: {
				algorithm: 'md5',
				length: 8
			},
			dist: {
				src: [
					'dist/components/**/*.html',
					'dist/partials/**/*.html',
					'dist/script/*.js',
					'dist/style/*.css',
					'dist/img/**/*.{png,jpg,svg,gif}'
					//'dist/fonts/**/*'
				]
			}
		},

		// identify build blocks and prepare for minification
		useminPrepare: {
			options: {
				root: 'src',
				dest: 'dist',
				flow: {
					html: {
						steps: {
							// js: ['concat', 'uglify'],
							js: ['concat'],
							css: ['cssmin']
						},
						post: {}
					}
				}
			},
			html: 'src/index.html'
		},

		// replace references
		usemin: {
			html: ['dist/**/*.html'],
			css: 'dist/style/*.css',
			js: 'dist/script/*.js',
			options: {
				assetsDirs: ['dist'],
				patterns: {
					html: [
						[/src="'([^:'"]+)'"/img, 'src replacement in html files'],
						[/ng-include="'([^:'"]+)'"/img, 'ng-include replacement in html files']
					],
					js: [
						[/(?:templateUrl|contentTemplate):[\s]*['"]([^:'"]+\.html)['"]/img, 'Partials replacement in js files']
					],
					css: [
						[/url\((?:\.\.\/)*((?!\.\.\/)[^:'"?#()]+)(?:[?#][^:'"?()]+)?\)/img, 'Url replacement in css files']
					]
				}
			}
		},

		uglify: {
			vendor: {
				files: {
					'dist/script/lib.js': 'dist/script/lib.js',
					'dist/script/threejs-bundle.js': 'dist/script/threejs-bundle.js'
				}
			},
			app: {
				options: {
					mangle: false
				},
				files: {
					'dist/script/app.js': 'dist/script/app.js'
				}
			}
		},

		// correct css url references
		'string-replace': {
			dist: {
				files: {
					'dist/': 'dist/style/*.css'
				},
				options: {
					replacements: [{
						pattern: /url\((?:\.\.\/)*((?!\.\.\/)[^:'"()]+)\)/ig,
						replacement: 'url(../$1)'
					}]
				}

			}
		},

		// documentation with JSDoc
		jsdoc: {
			dv3d: {
				src: ['src/lib/dv3d/*.js'],
				options: {
					destination: 'docs/dv3d',
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
				dest: 'docs/angular/',
				src: [
					'src/app/**/*.js',
					'src/components/**/*.js',
					'docs/angular/content/**/*.ngdoc'
				]
			}
		},

		// update versions
		version: {
			js: {
				options: {
					prefix: '@version\\s*',
					prereleaseIdentifier: 'alpha'
				},
				src: ['src/app/app.js']
			},
			html: {
				options: {
					prefix: '<p [^<>]+>DokuVis\\s+v',
					prereleaseIdentifier: 'alpha'
				},
				src: ['src/partials/footer.html', 'src/partials/project.html']
			},
			packages: {
				options: {
					prereleaseIdentifier: 'alpha'
				},
				src: ['package.json', 'src/bower.json']
			}
		},

		// wire bower dependencies to index.html
		wiredep: {
			target: {
				cwd: 'src',
				src: ['src/index.html']
			}
		}

	});

	// tasks
	grunt.registerTask('default', ['wiredep']);

	grunt.registerTask('build', [
		'clean:dist',
		'copy:dist',
		'useminPrepare',
		'concat:generated',
		'cssmin:generated',
		//'uglify:generated',
		'uglify:vendor',
		'uglify:app',
		'filerev',
		'usemin',
		'string-replace:dist',
		'clean:tmp'
	]);

};
