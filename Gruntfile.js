/*
 * grunt-tt2-bem
 * https://github.com/Wu-Wu/grunt-tt2-bem
 *
 * Copyright (c) 2014 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function(grunt) {
    grunt.initConfig({
        jshint: {
            all: {
                src: [
                    'Gruntfile.js',
                    'lib/**/*.js',
                    'test/**/*.js',
                    'tasks/**/*.js'
                ],
                options: {
                    curly: true,
                    eqeqeq: true,
                    immed: true,
                    latedef: true,
                    newcap: true,
                    noarg: true,
                    sub: true,
                    undef: true,
                    boss: true,
                    eqnull: true,
                    node: true,
                    laxbreak: true,
                    multistr: true
                }
            }
        },
        mocha_istanbul: {
            coverage: {
                src: 'test',
                options: {
                    mask: '*.js',
                    reportFormats: [ 'lcovonly' ],
                    root: './lib'
                }
            }
        },
        mochaTest: {
            all: {
                src: [ 'test/*.js' ],
                options: {
                    reporter: 'spec',
                    bail: true
                }
            }
        },
        coveralls: {
            all: {
                src: 'coverage/lcov.info',
                force: true
            }
        },
        clean: [ 'test/fixtures/bem' ],
        bemdecl: {
            all: {
                src: [ 'templates/**/*.html' ],
                dest: 'test/fixtures/bem/bundles.generated',
                options: {
                    root: 'test/fixtures',
                    includes: [ 'includes', 'templates' ],
                    cut: 1
                }
            }
        }
    });

    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-coveralls');

    grunt.registerTask('default', 'test');

    grunt.registerTask('test', [ 'clean', 'jshint:all', 'bemdecl:all', 'mochaTest:all' ]);
    grunt.registerTask('coverage', [ 'clean', 'jshint:all', 'bemdecl:all', 'mocha_istanbul:coverage' ]);

    grunt.registerTask('coveralls-io', [ 'coverage', 'coveralls:all' ]);
};
