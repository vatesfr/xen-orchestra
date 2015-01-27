'use strict';

//====================================================================

// Some modules are written in CoffeeScript.
require('coffee-script/register');

// Some modules are written in ES6.
require('6to5/register');

module.exports = require('./src/main');
