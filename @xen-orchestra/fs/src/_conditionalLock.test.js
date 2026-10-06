import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'

import { acquireConditionalLock, REFRESH_INTERVAL, STALE_AFTER, probeConditionalWrites } from './_conditionalLock.js'

// an in-memory `ConditionalLockStore`, which honours the conditions as S3 does
//
// `age` is measured with `Date.now()`, which the tests fake
function createMemoryStore({
  ignoreIfNoneMatch = false,
  ignoreIfMatch = false,
  refuseConditions = false,
  deleteMarkerBlocks = false,
} = {}) {
  let object // { body, etag, writtenAt }
  let n = 0
  let deleted = false
  const store = {
    // every body written through `create()` and `replace()`, in order
    writes: [],
    get object() {
      return object
    },
    // simulates another holder's object, written `age` ms ago
    plant(body, age = 0) {
      object = { body, etag: `"${++n}"`, writtenAt: Date.now() - age }
    },
    async create(body) {
      if (refuseConditions) {
        throw Object.assign(new Error('501 Not Implemented'), { code: 'ENOTSUP' })
      }
      if (deleteMarkerBlocks && deleted) {
        return undefined
      }
      if (ignoreIfNoneMatch) {
        return write(body)
      }
      return object === undefined ? write(body) : undefined
    },
    async replace(body, etag) {
      if (refuseConditions) {
        throw Object.assign(new Error('501 Not Implemented'), { code: 'ENOTSUP' })
      }
      if (ignoreIfMatch) {
        return object ? write(body) : undefined
      }
      return object?.etag === etag ? write(body) : undefined
    },
    async read() {
      return object && { etag: object.etag, body: object.body, age: Date.now() - object.writtenAt }
    },
    async remove() {
      object = undefined
      deleted = true
    },
  }
  function write(body) {
    object = { body, etag: `"${++n}"`, writtenAt: Date.now() }
    store.writes.push(body)
    return object.etag
  }
  return store
}

const flush = async (n = 5) => {
  for (let i = 0; i < n; ++i) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

describe('acquireConditionalLock', function () {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('takes a free lock', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')
    const body = JSON.parse(store.object.body)
    assert.match(body.id, /^[0-9a-f]{32}$/)
    assert.equal(body.seq, 0)
    await release()
  })

  it('refuses a held lock', async () => {
    const store = createMemoryStore()
    const release1 = await acquireConditionalLock(store, 'p')
    try {
      await assert.rejects(acquireConditionalLock(store, 'p'), {
        code: 'ELOCKED',
        message: 'Lock file is already being held',
      })
    } finally {
      await release1()
    }
  })

  it('refreshes every REFRESH_INTERVAL', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')
    assert.equal(store.writes.length, 1)

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.equal(store.writes.length, 2)
    const body2 = JSON.parse(store.writes[1])
    const body1 = JSON.parse(store.writes[0])
    assert.equal(body2.id, body1.id)
    assert.equal(body2.seq, 1)

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.equal(store.writes.length, 3)

    await release()
  })

  it('a refreshed lock never goes stale', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    for (let i = 0; i < 7; ++i) {
      mock.timers.tick(REFRESH_INTERVAL)
      await flush()
    }

    await assert.rejects(acquireConditionalLock(store, 'p'), {
      code: 'ELOCKED',
      message: 'Lock file is already being held',
    })

    await release()
  })

  it('takes over a stale lock', async () => {
    const store = createMemoryStore()

    // stale lock can be taken over
    store.plant('{"id":"other","seq":0}', STALE_AFTER + 1)
    const release = await acquireConditionalLock(store, 'p')
    const body = JSON.parse(store.object.body)
    assert.notEqual(body.id, 'other')
    await release()

    // fresh lock cannot be taken over
    store.plant('{"id":"other","seq":0}', STALE_AFTER - 1)
    await assert.rejects(acquireConditionalLock(store, 'p'), {
      code: 'ELOCKED',
      message: 'Lock file is already being held',
    })
  })

  it("a body it cannot parse is someone else's", async () => {
    const store = createMemoryStore()

    // garbage at stale can be taken over
    store.plant('garbage', STALE_AFTER + 1)
    const release1 = await acquireConditionalLock(store, 'p')
    await release1()

    // garbage when fresh cannot be taken over
    store.plant('garbage')
    await assert.rejects(acquireConditionalLock(store, 'p'), {
      code: 'ELOCKED',
      message: 'Lock file is already being held',
    })

    // null is parsed but no id field, treated as stale
    store.plant('null', STALE_AFTER + 1)
    const release2 = await acquireConditionalLock(store, 'p')
    await release2()
  })

  it('recognises its own object after a lost response', async () => {
    const store = createMemoryStore()

    let callCount = 0
    const originalCreate = store.create
    store.create = async function (body) {
      callCount++
      if (callCount === 1) {
        // write but resolve undefined
        await originalCreate.call(this, body)
        return undefined
      }
      return originalCreate.call(this, body)
    }

    const release = await acquireConditionalLock(store, 'p')
    await release()
    assert.equal(store.object, undefined)
  })

  it('gives up a lock someone else took, without deleting it', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    store.plant('{"id":"other","seq":0}')

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()

    // no new writes after losing the lock
    const writesAfterLoss = store.writes.length
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.equal(store.writes.length, writesAfterLoss)

    // the planted object is still there
    assert.equal(store.object.body, '{"id":"other","seq":0}')

    await release()
  })

  it('takes back a lock which vanished', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    const ownId = JSON.parse(store.object.body).id
    await store.remove()

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()

    // lock was taken back
    const currentBody = JSON.parse(store.object.body)
    assert.equal(currentBody.id, ownId)

    await release()
  })

  it('keeps refreshing after a failed request', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    let failNext = true
    const originalReplace = store.replace
    store.replace = async function (body, etag) {
      if (failNext) {
        failNext = false
        throw new Error('ECONNRESET')
      }
      return originalReplace.call(this, body, etag)
    }

    const writesBeforeFail = store.writes.length
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()

    // no write yet due to error
    assert.equal(store.writes.length, writesBeforeFail)

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()

    // refresh succeeds on second attempt
    assert.equal(store.writes.length, writesBeforeFail + 1)

    await release()
  })

  it('release deletes the object and stops refreshing', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    assert.notEqual(store.object, undefined)
    await release()
    assert.equal(store.object, undefined)

    const writesAfterRelease = store.writes.length
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()

    // no new writes after release
    assert.equal(store.writes.length, writesAfterRelease)
  })

  it('release never rejects', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    store.read = async function () {
      throw new Error('network error')
    }

    await release()
  })

  it('release waits for a refresh in flight', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    let pendingReplace
    let resolveReplace
    const originalReplace = store.replace
    store.replace = async function (body, etag) {
      const result = originalReplace.call(this, body, etag)
      if (!pendingReplace) {
        pendingReplace = new Promise(resolve => {
          resolveReplace = resolve
        })
        return pendingReplace
      }
      return result
    }

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()

    const releasePromise = release()
    await flush()

    // resolve the pending replace
    resolveReplace(await originalReplace.call(store, JSON.stringify({ id: 'test', seq: 0 }), '"1"'))
    await releasePromise

    // object was deleted even though replace was late
    assert.equal(store.object, undefined)
  })
})

describe('probeConditionalWrites()', function () {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('a compliant store', async () => {
    const store = createMemoryStore()
    const result = await probeConditionalWrites(store)
    assert.equal(result, undefined)
    assert.equal(store.object, undefined)
  })

  it('ignoreIfNoneMatch', async () => {
    const store = createMemoryStore({ ignoreIfNoneMatch: true })
    const result = await probeConditionalWrites(store)
    assert.equal(result, 'If-None-Match is ignored')
    assert.equal(store.object, undefined)
  })

  it('ignoreIfMatch', async () => {
    const store = createMemoryStore({ ignoreIfMatch: true })
    const result = await probeConditionalWrites(store)
    assert.equal(result, 'If-Match is ignored')
    assert.equal(store.object, undefined)
  })

  it('refuseConditions', async () => {
    const store = createMemoryStore({ refuseConditions: true })
    const result = await probeConditionalWrites(store)
    assert.equal(result, 'the storage refuses conditional writes: 501 Not Implemented')
    assert.equal(store.object, undefined)
  })

  it('deleteMarkerBlocks', async () => {
    const store = createMemoryStore({ deleteMarkerBlocks: true })
    const result = await probeConditionalWrites(store)
    assert.equal(result, 'a deleted object cannot be created again')
    assert.equal(store.object, undefined)
  })

  it('replace rejecting with a non-ENOTSUP error', async () => {
    const store = createMemoryStore()
    store.replace = async function (body, etag) {
      throw new Error('ECONNRESET')
    }
    const result = probeConditionalWrites(store)
    await assert.rejects(result, { message: 'ECONNRESET' })
    assert.equal(store.object, undefined)
  })
})
