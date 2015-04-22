/* eslint-env mocha */

import {expect} from 'chai'

// -------------------------------------------------------------------

import Bluebird from 'bluebird'

// -------------------------------------------------------------------

import utils, {$coroutine} from './fibers-utils'

// ===================================================================

describe('$coroutine', function () {
  it('creates a on which returns Bluebirds', function () {
    const fn = $coroutine(function () {})
    expect(fn().then).to.be.a('function')
  })

  it('creates a function which runs in a new fiber', function () {
    const previous = require('fibers').current

    const fn = $coroutine(function () {
      const current = require('fibers').current

      expect(current).to.exists
      expect(current).to.not.equal(previous)
    })

    fn()
  })

  it('forwards all arguments (even this)', function () {
    const self = {}
    const arg1 = {}
    const arg2 = {}

    $coroutine(function (arg1_, arg2_) {
      expect(this).to.equal(self)
      expect(arg1_).to.equal(arg1)
      expect(arg2_).to.equal(arg2)
    }).call(self, arg1, arg2)
  })
})

// -------------------------------------------------------------------

describe('$wait', function () {
  const $wait = utils.$wait

  it('waits for a Bluebird', function (done) {
    $coroutine(function () {
      const value = {}
      const Bluebird = Bluebird.cast(value)

      expect($wait(Bluebird)).to.equal(value)

      done()
    })()
  })

  it('handles Bluebird rejection', function (done) {
    $coroutine(function () {
      const Bluebird = Bluebird.reject('an exception')

      expect(function () {
        $wait(Bluebird)
      }).to.throw('an exception')

      done()
    })()
  })

  it('waits for a continuable', function (done) {
    $coroutine(function () {
      const value = {}
      const continuable = function (callback) {
        callback(null, value)
      }

      expect($wait(continuable)).to.equal(value)

      done()
    })()
  })

  it('handles continuable error', function (done) {
    $coroutine(function () {
      const continuable = function (callback) {
        callback('an exception')
      }

      expect(function () {
        $wait(continuable)
      }).to.throw('an exception')

      done()
    })()
  })

  it('forwards scalar values', function (done) {
    $coroutine(function () {
      let value = 'a scalar value'
      expect($wait(value)).to.equal(value)

      value = [
        'foo',
        'bar',
        'baz'
      ]
      expect($wait(value)).to.deep.equal(value)

      value = []
      expect($wait(value)).to.deep.equal(value)

      value = {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz'
      }
      expect($wait(value)).to.deep.equal(value)

      value = {}
      expect($wait(value)).to.deep.equal(value)

      done()
    })()
  })

  it('handles arrays of Bluebirds/continuables', function (done) {
    $coroutine(function () {
      const value1 = {}
      const value2 = {}

      const Bluebird = Bluebird.cast(value1)
      const continuable = function (callback) {
        callback(null, value2)
      }

      const results = $wait([Bluebird, continuable])
      expect(results[0]).to.equal(value1)
      expect(results[1]).to.equal(value2)

      done()
    })()
  })

  it('handles maps of Bluebirds/continuable', function (done) {
    $coroutine(function () {
      const value1 = {}
      const value2 = {}

      const Bluebird = Bluebird.cast(value1)
      const continuable = function (callback) {
        callback(null, value2)
      }

      const results = $wait({
        foo: Bluebird,
        bar: continuable
      })
      expect(results.foo).to.equal(value1)
      expect(results.bar).to.equal(value2)

      done()
    })()
  })

  it('handles nested arrays/maps', function (done) {
    const Bluebird = Bluebird.cast('a Bluebird')
    const continuable = function (callback) {
      callback(null, 'a continuable')
    }

    $coroutine(function () {
      expect($wait({
        foo: Bluebird,
        bar: [
          continuable,
          'a scalar'
        ]
      })).to.deep.equal({
        foo: 'a Bluebird',
        bar: [
          'a continuable',
          'a scalar'
        ]
      })

      done()
    })()
  })
})
