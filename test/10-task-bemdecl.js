/* global describe, it, before, after, beforeEach, afterEach */
var should = require('should'),
    fs = require('fs');

require('mocha');

var loadFixture = function (name) {
    var flattened = name.split('/').join('.');

    return {
        actual: fs.readFileSync('test/fixtures/bem/templates/' + name + '.bemdecl.js', {encoding: 'utf8'}),
        expected: fs.readFileSync('test/fixtures/' + flattened + '.decl.js', {encoding: 'utf8'})
    };
};

describe('task bemdecl:all', function() {
    var pkg;

    before(function() {
        pkg = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8'}));
    });

    it('should generate bemdecl for "templates/choose/index.html"', function() {
        var fixture = loadFixture('choose/index');

        var expected = fixture.expected
                                .replace('@generator', pkg.name)
                                .replace('@version', pkg.version);

        fixture.actual.should.be.eql(expected);
    });

    it('should generate bemdecl for "templates/web-sites/wix/index.html"', function() {
        var fixture = loadFixture('web-sites/wix/index');

        var expected = fixture.expected
                                .replace('@generator', pkg.name)
                                .replace('@version', pkg.version);

        fixture.actual.should.be.eql(expected);
    });

    it('should generate bemdecl for "templates/choose/new.html"', function() {
        var fixture = loadFixture('choose/new');

        var expected = fixture.expected
                                .replace('@generator', pkg.name)
                                .replace('@version', pkg.version);

        fixture.actual.should.be.eql(expected);
    });
});
