/* global describe, it, before, after, beforeEach, afterEach */
//
// template-engine.js tests
//
var TemplateEngine = require('../lib/template-engine'),
    te = new TemplateEngine({ debug : true }),
    should = require('should'),
    fs = require('fs');

require('mocha');

describe('template-engine', function(){

    it('should be true', function(){
        true.should.be.eql(true);
    });

});
