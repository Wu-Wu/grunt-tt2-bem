/* global describe, it, before, after, beforeEach, afterEach */
//
// template-engine.js tests
//
var TemplateEngine = require('../lib/template-engine'),
    te = new TemplateEngine({ debug : false, root: 'test/fixtures', includes: [ '.', 'includes' ] }),
    should = require('should'),
    fs = require('fs'),
    _ = require('lodash'),
    processTemplate = TemplateEngine.processTemplate;

require('mocha');

var loadFixture = function (name) {
    return {
        template: fs.readFileSync('test/fixtures/' + name + '.html', {encoding: 'utf8'})
        // expected: JSON.parse(fs.readFileSync('test/fixtures/'+name+'.json', {encoding: 'utf8'}))
    };
};

describe('template-engine', function(){

    describe('clear()', function(){
        before(function(){
            te.stash = [ 1, 2 ];
            te.seen = { 'foo.inc': true };
            te.fails = [ 'tom', 'dick', 'harry' ];
            te.clear();
        });

        it('should clear stash list', function(){
            te.stash.should.be.eql([]);
        });

        it('should clear seen hash', function(){
            te.seen.should.be.eql({});
        });

        it('should clear fails list', function(){
            te.fails.should.be.eql([]);
        });
    });

    describe('errors()', function(){
        before(function(){
            te.fails = [ 'tom', 'dick', 'harry' ];
        });

        it('should return correct errors list', function(){
            te.errors().should.be.eql([
                'tom',
                'dick',
                'harry'
            ]);
        });
    });

    describe('resolvePath()', function(){
        it('should return full path if file name exists', function(){
            te.resolvePath('blocks/b-foo.tt2').should.endWith('/includes/blocks/b-foo.tt2');
        });

        it('should return first resolved file name', function(){
            // test/fixtures/b-foo.inc
            // test/fixtures/includes/b-foo.inc
            te.resolvePath('b-foo.inc').should.endWith('/fixtures/b-foo.inc');
        });

        it('should return false if file name does not exists', function(){
            te.resolvePath('blocks/non-existent.tt2').should.eql(false);
        });
    });

    describe('processTemplate()', function(){
        var template,
            tree;

        before(function(){
            te.clear();

            template = '<div>\
                [% INCLUDE "b-foo.inc" %]\
                    [% \
                        SET foo = bar + 1 ;\
                        PROCESS \
                    \
                    xxx.tt2;; foo ? bar : qux\
                    %] [%~ INCLUDE     \'xxx.tt2\' %]\
                [% INCLUDE non-existent.inc -%]\
            </div>';

            tree = {
                re: te.re,
                seen: te.seen,
                stash: te.stash,
                resolvePath: _.bind(te.resolvePath, te)
            };

            processTemplate(tree, template, 'root');
        });

        it('should return correct seen hash', function(){
            tree.seen.should.be.eql({
                'b-foo.inc': true,
                'xxx.tt2': true,
                'non-existent.inc': true,
                'blocks/b-foo.tt2': true,
                'blocks/1.inc': true
            });
        });

        it('should return correct items length of stash', function(){
            tree.stash.should.have.a.length(5);
        });

        it('should find particular amount of INCLUDE tokens', function(){
            _.filter(tree.stash, { token: 'INCLUDE' }).should.have.a.length(3);
        });

        it('should find particular amount of PROCESS tokens', function(){
            _.filter(tree.stash, { token: 'PROCESS' }).should.have.a.length(2);
        });

        it('should find particular amount of resolved files', function(){
            _.filter(tree.stash, 'resolved').should.have.a.length(4);
        });

        it('should find particular amount of not resolved files', function(){
            _.filter(tree.stash, { resolved: false }).should.have.a.length(1);
        });

        it('should find particular amount of unique links at root', function(){
            _.filter(tree.stash, { parent: 'root' }).should.have.a.length(3);
        });

        it('should return correct content for item #0', function(){
            tree.stash[0].content.should.be.eql('<div>\n[% INCLUDE \'blocks/b-foo.tt2\' %]\n</div>\n');
        });

        it('should return correct content for item #1', function(){
            tree.stash[1].content.should.be.eql('<a class="b-bar__baz">&nbsp;</a>\n');
        });

        it('should return correct content for item #2', function(){
            tree.stash[2].content.should.be.eql('<!-- not resolved: "non-existent.inc" -->');
        });

        it('should return correct content for item #3', function(){
            tree.stash[3].content.should.be.eql('<a class="b-bar__baz">[% PROCESS "blocks/1.inc" %]</a>\n');
        });

        it('should return correct content for item #4', function(){
            tree.stash[4].content.should.be.eql('<span class="foo"></span>\n\n[%~\n    PROCESS xxx.tt2;\n%]\n');
        });
    });

    describe('parse()', function(){
        it('should return error if root template is undefined', function(){
            var result = te.parse();

            (result === undefined).should.be.eql(true);
            te.errors().should.be.eql([ 'Template is undefined' ]);
        });

        it('should return error if root template does not exist', function(){
            var result = te.parse('test/fixtures/tt2-nonexistent.html');

            (result === undefined).should.be.eql(true);
            te.errors().should.be.eql([ 'Template does not exist' ]);
        });

        it('should return error if root template is empty', function(){
            var result = te.parse('test/fixtures/tt2-empty.html');

            (result === undefined).should.be.eql(true);
            te.errors().should.be.eql([ 'Template is empty' ]);
        });

        it('should return merged content if everything resolved', function() {
            var filename = 'test/fixtures/tt2-resolved.html',
                template = fs.readFileSync(filename, { encoding: 'utf8' }),
                expected = template + '\n' +
                '<!--\n' +
                ' parent: ' + filename + ' @ pos 26\n' +
                ' resolved: ' + te.options.root + '/xxx.tt2\n' +
                '-->\n' +
                '<a class="b-bar__baz">&nbsp;</a>\n';

            var result = te.parse(filename);

            (result !== undefined).should.be.eql(true);
            result.should.be.eql(expected);
        });

        it('should return errors list if anything not resolved', function() {
            var filename = 'test/fixtures/tt2-not-resolved.html',
                expected = [
                    filename + ' @ pos 26: "INCLUDE xxx1.tt2"',
                    filename + ' @ pos 75: "PROCESS z.inc"'
                ];

            var result = te.parse(filename);

            (result === undefined).should.be.eql(true);
            te.errors().should.be.eql(expected);
        });
    });
});
