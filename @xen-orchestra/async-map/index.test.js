'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict
const sinon = require('sinon')

const { asyncMapSettled } = require('./')

const noop = Function.prototype

describe('asyncMapSettled', () => {
  it('works', async () => {
    const values = [Math.random(), Math.random()]
    const spy = sinon.spy(async v => v * 2)
    const iterable = new Set(values)

    // returns an array containing the result of each calls
    assert.deepStrictEqual(
      await asyncMapSettled(iterable, spy),
      values.map(value => value * 2)
    )

    for (let i = 0, n = values.length; i < n; ++i) {
      // each call receive the current item as sole argument
      assert.deepStrictEqual(spy.args[i], [values[i]])

      // each call as this bind to the iterable
      assert.deepStrictEqual(spy.thisValues[i], iterable)
    }
  })

  it('can use a specified thisArg', () => {
    const thisArg = {}
    const spy = sinon.spy()
    asyncMapSettled(['foo'], spy, thisArg)
    assert.deepStrictEqual(spy.thisValues[0], thisArg)
  })

  it('rejects only when all calls as resolved', async () => {
    const defers = []
    const promise = asyncMapSettled([1, 2], () => {
      let resolve, reject
      // eslint-disable-next-line promise/param-names
      const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve
        reject = _reject
      })
      defers.push({ promise, resolve, reject })
      return promise
    })

    let hasSettled = false
    promise.catch(noop).then(() => {
      hasSettled = true
    })

    const error = new Error()
    defers[0].reject(error)

    // wait for all microtasks to settle
    await new Promise(resolve => setImmediate(resolve))

    assert.strictEqual(hasSettled, false)

    defers[1].resolve()

    // wait for all microtasks to settle
    await new Promise(resolve => setImmediate(resolve))

    assert.strictEqual(hasSettled, true)
    await assert.rejects(promise, error)
  })

  it('issues when latest promise rejects', async () => {
    const error = new Error()
    await assert.rejects(
      asyncMapSettled([1], () => Promise.reject(error)),
      error
    )
  })
})
