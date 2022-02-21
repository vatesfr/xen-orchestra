'use strict'

const assert = require('assert/strict')
const { describe, it } = require('tap').mocha

const { every, some } = require('./')

const T = () => true
const F = () => false

const testArgsHandling = fn => {
  it('returns undefined if all predicates are undefined', () => {
    assert.equal(fn(undefined), undefined)
    assert.equal(fn([undefined]), undefined)
  })

  it('returns the predicate if only a single one is passed', () => {
    assert.equal(fn(undefined, T), T)
    assert.equal(fn([undefined, T]), T)
  })

  it('throws if it receives a non-predicate', () => {
    const error = new TypeError('not a valid predicate')
    error.value = 3
    assert.throws(() => fn(3), error)
  })

  it('forwards this and arguments to predicates', () => {
    const thisArg = 'qux'
    const args = ['foo', 'bar', 'baz']
    const predicate = function () {
      assert.equal(this, thisArg)
      assert.deepEqual(Array.from(arguments), args)
    }
    fn(predicate, predicate).apply(thisArg, args)
  })
}

const runTests = (fn, truthTable) =>
  it('works', () => {
    truthTable.forEach(([result, ...predicates]) => {
      assert.equal(fn(...predicates)(), result)
      assert.equal(fn(predicates)(), result)
    })
  })

describe('every', () => {
  testArgsHandling(every)
  runTests(every, [
    [true, T, T],
    [false, T, F],
    [false, F, T],
    [false, F, F],
  ])
})

describe('some', () => {
  testArgsHandling(some)
  runTests(some, [
    [true, T, T],
    [true, T, F],
    [true, F, T],
    [false, F, F],
  ])
})
