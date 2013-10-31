'use strict';

// # Globbing
// for performance reasons only one level down is matched:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
	// show elapsed time at the end
	require('time-grunt')(grunt);
	// load all grunt tasks
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		clean: {
			dist: {
				files: [{
					dot: true,
					src: 'dist/*'
				}]
			}
		},

		copy: {
			dist: {
				files: [{
					expand: true,
					matchBase: true,
					cwd: 'app',
					src: ['*', '!*.{s{a,c}ss,coffee}'],
					dest: 'dist',
				}],
			},
		},

		compass: {
			compile: {
				options: {
					sassDir: 'app/styles',
					cssDir: 'dist/styles',
					generatedImagesDir: 'dist/images/generated',
					imagesDir: 'app/images',
					javascriptsDir: 'app/scripts',
					fontsDir: 'app/styles/fonts',
					importPath: 'app/bower_components',
					httpImagesPath: '/images',
					httpGeneratedImagesPath: '/images/generated',
					httpFontsPath: '/styles/fonts',
					relativeAssets: false,
					assetCacheBuster: false
				},
			},
		},

		coffee: {
			compile: {
				files: [{
					expand: true,
					cwd: 'app/scripts',
					src: '{,*/}*.coffee',
					dest: 'dist/scripts',
					ext: '.js'
				}]
			}
		},

		connect: {
			livereload: {
				options: {
					hostname: 'localhost',
					port: 9000,

					livereload: 35729,
					open: true,

					base: [
						'dist',
					]
				}
			}
		},

		watch: {
			coffee: {
				files: ['app/styles/{,*/}*.coffee'],
				tasks: ['coffee:compile']
			},
			compass: {
				files: ['app/styles/{,*/}*.s{c,a}ss'],
				tasks: ['compass:compile' /*, 'autoprefixer'*/]
			},
			livereload: {
				options: {
					livereload: '<%= connect.livereload.options.livereload %>'
				},
				files: [
					'app/*.html',
					'dist/styles/{,*/}*.css',
					'{dist,app}/scripts/{,*/}*.js',
					'app/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
				]
			}
		},

		concurrent: {
			dist: [
				'copy',
				'compass',
				'coffee',
			]
		}
	});

	grunt.registerTask('build', [
		'clean',
		'concurrent',
	]);

	grunt.registerTask('server', [
		'connect',
		'watch',
	]);

	grunt.registerTask('default', [
		'build',
		'server'
	]);
};
