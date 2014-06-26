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

    describe('basic template', function() {
        var basic;

        before(function(){
            basic = loadFixture('basic');
            bd.parse( basic.template );
        })

        describe('listFound()', function(){

            it('should return correct length list of entities', function() {
                bd.listFound().length.should.be.eql(basic.expected.listFound.length);
            });

            it('should deeply match found entities', function() {
                bd.listFound().should.be.eql(basic.expected.listFound);
            });

        });

        describe('listParsed()', function(){

            it('should return correct length list of blocks', function() {
                bd.listParsed().length.should.be.eql(basic.expected.listParsed.length);
            });

            it('should deeply match parsed blocks', function() {
                bd.listParsed().should.be.eql(basic.expected.listParsed);
            });

        });
    });

});
