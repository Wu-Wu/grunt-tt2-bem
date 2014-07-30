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

_.mixin({ 'gap': function (count) {
    var gap = '';
    while (count-- > 0) {
        gap += '  ';
    }
    return gap;
}}, { chain: false });


var BemDecl = function (options) {
    options = options || {};

    this.options = _.defaults(options, {
        debug: false,
        prefixes: [ 'b', 'i', 'l' ],    // used prefixes
        allowed: []                     // allowed block names
    });

    this.debug = this.options.debug;
    this.allowed = this.options.allowed;

    var literal = '[-a-zA-Z0-9]',
        modSep = '_',
        elemSep = '__',
        word = literal + '+',
        block = '((' + this.options.prefixes.join('|') + ')-' + word + ')',
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
    this.clear();
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

BemDecl.prototype.isSeen = function (item) {
    return this.seen[item.block] ? true : false;
};

BemDecl.prototype.isAllowed = function (item) {
    if (this.allowed.length) {
        return _.indexOf(this.allowed, item.block) !== -1 ? true : false;
    }
    else {
        return true;
    }
};

// because of tt2 expressions like this: "b-footer__benefits-[% ru ? 'ru' : 'en' %]_logo_1"
BemDecl.prototype.isNotBroken = function (item) {
    return /-$/.test(item.elem) ? false : /-$/.test(item.modName) ? false : true;
};

BemDecl.prototype.parsed = function() {
    return _.chain(this.stash)
                .filter(this.isSeen, this)
                .filter(this.isAllowed, this)
                .filter(this.isNotBroken, this)
                .compact()
                .uniq(function (item) { return JSON.stringify(item); })
                .value();
};

BemDecl.prototype.logg = function (level, message) {
    if (this.debug) {
        console.log(_.gap(level) + message);
    }
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
        this.logg(1, 'no singular or plural: -> "elem"');
        block.elem = entity.elem;
    }
    else if (singular) {
        // cast singular to plural
        var prev = block.elem;
        this.logg(1, 'present singular: E = ' + prev);
        if (prev !== entity.elem) {
            this.logg(2, 'not equal to E = ' + entity.elem + ': cast "elem" -> "elems"');
            delete block.elem;
            block.elems = [ prev, entity.elem ];
        }
    }
    else if (plural) {
        // +element to plural
        this.logg(1, 'present plural');
        if (_.isObject(block.elems[0])) {
            this.logg(2, 'as Array of Objects...');
            // "elems" like [ { elem: "a" }, { elem: "b" } ] (Array-Of-Objects)
            if (_.findIndex(block.elems, { elem: entity.elem }) === -1) {
                this.logg(3, 'push E = ' + entity.elem + ' as Object');
                // not yet exists in "elems"
                block.elems.push({ elem: entity.elem });
            }
        }
        else {
            this.logg(2, 'as Array of Strings...');
            // "elems" like [ "a", "b" ] (Array-Of-Scalars)
            if (_.indexOf(block.elems, entity.elem) === -1) {
                this.logg(3, 'push E = ' + entity.elem + ' as String');
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
        this.logg(1, 'no singular or plural');
        // not exists "mod", nor "mods"
        var mod = this.toMod(entity);
        // -> a) && -> b)
        block[ mod.key ] = mod.val;
        this.logg(2, '-> "' + mod.key + '"');
    }
    else if (singular) {
        // exists "mod"
        var prev = block.mod;
        delete block.mod;

        this.logg(1, 'present singular: M = ' +  prev + ': cast "mod" -> "mods"');

        if (hasVal && prev === entity.modName) {
            this.logg(2, 'equal to M = ' + entity.modName + ': cast "val" -> "vals"');
            // a) -> e)
            block.mods = [
                { mod: prev, vals: [ true, entity.modVal ] }
            ];
        }
        else {
            this.logg(2, 'push M = ' + entity.modName + ' to "mods"');
            // a) -> d)
            block.mods = [
                { mod: prev, val: true },
                { mod: entity.modName, val: entity.modVal }
            ];
        }
    }
    else if (plural) {
        // exists "mods"
        this.logg(1, 'present plural');
        var pos = _.findIndex(block.mods, { mod: entity.modName });

        if (pos !== -1) {
            this.logg(2, 'found M = ' + entity.modName + 'in "mods"');
            var mods = block.mods[pos];
            // c) -> c) && b) -> c)
            mods = this.transformVal(mods, entity);
        }
        else {
            this.logg(2, 'not found M = ' + entity.modName + 'in "mods"');
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

// handle elem + mod if present "elems"
BemDecl.prototype.emPluralElem = function (elems, entity) {
    var hasModVal = ! _.isBoolean(entity.modVal),
        mod;

    var posAsObject = _.findIndex(elems, { elem: entity.elem }),
        posAsString = _.indexOf(elems, entity.elem);

    this.logg(1, 'present plural');

    if (posAsObject !== -1 && posAsString === -1) {
        // "elems" as array of objects
        // found current elem in "elems"
        var me = elems[posAsObject],
            singular = _.has(me, 'mod'),
            plural = _.has(me, 'mods');

        this.logg(2, 'found E = ' + entity.elem + ' in "elems" as Object');

        if (!singular && !plural) {
            this.logg(3, 'absent singular or plural');

            var modY = this.toMod(entity);
            me[ modY.key ] = modY.val;
            this.logg(4, 'M = ' + entity.modName + ': add "' + modY.key + '"');
        }
        else if (singular && !plural) {
            this.logg(3, 'present "mod"');
            // exists "mod" (only)
            if (me.mod !== entity.modName) {
                // different mods
                // cast "mod" -> "mods"
                var was = me.mod;
                delete me.mod;

                this.logg(4, was + ' not equal M = ' + entity.modName + ': cast "mod" -> "mods"');

                me.mods = [
                    { mod: was },
                    { mod: entity.modName }
                ];

                if (hasModVal) {
                    // set new mod's "val"
                    me.mods[1].val = entity.modVal;
                    this.logg(5, 'set value ' + entity.modVal + ' for this');
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

                    this.logg(4, ' not equal M = ' + entity.modName + ': cast "val" -> "vals"');
                }
            }
        }
        else if (!singular && plural) {
            this.logg(3, 'present "mods"');
            // exists "mods" (only)
            var current = _.findIndex(elems[posAsObject].mods, { mod: entity.modName });

            if (current !== -1) {
                this.logg(4, 'found M = ' + entity.modName);
                // the current mod found in "mods"
                var exMod = elems[posAsObject].mods[current];
                exMod = this.transformVal(exMod, entity);
            }
            else {
                this.logg(4, 'not found M = ' + entity.modName);
                // the current mod not found in "mods"
                // add new mod object to "mods"
                elems[posAsObject].mods.push({ mod: entity.modName, val: entity.modVal });
            }
        }
    }
    else if (posAsString !== -1 && posAsObject === -1) {
        this.logg(2, 'found E = ' + entity.elem + ' in "elems" as String');
        // "elems" as array of strings
        elems = _.map(elems, function (elem) {
            var el = { elem: elem };

            if (elem === entity.elem) {
                var modX = this.toMod(entity);

                el[ modX.key ] = modX.val;
            }

            return el;
        }, this);
    }
    else {
        this.logg(2, 'not found E = ' + entity.elem + ' in "elems"');
        // element not found in "elems"
        elems.push({ elem: entity.elem });
        // new element's index
        mod = this.toMod(entity);

        elems[ elems.length - 1 ][ mod.key ] = mod.val;
    }

    return elems;
};

BemDecl.prototype.handleElemMod = function (block, entity) {
    var singular = _.has(block, 'elem'),
        plural = _.has(block, 'elems'),
        mod,
        elemIndex = 0;

    if (!singular && !plural) {
        // absent both forms
        this.logg(1, 'no singular or plural');
        block.elems = [];

        block.elems.push({ elem: entity.elem });
        this.logg(1, 'push E = ' + entity.elem + ' to "elems" as Object');

        mod = this.toMod(entity);
        block.elems[ elemIndex ][ mod.key ] = mod.val;
        this.logg(1, 'set M to "' + mod.key + '"');
    }
    else if (singular) {
        // present singular (elem)
        this.logg(1, 'present singular: cast "elem" -> "elems"');
        var prev = block.elem;

        delete block.elem;
        block.elems = [];

        // save previous element
        block.elems.push({ elem: prev });

        if (prev !== entity.elem) {
            this.logg(1, 'push E = ' + entity.elem + ' to "elems" as Object');
            // current element to this list
            block.elems.push({ elem: entity.elem });
            // add "mod" to this element
            elemIndex = 1;
        }

        // save "mod"
        mod = this.toMod(entity);
        block.elems[ elemIndex ][ mod.key ] = mod.val;
        this.logg(1, 'set M to "' + mod.key + '"');
    }
    else if (plural) {
        block.elems = this.emPluralElem(block.elems, entity);
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
            this.logg(0, 'elem-mod: E = ' + item.elem + '; M = ' + item.modName);
            decl[index] = this.handleElemMod(decl[index], item);
        }
        // exists element
        else if (hasElem) {
            this.logg(0, 'elem-only: E = ' + item.elem);
            decl[index] = this.handleElemOnly(decl[index], item);
        }
        // exists modifier
        else if (hasMod) {
            this.logg(0, 'mod-only: M = ' + item.modName);
            decl[index] = this.handleModOnly(decl[index], item);
        }

    }, this);

    return decl;
};

module.exports = BemDecl;
