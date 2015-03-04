'use strict';

//====================================================================

var Bluebird = require('bluebird');

//====================================================================

function returnThis() {
  /* jshint validthis: true */

  return this;
}

// Returns an iterator to the Fibonacci sequence.
function fibonacci(start) {
  var prev = 0;
  var curr = start || 1;

  var iterator = {
    next: function () {
      var tmp = curr;
      curr += prev;
      prev = tmp;

      return {
        done: false,
        value: prev,
      };
    },
  };

  // Make the iterator a true iterable (ES6).
  if (typeof Symbol !== 'undefined') {
    iterator[Symbol.iterator] = returnThis;
  }

  return iterator;
}

//====================================================================

function defaultGenerator() {
  return fibonacci(1e3);
}

function BackOff(opts) {
  if (!opts) {
    opts = {};
  }

  this._attempts = 0;
  this._generator = opts.generator || defaultGenerator;
  this._iterator = this._generator();
  this._maxAttempts = opts.maxAttempts || Infinity;
}

BackOff.prototype.wait = function () {
  var maxAttempts = this._maxAttempts;
  if (this._attempts++ > maxAttempts) {
    return Bluebird.reject(new Error(
      'maximum attempts reached (' + maxAttempts +')'
    ));
  }

  return Bluebird.delay(this._iterator.next().value);
};

BackOff.prototype.reset = function () {
  this._attempts = 0;
  this._iterator = this._generator();
};

//====================================================================

module.exports = BackOff;
