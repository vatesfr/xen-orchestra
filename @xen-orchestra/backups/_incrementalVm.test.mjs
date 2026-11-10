import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { abortableMap } from './_incrementalVm.mjs'

const tick = () => new Promise(resolve => setImmediate(resolve))

describe('abortableMap()', () => {
  it('works without a parent signal', async () => {
    const signals = []
    const result = await abortableMap(undefined, [1, 2, 3], async (signal, item) => {
      signals.push(signal)
      return item * 2
    })

    assert.deepEqual(result, [2, 4, 6])
    assert.ok(signals.every(signal => signal instanceof AbortSignal && !signal.aborted))
  })

  it('aborts the other items and rejects with the first failure', async () => {
    const error = new Error('first failure')
    const signals = []

    await assert.rejects(
      abortableMap(undefined, [1, 2, 3], async (signal, item) => {
        signals.push(signal)
        if (item === 2) {
          throw error
        }
        await new Promise(() => {}) // never settles, siblings are not waited for
      }),
      error
    )

    assert.equal(signals.length, 3)
    assert.ok(signals.every(signal => signal.aborted))
  })

  it('aborts every item when the parent signal is aborted', async () => {
    const parent = new AbortController()
    const signals = []

    const promise = abortableMap(parent.signal, [1, 2], (signal, item) => {
      signals.push(signal)
      return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)))
    })
    await tick()
    assert.ok(signals.every(signal => !signal.aborted))

    const reason = new Error('cancelled')
    parent.abort(reason)

    await assert.rejects(promise, reason)
    assert.ok(signals.every(signal => signal.aborted))
  })

  it('does not abort the parent signal on failure', async () => {
    const parent = new AbortController()
    await assert.rejects(abortableMap(parent.signal, [1], async () => Promise.reject(new Error('fail'))))
    assert.equal(parent.signal.aborted, false)
  })
})
