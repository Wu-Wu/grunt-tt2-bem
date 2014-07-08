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
        util = require('util');

    function bemDeclTask () {

        var options = this.options({
            root        : path.resolve(__dirname, '..'),
            includes    : [ '.' ],
            prefixes    : [ 'b', 'i', 'l' ],
            allowed     : [],
            debug       : false
        });

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

        // grunt.verbose.writeln(util.inspect(this.te, {depth: null, colors:true}));
        // grunt.verbose.writeln(util.inspect(this.bd, {depth: null, colors:true}));
        // grunt.verbose.writeflags(options);
    }

    grunt.registerMultiTask('bemdecl', 'Creates *.bemdecl.js for templates', bemDeclTask);
};
