import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'

import { acquireLeaseLock, LEASE_DURATION, RENEW_INTERVAL } from './_leaseLock.js'

// an in-memory `LeaseLockStore`, which follows Azure's rules for leases
//
// expiry is measured with `Date.now()`, which the tests fake
function createMemoryStore() {
  let blob // { lease: { id, duration, expiresAt } | undefined }
  const store = {
    // every acquisition and renewal which succeeded, in order, as `[operation, leaseId]`
    operations: [],
    get blob() {
      return blob
    },
    // simulates another holder, which leased the blob `age` ms ago
    plant(id, age = 0) {
      blob = { lease: { id, duration: LEASE_DURATION, expiresAt: Date.now() - age + LEASE_DURATION * 1e3 } }
    },
    async create() {
      if (blob === undefined) {
        blob = { lease: undefined }
      }
    },
    async acquire(leaseId, duration) {
      if (blob === undefined) {
        throw Object.assign(new Error('BlobNotFound'), { code: 'ENOENT' })
      }
      const { lease } = blob
      if (lease !== undefined && lease.id !== leaseId && lease.expiresAt > Date.now()) {
        return false
      }
      blob.lease = { id: leaseId, duration, expiresAt: Date.now() + duration * 1e3 }
      store.operations.push(['acquire', leaseId])
      return true
    },
    // an expired lease can be renewed, as long as no one leased the blob since
    async renew(leaseId) {
      const lease = blob?.lease
      if (lease?.id !== leaseId) {
        return false
      }
      lease.expiresAt = Date.now() + lease.duration * 1e3
      store.operations.push(['renew', leaseId])
      return true
    },
    async remove(leaseId) {
      const lease = blob?.lease
      if (lease?.id === leaseId && lease.expiresAt > Date.now()) {
        blob = undefined
      }
    },
  }
  return store
}

const flush = async (n = 5) => {
  for (let i = 0; i < n; ++i) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

const LOCKED = {
  code: 'ELOCKED',
  message: 'Lock file is already being held',
}

describe('acquireLeaseLock', function () {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('takes a free lock', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')

    assert.equal(store.operations.length, 1)
    const [operation, leaseId] = store.operations[0]
    assert.equal(operation, 'acquire')
    assert.match(leaseId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    assert.equal(store.blob.lease.id, leaseId)
    assert.equal(store.blob.lease.duration, LEASE_DURATION)

    await release()
  })

  it('refuses a held lock', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')
    try {
      await assert.rejects(acquireLeaseLock(store, 'p'), LOCKED)
    } finally {
      await release()
    }
  })

  it('takes a lock whose lease expired', async () => {
    const store = createMemoryStore()

    store.plant('other', LEASE_DURATION * 1e3 + 1)
    const release = await acquireLeaseLock(store, 'p')
    assert.notEqual(store.blob.lease.id, 'other')
    await release()

    store.plant('other', LEASE_DURATION * 1e3 - 1)
    await assert.rejects(acquireLeaseLock(store, 'p'), LOCKED)
  })

  it('renews every RENEW_INTERVAL', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')
    const [, leaseId] = store.operations[0]

    mock.timers.tick(RENEW_INTERVAL)
    await flush()
    assert.deepEqual(store.operations[1], ['renew', leaseId])

    mock.timers.tick(RENEW_INTERVAL)
    await flush()
    assert.deepEqual(store.operations[2], ['renew', leaseId])
    assert.equal(store.operations.length, 3)

    await release()
  })

  it('a renewed lease never expires', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')

    for (let i = 0; i < 7; ++i) {
      mock.timers.tick(RENEW_INTERVAL)
      await flush()
    }

    await assert.rejects(acquireLeaseLock(store, 'p'), LOCKED)

    await release()
  })

  it('tries again when the blob is deleted before it is leased', async () => {
    const store = createMemoryStore()
    store.plant('other')

    // its holder releases the lock right after the first `create()`
    const originalCreate = store.create
    let creates = 0
    store.create = async function () {
      await originalCreate.call(this)
      if (++creates === 1) {
        await store.remove('other')
      }
    }

    const release = await acquireLeaseLock(store, 'p')
    assert.equal(creates, 2)
    assert.notEqual(store.blob.lease.id, 'other')
    await release()
  })

  it('refuses the lock when the blob is deleted twice before it is leased', async () => {
    const store = createMemoryStore()

    // a contender takes the lock and releases it right after every `create()`
    const originalCreate = store.create
    store.create = async function () {
      await originalCreate.call(this)
      store.plant('other')
      await store.remove('other')
    }

    await assert.rejects(acquireLeaseLock(store, 'p'), LOCKED)
  })

  it('gives up a lock someone else took, without deleting it', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')

    // the lease expired, and another holder took it
    store.plant('other')

    mock.timers.tick(RENEW_INTERVAL)
    await flush()

    // no renewal after losing the lock
    const operationsAfterLoss = store.operations.length
    mock.timers.tick(RENEW_INTERVAL)
    await flush()
    assert.equal(store.operations.length, operationsAfterLoss)

    await release()

    // the other holder's blob is still there
    assert.equal(store.blob.lease.id, 'other')
  })

  it('takes back a lock whose blob vanished', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')

    const [, leaseId] = store.operations[0]
    await store.remove(leaseId)
    assert.equal(store.blob, undefined)

    mock.timers.tick(RENEW_INTERVAL)
    await flush()

    assert.equal(store.blob.lease.id, leaseId)

    await release()
  })

  it('keeps renewing after a failed request', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')

    const originalRenew = store.renew
    let failNext = true
    store.renew = async function (leaseId) {
      if (failNext) {
        failNext = false
        throw new Error('ECONNRESET')
      }
      return originalRenew.call(this, leaseId)
    }

    mock.timers.tick(RENEW_INTERVAL)
    await flush()
    assert.equal(store.operations.length, 1)

    mock.timers.tick(RENEW_INTERVAL)
    await flush()
    assert.equal(store.operations.length, 2)

    await release()
  })

  it('release deletes the blob and stops renewing', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')

    assert.notEqual(store.blob, undefined)
    await release()
    assert.equal(store.blob, undefined)

    const operationsAfterRelease = store.operations.length
    mock.timers.tick(RENEW_INTERVAL)
    await flush()
    mock.timers.tick(RENEW_INTERVAL)
    await flush()
    assert.equal(store.operations.length, operationsAfterRelease)
  })

  it('release never rejects', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')

    store.remove = async function () {
      throw new Error('network error')
    }

    await release()
  })

  it('release waits for a renewal in flight', async () => {
    const store = createMemoryStore()
    const release = await acquireLeaseLock(store, 'p')

    const originalRenew = store.renew
    let resolveRenew
    store.renew = function (leaseId) {
      return new Promise(resolve => {
        resolveRenew = () => resolve(originalRenew.call(this, leaseId))
      })
    }

    mock.timers.tick(RENEW_INTERVAL)
    await flush()

    const releasePromise = release()
    await flush()

    // the blob is not deleted while the renewal is in flight
    assert.notEqual(store.blob, undefined)

    resolveRenew()
    await releasePromise
    assert.equal(store.blob, undefined)
  })
})
