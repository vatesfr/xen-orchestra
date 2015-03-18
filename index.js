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
debug('Loading Babel (ES6 support)...');
require('babel/register')({
  ignore: /xo-.*\/node_modules/
});

debug('Loading main module...');
module.exports = require('./src');
