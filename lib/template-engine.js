/*
 * grunt-tt2-bem
 * https://github.com/Wu-Wu/grunt-tt2-bem
 *
 * Copyright (c) 2014 Anton Gerasimov
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path');

var TemplateEngine = function (options) {
    this.options = _.defaults(options, {
        debug: false,
        root: __dirname,
        includes: [ './' ],     // include path list
        depth: 10               // max depth level (recursive include/process)
    });

    this.debug = this.options.debug;

    // resolve paths
    this.options.root = path.resolve(this.options.root);

    this.options.includes = _.map(this.options.includes, function(el){
        return path.resolve(this.options.root, el);
    }, this);

    if (this.debug) {
        console.log('this.options:', this.options);
    }

    this.stash = [];

    var tt = '(INCLUDE|PROCESS)',
        quotes = '(?:["\'])?',
        pathSpec = '([a-zA-Z0-9.\\-\\/,~_@]+)';

    this.re = new RegExp('\\b' + tt + '\\s+' + quotes + pathSpec + quotes, 'g');

    if (this.debug) {
        console.log('this.re:', this.re);
    }
};

TemplateEngine.prototype.clear = function () {
    this.stash = [];
};

TemplateEngine.prototype.resolvePath = function (file) {
    var dir = _.find(this.options.includes, function (el) {
        return fs.existsSync(el + '/' + file) ? true : false;
    });

    return dir ? (dir + '/' + file) : false;
};

TemplateEngine.prototype.process = function (template) {
    var tt;

    this.clear();

    while ((tt = this.re.exec(template)) !== null) {
        this.stash.push({
            pos: tt.index,
            token: tt[1],
            path: tt[2],
            resolved: this.resolvePath(tt[2])
        });
    }

    // console.log(this.stash);
};

module.exports = TemplateEngine;
