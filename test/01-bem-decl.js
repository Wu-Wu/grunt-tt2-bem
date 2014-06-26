//
// bem-decl.js tests
//
var revision = require('../lib/bem-decl'),
    should = require('should');

require('mocha');

describe('bem-decl', function() {

    describe('foo()', function() {

        it('should equal to foo', function() {
            'foo'.should.be.eql('foo');
        });

    });

});
