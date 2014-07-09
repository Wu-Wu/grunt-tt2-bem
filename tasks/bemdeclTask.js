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
            debug       : false
        });

        var files = [];

        // grunt.verbose.writeln('files: ' + util.inspect(this.files, {depth: null, colors:true}));

        _.each(this.files, function (pair) {
            _.each(pair.src, function (src) {
                files.push({
                    src: src,
                    dst: pair.dest,
                    dir: path.dirname(pair.dest)
                });
            });
        });

        // grunt.verbose.writeln('files: ' + util.inspect(files, {depth: null, colors:true}));

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

            // grunt.verbose.writeln('includes: ' + util.inspect(this.te.options.includes, {depth: null, colors:true}));

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
            grunt.log.writeln('No files to processing');
        }

        // grunt.verbose.writeln(util.inspect(this.te, {depth: null, colors:true}));
        // grunt.verbose.writeln(util.inspect(this.bd, {depth: null, colors:true}));
        // grunt.verbose.writeflags(options);
    }

    grunt.registerMultiTask('bemdecl', 'Creates *.bemdecl.js for templates', bemDeclTask);
};
