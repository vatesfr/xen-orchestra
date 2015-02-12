'use strict';

//====================================================================

var expect = require('chai').expect;

//--------------------------------------------------------------------

var Promise = require('bluebird');

//--------------------------------------------------------------------

var utils = require('./fibers-utils');
var $fiberize = utils.$fiberize;

//====================================================================

/* jshint mocha: true */

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

		$fiberize(function (arg1_, arg2_) {
			expect(this).to.equal(self);
			expect(arg1_).to.equal(arg1);
			expect(arg2_).to.equal(arg2);
		}).call(self, arg1, arg2);
	});
});

//--------------------------------------------------------------------

describe('$wait', function () {
	var $wait = utils.$wait;

	it('waits for a promise', function (done) {
		$fiberize(function () {
			var value = {};
			var promise = Promise.cast(value);

			expect($wait(promise)).to.equal(value);

			done();
		})();
	});

	it('handles promise rejection', function (done) {
		$fiberize(function () {
			var promise = Promise.reject('an exception');

			expect(function () {
				$wait(promise);
			}).to.throw('an exception');

			done();
		})();
	});

	it('waits for a continuable', function (done) {
		$fiberize(function () {
			var value = {};
			var continuable = function (callback) {
				callback(null, value);
			};

			expect($wait(continuable)).to.equal(value);

			done();
		})();
	});

	it('handles continuable error', function (done) {
		$fiberize(function () {
			var continuable = function (callback) {
				callback('an exception');
			};

			expect(function () {
				$wait(continuable);
			}).to.throw('an exception');

			done();
		})();
	});

	it('forwards scalar values', function (done) {
		$fiberize(function () {
			var value = 'a scalar value';
			expect($wait(value)).to.equal(value);

			value = [
				'foo',
				'bar',
				'baz',
			];
			expect($wait(value)).to.deep.equal(value);

			value = [];
			expect($wait(value)).to.deep.equal(value);

			value = {
				foo: 'foo',
				bar: 'bar',
				baz: 'baz',
			};
			expect($wait(value)).to.deep.equal(value);

			value = {};
			expect($wait(value)).to.deep.equal(value);

			done();
		})();
	});

	it('handles arrays of promises/continuables', function (done) {
		$fiberize(function () {
			var value1 = {};
			var value2 = {};

			var promise = Promise.cast(value1);
			var continuable = function (callback) {
				callback(null, value2);
			};

			var results = $wait([promise, continuable]);
			expect(results[0]).to.equal(value1);
			expect(results[1]).to.equal(value2);

			done();
		})();
	});

	it('handles maps of promises/continuable', function (done) {
		$fiberize(function () {
			var value1 = {};
			var value2 = {};

			var promise = Promise.cast(value1);
			var continuable = function (callback) {
				callback(null, value2);
			};

			var results = $wait({
				foo: promise,
				bar: continuable
			});
			expect(results.foo).to.equal(value1);
			expect(results.bar).to.equal(value2);

			done();
		})();
	});

	it('handles nested arrays/maps', function (done) {
		var promise = Promise.cast('a promise');
		var continuable = function (callback) {
			callback(null, 'a continuable');
		};

		$fiberize(function () {
			expect($wait({
				foo: promise,
				bar: [
					continuable,
					'a scalar'
				]
			})).to.deep.equal({
				foo: 'a promise',
				bar: [
					'a continuable',
					'a scalar'
				]
			});

			done();
		})();
	});

	describe('#register()', function () {
		it('registers a callback-based function to be waited', function (done) {
			$fiberize(function () {
				var fn = function (value, callback) {
					callback(null, value);
				};

				var value = {};
				expect($wait(fn(value, $wait.register()))).to.equal(value);

				value = {};
				expect($wait(fn(value, $wait.register()))).to.equal(value);

				done();
			})();
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
