import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { abortableMap } from './_abortableMap.mjs'

const tick = () => new Promise(resolve => setImmediate(resolve))

// resolves once `signal` is aborted
const aborted = signal => new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))

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

  it('aborts the other items and rejects with the first failure once they have settled', async () => {
    const error = new Error('first failure')
    const signals = []
    const stopped = []

    await assert.rejects(
      abortableMap(undefined, [1, 2, 3], async (signal, item) => {
        signals.push(signal)
        if (item === 2) {
          throw error
        }
        await aborted(signal)
        await tick() // winds down after the abort
        stopped.push(item)
        throw new Error(`item ${item} aborted`)
      }),
      error
    )

    assert.equal(signals.length, 3)
    assert.ok(signals.every(signal => signal.aborted))
    // the other items have stopped before the rejection
    assert.deepEqual(stopped.sort(), [1, 3])
  })

  it('stops at a synchronous failure, and aborts and waits for the items already started', async () => {
    const error = new Error('synchronous failure')
    const started = []
    const stopped = []

    await assert.rejects(
      abortableMap(undefined, [1, 2, 3], (signal, item) => {
        if (item === 2) {
          throw error
        }
        started.push(item)
        return aborted(signal).then(() => {
          stopped.push(item)
        })
      }),
      error
    )

    assert.deepEqual(started, [1])
    assert.deepEqual(stopped, [1])
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
