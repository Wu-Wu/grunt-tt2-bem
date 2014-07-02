/* global describe, it, before, after, beforeEach, afterEach */
//
// bem-decl.js tests
//
var bd = require('../lib/bem-decl'),
    should = require('should'),
    fs = require('fs');

require('mocha');

var loadFixture = function (name) {
    return {
        template: fs.readFileSync('test/fixtures/' + name + '.html', {encoding: 'utf8'}),
        expected: JSON.parse(fs.readFileSync('test/fixtures/'+name+'.json', {encoding: 'utf8'}))
    };
};

describe('bem-decl', function() {

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

    describe('filter()', function(){
        beforeEach(function(){
            bd.stash = [
                { block: 'b-foo', elem: 'bar', modName: undefined, modVal: undefined },
                { block: 'b-bar', elem: 'foo', modName: undefined, modVal: undefined },
            ];
            bd.seen = {
                'b-foo' : true,
                'b-bar' : true
            };
        });

        it('should pass all seen blocks', function(){
            bd.filter();
            bd.stash.should.have.length(2);
        });

        it('should reset not seen blocks', function(){
            delete bd.seen['b-bar'];
            bd.filter();
            bd.stash[1].should.be.eql(false);
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

    describe('handleElemOnly()', function(){
        var block,
            entity = { elem: 'bar' };

        before(function(){
            bd.parse('');
        });

        after(function(){
            bd.clear();
        });

        beforeEach(function(){
            block = { block: 'b-foo' };
        });

        it('should add "elem" key to empty block', function(){
            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', elem: 'bar' });
        });

        it('should add "elems" key to empty block', function(){
            block.elem = 'quux';

            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', elems: [ 'quux', 'bar' ] });
        });

        it('should not pluralize key for the same element', function(){
            block.elem = 'bar';

            var got = bd.handleElemOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', elem: 'bar' });
        });
    });

    describe('handleModOnly()', function(){
        var block, entity;

        before(function(){
            bd.parse('');
        });

        after(function(){
            bd.clear();
        });

        beforeEach(function(){
            block = { block: 'b-foo' };
            entity = { modName: 'bar', modVal: 'baz' };
        });

        it('should add "mods" key for non-boolean "mod"', function(){
            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({
                block: 'b-foo',
                mods: [
                    { mod: 'bar', val: 'baz' }
                ]
            });
        });

        it('should add "mod" key for boolean "mod"', function(){
            entity.modVal = true;

            var got = bd.handleModOnly(block, entity);

            got.should.be.eql({ block: 'b-foo', mod: 'bar' });
        });

        it('should cast list of "mods" for another boolean "mod"', function(){
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

        it('should cast list of "mods" for another non-boolean "mod"', function(){
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

        it('should change to "vals" key for the same non-boolean "mod"', function(){
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

        it('should change to "vals" if "mod" already exists', function(){
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

        it('should add to "vals" if "mod" already exists', function(){
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

        after(function(){
            bd.clear();
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

        it('should transform to "elems" existed "elem" boolean "mod" (C)', function(){
            block.elem = 'foo';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseC);
        });

        it('should transform to "elems" existed "elem" for non-boolean "mod" (D)', function(){
            block.elem = 'foo';
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseD);
        });

        it('should add to "elems" non-existent "elem" w/ boolean "mod" (E)', function(){
            block.elems = [ { elem: 'foo' } ];

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseE);
        });

        it('should add to "elems" non-existent "elem" w/ non-boolean "mod" (F)', function(){
            block.elems = [ { elem: 'foo' } ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseF);
        });

        it('should add to "mods" non-existent "mod" w/ non-boolean "val" (G)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'bar', val: 'baz' } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseG);
        });

        it('should cast "val" to "vals" for non-existent "val" (H)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux', val: 'baz' } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseH);
        });

        it('should not cast "val" to "vals" existed "val" (I)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux', val: 'quux' } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseI);
        });

        it('should add to "vals" non-existent "val" (J)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux', vals: [ 'aaa', 'bbb' ] } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseJ);
        });

        it('should not add to "vals" existed "val" (K)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux', vals: [ 'quux', 'xxx' ] } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseK);
        });

        it('should cast empty to "vals" non-existent "val" (L)', function(){
            block.elems = [
                { elem: 'bar', mods: [ { mod: 'qux' } ] }
            ];
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseL);
        });

        it('should not cast empty to "vals" the same "val" (M)', function(){
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

        after(function(){
            bd.clear();
        });

        describe('listFound()', function(){
            it('should return correct length list of entities', function() {
                bd.listFound().should.have.length(4);
            });

            it('should deeply match found entities', function() {
                bd.listFound().should.be.eql([
                    'b-text',
                    'b-text_size_15',
                    'b-foo',
                    'b-foo__bar'
                ]);
            });
        });

        describe('listParsed()', function(){
            it('should return correct length list of blocks', function() {
                bd.listParsed().should.have.length(4);
            });

            it('should deeply match parsed blocks', function() {
                bd.listParsed().should.be.eql([
                    { block: 'b-text', elem: null, modName: null, modVal: null },
                    { block: 'b-text', elem: null, modName: 'size', modVal: '15' },
                    { block: 'b-foo', elem: null, modName: null, modVal: null },
                    { block: 'b-foo', elem: 'bar', modName: null, modVal: null }
                ]);
            });
        });

        describe('decl()', function(){
            it('should return correct length list of blocks', function() {
                bd.decl().should.have.length(2);
            });

            it('should return correct declaration', function() {
                bd.decl().should.be.eql([
                    { block: 'b-text', mods: [ { mod: 'size', val: 15 } ] },
                    { block: 'b-foo', elem: 'bar' }
                ]);
            });
        });
    });

    describe('elem: singular/plural forms', function() {
        var elems;

        before(function(){
            elems = loadFixture('elems');
            bd.parse(elems.template);
        });

        after(function(){
            bd.clear();
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

        after(function(){
            bd.clear();
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

        after(function(){
            bd.clear();
        });

        it('should return correct length list of entities', function() {
            bd.listFound().should.have.length(basic.expected.listFound.length);
        });

        it('should deeply match found entities', function() {
            bd.listFound().should.be.eql(basic.expected.listFound);
        });

        it('should return correct length list of blocks', function() {
            bd.listParsed().should.have.length(basic.expected.listParsed.length);
        });

        it('should deeply match parsed blocks', function() {
            bd.listParsed().should.be.eql(basic.expected.listParsed);
        });
    });

});
