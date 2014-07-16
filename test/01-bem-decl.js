/* global describe, it, before, after, beforeEach, afterEach */
//
// bem-decl.js tests
//
var BemDecl = require('../lib/bem-decl'),
    bd = new BemDecl(),
    should = require('should'),
    fs = require('fs'),
    path = require('path');

require('mocha');

var loadFixture = function (name) {
    var base = path.join('test', 'fixtures'),
        tFile = path.join(base, name + '.html'),
        eFile = path.join(base, name + '.json');

    return {
        template: fs.readFileSync(tFile, {encoding: 'utf8'}),
        expected: JSON.parse(fs.readFileSync(eFile, {encoding: 'utf8'}))
    };
};

describe('bem-decl', function() {

    describe('clear()', function(){
        beforeEach(function(){
            bd.stash = [ { block: 'b-foo', elem: undefined, modName: undefined, modVal: undefined } ];
            bd.seen  = { 'b-foo' : true };
            bd.matched = [ 'b-foo' ];
        });

        it('should have an empty stash list', function(){
            bd.clear();
            bd.stash.should.be.eql([]);
        });

        it('should have an empty seen hash', function(){
            bd.clear();
            bd.seen.should.be.eql({});
        });

        it('should have an empty matched list', function(){
            bd.clear();
            bd.matched.should.be.eql([]);
        });
    });

    describe('push()', function(){
        afterEach(function(){
            bd.stash = [];
            bd.seen  = {};
        });

        it('should parse valid class', function(){
            bd.push('b-foo');
            bd.stash.should.have.length(1);
        });

        it('should catch invalid class', function(){
            bd.push('b-fo%');
            bd.stash.should.have.length(0);
        });

        it('should add to seen blocks', function(){
            bd.push('b-foo');
            bd.seen.should.be.eql({ 'b-foo': true });
        });

        it('should not add to seen blocks if elem exists', function(){
            bd.push('b-foo__bar');
            bd.seen.should.be.eql({});
        });

        it('should not add to seen blocks if mod exists', function(){
            bd.push('b-foo_bar');
            bd.seen.should.be.eql({});
        });

        it('should not add to seen blocks if elem & mod exists', function(){
            bd.push('b-foo__bar_baz_qux');
            bd.seen.should.be.eql({});
        });

        it('should not add to seen blocks if block already added', function(){
            bd.seen = { 'b-foo' : true };
            bd.push('b-foo');
            bd.stash.should.have.length(1);
        });

        it('should not add to seen blocks if block already added, elem and mod exists', function(){
            bd.seen = { 'b-foo' : true };
            bd.push('b-foo__bar_baz_qux');
            bd.stash.should.have.length(1);
        });
    });

    describe('parsed()', function(){
        beforeEach(function(){
            bd.stash = [
                { block: 'b-foo', elem: 'bar', modName: undefined, modVal: undefined },
                { block: 'b-bar', elem: 'foo', modName: undefined, modVal: undefined },
            ];
            bd.seen = {
                'b-foo' : true,
                'b-bar' : true,
                'b-baz' : true
            };
            bd.allowed = [
                'b-foo',
                'b-bar',
                'b-baz'
            ];
        });

        after(function(){
            bd.allowed = [];
        });

        it('should return correct count of blocks', function(){
            bd.parsed().should
                            .containDeep([ { block: 'b-foo' }, { block: 'b-bar' } ])
                            .and.have.length(2);
        });

        it('should filter duplicate blocks', function(){
            bd.stash.push({ block: 'b-baz', elem: 'aaa', modName: undefined, modVal: undefined });
            bd.stash.push({ block: 'b-baz', elem: 'bbb', modName: 'ccc', modVal: undefined });
            bd.stash.push({ block: 'b-baz', elem: 'aaa', modName: undefined, modVal: undefined });
            bd.stash.push({ block: 'b-baz', elem: 'bbb', modName: 'ccc', modVal: undefined });

            bd.parsed().should
                            .containDeep([ { block: 'b-foo' }, { block: 'b-bar' }, { block: 'b-baz' } ])
                            .and.have.length(4);
        });

        it('should filter not seen blocks', function(){
            bd.stash.push({ block: 'b-xxx', elem: 'ccc', modName: 'ddd', modVal: 'eee' });
            bd.stash.push({ block: 'b-zzz', elem: 'aaa', modName: undefined, modVal: undefined });

            bd.parsed().should
                            .not.containDeep([ { block: 'b-xxx' }, { block: 'b-zzz' } ])
                            .and.have.length(2);
        });

        it('should filter not allowed blocks', function(){
            bd.seen['b-xxx'] = true;
            bd.stash.push({ block: 'b-xxx', elem: 'ccc', modName: 'ddd', modVal: 'eee' });

            bd.parsed().should
                            .not.containDeep([ { block: 'b-xxx' } ])
                            .and.have.length(2);
        });
    });

    describe('toMod()', function(){
        it('should return "mods" for non-boolean mod', function(){
            var entity = {
                modName: 'foo',
                modVal: 'bar'
            };

            var got = bd.toMod(entity);

            got.should.be.eql({
                key: 'mods',
                val: [
                    { mod: 'foo', val: 'bar' }
                ]
            });
        });

        it('should return "mod" for boolean mod', function(){
            var entity = {
                modName: 'foo',
                modVal: true
            };

            var got = bd.toMod(entity);

            got.should.be.eql({
                key: 'mod',
                val: 'foo'
            });
        });
    });

    describe('found()', function(){
        beforeEach(function(){
            bd.clear();
        });

        it('should return non empty matched list', function(){
            bd.matched = [ 'b-foo', 'b-bar__baz' ];
            bd.found().should.be.eql([
                'b-foo',
                'b-bar__baz'
            ]);
        });

        it('should return empty mathed list', function(){
            bd.found().should.have.length(0);
        });
    });

    describe('handleElemOnly()', function(){
        var block,
            entity;

        before(function(){
            bd.parse('');
        });

        beforeEach(function(){
            block = { block: 'b-foo' };
            entity = { elem: 'bar' };
        });

        it('should add "elem" key to empty block', function(){
            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', elem: 'bar' });
        });

        it('should cast "elem" to "elems" if element not exists', function(){
            block.elem = 'quux';

            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', elems: [ 'quux', 'bar' ] });
        });

        it('should not cast "elem" to "elems" if element exists', function(){
            block.elem = 'bar';

            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', elem: 'bar' });
        });

        it('should not add existed element to "elems"', function(){
            block.elems = [ 'bar', 'qux' ];

            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', elems: [ 'bar', 'qux' ] });
        });

        it('should add non-existent element to "elems"', function(){
            block.elems = [ 'qux', 'quux' ];

            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', elems: [ 'qux', 'quux', 'bar' ] });
        });

        it('should add non-existent element (as object) to "elems"', function(){
            block.elems = [ { elem: 'qux' } ];

            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                elems: [
                    { elem: 'qux' },
                    { elem: 'bar' }
                ]
            });
        });

        it('should not add existed element (as object) to "elems"', function(){
            block.elems = [ { elem: 'bar' }, { elem: 'qux' } ];

            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                elems: [
                    { elem: 'bar' },
                    { elem: 'qux' }
                ]
            });
        });
    });

    describe('handleModOnly()', function(){
        var block, entity;

        before(function(){
            bd.parse('');
        });

        beforeEach(function(){
            block = { block: 'b-foo' };
            entity = { modName: 'bar', modVal: 'baz' };
        });

        it('should add to "mods" for non-boolean "mod"', function(){
            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'bar', val: 'baz' }
                ]
            });
        });

        it('should add to "mod" for boolean "mod"', function(){
            entity.modVal = true;

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', mod: 'bar' });
        });

        it('should cast "mod" to "mods" for another boolean "mod"', function(){
            entity.modVal = true;
            block.mod = 'quux';

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'quux', val: true },
                    { mod: 'bar', val: true }
                ]
            });
        });

        it('should cast "mod" to "mods" for another non-boolean "mod"', function(){
            block.mod = 'quux';

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'quux', val: true },
                    { mod: 'bar', val: 'baz' }
                ]
            });
        });

        it('should cast "val" to "vals" for the same non-boolean "mod"', function(){
            block.mod = 'bar';

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'bar', vals: [ true, 'baz' ] }
                ]
            });
        });

        it('should add to "mods" any other "mod"', function(){
            block.mods = [
                { mod: 'quux', val: '42' }
            ];

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'quux', val: '42' },
                    { mod: 'bar', val: 'baz' }
                ]
            });
        });

        it('should cast "val" to "vals" for existed "mod"', function(){
            block.mods = [
                { mod: 'quux', val: '42' },
                { mod: 'bar', val: true }
            ];

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'quux', val: '42' },
                    { mod: 'bar', vals: [ true, 'baz' ] }
                ]
            });
        });

        it('should add to "vals" for existed "mod"', function(){
            block.mods = [
                { mod: 'bar', vals: [ 'a', 'b' ] }
            ];

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'bar', vals: [ 'a', 'b', 'baz' ] }
                ]
            });
        });

        it('should not add to "vals" for "mod" if value already in list', function(){
            block.mods = [
                { mod: 'bar', vals: [ 'baz', 'b' ] }
            ];

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'bar', vals: [ 'baz', 'b' ] }
                ]
            });
        });

    });

    describe('handleElemMod()', function(){
        var block,
            entity,
            em;

        before(function(){
            em = loadFixture('elems_mods');
            bd.parse('');
        });

        beforeEach(function(){
            block = { block: 'b-foo' };
            entity = { elem: 'bar', modName: 'qux', modVal: true };
        });

        it('should wrap to "elems" for boolean "mod" and "elem" (A)', function(){
            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseA);
        });

        it('should wrap to "elems" for non-boolean "mod" and "elem" (B)', function(){
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseB);
        });

        it('should cast "elem" to "elems" for boolean "mod" and "elem" (C)', function(){
            block.elem = 'foo';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseC);
        });

        it('should cast "elem" to "elems" for non-boolean "mod" and "elem" (D)', function(){
            block.elem = 'foo';
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseD);
        });

        it('should add to "elems" non-existent "elem" with boolean "mod" (E)', function(){
            block.elems = [ { elem: 'foo' } ];

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseE);
        });

        it('should add to "elems" non-existent "elem" with non-boolean "mod" (F)', function(){
            block.elems = [ { elem: 'foo' } ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseF);
        });

        it('should add to "mods" non-existent non-boolean "mod" (G)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'bar', val: 'baz' } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseG);
        });

        it('should cast "val" to "vals" for non-existent "val" the same "mod" (H)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux', val: 'baz' } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseH);
        });

        it('should not cast "val" to "vals" the same "mod" for existed "val" (I)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux', val: 'quux' } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseI);
        });

        it('should add to "vals" non-existent "val" for the same "mod" (J)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux', vals: [ 'aaa', 'bbb' ] } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseJ);
        });

        it('should not add to "vals" existed "val" for the same "mod" (K)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux', vals: [ 'quux', 'xxx' ] } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseK);
        });

        it('should cast empty to "vals" non-existent "val" for the same "mod" (L)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux' } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseL);
        });

        it('should not cast empty to "vals" the same "val" for the same "mod" (M)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux' } ] }
            ];

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseM);
        });

        it('should cast "mod" to "mods" for different "mod" (N)', function(){
            block.elems = [
                { elem: 'bar', mod: 'aaa' }
            ];

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseN);
        });

        it('should cast "mod" to "mods" for different non-boolean "mod" (O)', function(){
            block.elems = [
                { elem: 'bar', mod: 'aaa' }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseO);
        });

        it('should not cast "mod" to "mods" for the same boolean "mod" (P)', function(){
            block.elems = [
                { elem: 'bar', mod: 'qux' }
            ];

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseP);
        });

        it('should cast "mod" to "mods" for the same non-boolean "mod" (Q)', function(){
            block.elems = [
                { elem: 'bar', mod: 'qux' }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseQ);
        });
    });

    describe('inline (simple)', function(){
        before(function(){
            bd.parse( '<p class="b-text b-text_size_15 b-foo b-foo__bar"></p>' );
        });

        it('should return correct length list of found entities', function() {
            bd.found().should.have.length(4);
        });

        it('should deeply match found entities', function() {
            bd.found().should.be.eql([
                'b-text',
                'b-text_size_15',
                'b-foo',
                'b-foo__bar'
            ]);
        });

        it('should return correct length list of parsed blocks', function() {
            bd.parsed().should.have.length(4);
        });

        it('should deeply match parsed blocks', function() {
            bd.parsed().should.be.eql([
                { block: 'b-text', elem: null, modName: null, modVal: null },
                { block: 'b-text', elem: null, modName: 'size', modVal: '15' },
                { block: 'b-foo', elem: null, modName: null, modVal: null },
                { block: 'b-foo', elem: 'bar', modName: null, modVal: null }
            ]);
        });

        it('should return correct length of declaration', function() {
            bd.decl().should.have.length(2);
        });

        it('should return correct declaration', function() {
            bd.decl().should.be.eql([
                { block: 'b-text', mods: [ { mod: 'size', val: 15 } ] },
                { block: 'b-foo', elem: 'bar' }
            ]);
        });
    });

    describe('elem: singular/plural forms', function() {
        var elems;

        before(function(){
            elems = loadFixture('elems');
            bd.parse(elems.template);
        });

        it('should return correct length list of blocks', function() {
            bd.decl().should.have.length(elems.expected.decl.length);
        });

        it('should return correct form for the "elem"', function() {
            bd.decl().should.be.eql(elems.expected.decl);
        });
    });

    describe('mod: singular/plural forms', function() {
        var mods;

        before(function(){
            mods = loadFixture('mods');
            bd.parse(mods.template);
        });

        it('should return correct length list of blocks', function() {
            bd.decl().should.have.length(mods.expected.decl.length);
        });

        it('should return correct form for the "mod"', function() {
            bd.decl().should.be.eql(mods.expected.decl);
        });
    });

    describe('basic template', function() {
        var basic;

        before(function(){
            basic = loadFixture('basic');
            bd.parse( basic.template );
        });

        it('should return correct length list of entities', function() {
            bd.found().should.have.length(basic.expected.found.length);
        });

        it('should deeply match found entities', function() {
            bd.found().should.be.eql(basic.expected.found);
        });

        it('should return correct length list of blocks', function() {
            bd.parsed().should.have.length(basic.expected.parsed.length);
        });

        it('should deeply match parsed blocks', function() {
            bd.parsed().should.be.eql(basic.expected.parsed);
        });
    });

    describe('github issue #4', function(){
        var text = 'b-foo b-foo__xxx b-foo__zzz b-foo__zzz_color_red b-foo__xxx';

        before(function(){
            bd.parse( text );
        });

        it('should correct cast "elems" (strings) to "elems" (objects)', function(){
            bd.decl().should.be.eql([
                {
                    block: 'b-foo',
                    elems: [
                        { elem: 'xxx' },
                        {
                            elem: 'zzz',
                            mods: [ { mod: 'color', val: 'red' } ]
                        }
                    ]
                }
            ]);
        });
    });

});
