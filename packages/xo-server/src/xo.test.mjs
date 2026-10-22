import assert from 'node:assert/strict'
import test from 'node:test'
import { EventEmitter } from 'node:events'

import Xo from './xo.mjs'

const { afterEach, beforeEach, describe, it, mock } = test

// resolves with the arguments of the next `name` event of `emitter`
const nextEvent = (emitter, name) => new Promise(resolve => emitter.once(name, (...args) => resolve(args)))

describe('registerCollection', () => {
  // the constructor arms a timer that is only disarmed on `core started`, which this test does not emit:
  // the fake timers keep it from firing after the test ends
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  // the `backup-archive` SSE events are built from this wrapper: the collection emits arrays of items, the
  // emitter returned by `getXoEventEmitterByType` emits one `(object, previous)` event per item
  it('turns the array payloads of a collection into add, update and remove events', async () => {
    const xo = new Xo({
      config: { datadir: '/tmp/xo-test-datadir', resourceCacheDelay: '1s', backups: { listingDebounce: '1m' } },
      appVersion: 'test',
    })
    const collection = new EventEmitter()
    collection.get = async () => []

    xo.hooks.emit('registerCollection', { collection, type: 'backup-archive' })
    // the registration is asynchronous (it waits for the initial load): let it finish
    await new Promise(resolve => setImmediate(resolve))
    const emitter = xo.getXoEventEmitterByType('backup-archive')

    const archive = { id: 'archive-1', vm: 'vm-1' }

    const added = nextEvent(emitter, 'add')
    collection.emit('add', [archive])
    assert.deepEqual(await added, [archive, undefined])

    const updated = nextEvent(emitter, 'update')
    collection.emit('update', [{ ...archive, size: 2 }])
    assert.deepEqual(await updated, [{ ...archive, size: 2 }, archive])

    const removed = nextEvent(emitter, 'remove')
    collection.emit('remove', ['archive-1'])
    assert.deepEqual(await removed, [undefined, { ...archive, size: 2 }])
  })
})
