/* eslint-env mocha */

import {expect} from 'chai'

// -------------------------------------------------------------------

import Bluebird from 'bluebird'

// -------------------------------------------------------------------

import {$coroutine, $wait} from './fibers-utils'

// Enable source maps support for traces.
import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

// ===================================================================

describe('$coroutine', function () {
  it('creates a function which returns promises', function () {
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

    return fn()
  })

  it('forwards all arguments (even this)', function () {
    const self = {}
    const arg1 = {}
    const arg2 = {}

    return $coroutine(function (arg1_, arg2_) {
      expect(this).to.equal(self)
      expect(arg1_).to.equal(arg1)
      expect(arg2_).to.equal(arg2)
    }).call(self, arg1, arg2)
  })
})

// -------------------------------------------------------------------

describe('$wait', function () {
  it('waits for a promise', function () {
    return $coroutine(function () {
      const value = {}
      const promise = Bluebird.resolve(value)

      expect($wait(promise)).to.equal(value)
    })()
  })

  it('handles promise rejection', function () {
    return $coroutine(function () {
      const promise = Bluebird.reject('an exception')

      expect(function () {
        $wait(promise)
      }).to.throw('an exception')
    })()
  })

  it('forwards scalar values', function () {
    return $coroutine(function () {
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
    })()
  })

  it('handles arrays of promises', function () {
    return $coroutine(function () {
      const value1 = {}
      const value2 = {}

      const promise1 = Bluebird.resolve(value1)
      const promise2 = Bluebird.resolve(value2)

      const results = $wait([promise1, promise2])
      expect(results[0]).to.equal(value1)
      expect(results[1]).to.equal(value2)
    })()
  })

  it('handles maps of promises', function () {
    return $coroutine(function () {
      const value1 = {}
      const value2 = {}

      const promise1 = Bluebird.resolve(value1)
      const promise2 = Bluebird.resolve(value2)

      const results = $wait({
        foo: promise1,
        bar: promise2
      })
      expect(results.foo).to.equal(value1)
      expect(results.bar).to.equal(value2)
    })()
  })

  it('handles nested arrays/maps', function () {
    const promise1 = Bluebird.resolve('promise 1')
    const promise2 = Bluebird.resolve('promise 2')

    return $coroutine(function () {
      expect($wait({
        foo: promise1,
        bar: [
          promise2,
          'a scalar'
        ]
      })).to.deep.equal({
        foo: 'promise 1',
        bar: [
          'promise 2',
          'a scalar'
        ]
      })
    })()
  })
})
