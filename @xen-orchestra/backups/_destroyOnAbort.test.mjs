import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'

import { destroyOnAbort } from './_destroyOnAbort.mjs'

describe('destroyOnAbort()', () => {
  it('does nothing without a signal', () => {
    const stream = new PassThrough()

    destroyOnAbort(stream, undefined)()

    assert.equal(stream.destroyed, false)
    assert.equal(stream.listenerCount('error'), 0)
  })

  it('destroys the stream right away when the signal is already aborted', () => {
    const stream = new PassThrough()
    const reason = new Error('aborted')

    destroyOnAbort(stream, AbortSignal.abort(reason))

    assert.equal(stream.destroyed, true)
    assert.equal(stream.errored, reason)
  })

  it('destroys the stream once aborted, without crashing when nothing listens to it', async () => {
    const stream = new PassThrough()
    const controller = new AbortController()
    const reason = new Error('aborted')

    destroyOnAbort(stream, controller.signal)
    controller.abort(reason)
    // the error event is emitted on the next tick: an unhandled one would crash the test process
    await new Promise(resolve => setImmediate(resolve))

    assert.equal(stream.destroyed, true)
    assert.equal(stream.errored, reason)
  })

  it('returns a function that stops listening to the signal', () => {
    const stream = new PassThrough()
    const controller = new AbortController()

    destroyOnAbort(stream, controller.signal)()
    controller.abort()

    assert.equal(stream.destroyed, false)
  })
})
