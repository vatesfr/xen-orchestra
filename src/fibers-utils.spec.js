'use strict';

//====================================================================

var expect = require('chai').expect;

//--------------------------------------------------------------------

var utils = require('./fibers-utils');
var $fiberize = utils.$fiberize;

//====================================================================

describe('$fiberize', function () {
	it('creates a function which runs in a new fiber', function () {
		var previous = require('fibers').current;

		var fn = $fiberize(function () {
			var current = require('fibers').current;

			expect(current).to.exists;
			expect(current).to.not.equal(previous);
		});

		fn();
	});

	it('forwards all arguments (even this)', function () {
		var self = {};
		var arg1 = {};
		var arg2 = {};

		$fiberize(function (arg1, arg2) {
			expect(this).to.equal(self);
			expect(arg1).to.equal(arg1);
			expect(arg2).to.equal(arg2);
		}).call(self, arg1, arg2);
	});
});

//--------------------------------------------------------------------

describe('$wait', function () {
	var $wait = utils.$wait;

	it('waits for a promise', function (done) {
		$fiberize(function () {
			var value = {};
			var promise = require('q')(value);

			expect($wait(promise)).to.equal(value);

			done();
		})();
	});

	it('handles promise rejection', function (done) {
		$fiberize(function () {
			var promise = require('q').reject('an exception');

			expect(function () {
				$wait(promise);
			}).to.throw('an exception');

			done();
		})();
	});

	it('waits for a thunk', function (done) {
		$fiberize(function () {
			var value = {};
			var thunk = function (callback) {
				callback(null, value);
			};

			expect($wait(thunk)).to.equal(value);

			done();
		})();
	});

	it('handles thunk error', function (done) {
		$fiberize(function () {
			var thunk = function (callback) {
				callback('an exception');
			};

			expect(function () {
				$wait(thunk);
			}).to.throw('an exception');

			done();
		})();
	});

	it('forwards scalar values', function () {
		$fiberize(function () {
			var value = 'a scalar value';
			expect($wait(value)).to.equal(value);
		});
	});

	it('handles arrays of promises/thunks', function (done) {
		$fiberize(function () {
			var value1 = {};
			var value2 = {};

			var promise = require('q')(value1);
			var thunk = function (callback) {
				callback(null, value2);
			};

			var results = $wait([promise, thunk]);
			expect(results[0]).to.equal(value1);
			expect(results[1]).to.equal(value2);

			done();
		})();
	});

	it('handles maps of promises/thunk', function (done) {
		$fiberize(function () {
			var value1 = {};
			var value2 = {};

			var promise = require('q')(value1);
			var thunk = function (callback) {
				callback(null, value2);
			};

			var results = $wait({
				foo: promise,
				bar: thunk
			});
			expect(results.foo).to.equal(value1);
			expect(results.bar).to.equal(value2);

			done();
		})();
	});

	it('handles nested arrays/maps', function (done) {
		var promise = require('q')('a promise');
		var thunk = function (callback) {
			callback(null, 'a thunk');
		};

		$fiberize(function () {
			expect($wait({
				foo: promise,
				bar: [
					thunk,
					'a scalar'
				]
			})).to.deep.equal({
				foo: 'a promise',
				bar: [
					'a thunk',
					'a scalar'
				]
			});

			done();
		})();

		describe('#register()', function () {
			it('registers a callback-based function to be waited', function (done) {
				$fiberize(function () {
					var fn = function (value, callback) {
						callback(null, value);
					};
					var value = {};

					expect($wait(fn(value, $wait.register()))).to.equal(value);

					done();
				})();
			});
		});
	});
});

//--------------------------------------------------------------------

describe('$waitEvent', function () {
	var $waitEvent = utils.$waitEvent;

	it('waits for an event', function (done) {
		$fiberize(function () {
			var emitter = new (require('events').EventEmitter)();

			var value = {};
			process.nextTick(function () {
				emitter.emit('foo', value);
			});

			expect($waitEvent(emitter, 'foo')[0]).to.equal(value);

			done();
		})();
	});

	it('handles the error event', function (done) {
		$fiberize(function () {
			var emitter = new (require('events').EventEmitter)();

			process.nextTick(function () {
				emitter.emit('error', 'an error');
			});

			expect(function () {
				$waitEvent(emitter, 'foo');
			}).to.throw('an error');

			done();
		})();
	});
});
