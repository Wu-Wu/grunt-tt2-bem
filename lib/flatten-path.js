/*
 * grunt-tt2-bem
 * https://github.com/Wu-Wu/grunt-tt2-bem
 *
 * Copyright (c) 2014 Anton Gerasimov
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path'),
    _ = require('lodash');

module.exports = function (filename, opt) {
    opt = opt || {};

    opt = _.defaults(opt, {
        root: '',
        ext: '.html',
        sep: '-',
        cut: 0
    });

    var folders = [],
        relative = path.relative(path.normalize(opt.root), path.normalize(filename)),
        basename = path.basename(relative, opt.ext);

    // split dirs
    folders = path.dirname(relative).split(path.sep);
    // add file
    folders.push(basename);

    if (folders[0] === '..') {
        throw new Error('Filename located out of root directory');
    }

    return folders.slice(opt.cut).join(opt.sep);
};
