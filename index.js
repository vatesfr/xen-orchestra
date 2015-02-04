'use strict';

//====================================================================

if (process.env.DEBUG === undefined) {
	process.env.DEBUG = 'xo:*';
}

var debug = require('debug')('xo:runner');

//====================================================================

// Some modules are written in CoffeeScript.
debug('Loading CoffeeScript...');
require('coffee-script/register');

// Some modules are written in ES6.
debug('Loading ES6...');
require('6to5/register');

debug('Loading main module...');
module.exports = require('./src/main');
