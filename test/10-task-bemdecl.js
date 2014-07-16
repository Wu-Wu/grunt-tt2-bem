/* global describe, it, before, after, beforeEach, afterEach */
var should = require('should'),
    fs = require('fs'),
    path = require('path');

require('mocha');

var task = 'bemdecl:all';

var loadFixture = function (name) {
    var base = path.join('test','fixtures'),
        fileActual = path.join(base, 'bem', 'bundles.generated', name, name + '.bemdecl.js'),
        fileExpected = path.join(base, 'bemdecl', name + '.bemdecl.js');

    return {
        actual: fs.readFileSync(fileActual, {encoding: 'utf8'}),
        expected: fs.readFileSync(fileExpected, {encoding: 'utf8'})
    };
};

describe('task ' + task, function() {

    it('should generate bemdecl for "templates/choose/index.html"', function() {
        var fixture = loadFixture('choose-index');

        var expected = fixture.expected.replace('@task', task);

        fixture.actual.should.be.eql(expected);
    });

    it('should generate bemdecl for "templates/web-sites/wix/index.html"', function() {
        var fixture = loadFixture('web-sites-wix-index');

        var expected = fixture.expected.replace('@task', task);

        fixture.actual.should.be.eql(expected);
    });

    it('should generate bemdecl for "templates/choose/new.html"', function() {
        var fixture = loadFixture('choose-new');

        var expected = fixture.expected.replace('@task', task);

        fixture.actual.should.be.eql(expected);
    });
});
