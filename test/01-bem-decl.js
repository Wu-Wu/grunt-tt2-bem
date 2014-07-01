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

        it('should wrap to "elems" for boolean "mod" and "elem"', function(){
            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseA);
        });

        it('should wrap to "elems" for non-boolean "mod" and "elem"', function(){
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseB);
        });

        it('should transform to "elems" existed "elem" boolean "mod"', function(){
            block.elem = 'foo';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseC);
        });

        it('should transform to "elems" existed "elem" for non-boolean "mod"', function(){
            block.elem = 'foo';
            entity.modVal = 'quux';

            var got = bd.handleElemMod(block, entity);

            got.should.be.eql(em.expected.caseD);
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
        })

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
        })

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
        })

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
