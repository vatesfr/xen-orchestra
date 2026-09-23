import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import asyncMapLegacy = require('./legacy.cjs')

const noop = () => {}

// wait for all microtasks to settle
const settleMicrotasks = () => new Promise(resolve => setImmediate(resolve))

describe('asyncMapLegacy', () => {
  it('maps an array, keyed by index', async () => {
    assert.deepStrictEqual(await asyncMapLegacy([10, 20, 30], async (value, key) => value + key), [10, 21, 32])
  })

  it('maps a plain object, keyed by property name', async () => {
    assert.deepStrictEqual(await asyncMapLegacy({ foo: 1, bar: 2 }, async (value, key) => `${key}:${value}`), [
      'foo:1',
      'bar:2',
    ])
  })

  it('awaits a collection given as a promise', async () => {
    assert.deepStrictEqual(await asyncMapLegacy(Promise.resolve([1, 2]), async value => value * 2), [2, 4])
  })

  it('resolves to an empty array for a nullish collection', async () => {
    assert.deepStrictEqual(await asyncMapLegacy(null, noop), [])
    assert.deepStrictEqual(await asyncMapLegacy(undefined, noop), [])
  })

  it('passes the collection as third argument', async () => {
    const collection = [1]
    await asyncMapLegacy(collection, async (value, key, received) => {
      assert.strictEqual(received, collection)
    })
  })

  it('rejects only when all calls have settled', async () => {
    let resolveSecond!: () => void
    const second = new Promise<void>(resolve => {
      resolveSecond = resolve
    })

    const error = new Error()
    const promise = asyncMapLegacy([1, 2], (value): Promise<void> => (value === 1 ? Promise.reject(error) : second))

    let hasSettled = false
    promise.catch(noop).then(() => {
      hasSettled = true
    })

    await settleMicrotasks()

    assert.strictEqual(hasSettled, false)

    resolveSecond()

    await settleMicrotasks()

    assert.strictEqual(hasSettled, true)
    await assert.rejects(promise, error)
  })

  it('rejects with the first error', async () => {
    const first = new Error('first')
    const second = new Error('second')
    await assert.rejects(
      asyncMapLegacy([1, 2], value => Promise.reject(value === 1 ? first : second)),
      first
    )
  })
})
