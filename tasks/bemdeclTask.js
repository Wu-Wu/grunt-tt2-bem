/*
 * grunt-tt2-bem
 * https://github.com/Wu-Wu/grunt-tt2-bem
 *
 * Copyright (c) 2014 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function (grunt) {

    function bemDeclTask () {

        var options = this.options({
            root        : __dirname,
            includes    : [ '.' ],
            prefixes    : [ 'b', 'i', 'l' ],
            allowed     : []
        });

        // grunt.verbose.writeflags(options);
    }

    grunt.registerMultiTask('bemdecl', 'Creates *.bemdecl.js for templates', bemDeclTask);
};
