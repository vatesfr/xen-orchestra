'use strict'

const assert = require('assert/strict')
const { describe, it } = require('tap').mocha

const { every, not, some } = require('./')

const T = () => true
const F = () => false

const testArgHandling = fn => {
  it('returns undefined if predicate is undefined', () => {
    assert.equal(fn(undefined), undefined)
  })

  it('throws if it receives a non-predicate', () => {
    const error = new TypeError('not a valid predicate')
    error.value = 3
    assert.throws(() => fn(3), error)
  })
}

const testArgsHandling = fn => {
  testArgHandling(fn)

  it('returns the predicate if only a single one is passed', () => {
    assert.equal(fn(undefined, T), T)
    assert.equal(fn([undefined, T]), T)
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

const runTests = (fn, acceptMultiple, truthTable) =>
  it('works', () => {
    truthTable.forEach(([result, ...predicates]) => {
      if (acceptMultiple) {
        assert.equal(fn(predicates)(), result)
      } else {
        assert.equal(predicates.length, 1)
      }
      assert.equal(fn(...predicates)(), result)
    })
  })

describe('every', () => {
  testArgsHandling(every)
  runTests(every, true, [
    [true, T, T],
    [false, T, F],
    [false, F, T],
    [false, F, F],
  ])
})

describe('not', () => {
  testArgHandling(not)

  it('returns the original predicate if negated twice', () => {
    assert.equal(not(not(T)), T)
  })

  runTests(not, false, [
    [true, F],
    [false, T],
  ])
})

describe('some', () => {
  testArgsHandling(some)
  runTests(some, true, [
    [true, T, T],
    [true, T, F],
    [true, F, T],
    [false, F, F],
  ])
})
