/*
 * grunt-tt2-bem
 * https://github.com/Wu-Wu/grunt-tt2-bem
 *
 * Copyright (c) 2014 Anton Gerasimov
 * Licensed under the MIT license.
 */

'use strict';

var bn = require('bem-naming'),
    _ = require('lodash');

var BemDecl = function (options) {
    this.options = _.extend(options, {
        debug: false
    });

    this.debug = this.options.debug;

    this.re = /\b([bil]-[-a-z0-9]+)(?:__([-a-z0-9]+))?(?:_([-a-z0-9_]+))?/igm;

    this.clear();
};

BemDecl.prototype.clear = function() {
    this.stash = [];
    this.seen = {};
    this.found = [];
};

BemDecl.prototype.parse = function (text) {
    this.found = text.match(this.re);
    _.forEach(this.found, this.push, this);
};

BemDecl.prototype.push = function (item) {
    if (this.debug) {
        console.log('> got:', item);
    }

    var parsed;

    try {
        parsed = bn.parse(item);
    }
    catch (e) {
        parsed = { block : false };
    }

    if (!parsed.block) {
        return;
    }

    if (!parsed.elem && !parsed.modName && !this.seen[parsed.block]) {
        this.seen[parsed.block] = true;
    }
    this.stash.push(parsed);
};

BemDecl.prototype.filter = function() {
    _.forEach(this.stash, function (item, index) {
        if (!this.seen[item.block]) {
            if (this.debug) {
                console.log('not seen:', item.block);
            }
            this.stash[index] = false;
        }
    }, this);
};

BemDecl.prototype.listFound = function () {
    return this.found;
};

BemDecl.prototype.listParsed = function() {
    this.filter();
    return _.chain(this.stash)
                .compact()
                .uniq(function(item){ return JSON.stringify(item); })
                .value();
};

BemDecl.prototype.handleElemOnly = function (block, entity) {
    var singular = _.has(block, 'elem'),
        plural   = _.has(block, 'elems');

    if (!singular && !plural) {
        // +element to singular
        block['elem'] = entity.elem;
    }
    else if (singular) {
        // cast singular to plural
        var prev = block['elem'];
        if (prev !== entity.elem) {
            delete block['elem'];
            block['elems'] = [ prev, entity.elem ];
        }
    }
    else if (plural) {
        // +element to plural
        block['elems'].push(entity.elem);
    }
    else {
    }

    return block;
};

// representations:

// a) mod: 'foo'
// b) mods: [ { mod: 'foo', val: 'bar' } ]
// c) mods: [ { mod: 'foo', vals: [ 'bar', 'baz' ] } ]
// d) mods: [ { mod: 'foo', val: 'bar' }, { mod: 'baz', val: true } ]
// e) mods: [ { mod: 'foo', vals: [ true, 'bar' ] } ]

// transition table:

// (1) mod/val         | (2) mod/val       | representation
// --------------------+-------------------+---------------
// foo/(true)          | (none)            | -> a)
// foo/bar             | (none)            | -> b)
// foo/bar             | foo/baz           | -> b) -> c)
// foo/bar             | baz/(true)        | -> b) -> d)
// foo/bar             | baz/bar           | -> b) -> d)
// foo/(true)          | foo/bar           | -> a) -> e)
// foo/(true)          | baz/(true)        | -> a) -> d)
// foo/(true)          | baz/bar           | -> a) -> d)

BemDecl.prototype.handleModOnly = function (block, entity) {
    var singular = _.has(block, 'mod'),
        plural   = _.has(block, 'mods'),
        hasVal   = ! _.isBoolean(entity.modVal);

    if (!singular && !plural) {
        if (hasVal) {
            // -> b)
            block['mods'] = [
                { mod: entity.modName, val: entity.modVal }
            ];
        }
        else {
            // -> a)
            block['mod'] = entity.modName;
        }
    }
    else if (singular) {
        var prev = block['mod'];

        delete block['mod'];

        if (hasVal && prev === entity.modName) {
            // a) -> e)
            block['mods'] = [
                { mod: prev, vals: [ true, entity.modVal ] }
            ];
        }
        else if (hasVal && prev !== entity.modName) {
            // a) -> d)
            block['mods'] = [
                { mod: prev, val: true },
                { mod: entity.modName, val: entity.modVal }
            ];
        }
        else {
            // a) -> d)
            block['mods'] = [
                { mod: prev, val: true },
                { mod: entity.modName, val: true }
            ];
        }
    }
    else if (plural) {
        var pos = _.findIndex(block['mods'], { mod: entity.modName });

        if (pos !== -1) {
            var mods = block['mods'][pos],
                hasVals = _.has(mods, 'vals');

            if (hasVals) {
                // c) -> c)
                // skip, if already have this value in vals
                if ( _.indexOf(mods['vals'], entity.modVal) === -1) {
                    mods['vals'].push(entity.modVal);
                }
            }
            else {
                // b) -> c)
                var val = mods['val'];

                delete mods['val'];

                mods['vals'] = [ val, entity.modVal ];
            }
        }
        else {
            // b) -> d)
            block['mods'].push({ mod: entity.modName, val: entity.modVal });
        }
    }

    return block;
};

BemDecl.prototype.decl = function() {
    var order = [],
        decl = [];

    _.each(this.listParsed(), function (item) {
        var index    = _.indexOf(order, item.block),
            hasElem = ! _.isUndefined(item.elem),
            hasMod  = ! _.isUndefined(item.modName);

        if (index === -1) {
            order.push(item.block);
            index = order.length - 1;
            decl.push({ block: item.block });
        }

        // TODO: each entity
        // 1) block + elem + mod
        // 2) block + elem
        // 3) block + mod

        // exists element
        if (hasElem) {
            decl[index] = this.handleElemOnly(decl[index], item);
        }

        // exists modifier
        if (hasMod) {
            decl[index] = this.handleModOnly(decl[index], item);
        }
    }, this);

    return decl;
    // несколько элементов с модификаторами (одно значение)
    // {
    //     block : 'b-foo',
    //     elems : [
    //         { elem : 'bar' },
    //         {
    //             elem : 'baz',
    //             mods : [
    //                 { mod: 'qux' : val: 'quux' }
    //             ]
    //         }
    //     ]
    // }
    // // несколько элементов с модификаторами (несколько значений)
    // {
    //     block : 'b-foo',
    //     elems : [
    //         { elem : 'bar' },
    //         {
    //             elem : 'baz',
    //             mods : [
    //                 { mod: 'qux' : vals: [ 'quux1', 'quux2' ] }
    //             ]
    //         }
    //     ]
    // }
};

module.exports = new BemDecl({ debug: false });
