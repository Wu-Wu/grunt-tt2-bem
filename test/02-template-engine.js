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

    it('should be true', function(){
        var aaa = loadFixture('tt2-base');

        te.process(aaa.template);

        true.should.be.eql(true);
    });


});
