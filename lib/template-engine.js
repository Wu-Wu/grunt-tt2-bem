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
    path = require('path'),
    util = require('util'),
    tco = require('tail-call/core').recur;

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

    var tt = '(INCLUDE|PROCESS)',
        quotes = '(?:["\'])?',
        pathSpec = '([a-zA-Z0-9.\\-\\/,~_@]+)';

    this.re = new RegExp('\\b' + tt + '\\s+' + quotes + pathSpec + quotes, 'g');

    if (this.debug) {
        console.log('this.re:', this.re);
    }

    this.clear();
};

TemplateEngine.prototype.clear = function () {
    this.stash = [];
    this.seen = {};
};

TemplateEngine.prototype.resolvePath = function (file) {
    var dir = _.find(this.options.includes, function (el) {
        return fs.existsSync(el + '/' + file) ? true : false;
    });

    return dir ? (dir + '/' + file) : false;
};

var processTemplate = tco(function(tree, template, parent) {
    var tt;

    // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    // console.log(template);
    // console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');

    while ((tt = tree.re.exec(template)) !== null) {
        // console.log('+++ found', tt[2]);
        if (!tree.seen[tt[2]]) {
            var token = {
                pos: [ tt.index, tree.re.lastIndex ],
                token: tt[1],
                path: tt[2],
                resolved: tree.resolvePath(tt[2]),
                content: '',
                parent: parent
            };

            tree.seen[token.path] = true;

            if (token.resolved === false) {
                token.content = '<!-- not resolved: "' + token.path + '" -->';
            }
            else {
                token.content = fs.readFileSync(token.resolved, { encoding: 'utf8' });

                if (token.content.match(/INCLUDE|PROCESS/gm)) {
                    processTemplate(tree, token.content, token.path);
                }
            }
            tree.stash.push(token);
        }
    }

    return tree;
});

TemplateEngine.prototype.process = function (template) {
    this.clear();

    var tree = {
        re: this.re,
        seen: this.seen,
        stash: this.stash,
        resolvePath: _.bind(this.resolvePath, this)
    };

    processTemplate(tree, template, 'root');

    if (this.debug) {
        console.log(util.inspect(tree.stash, {depth: null, colors:true}));
        // console.log(this.seen);
    }
};

module.exports = TemplateEngine;
