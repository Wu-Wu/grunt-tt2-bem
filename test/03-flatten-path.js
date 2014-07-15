/* global describe, it, before, after, beforeEach, afterEach */
//
// flatten-path.js tests
//
var flattenPath = require('../lib/flatten-path'),
    should = require('should');

require('mocha');

describe('flatten-path', function() {
    it('should works with defaults', function() {
        flattenPath('templates/choose/index.html')
            .should.be.eql('templates-choose-index');
    });

    it('should handle filename extension (ext)', function() {
        flattenPath('templates/choose/index.tt2', { ext: '.tt2' })
            .should.be.eql('templates-choose-index');
    });

    it('should handle output separator (sep)', function() {
        flattenPath('templates/choose/index.html', { sep: '_' })
            .should.be.eql('templates_choose_index');
    });

    it('should handle cut level (cut)', function() {
        flattenPath('templates/choose/index.html', { cut: 1 })
            .should.be.eql('choose-index');
    });

    it('should handle root prefix (root)', function() {
        flattenPath('templates/foo/bar/choose/index.html', { root: 'templates/foo' })
            .should.be.eql('bar-choose-index');
    });

    it('should handle all options together', function() {
        flattenPath(
            'templates/foo/bar/baz/choose/index.tt2.html',
            { root: 'templates/foo', ext: '.tt2.html', sep: '__', cut: 2 }
        ).should.be.eql('choose__index');
    });
});
