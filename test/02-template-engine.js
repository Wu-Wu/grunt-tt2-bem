/* global describe, it, before, after, beforeEach, afterEach */
//
// template-engine.js tests
//
var TemplateEngine = require('../lib/template-engine'),
    te = new TemplateEngine({ debug : true, root: 'test/fixtures', includes: [ '.', 'includes' ] }),
    should = require('should'),
    fs = require('fs');

require('mocha');

var loadFixture = function (name) {
    return {
        template: fs.readFileSync('test/fixtures/' + name + '.html', {encoding: 'utf8'})
        // expected: JSON.parse(fs.readFileSync('test/fixtures/'+name+'.json', {encoding: 'utf8'}))
    };
};

describe('template-engine', function(){

    describe('clear()', function(){
        before(function(){
            te.stash = [ 1, 2 ];
            te.seen = { 'foo.inc': true };
            te.clear();
        });

        it('should clear stash list', function(){
            te.stash.should.be.eql([]);
        });

        it('should clear seen hash', function(){
            te.seen.should.be.eql({});
        });
    });

    describe('resolvePath()', function(){
        it('should return full path if file name exists', function(){
            te.resolvePath('blocks/b-foo.tt2').should.endWith('/includes/blocks/b-foo.tt2');
        });

        it('should return first resolved file name', function(){
            // test/fixtures/b-foo.inc
            // test/fixtures/includes/b-foo.inc
            te.resolvePath('b-foo.inc').should.endWith('/fixtures/b-foo.inc');
        });

        it('should return false if file name does not exists', function(){
            te.resolvePath('blocks/non-existent.tt2').should.eql(false);
        });
    });

    // it('should be true', function(){
    //     var aaa = loadFixture('tt2-base');

    //     te.process(aaa.template);

    //     true.should.be.eql(true);
    // });
});
