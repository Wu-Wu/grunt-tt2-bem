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

    // console.log('opt', opt);

    var flattened = '',
        folders = [],
        relative = path.relative(opt.root, filename),
        basename = path.basename(relative, opt.ext);


    // split dirs
    folders = path.dirname(relative).split(path.sep);
    // add file
    folders.push(basename);

    flattened = folders.slice(opt.cut).join(opt.sep);

    // console.log(
    //     'src:', filename,
    //     'flat:', flattened
    // );

    return flattened;
};
