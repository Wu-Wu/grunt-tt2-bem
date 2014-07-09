/*
 * grunt-tt2-bem
 * https://github.com/Wu-Wu/grunt-tt2-bem
 *
 * Copyright (c) 2014 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function (grunt) {
    var path = require('path'),
        TemplateEngine = require('../lib/template-engine'),
        BemDecl = require('../lib/bem-decl'),
        util = require('util'),
        _ = grunt.util._;


    function bemDeclTask () {

        var options = this.options({
            root        : path.resolve(__dirname, '..'),
            includes    : [ '.' ],
            prefixes    : [ 'b', 'i', 'l' ],
            allowed     : [],
            // expanding this.files
            src         : [],
            dest        : '',
            ext         : '.bemdecl.js',
            extDot      : 'last',
            // misc
            debug       : false
        });

        var files = [];

        // no files provided
        if (_.isEmpty(this.files)) {
            // trying to expand from options
            if (!_.isEmpty(options.src) && !_.isEmpty(options.dest)) {
                // expand by given root, src & dest, ext & extDot
                this.files = grunt.file.expandMapping(
                    options.src,
                    options.dest,
                    {
                        cwd: options.root,
                        ext: options.ext,
                        extDot: options.extDot
                    }
                );
            }
        }

        // arrange src-dest pairs of files
        _.each(this.files, function (pair) {
            _.each(pair.src, function (src) {
                files.push({
                    src: src,
                    dst: pair.dest,
                    dir: path.dirname(pair.dest)
                });
            });
        });

        if (files.length > 0) {
            this.te = new TemplateEngine({
                debug: options.debug,
                root: options.root,
                includes: options.includes
            });

            this.bd = new BemDecl({
                debug: options.debug,
                prefixes: options.prefixes,
                allowed: options.allowed
            });

            grunt.util.async.forEachLimit(files, 30, function (file, next) {
                grunt.log.writeln("Processing " + (file.src).cyan + "...");

                // TODO
                // content = this.te.parse(file.src);
                // decl = this.bd.decl(content);
                // !grunt.file.exists(file.dir) -> grunt.file.mkdir(file.dir);
                // grunt.file.write(file.dst, decl, {encoding: 'utf8'});

                next();
            }.bind(this), this.async());
        }
        else {
            grunt.log.writeln('No templates to processing');
        }
    }

    grunt.registerMultiTask('bemdecl', 'Creates *.bemdecl.js for templates', bemDeclTask);
};
