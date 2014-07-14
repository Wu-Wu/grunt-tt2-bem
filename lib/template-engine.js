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
        includes: [ './' ]      // include path list
    });

    this.debug = this.options.debug;

    // resolve paths
    this.options.root = path.resolve(this.options.root);

    this.options.includes = _.map(this.options.includes, function(el){
        return path.resolve(this.options.root, el);
    }, this);

    var tt = '(INCLUDE|PROCESS)',
        comm = '(?:[^#]+)\\s*', // TODO #2
        quotes = '(?:["\'])?',
        pathSpec = '([a-zA-Z0-9.\\-\\/,~_@]+)';

    this.re = new RegExp('\\b' + tt + '\\s+' + quotes + pathSpec + quotes, 'g');

    this.clear();
};

TemplateEngine.prototype.clear = function () {
    this.stash = [];
    this.seen = {};
    this.fails = [];
};

TemplateEngine.prototype.errors = function () {
    return this.fails;
};

TemplateEngine.prototype.resolvePath = function (file) {
    var dir = _.find(this.options.includes, function (el) {
        return fs.existsSync(el + '/' + file) ? true : false;
    });

    return dir ? (dir + '/' + file) : false;
};

var processTemplate = tco(function(tree, template, parent) {
    var tt;

    while ((tt = tree.re.exec(template)) !== null) {
        if (!tree.seen[tt[2]]) {
            var token = {
                pos: tt.index,
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

TemplateEngine.prototype.parse = function (filename) {
    this.clear();

    var tree = {
        re: this.re,
        seen: this.seen,
        stash: this.stash,
        resolvePath: _.bind(this.resolvePath, this)
    };

    if (!filename) {
        this.fails.push('Template is undefined');
        return;
    }

    if (!fs.existsSync(filename)) {
        this.fails.push('Template does not exist');
        return;
    }

    var template = fs.readFileSync(filename, { encoding: 'utf8' });

    if (!template.length) {
        this.fails.push('Template is empty');
        return;
    }

    processTemplate(tree, template, filename);

    // filter not resolved items
    var failed = _.filter(tree.stash, { resolved: false });

    if (failed.length) {
        this.fails.push('Unable to resolve file path:');
        _.each(failed, function (item) {
            this.fails.push(
                util.format(
                    '%s @ pos %d: "%s %s"',
                    item.parent, item.pos, item.token, item.path
                )
            );
        }, this);
    }
    else {
        _.each(this.stash, function (item) {
            template += util.format(
                '\n<!--\n parent: %s @ pos %d\n resolved: %s\n-->\n',
                item.parent, item.pos, item.resolved
            );
            template += item.content;
        }, this);
    }

    return this.fails.length ? undefined : template;
};

module.exports = TemplateEngine;
module.exports.processTemplate = processTemplate;
