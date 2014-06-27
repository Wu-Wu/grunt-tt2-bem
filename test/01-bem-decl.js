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
