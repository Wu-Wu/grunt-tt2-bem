/* global describe, it, before, after, beforeEach, afterEach */
//
// gather-files.js tests
//
var gatherFiles = require('../lib/gather-files').gatherFiles,
    toArray = require('../lib/gather-files').toArray,
    path = require('path'),
    _ = require('lodash'),
    grunt = require('grunt'),
    should = require('should');

require('mocha');

describe('gather-files toArray()', function() {
    it('should accept empty/undefined String', function() {
        toArray().should.be.eql([]);
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

    it('should transform composite String to Array', function() {
        toArray('foo/bar.html:!qux/baz.html').should.be.eql([
            'foo/bar.html',
            '!qux/baz.html'
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

// expanding callback. just return pattern without globbing (as is)
var cbFake = function (pattern) {
    return _.chain(pattern)
                .map(function (el) {
                    return el.charAt(0) === '!' ? null : el;
                })
                .compact()
                .value();
};

var cbReal = function (pattern) {
    return grunt.file.expand({ filter: 'isFile', cwd: '.' }, pattern);
};

describe('gather-files gatherFiles()', function() {
    it('should works with defaults', function() {
        var src = [
                path.join('foo', 'bar.html'),
                path.join('baz', 'qux.html'),
                path.join('foo', 'bar.html'),
                path.join('!qux', 'qux.html'),
            ],
            opts = {};

        gatherFiles(src, cbFake, opts).should.be.eql([
            {
                src: path.join('foo', 'bar.html'),
                dst: path.join('foo-bar', 'foo-bar.bemdecl.js'),
                dir: path.join('foo-bar')
            },
            {
                src: path.join('baz', 'qux.html'),
                dst: path.join('baz-qux', 'baz-qux.bemdecl.js'),
                dir: path.join('baz-qux')
            }
        ]);
    });

    it('should consider "root" option', function() {
        var src = [
                path.join('foo', 'bar.html'),
            ],
            opts = {
                root: 'views'
            };

        gatherFiles(src, cbFake, opts).should.be.eql([
            {
                src: path.join('views', 'foo', 'bar.html'),
                dst: path.join('foo-bar', 'foo-bar.bemdecl.js'),
                dir: path.join('foo-bar')
            }
        ]);
    });

    it('should consider "dest" option', function() {
        var src = [
                path.join('foo', 'bar.html'),
            ],
            opts = {
                root: path.join('views', 'my'),
                dest: path.join('bem', 'bundles.dynamic')
            };

        gatherFiles(src, cbFake, opts).should.be.eql([
            {
                src: path.join('views', 'my', 'foo', 'bar.html'),
                dst: path.join('bem', 'bundles.dynamic', 'foo-bar', 'foo-bar.bemdecl.js'),
                dir: path.join('bem', 'bundles.dynamic', 'foo-bar')
            }
        ]);
    });

    it('should consider "extSrc" option', function() {
        var src = [
                path.join('foo', 'bar.tt2'),
            ],
            opts = {
                root: path.join('views', 'my'),
                extSrc: '.tt2'
            };

        gatherFiles(src, cbFake, opts).should.be.eql([
            {
                src: path.join('views', 'my', 'foo', 'bar.tt2'),
                dst: path.join('foo-bar', 'foo-bar.bemdecl.js'),
                dir: path.join('foo-bar')
            }
        ]);
    });

    it('should consider "extDst" option', function() {
        var src = [
                path.join('foo', 'bar.html'),
            ],
            opts = {
                root: path.join('views', 'my'),
                extDst: '.foo.bemdecl.js'
            };

        gatherFiles(src, cbFake, opts).should.be.eql([
            {
                src: path.join('views', 'my', 'foo', 'bar.html'),
                dst: path.join('foo-bar', 'foo-bar.foo.bemdecl.js'),
                dir: path.join('foo-bar')
            }
        ]);
    });

    it('should consider "sep" option', function() {
        var src = [
                path.join('foo', 'bar.html'),
            ],
            opts = {
                root: path.join('views', 'my'),
                sep: '__'
            };

        gatherFiles(src, cbFake, opts).should.be.eql([
            {
                src: path.join('views', 'my', 'foo', 'bar.html'),
                dst: path.join('foo__bar', 'foo__bar.bemdecl.js'),
                dir: path.join('foo__bar')
            }
        ]);
    });

    it('should consider "cut" option', function() {
        var src = [
                path.join('qux', 'foo', 'bar.html'),
            ],
            opts = {
                root: path.join('views', 'my'),
                cut: 1
            };

        gatherFiles(src, cbFake, opts).should.be.eql([
            {
                src: path.join('views', 'my', 'qux', 'foo', 'bar.html'),
                dst: path.join('foo-bar', 'foo-bar.bemdecl.js'),
                dir: path.join('foo-bar')
            }
        ]);
    });

    it('should consider all options', function() {
        var src = [
                path.join('qux', 'foo', 'bar.tt2'),
            ],
            opts = {
                root: path.join('views', 'my'),
                dest: path.join('bem', 'bundles.dynamic'),
                extSrc: '.tt2',
                extDst: '.tt2.bemdecl.js',
                sep: '__',
                cut: 1
            };

        gatherFiles(src, cbFake, opts).should.be.eql([
            {
                src: path.join('views', 'my', 'qux', 'foo', 'bar.tt2'),
                dst: path.join('bem', 'bundles.dynamic', 'foo__bar', 'foo__bar.tt2.bemdecl.js'),
                dir: path.join('bem', 'bundles.dynamic', 'foo__bar')
            }
        ]);
    });

    it('should really works with negate and default root', function() {
        var src = [
                path.join('test', 'fixtures', 'templates', '**', '*.html'),
                path.join('!test', 'fixtures', 'templates', 'web-sites', '**', '*.html')
            ],
            opts = {
                cut: 3,
                dest: 'bemX'
            };

        gatherFiles(src, cbReal, opts).should.be.eql([
            {
                src: path.join('test', 'fixtures', 'templates', 'choose', 'index.html'),
                dst: path.join(opts.dest, 'choose-index', 'choose-index.bemdecl.js'),
                dir: path.join(opts.dest, 'choose-index')
            },
            {
                src: path.join('test', 'fixtures', 'templates', 'choose', 'new.html'),
                dst: path.join(opts.dest, 'choose-new', 'choose-new.bemdecl.js'),
                dir: path.join(opts.dest, 'choose-new')
            }
        ]);
    });

    it('should really works with negate and non default root', function() {
        var src = [
                path.join('templates', '**', '*.html'),
                path.join('!templates', 'web-sites', '**', '*.html')
            ],
            opts = {
                root: path.join('test', 'fixtures'),
                dest: 'bemX',
                cut: 1
            };

        gatherFiles(src, cbReal, opts).should.be.eql([
            {
                src: path.join(opts.root, 'templates', 'choose', 'index.html'),
                dst: path.join(opts.dest, 'choose-index', 'choose-index.bemdecl.js'),
                dir: path.join(opts.dest, 'choose-index')
            },
            {
                src: path.join(opts.root, 'templates', 'choose', 'new.html'),
                dst: path.join(opts.dest, 'choose-new', 'choose-new.bemdecl.js'),
                dir: path.join(opts.dest, 'choose-new')
            }
        ]);
    });
});
