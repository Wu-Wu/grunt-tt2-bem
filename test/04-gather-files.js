/* global describe, it, before, after, beforeEach, afterEach */
//
// gather-files.js tests
//
var gatherFiles = require('../lib/gather-files').gatherFiles,
    toArray = require('../lib/gather-files').toArray,
    should = require('should');

require('mocha');

describe('gather-files toArray()', function() {
    it('should accept empty/undefined String', function() {
        toArray('').should.be.eql([]);
        toArray(undefined).should.be.eql([]);
        toArray(false).should.be.eql([]);
        toArray(null).should.be.eql([]);
    });

    it('should accept empty Array', function() {
        toArray([]).should.be.eql([]);
    });

    it('should accept empty Object', function() {
        toArray({}).should.be.eql([]);
    });

    it('should transform String to Array', function() {
        toArray('foo/bar.html').should.be.eql([
            'foo/bar.html'
        ]);
    });

    it('should transform Object to Array', function() {
        var src = {
            foo : [ 'foo/foo.html', 'foo/bar.html' ],
            baz : 'baz/foo.html'
        };

        toArray(src).should.be.eql([
            'foo/foo.html',
            'foo/bar.html',
            'baz/foo.html'
        ]);
    });

    it('should reject empty/undefined values', function() {
        var src = [
            'foo/bar.html',
            false,
            'bar/baz.html',
            undefined,
            null,
            '',
            0
        ];

        toArray(src).should.be.eql([
            'foo/bar.html',
            'bar/baz.html'
        ]);
    });

    it('should reject duplicates', function() {
        var src = {
            foo : 'foo/bar.html',
            bar : 'bar/baz.html',
            baz : [ 'foo/bar.html', 'qux/qux.html', 'bar/baz.html' ]
        };

        toArray(src).should.be.eql([
            'foo/bar.html',
            'bar/baz.html',
            'qux/qux.html'
        ]);
    });
});

describe('gather-files gatherFiles()', function() {
    it('should be ok', function() {
    });
});
