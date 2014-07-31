Release History
===============

>for node.js package [grunt-tt2-bem](https://www.npmjs.org/package/grunt-tt2-bem)

[![NPM version](https://badge.fury.io/js/grunt-tt2-bem.svg)](http://badge.fury.io/js/grunt-tt2-bem)

## {{$NEXT}}

## v0.2.3
  - Fix: constructing file paths with methods of module **path**.
  - Feature: option `allowed` (blocks) can be set by `Function` returned an `Array`.
  - Fix: incorrect behaviour if there is no `mod`/`mods` for the element.
  - Refactoring of the `handleElemMod()`.

## v0.2.2
  - Fix: correct handle the negate symbols `!` in globbing patterns (#9).
  - Feature: support for composite `String` in `src` property (#10).

## v0.2.1
  - Fix: names w/o dots, slashes or dashes are treated as "variable" (#8).

## v0.2.0
  - Changed naming algorithm for declaration files.
  - Added new options for more flexible src/dest files handling.
  - Source templates (patterns) passed via `src` property. It accepts `String`, `Array` or `Object`.
  - Destination directory passed via `dest` property.
  - Updated README.md.

## v0.1.1
  - Initial release

