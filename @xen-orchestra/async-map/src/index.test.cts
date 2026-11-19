import { describe, it, mock } from 'node:test'
import { strict as assert } from 'node:assert'

import { asyncMap, asyncMapSettled } from './index.cjs'

const noop = () => {}

type Defer = {
  promise: Promise<void>
  resolve: (value: void | PromiseLike<void>) => void
  reject: (reason?: unknown) => void
}

// wait for all microtasks to settle
const settleMicrotasks = () => new Promise(resolve => setImmediate(resolve))

describe('asyncMap', () => {
  it('works', async () => {
    const values = [Math.random(), Math.random()]
    const spy = mock.fn(async (v: number) => v * 2)
    const iterable = new Set(values)

    // returns an array containing the result of each calls
    assert.deepStrictEqual(
      await asyncMap(iterable, spy),
      values.map(value => value * 2)
    )

    for (let i = 0, n = values.length; i < n; ++i) {
      // each call receive the current item and its index, because `Array.from`
      // is what calls it
      assert.deepStrictEqual(spy.mock.calls[i].arguments, [values[i], i])

      // each call as this bind to the iterable
      assert.deepStrictEqual(spy.mock.calls[i].this, iterable)
    }
  })

  it('can use a specified thisArg', async () => {
    const thisArg = {}
    const spy = mock.fn()
    await asyncMap(['foo'], spy, thisArg)
    assert.deepStrictEqual(spy.mock.calls[0].this, thisArg)
  })

  it('resolves to an empty array for an empty iterable', async () => {
    assert.deepStrictEqual(await asyncMap([], noop), [])
  })

  it('rejects as soon as a call rejects', async () => {
    const error = new Error()
    await assert.rejects(
      asyncMap([1, 2], i => (i === 1 ? Promise.reject(error) : new Promise(noop))),
      error
    )
  })

  // unlike `asyncMapSettled`, which wraps each call
  it('throws synchronously when the mapper throws synchronously', () => {
    const error = new Error()
    assert.throws(
      () =>
        asyncMap([1], () => {
          throw error
        }),
      error
    )
  })
})

describe('asyncMapSettled', () => {
  it('works', async () => {
    const values = [Math.random(), Math.random()]
    const spy = mock.fn(async (v: number) => v * 2)
    const iterable = new Set(values)

    // returns an array containing the result of each calls
    assert.deepStrictEqual(
      await asyncMapSettled(iterable, spy),
      values.map(value => value * 2)
    )

    for (let i = 0, n = values.length; i < n; ++i) {
      // each call receive the current item as sole argument
      assert.deepStrictEqual(spy.mock.calls[i].arguments, [values[i]])

      // each call as this bind to the iterable
      assert.deepStrictEqual(spy.mock.calls[i].this, iterable)
    }
  })

  it('can use a specified thisArg', () => {
    const thisArg = {}
    const spy = mock.fn()
    asyncMapSettled(['foo'], spy, thisArg)
    assert.deepStrictEqual(spy.mock.calls[0].this, thisArg)
  })

  it('resolves to an empty array for an empty iterable', async () => {
    assert.deepStrictEqual(await asyncMapSettled([], noop), [])
  })

  it('rejects when the mapper throws synchronously', async () => {
    const error = new Error()
    await assert.rejects(
      asyncMapSettled([1], () => {
        throw error
      }),
      error
    )
  })

  it('rejects only when all calls as resolved', async () => {
    const defers: Defer[] = []
    const promise = asyncMapSettled([1, 2], () => {
      let resolve!: Defer['resolve']
      let reject!: Defer['reject']
      const promise = new Promise<void>((_resolve, _reject) => {
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

    await settleMicrotasks()

    assert.strictEqual(hasSettled, false)

    defers[1].resolve()

    await settleMicrotasks()

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
