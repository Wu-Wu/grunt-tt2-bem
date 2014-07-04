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
    this.options = _.defaults(options, {
        debug: false,
        prefix: [ 'b', 'i', 'l' ]
    });

    this.debug = this.options.debug;

    var literal = '[-a-zA-Z0-9]',
        modSep = '_',
        elemSep = '__',
        word = literal + '+',
        block = '((' + this.options.prefix.join('|') + ')-' + word + ')',
        mod = '(?:' + modSep + '(' + word + '))?',
        elem = '(?:' + elemSep + '(' + word + '))?';

    this.re = new RegExp('\\b' + block + elem + mod + mod, 'g');

    // console.log('re:', this.re);

    this.clear();
};

BemDecl.prototype.clear = function() {
    this.stash = [];
    this.seen = {};
    this.matched = [];
};

BemDecl.prototype.parse = function (text) {
    this.matched = text.match(this.re);
    _.each(this.matched, this.push, this);
};

BemDecl.prototype.push = function (item) {
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

BemDecl.prototype.found = function () {
    return this.matched;
};

BemDecl.prototype.parsed = function() {
    return _.chain(this.stash)
                .filter(function (item) { return this.seen[item.block] ? true : false; }, this)
                .compact()
                .uniq(function (item) { return JSON.stringify(item); })
                .value();
};

// representations:

// a) elem: 'foo'
// b) elems: [ 'foo', 'bar' ]
// c) elems: [ { elem: 'foo' }, { elem: 'bar' } ]

// transition table:

// (1) elem            | (2) elem          | representation
// --------------------+-------------------+---------------
// foo                 | (none)            | -> a)
// foo                 | foo               | -> a) -> a)
// foo                 | bar               | -> a) -> b)
// foo (+ mod*)        | bar               | -> c)

// * state by handleElemMod()

BemDecl.prototype.handleElemOnly = function (block, entity) {
    var singular = _.has(block, 'elem'),
        plural   = _.has(block, 'elems');

    if (!singular && !plural) {
        // +element to singular
        block.elem = entity.elem;
    }
    else if (singular) {
        // cast singular to plural
        var prev = block.elem;
        if (prev !== entity.elem) {
            delete block.elem;
            block.elems = [ prev, entity.elem ];
        }
    }
    else if (plural) {
        // +element to plural
        if (_.isObject(block.elems[0])) {
            // "elems" like [ { elem: "a" }, { elem: "b" } ] (Array-Of-Objects)
            if (_.findIndex(block.elems, { elem: entity.elem }) === -1) {
                // not yet exists in "elems"
                block.elems.push({ elem: entity.elem });
            }
        }
        else {
            // "elems" like [ "a", "b" ] (Array-Of-Scalars)
            if (_.indexOf(block.elems, entity.elem) === -1) {
                // not yet exists in "elems"
                block.elems.push(entity.elem);
            }
        }
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
        // not exists "mod", nor "mods"
        var mod = this.toMod(entity);
        // -> a) && -> b)
        block[ mod.key ] = mod.val;
    }
    else if (singular) {
        // exists "mod"
        var prev = block.mod;
        delete block.mod;

        if (hasVal && prev === entity.modName) {
            // a) -> e)
            block.mods = [
                { mod: prev, vals: [ true, entity.modVal ] }
            ];
        }
        else {
            // a) -> d)
            block.mods = [
                { mod: prev, val: true },
                { mod: entity.modName, val: entity.modVal }
            ];
        }
    }
    else if (plural) {
        // exists "mods"
        var pos = _.findIndex(block.mods, { mod: entity.modName });

        if (pos !== -1) {
            var mods = block.mods[pos];
            // c) -> c) && b) -> c)
            mods = this.transformVal(mods, entity);
        }
        else {
            // b) -> d)
            block.mods.push({ mod: entity.modName, val: entity.modVal });
        }
    }

    return block;
};

BemDecl.prototype.toMod = function (entity) {
    // default - plural
    var hasVal = ! _.isBoolean(entity.modVal),
        mod = {
            key: 'mods',
            val: [
                { mod: entity.modName, val: entity.modVal }
            ]
        };

    if (!hasVal) {
        // switch to singular
        mod.key = 'mod';
        mod.val = entity.modName;
    }

    return mod;
};

BemDecl.prototype.handleElemMod = function (block, entity) {
    var hasElemS = _.has(block, 'elem'),
        hasElemP = _.has(block, 'elems'),
        hasModVal = ! _.isBoolean(entity.modVal),
        mod,
        elemIndex;

    if (!hasElemS && !hasElemP) {
        // absent both forms
        block.elems = [];

        block.elems.push({ elem: entity.elem });

        mod = this.toMod(entity);
        block.elems[0][ mod.key ] = mod.val;
    }
    else if (hasElemS) {
        // present singular (elem)
        var prev = block.elem;

        elemIndex = 0;

        delete block.elem;

        block.elems = [];

        // save previous element
        block.elems.push({ elem: prev });

        if (prev !== entity.elem) {
            // current element to this list
            block.elems.push({ elem: entity.elem });
            // add "mod" to this element
            elemIndex = 1;
        }

        // save "mod"
        mod = this.toMod(entity);
        block.elems[ elemIndex ][ mod.key ] = mod.val;
    }
    else if (hasElemP) {
        // present plural (elems)
        var pos = _.findIndex(block.elems, { elem: entity.elem });

        if (pos !== -1) {
            // found current elem in "elems"
            var me = block.elems[pos],
                hasModS = _.has(me, 'mod'),
                hasModP = _.has(me, 'mods');

            if (hasModS && !hasModP) {
                // exists "mod" (only)
                if (me.mod !== entity.modName) {
                    // different mods
                    // cast "mod" -> "mods"
                    var was = me.mod;
                    delete me.mod;

                    me.mods = [
                        { mod: was },
                        { mod: entity.modName }
                    ];

                    if (hasModVal) {
                        // set new mod's "val"
                        me.mods[1].val = entity.modVal;
                    }
                }
                else {
                    // the same mod
                    if (hasModVal) {
                        // cast "mod" -> "mods"
                        delete me.mod;

                        // TODO: should be saved boolean?
                        me.mods = [
                            { mod: entity.modName, vals: [ true, entity.modVal ] }
                        ];
                    }
                }
            }
            else if (!hasModS && hasModP) {
                // exists "mods" (only)
                var current = _.findIndex(block.elems[pos].mods, { mod: entity.modName });

                if (current !== -1) {
                    // the current mod found in "mods"
                    var exMod = block.elems[pos].mods[current];
                    exMod = this.transformVal(exMod, entity);
                }
                else {
                    // the current mod not found in "mods"
                    // add new mod object to "mods"
                    block.elems[pos].mods.push({ mod: entity.modName, val: entity.modVal });
                }
            }
        }
        else {
            // element not found in "elems"
            block.elems.push({ elem: entity.elem });
            // new element's index
            elemIndex = block.elems.length - 1;
            mod = this.toMod(entity);

            block.elems[ elemIndex ][ mod.key ] = mod.val;
        }
    }

    return block;
};

// transforms "val" to "vals" based on mod's state and current entity
BemDecl.prototype.transformVal = function (mod, entity) {
    var singular = _.has(mod, 'val'),
        plural = _.has(mod, 'vals');

    if (singular && !plural) {
        // exists "val"
        if (mod.val !== entity.modVal) {
            // cast "val" -> "vals"
            var savedVal = mod.val;
            delete mod.val;
            mod.vals = [ savedVal, entity.modVal ];
        }
    }
    else if (!singular && plural) {
        // exists "vals"
        if (_.indexOf(mod.vals, entity.modVal) === -1) {
            // add new val to list
            mod.vals.push(entity.modVal);
        }
    }
    else {
        // not exists "val", nor "vals"
        if (! _.isBoolean(entity.modVal)) {
            // cast empty -> "vals" (if has new val)
            // TODO: should be saved boolean?
            mod.vals = [ true, entity.modVal ];
        }
    }

    return mod;
};

BemDecl.prototype.decl = function() {
    var order = [],
        decl = [];

    _.each(this.parsed(), function (item) {
        var index    = _.indexOf(order, item.block),
            hasElem = ! _.isUndefined(item.elem),
            hasMod  = ! _.isUndefined(item.modName);

        if (index === -1) {
            order.push(item.block);
            index = order.length - 1;
            decl.push({ block: item.block });
        }

        // exists element & modifier
        if (hasElem && hasMod) {
            decl[index] = this.handleElemMod(decl[index], item);
        }
        // exists element
        else if (hasElem) {
            decl[index] = this.handleElemOnly(decl[index], item);
        }
        // exists modifier
        else if (hasMod) {
            decl[index] = this.handleModOnly(decl[index], item);
        }

    }, this);

    return decl;
};

module.exports = BemDecl;
