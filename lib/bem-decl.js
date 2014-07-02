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
        block.elems.push(entity.elem);
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
            block.mods = [
                { mod: entity.modName, val: entity.modVal }
            ];
        }
        else {
            // -> a)
            block.mod = entity.modName;
        }
    }
    else if (singular) {
        var prev = block.mod;

        delete block.mod;

        if (hasVal && prev === entity.modName) {
            // a) -> e)
            block.mods = [
                { mod: prev, vals: [ true, entity.modVal ] }
            ];
        }
        else if (hasVal && prev !== entity.modName) {
            // a) -> d)
            block.mods = [
                { mod: prev, val: true },
                { mod: entity.modName, val: entity.modVal }
            ];
        }
        else {
            // a) -> d)
            block.mods = [
                { mod: prev, val: true },
                { mod: entity.modName, val: true }
            ];
        }
    }
    else if (plural) {
        var pos = _.findIndex(block.mods, { mod: entity.modName });

        if (pos !== -1) {
            var mods = block.mods[pos],
                hasVals = _.has(mods, 'vals');

            if (hasVals) {
                // c) -> c)
                // skip, if already have this value in vals
                if ( _.indexOf(mods.vals, entity.modVal) === -1) {
                    mods.vals.push(entity.modVal);
                }
            }
            else {
                // b) -> c)
                var val = mods.val;

                delete mods.val;

                mods.vals = [ val, entity.modVal ];
            }
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
            var me = block.elems[pos],
                hasModS = _.has(me, 'mod'),
                hasModP = _.has(me, 'mods');

            // TODO
            if (hasModS && !hasModP) {

            }
            else if (!hasModS && hasModP) {
                var current = _.findIndex(block.elems[pos].mods, { mod: entity.modName });

                if (current !== -1) {
                    var exMod = block.elems[pos].mods[current],
                        cValS = _.has(exMod, 'val'),
                        cValP = _.has(exMod, 'vals');

                    if (cValS && !cValP) {
                        // exists "val"
                        if (exMod.val !== entity.modVal) {
                            // cast "val" -> "vals"
                            var savedVal = exMod.val;
                            delete exMod.val;
                            exMod.vals = [ savedVal, entity.modVal ];
                        }
                    }
                    else if (!cValS && cValP) {
                        // exists "vals"
                        if (_.indexOf(exMod.vals, entity.modVal) === -1) {
                            // add new val to list
                            exMod.vals.push(entity.modVal);
                        }
                    }
                    else {
                        // not exists "val", nor "vals"
                        if (hasModVal) {
                            // cast empty -> "vals" (if has new val)
                            // TODO: should be saved boolean?
                            exMod.vals = [ true, entity.modVal ];
                        }
                    }
                }
                else {
                    // add new mod object to "mods"
                    block.elems[pos].mods.push({ mod: entity.modName, val: entity.modVal });
                }
            }
            else {
                // WTF?!
                // has nothing || has both
            }

        }
        else {
            // element not found
            block.elems.push({ elem: entity.elem });
            // new element's index
            elemIndex = block.elems.length - 1;
            mod = this.toMod(entity);

            block.elems[ elemIndex ][ mod.key ] = mod.val;
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

module.exports = new BemDecl({ debug: false });
