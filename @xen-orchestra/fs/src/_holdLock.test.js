import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'
import sinon from 'sinon'

import { holdLock, lockedError } from './_holdLock.js'

const INTERVAL = 10e3

const flush = async (n = 5) => {
  for (let i = 0; i < n; ++i) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

// one refresh, after `INTERVAL`
async function tick() {
  mock.timers.tick(INTERVAL)
  await flush()
}

describe('holdLock()', () => {
  let lock

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    lock = {
      refresh: sinon.stub().resolves(true),
      reacquire: sinon.stub().resolves(),
      release: sinon.stub().resolves(),
    }
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('refreshes every interval until released', async () => {
    const release = holdLock('p', INTERVAL, lock)
    await tick()
    await tick()
    assert.equal(lock.refresh.callCount, 2)

    await release()
    assert.equal(lock.release.callCount, 1)

    await tick()
    assert.equal(lock.refresh.callCount, 2)
  })

  it('keeps refreshing after a failed refresh', async () => {
    lock.refresh.onFirstCall().rejects(new Error('ECONNRESET'))
    const release = holdLock('p', INTERVAL, lock)

    await tick()
    await tick()
    assert.equal(lock.refresh.callCount, 2)
    assert.equal(lock.reacquire.callCount, 0)

    await release()
  })

  it('takes back a lost lock, and keeps refreshing', async () => {
    lock.refresh.onFirstCall().resolves(false)
    const release = holdLock('p', INTERVAL, lock)

    await tick()
    assert.equal(lock.reacquire.callCount, 1)

    await tick()
    assert.equal(lock.refresh.callCount, 2)

    await release()
  })

  it('tries again to take back a lost lock when the request fails', async () => {
    lock.refresh.resolves(false)
    lock.reacquire.onFirstCall().rejects(new Error('503 Service Unavailable'))
    const release = holdLock('p', INTERVAL, lock)

    await tick()
    await tick()
    assert.equal(lock.reacquire.callCount, 2)

    await release()
  })

  it('gives up a lock another holder took', async () => {
    lock.refresh.resolves(false)
    lock.reacquire.rejects(lockedError('p'))
    const release = holdLock('p', INTERVAL, lock)

    await tick()
    await tick()
    assert.equal(lock.refresh.callCount, 1)

    await release()
  })

  it('release waits for a refresh in flight', async () => {
    let refreshed
    lock.refresh.callsFake(() => new Promise(resolve => (refreshed = resolve)))
    const release = holdLock('p', INTERVAL, lock)

    await tick()
    const releasing = release()
    await flush()
    assert.equal(lock.release.callCount, 0)

    refreshed(true)
    await releasing
    assert.equal(lock.release.callCount, 1)
  })

  it('release never rejects', async () => {
    lock.release.rejects(new Error('network error'))
    const release = holdLock('p', INTERVAL, lock)

    await release()
  })
})
