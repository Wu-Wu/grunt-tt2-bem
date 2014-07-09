grunt-tt2-bem
=============

> Template Toolkit 2 to BEM bridge.

[![Build Status](https://travis-ci.org/Wu-Wu/grunt-tt2-bem.svg?branch=master)](https://travis-ci.org/Wu-Wu/grunt-tt2-bem)
[![Coverage Status](https://img.shields.io/coveralls/Wu-Wu/grunt-tt2-bem.svg)](https://coveralls.io/r/Wu-Wu/grunt-tt2-bem?branch=master)
[![Dependency Status](https://david-dm.org/Wu-Wu/grunt-tt2-bem.svg)](https://david-dm.org/Wu-Wu/grunt-tt2-bem)

## Getting Started

This plugin requires Grunt ~0.4.1

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-tt2-bem
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-tt2-bem');
```

## The "bemdecl" task

TODO

### Overview

In your project's Gruntfile, add a section named `bemdecl` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
    bemdecl: {
        someTarget: {
            options: {
                // Target-specific options go here.
                root: 'path/to/root',
                includes: [ 'includes', 'inc' ]    // relative to $root
            },
            files: [
                // Specify the tt2 files you want to transform to bemdecl.
                { src: 'templates/foo.html', dest: 'bem/templates/foo.bemdecl.js' }
            ]
        }
    }
})
```

Each target defines a specific task that can be run.

### Options

#### options.root
Type: `String`
Default value: `Gruntfile.* directory`

Templates root directory.

#### options.includes
Type: `Array`
Default value: `[ '.' ]` (root directory)

List of directories contains include files.

#### options.prefixes
Type: `Array`
Default value: `[ 'b', 'i', 'l' ]`

Valid BEM prefixes. Will catch all BEM-blocks started with (like `b-foo__bar`, `i-rel`) and skip others
(like `d-quux__foo`).

#### options.allowed
Type: `Array`
Default value: `[ ]`

Allowed BEM-blocks. Not allowed blocks will be filtered out from `*.bemdecl.js` files.

> An empty list means that all BEM-blocks considered valid.

#### options.src
Type: `Array`
Default value: `[ ]`

Source files patterns list. This list will be used to build src-dest map through the [grunt.file.expandMapping](http://gruntjs.com/api/grunt.file#grunt.file.expandmapping) if no `files` given.
See more at [Configuring tasks: Files](http://gruntjs.com/configuring-tasks#files).

#### options.dest
Type: `String`
Default value: `''`

Destination path prefix. Used only for building src-dest map in conjunction of `options.src`.

#### options.ext
Type: `String`
Default value: `.bemdecl.js`

Extension replacement for destination filepaths. Used only for building src-dest map in conjunction of `options.src`.

#### options.extDot
Type: `String`
Default value: `last`

Extension in filenames will begin after first or last dot. So allowed values for this will be `last` and `first`. Used only for building src-dest map in conjunction of `options.src`.

### Usage Example

TODO

### Source templates

Source templates might be pointed in several ways:

#### As an object `files` (static)

```js
bemdecl: {
    all: {
        options: { },
        files: {
            // dest : src
            'bem/templates/web-sites/index.bemdecl.js': 'templates/web-sites/index.html',
            'bem/templates/domain/new.bemdecl.js': 'templates/domain/new.html'
        }
    }
}
```

#### As an array `files` (static)

```js
bemdecl: {
    all: {
        options: { },
        files: [
            { src: 'templates/web-sites/index.html', dest: 'bem/templates/web-sites/index.bemdecl.js' },
            { src: 'templates/domain/new.html', dest: 'bem/templates/domain/new.bemdecl.js' }
        ]
    }
}
```

#### As an array `files` (dynamic)

```js
bemdecl: {
    all: {
        options: { },
        files: [{
            expand: true,
            cwd: 'path/to/root',
            src: [ 'templates/**/*.html' ],
            dest: 'bem/',
            ext: '.bemdecl.js',
            extDot: 'last'
        }]
    }
}
```

#### By special options (dynamic)

```js
bemdecl: {
    all: {
        options: {
            root: 'path/to/root',
            includes: [ 'includes' ],
            // dynamic mapping of files
            src: [ 'templates/**/*.html' ],
            dest: 'bem/',
            ext: '.bemdecl.js',     // defaults
            extDot: 'last'          // defaults
        },
    }
}
```



## License
_grunt-tt2-bem_ is licensed under the [MIT license][].

[MIT license]: http://www.tldrlegal.com/license/mit-license
