/*
 * grunt-tt2-bem
 * https://github.com/Wu-Wu/grunt-tt2-bem
 *
 * Copyright (c) 2014 Anton Gerasimov
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path'),
    _ = require('lodash'),
    u = require('util'),
    flattenPath = require('./flatten-path');

var toArray = function (val) {
    // String to Array
    if (_.isString(val)) {
        val = [ val ];
    }
    // Object to Array
    if (_.isObject(val) && !_.isArray(val)) {
        val = _.values(val);
    }

    // normalize list of patterns/files
    val = _.chain(val).flatten().compact().uniq().value();

    return val;
};

module.exports.gatherFiles = function (src, cb, opt) {
    opt = opt || {};

    var files = [];

    opt = _.defaults(opt, {
        root    : '',
        dest    : '',
        extSrc  : '.html',
        extDst  : '.bemdecl.js',
        sep     : '-',
        cut     : 0
    });

    src = toArray(src);

    var flattenPathOpts = {
        root : opt.root,
        cut  : opt.cut,
        ext  : opt.extSrc,
        sep  : opt.sep
    };

    _.each(src, function (pattern) {
        // expand each pattern
        var expanded = cb(path.join(opt.root, pattern));

        _.each(expanded, function (file) {
            // templates/choose/index.html -> templates-choose-index
            var name = flattenPath(file, flattenPathOpts);

            files.push({
                src: file,
                dst: path.join(opt.dest, name, name + opt.extDst),
                dir: path.join(opt.dest, name)
            });
        });
    });

    // console.log('files' + u.inspect(files, {depth:null,colors:true}));

    return files;
};

module.exports.toArray = toArray;
