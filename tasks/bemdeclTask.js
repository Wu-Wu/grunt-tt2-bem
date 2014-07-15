/*
 * grunt-tt2-bem
 * https://github.com/Wu-Wu/grunt-tt2-bem
 *
 * Copyright (c) 2014 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

function declBanner (source, options) {
    return  '/*\n' +
            ' *\n' +
            ' * WARNING!\n' +
            ' * DO NOT EDIT THIS MANUALLY - YOUR CHANGES WILL BE OVERWRITTEN!\n' +
            ' *\n' +
            ' * Generated by ' + options.gen + ' v' + options.ver + '\n' +
            ' * Source file: ' + source + '\n' +
            ' *\n' +
            ' */\n';
}

function declBlocks (decl, options) {
    return  'exports.blocks = ' +
                JSON.stringify(decl, null, options.indent) +
            ';\n';
}

module.exports = function (grunt) {
    var path = require('path'),
        TemplateEngine = require('../lib/template-engine'),
        BemDecl = require('../lib/bem-decl'),
        util = require('util'),
        _ = require('lodash'),
        chalk = require('chalk'),
        flattenPath = require('../lib/flatten-path');


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
            debug       : false,
            indentSize  : 4
        });

        var files = [];

        options.pkg = grunt.file.readJSON('package.json');

        // no files provided
        if (_.isEmpty(this.files)) {
            // trying to expand from options
            if (!_.isEmpty(options.src) && !_.isEmpty(options.dest)) {
                // expand by given root, src & dest, ext & extDot
                this.files = grunt.file.expandMapping(
                    options.src,
                    path.join(options.root, options.dest),
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
                // flattenPath(src, { root: options.root, cut: options.cutLevel, ext: '.html', sep: '-' });
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
                grunt.log.writeln("Processing " + chalk.cyan(file.src) + "...");

                var content = this.te.parse(file.src);

                if (!content) {
                    grunt.fatal(this.te.errors().join('\n'));
                }
                else {
                    this.bd.clear();
                    this.bd.parse(content);

                    var declContents =
                        declBanner(file.src, { gen: options.pkg.name, ver: options.pkg.version }) +
                        declBlocks(this.bd.decl(), { indent: options.indentSize });

                    if (!grunt.file.exists(file.dir)) {
                        grunt.file.mkdir(file.dir);
                        grunt.log.writeln('Created directory ' + chalk.yellow(file.dir) + ' ...');
                    }

                    grunt.file.write(file.dst, declContents, {encoding: 'utf8'});
                    // grunt.log.writeln(chalk.yellow(declContents));
                }

                next();
            }.bind(this), this.async());
        }
        else {
            grunt.log.writeln('No templates to processing');
        }
    }

    grunt.registerMultiTask('bemdecl', 'Creates *.bemdecl.js for templates', bemDeclTask);
};
