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
            options: {
                src: 'coverage/lcov.info',
                force: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-coveralls');

    grunt.registerTask('default', 'mochaTest:all');

    grunt.registerTask('test', 'mochaTest:all');
    grunt.registerTask('coverage', 'mocha_istanbul:coverage');

    grunt.registerTask('coveralls-io', [ 'coverage', 'coveralls' ]);
};
