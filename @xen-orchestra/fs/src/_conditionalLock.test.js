import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'
import sinon from 'sinon'

import {
  acquireConditionalLock,
  REFRESH_INTERVAL,
  REFRESH_TIMEOUT,
  STALE_AFTER,
  probeConditionalWrites,
} from './_conditionalLock.js'

// an in-memory `ConditionalLockStore`, which honours the conditions as S3 does
//
// `age` is measured with `Date.now()`, which the tests fake
function createMemoryStore({
  ignoreIfNoneMatch = false,
  ignoreIfMatch = false,
  refuseConditions = false,
  refuseRead = false,
  deleteMarkerBlocks = false,
  vanishBeforeReplace = false,
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
      if (vanishBeforeReplace) {
        object = undefined
      }
      if (ignoreIfMatch) {
        return object ? write(body) : undefined
      }
      return object?.etag === etag ? write(body) : undefined
    },
    async read() {
      if (refuseRead) {
        throw Object.assign(new Error('GetObject returned no Body, ETag or Last-Modified'), { code: 'ENOTSUP' })
      }
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

// one refresh, after `REFRESH_INTERVAL`
async function refreshOnce() {
  mock.timers.tick(REFRESH_INTERVAL)
  await flush()
}

const LOCKED = { code: 'ELOCKED', message: 'Lock file is already being held' }
const OTHER = '{"id":"other","seq":0}'

describe('acquireConditionalLock()', function () {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('takes a free lock, and deletes it on release', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')
    const body = JSON.parse(store.object.body)
    assert.match(body.id, /^[0-9a-f]{32}$/)
    assert.equal(body.seq, 0)

    await release()
    assert.equal(store.object, undefined)
  })

  it('refuses a held lock', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')
    try {
      await assert.rejects(acquireConditionalLock(store, 'p'), LOCKED)
    } finally {
      await release()
    }
  })

  it('rewrites its object with a new body every REFRESH_INTERVAL, so that it never goes stale', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    for (let i = 0; i < 7; ++i) {
      await refreshOnce()
    }
    const bodies = store.writes.map(body => JSON.parse(body))
    assert.deepEqual(
      bodies.map(({ seq }) => seq),
      [0, 1, 2, 3, 4, 5, 6, 7]
    )
    assert.equal(new Set(bodies.map(({ id }) => id)).size, 1)
    await assert.rejects(acquireConditionalLock(store, 'p'), LOCKED)

    await release()
  })

  it('takes over a stale lock, not a fresh one', async () => {
    const store = createMemoryStore()

    store.plant(OTHER, STALE_AFTER - 1)
    await assert.rejects(acquireConditionalLock(store, 'p'), LOCKED)

    store.plant(OTHER, STALE_AFTER + 1)
    const release = await acquireConditionalLock(store, 'p')
    assert.notEqual(JSON.parse(store.object.body).id, 'other')
    await release()
  })

  it("takes a body it cannot parse for someone else's", async () => {
    const store = createMemoryStore()

    // `null` parses, but has no `id`
    for (const body of ['garbage', 'null']) {
      store.plant(body)
      await assert.rejects(acquireConditionalLock(store, 'p'), LOCKED)

      store.plant(body, STALE_AFTER + 1)
      const release = await acquireConditionalLock(store, 'p')
      await release()
    }
  })

  // the SDK retries a request whose response was lost: when the write had landed, the retry is refused by the very
  // object it wrote
  it('recognises its own object after a lost response of create()', async () => {
    const store = createMemoryStore()
    const { create } = store
    sinon
      .stub(store, 'create')
      .callThrough()
      .onFirstCall()
      .callsFake(async body => {
        await create(body)
      })

    const release = await acquireConditionalLock(store, 'p')
    assert.equal(store.writes.length, 1)

    await release()
    assert.equal(store.object, undefined)
  })

  it('recognises its own object after a lost response of a takeover', async () => {
    const store = createMemoryStore()
    store.plant(OTHER, STALE_AFTER + 1)
    const { replace } = store
    sinon
      .stub(store, 'replace')
      .callThrough()
      .onFirstCall()
      .callsFake(async (body, etag) => {
        await replace(body, etag)
      })

    const release = await acquireConditionalLock(store, 'p')
    assert.equal(JSON.parse(store.object.body).id, JSON.parse(store.writes[0]).id)

    await release()
    assert.equal(store.object, undefined)
  })

  it('recognises its own object after a lost response of a refresh, and refreshes with its new ETag', async () => {
    const store = createMemoryStore()
    sinon.spy(store, 'create')
    const release = await acquireConditionalLock(store, 'p')
    const { id } = JSON.parse(store.object.body)

    const { replace } = store
    sinon
      .stub(store, 'replace')
      .callThrough()
      .onFirstCall()
      .callsFake(async (body, etag) => {
        await replace(body, etag)
      })

    // the refresh landed, its response lost: it is not reacquired, nor created again
    await refreshOnce()
    assert.equal(store.writes.length, 2)
    assert.deepEqual(JSON.parse(store.object.body), { id, seq: 1 })
    assert.equal(store.create.callCount, 1)

    // the next refresh replaces the object written by the lost one, under its ETag
    await refreshOnce()
    assert.equal(store.writes.length, 3)
    assert.deepEqual(JSON.parse(store.object.body), { id, seq: 2 })
    assert.equal(store.create.callCount, 1)

    await release()
    assert.equal(store.object, undefined)
  })

  it('takes a lock released between create() and read()', async () => {
    const store = createMemoryStore()
    sinon.stub(store, 'create').callThrough().onFirstCall().resolves(undefined)
    sinon.stub(store, 'read').callThrough().onFirstCall().resolves(undefined)

    const release = await acquireConditionalLock(store, 'p')
    assert.equal(store.create.callCount, 2)
    assert.equal(store.writes.length, 1)

    await release()
    assert.equal(store.object, undefined)
  })

  it('takes over a stale lock which vanishes before the takeover, by creating it again', async () => {
    const store = createMemoryStore({ vanishBeforeReplace: true })
    store.plant(OTHER, STALE_AFTER + 1)

    const release = await acquireConditionalLock(store, 'p')
    assert.equal(store.writes.length, 1)
    assert.equal(store.object.body, store.writes[0])
    const { id, seq } = JSON.parse(store.object.body)
    assert.notEqual(id, 'other')
    assert.equal(seq, 0)

    await release()
    assert.equal(store.object, undefined)
  })

  it('refuses a lock taken again between create() and read()', async () => {
    const store = createMemoryStore()
    sinon.stub(store, 'create').resolves(undefined)
    sinon.stub(store, 'read').resolves(undefined)

    await assert.rejects(acquireConditionalLock(store, 'p'), LOCKED)
    assert.equal(store.create.callCount, 2)
  })

  it('gives up a lock someone else took, without deleting it', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')

    store.plant(OTHER)
    await refreshOnce()
    await refreshOnce()
    assert.equal(store.writes.length, 1)

    await release()
    assert.equal(store.object.body, OTHER)
  })

  it('takes back a lock which vanished', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')
    const { id } = JSON.parse(store.object.body)

    await store.remove()
    await refreshOnce()
    assert.equal(JSON.parse(store.object.body).id, id)

    await release()
  })

  it('gives up a refresh whose request hangs, and keeps refreshing', async () => {
    const store = createMemoryStore()
    const release = await acquireConditionalLock(store, 'p')
    const hung = new Promise(() => {})
    sinon.stub(store, 'replace').callThrough().onFirstCall().returns(hung)

    await refreshOnce()
    assert.equal(store.writes.length, 1)

    // the refresh gave up: the next one runs one interval later
    mock.timers.tick(REFRESH_TIMEOUT)
    await flush()
    await refreshOnce()
    assert.equal(store.writes.length, 2)

    // nor does the release wait for a hung refresh beyond REFRESH_TIMEOUT
    store.replace.returns(hung)
    await refreshOnce()
    const releasing = release()
    mock.timers.tick(REFRESH_TIMEOUT)
    await releasing
  })
})

describe('probeConditionalWrites()', function () {
  it('accepts a store which honours the conditions, and deletes its object', async () => {
    const store = createMemoryStore()
    assert.equal(await probeConditionalWrites(store), undefined)
    assert.equal(store.object, undefined)
  })

  for (const [flag, reason] of [
    ['ignoreIfNoneMatch', 'If-None-Match is ignored'],
    ['ignoreIfMatch', 'If-Match is ignored'],
    ['refuseConditions', 'the storage refuses conditional writes: 501 Not Implemented'],
    ['refuseRead', 'the storage refuses conditional writes: GetObject returned no Body, ETag or Last-Modified'],
    ['deleteMarkerBlocks', 'a deleted object cannot be created again'],
  ]) {
    it(`refuses a store with ${flag}, and deletes its object`, async () => {
      const store = createMemoryStore({ [flag]: true })
      assert.equal(await probeConditionalWrites(store), reason)
      assert.equal(store.object, undefined)
    })
  }

  it('rejects when a request fails, and deletes its object', async () => {
    const store = createMemoryStore()
    sinon.stub(store, 'replace').rejects(new Error('ECONNRESET'))

    await assert.rejects(probeConditionalWrites(store), { message: 'ECONNRESET' })
    assert.equal(store.object, undefined)
  })
})
