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

BemDecl.prototype.decl = function() {
    var order = [],
        decl = [];

    _.each(this.listParsed(), function (item) {
        var index    = _.indexOf(order, item.block),
            hasElem = ! _.isUndefined(item.elem),
            hasMod  = ! _.isUndefined(item.modName),
            hasVal  = ! _.isBoolean(item.modVal);

        if (index === -1) {
            order.push(item.block);
            index = order.length - 1;
            decl.push({ block: item.block });
        }

        // exists element
        if (hasElem) {
            var singular = _.has(decl[index], 'elem'),
                plural   = _.has(decl[index], 'elems');

            if (!singular && !plural) {
                // +element to singular
                decl[index]['elem'] = item.elem;
            }
            else if (singular) {
                // cast singular to plural
                var prev= decl[index]['elem'];
                delete decl[index]['elem'];
                decl[index]['elems'] = [ prev, item.elem ];
            }
            else if (plural) {
                // +element to plural
                decl[index]['elems'].push(item.elem);
            }
            else {
            }
        }

        // exists modifier
        if (hasMod) {
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
            // foo/(true)          | foo/bar           | -> a) -> e)
            // foo/(true)          | baz(true)         | -> a) -> d)

            var singular = _.has(decl[index], 'mod'),
                plural   = _.has(decl[index], 'mods');

            if (!singular && !plural) {
                if (hasVal) {
                    // -> b)
                    decl[index]['mods'] = [
                        { mod: item.modName, val: item.modVal }
                    ];
                }
                else {
                    // -> a)
                    decl[index]['mod'] = item.modName;
                }
            }
            else if (singular) {
                var prev = decl[index]['mod'];

                delete decl[index]['mod'];

                if (hasVal && prev === item.modName) {
                    // a) -> e)
                    decl[index]['mods'] = [
                        { mod: prev, vals: [ true, item.modVal ] }
                    ];
                }
                else if (hasVal && prev !== item.modName) {
                    // a) -> d)
                    decl[index]['mods'] = [
                        { mod: prev, val: true },
                        { mod: item.modName, val: item.modVal }
                    ];
                }
                else {
                    // a) -> d)
                    decl[index]['mods'] = [
                        { mod: prev, val: true },
                        { mod: item.modName, val: true }
                    ];
                }
            }
            else if (plural) {
                var pos = _.findIndex(decl[index]['mods'], { mod: item.modName });

                if (pos !== -1) {
                    var hasVals = _.has(decl[index]['mods'][pos], 'vals');

                    if (hasVals) {
                        // c) -> c)
                        decl[index]['mods'][pos]['vals'].push(item.modVal);
                    }
                    else {
                        // b) -> c)
                        var val = decl[index]['mods'][pos]['val'];

                        delete decl[index]['mods'][pos]['val'];

                        decl[index]['mods'][pos]['vals'] = [ val, item.modVal ];
                    }
                }
                else {
                    // b) -> d)
                    decl[index]['mods'].push({ mod: item.modName, val: item.modVal });
                }
            }
        }
    });

    return decl;
    // // блок
    // {
    //     block: 'b-foo'
    // }
    // // элемент
    // {
    //     block : 'b-foo',
    //     elem : 'bar'
    // }
    // // несколько элементов
    // {
    //     block : 'b-foo',
    //     elems : [ 'bar', 'baz' ]
    // }
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
    // // модификатор (без значения)
    // {
    //     block : 'b-foo',
    //     mod : 'bar'
    // }
    // // модификатор с одним значением
    // {
    //     block : 'b-foo',
    //     mods: [
    //         { mod: 'bar', val: 'baz' }
    //     ]
    // }
    // // модификатор с несколькими значениями
    // {
    //     block : 'b-foo',
    //     mods: [
    //         { mod: 'bar', vals: [ 'baz', 'qux' ] }
    //     ]
    // }
};

module.exports = new BemDecl({ debug: false });
