/* global describe, it, before, after, beforeEach, afterEach */
var should = require('should'),
    fs = require('fs'),
    path = require('path');

require('mocha');

var loadFixture = function (name) {
    var base = path.join('test','fixtures'),
        fileActual = path.join(base, 'bem', 'bundles.generated', name, name + '.bemdecl.js'),
        fileExpected = path.join(base, name + '.bemdecl.js');

    return {
        actual: fs.readFileSync(fileActual, {encoding: 'utf8'}),
        expected: fs.readFileSync(fileExpected, {encoding: 'utf8'})
    };
};

describe('task bemdecl:all', function() {
    var pkg;

    before(function() {
        pkg = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf8'}));
    });

    it('should generate bemdecl for "templates/choose/index.html"', function() {
        var fixture = loadFixture('choose-index');

        var expected = fixture.expected
                                .replace('@generator', pkg.name)
                                .replace('@version', pkg.version);

        fixture.actual.should.be.eql(expected);
    });

    it('should generate bemdecl for "templates/web-sites/wix/index.html"', function() {
        var fixture = loadFixture('web-sites-wix-index');

        var expected = fixture.expected
                                .replace('@generator', pkg.name)
                                .replace('@version', pkg.version);

        fixture.actual.should.be.eql(expected);
    });

    it('should generate bemdecl for "templates/choose/new.html"', function() {
        var fixture = loadFixture('choose-new');

        var expected = fixture.expected
                                .replace('@generator', pkg.name)
                                .replace('@version', pkg.version);

        fixture.actual.should.be.eql(expected);
    });
});
