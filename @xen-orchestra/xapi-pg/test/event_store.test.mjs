import * as assert from 'node:assert'
import { test, suite } from 'node:test'
import { createClassNameFixer, EventStore } from '../src/event_store.mjs'
import { ReferenceStore } from '../src/db_history.mjs'
import { NULL_REF } from '../src/xapi.mjs'

const tableNames = {
  eventTableName: 'events',
  historyTableName: 'history',
  ref2UuidTableName: 'ref_uuid',
}

function makeIngestFixture({
  onQuery = () => ({ rowCount: 0, rows: [] }),
  prepareNonRefRecords = () => ({ references: [] }),
  collectRefsFromRecords = (_, collector) => collector || new Set(),
  persistRefRecordsToDB = async () => {},
  refStore = {
    bulkRecordUuid: async () => {},
    bulkSearchUuid: async () => new Map(),
    clearCache: () => {},
  },
} = {}) {
  const queries = []
  const actions = []
  const referenceStoreOverlays = []
  const referenceCacheMerges = []
  const createOverlay = refStore.createOverlay?.bind(refStore)
  refStore.createOverlay = () => {
    const overlay = createOverlay?.() ?? {
      bulkRecordUuid: (...args) => refStore.bulkRecordUuid(...args),
      bulkSearchUuid: (...args) => refStore.bulkSearchUuid(...args),
      mergeCache: () => {},
    }
    const mergeCache = overlay.mergeCache.bind(overlay)
    overlay.mergeCache = () => {
      referenceCacheMerges.push(overlay)
      mergeCache()
    }
    referenceStoreOverlays.push(overlay)
    return overlay
  }
  const dbClient = {
    query: async (sql, params) => {
      queries.push({ sql, params })
      actions.push(sql)
      return onQuery(sql, params, queries)
    },
  }
  const classesDict = {
    VM: {
      getTableNameEsc: () => '"VM"',
      prepareNonRefRecords: records => {
        actions.push('prepare non-reference records')
        return prepareNonRefRecords(records)
      },
      collectRefsFromRecords,
      persistRefRecordsToDB,
    },
  }
  const eventStore = new EventStore(classesDict, tableNames, 'pool-ref', new Map(), refStore)
  return { dbClient, eventStore, queries, refStore, actions, referenceStoreOverlays, referenceCacheMerges }
}

function serializationError() {
  return Object.assign(new Error('serialization failure'), { code: '40001' })
}

function queryCount(queries, sql) {
  return queries.filter(query => query.sql === sql).length
}

suite('EventStore.ingestEvents', function () {
  test('prepares non-reference writes before the transaction and reuses them on retry', async function () {
    let commitAttempts = 0
    const refSearches = []
    let referencePersistenceAttempts = 0
    let preparationCount = 0
    const fixture = makeIngestFixture({
      onQuery: sql => {
        if (sql === 'COMMIT' && commitAttempts++ === 0) throw serializationError()
        return { rowCount: 0, rows: [] }
      },
      prepareNonRefRecords: () => {
        preparationCount++
        return { sql: 'PREPARED NON-REFERENCE INSERT', bind: [] }
      },
      collectRefsFromRecords: (_, collector) => collector.add('reference-1'),
      persistRefRecordsToDB: async (_dbClient, _records, ref2uuid) => {
        referencePersistenceAttempts++
        ref2uuid('reference-1')
      },
      refStore: {
        bulkRecordUuid: async () => {},
        bulkSearchUuid: async refs => {
          const searchedRefs = [...refs]
          refSearches.push(searchedRefs)
          return searchedRefs.length && refSearches.filter(search => search.length > 0).length === 2
            ? new Map([['reference-1', 'uuid-1']])
            : new Map()
        },
      },
    })

    const unknownRefs = await fixture.eventStore.ingestEvents(
      fixture.dbClient,
      { token: 'token-1', events: [{ class: 'VM', operation: 'add', ref: 'ref-1', snapshot: { uuid: 'uuid-1' } }] },
      'session-1'
    )

    assert.deepStrictEqual(unknownRefs, new Set())
    assert.deepStrictEqual(
      refSearches.filter(refs => refs.length > 0),
      [['reference-1'], ['reference-1']]
    )
    assert.strictEqual(preparationCount, 1)
    assert.strictEqual(referencePersistenceAttempts, 2)
    assert.strictEqual(fixture.actions[0], 'prepare non-reference records')
    assert.strictEqual(fixture.actions[1], 'BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE DEFERRABLE')
    assert.strictEqual(queryCount(fixture.queries, 'PREPARED NON-REFERENCE INSERT'), 2)
    assert.strictEqual(fixture.referenceStoreOverlays.length, 2)
    assert.notStrictEqual(fixture.referenceStoreOverlays[0], fixture.referenceStoreOverlays[1])
    assert.deepStrictEqual(fixture.referenceCacheMerges, [fixture.referenceStoreOverlays[1]])
    assert.strictEqual(queryCount(fixture.queries, 'BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE DEFERRABLE'), 2)
    assert.strictEqual(queryCount(fixture.queries, 'ROLLBACK'), 1)
    assert.strictEqual(queryCount(fixture.queries, 'COMMIT'), 2)
  })

  test('retries serialization failures raised by statements', async function () {
    let setLocalAttempts = 0
    const fixture = makeIngestFixture({
      onQuery: sql => {
        if (sql === 'SET LOCAL synchronous_commit = off;' && setLocalAttempts++ === 0) throw serializationError()
        return { rowCount: 0, rows: [] }
      },
    })

    await fixture.eventStore.ingestEvents(fixture.dbClient, { token: 'token-1', events: [] }, 'session-1')

    assert.strictEqual(queryCount(fixture.queries, 'BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE DEFERRABLE'), 2)
    assert.strictEqual(queryCount(fixture.queries, 'ROLLBACK'), 1)
    assert.strictEqual(queryCount(fixture.queries, 'COMMIT'), 1)
  })

  test('stops after the configured number of serialization retries', async function () {
    const fixture = makeIngestFixture({
      onQuery: sql => (sql === 'COMMIT' ? Promise.reject(serializationError()) : { rows: [] }),
    })

    await assert.rejects(
      fixture.eventStore.ingestEvents(fixture.dbClient, { token: 'token-1', events: [] }, 'session-1'),
      error => {
        assert.strictEqual(error.cause.code, '40001')
        return true
      }
    )

    assert.strictEqual(queryCount(fixture.queries, 'BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE DEFERRABLE'), 4)
    assert.strictEqual(queryCount(fixture.queries, 'ROLLBACK'), 4)
    assert.strictEqual(queryCount(fixture.queries, 'COMMIT'), 4)
  })

  test('does not retry non-serialization failures', async function () {
    const failure = new Error('database unavailable')
    const fixture = makeIngestFixture({
      onQuery: sql => (sql.startsWith('SET LOCAL') ? Promise.reject(failure) : { rows: [] }),
    })

    await assert.rejects(
      fixture.eventStore.ingestEvents(fixture.dbClient, { token: 'token-1', events: [] }, 'session-1'),
      error => {
        assert.strictEqual(error.cause, failure)
        return true
      }
    )

    assert.strictEqual(queryCount(fixture.queries, 'BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE DEFERRABLE'), 1)
    assert.strictEqual(queryCount(fixture.queries, 'ROLLBACK'), 1)
    assert.deepStrictEqual(fixture.referenceCacheMerges, [])
  })

  test('propagates rollback failures without retrying', async function () {
    const rollbackFailure = new Error('connection lost during rollback')
    const fixture = makeIngestFixture({
      onQuery: sql => {
        if (sql.startsWith('SET LOCAL')) throw serializationError()
        if (sql === 'ROLLBACK') throw rollbackFailure
        return { rows: [] }
      },
    })

    await assert.rejects(
      fixture.eventStore.ingestEvents(fixture.dbClient, { token: 'token-1', events: [] }, 'session-1'),
      error => error === rollbackFailure
    )

    assert.strictEqual(queryCount(fixture.queries, 'BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE DEFERRABLE'), 1)
    assert.strictEqual(queryCount(fixture.queries, 'ROLLBACK'), 1)
    assert.deepStrictEqual(fixture.referenceCacheMerges, [])
  })

  test('does not carry deletion snapshots into a retried attempt or mutate the input batch', async function () {
    let deleteSearches = 0
    let commitAttempts = 0
    const originalEvent = { id: 'event-del', class: 'VM', operation: 'del', ref: 'ref-del' }
    const fixture = makeIngestFixture({
      onQuery: sql => {
        if (sql === 'COMMIT' && commitAttempts++ === 0) throw serializationError()
        return { rows: [] }
      },
      refStore: {
        bulkRecordUuid: async () => {},
        bulkSearchUuid: async refs => {
          if ([...refs].length === 0) return new Map()
          return deleteSearches++ === 0 ? new Map([['ref-del', 'uuid-del']]) : new Map()
        },
        clearCache: () => {},
      },
    })

    await fixture.eventStore.ingestEvents(
      fixture.dbClient,
      { token: 'token-del', events: [originalEvent] },
      'session-1'
    )

    assert.strictEqual(originalEvent.snapshot, undefined)
    const deletes = fixture.queries.filter(({ sql }) => sql.startsWith('DELETE'))
    assert.strictEqual(deletes.length, 1)
    assert.strictEqual(queryCount(fixture.queries, 'COMMIT'), 2)
    assert.strictEqual(fixture.referenceCacheMerges.length, 1)
  })

  test('does not cache reference mappings when their database insertion fails', async function () {
    const refStore = new ReferenceStore('ref_uuid', 'pool-ref')
    refStore._recordInMemory('existing-ref', 'existing-uuid')
    const failure = new Error('reference insert failed')
    const fixture = makeIngestFixture({
      onQuery: sql => {
        if (sql.includes('INSERT INTO ref_uuid')) throw failure
        return { rowCount: 0, rows: [] }
      },
      refStore,
    })

    await assert.rejects(
      fixture.eventStore.ingestEvents(
        fixture.dbClient,
        {
          token: 'token-1',
          events: [{ class: 'VM', operation: 'add', ref: 'new-ref', snapshot: { uuid: 'new-uuid' } }],
        },
        'session-1'
      ),
      error => error.cause === failure
    )

    assert.strictEqual(refStore.ref2Uuid.has('new-ref'), false)
    assert.strictEqual(refStore.ref2Uuid.get('existing-ref'), 'existing-uuid')
    assert.strictEqual(refStore.uuid2Ref.get('existing-uuid'), 'existing-ref')
    assert.deepStrictEqual(fixture.referenceCacheMerges, [])
    assert.strictEqual(queryCount(fixture.queries, 'ROLLBACK'), 1)
  })

  test('discards commit-failed mappings and merges only the successful retry', async function () {
    let commitAttempts = 0
    const cachedDuringRollback = []
    const refStore = new ReferenceStore('ref_uuid', 'pool-ref')
    const fixture = makeIngestFixture({
      onQuery: sql => {
        if (sql === 'COMMIT' && commitAttempts++ === 0) throw serializationError()
        if (sql === 'ROLLBACK') cachedDuringRollback.push(refStore.ref2Uuid.has('new-ref'))
        return { rowCount: 0, rows: [] }
      },
      prepareNonRefRecords: () => ({ references: ['new-ref'] }),
      refStore,
    })

    await fixture.eventStore.ingestEvents(
      fixture.dbClient,
      { token: 'token-1', events: [{ class: 'VM', operation: 'add', ref: 'new-ref', snapshot: { uuid: 'new-uuid' } }] },
      'session-1'
    )

    assert.deepStrictEqual(cachedDuringRollback, [false])
    assert.strictEqual(refStore.ref2Uuid.get('new-ref'), 'new-uuid')
    assert.strictEqual(refStore.uuid2Ref.get('new-uuid'), 'new-ref')
    assert.deepStrictEqual(fixture.referenceCacheMerges, [fixture.referenceStoreOverlays[1]])
  })
})

suite('ReferenceStore', function () {
  test('returns undefined for cache misses and resolves cached values through overlays', function () {
    const refStore = new ReferenceStore('ref_uuid', 'pool-ref')
    refStore._recordInMemory('ref-1', 'uuid-1')
    const overlay = refStore.createOverlay()

    assert.strictEqual(refStore._getCachedRef('missing-ref'), undefined)
    assert.strictEqual(refStore._getCachedUuid('missing-uuid'), undefined)
    assert.strictEqual(refStore._getCachedRef(NULL_REF), null)
    assert.strictEqual(refStore._getCachedUuid(null), NULL_REF)
    assert.strictEqual(overlay._getCachedRef('ref-1'), 'uuid-1')
    assert.strictEqual(overlay._getCachedUuid('uuid-1'), 'ref-1')
    assert.strictEqual(overlay._getCachedRef('missing-ref'), undefined)
    assert.strictEqual(overlay._getCachedUuid('missing-uuid'), undefined)
  })

  test('rejects undefined cache mappings without modifying either map', function () {
    const refStore = new ReferenceStore('ref_uuid', 'pool-ref')

    assert.throws(() => refStore._recordInMemory(undefined, 'uuid-1'), /cannot be undefined/)
    assert.throws(() => refStore._recordInMemory('ref-1', undefined), /cannot be undefined/)

    assert.deepStrictEqual([...refStore.ref2Uuid], [[NULL_REF, null]])
    assert.deepStrictEqual([...refStore.uuid2Ref], [[null, NULL_REF]])
  })

  test('stages new and database-loaded mappings until an overlay is merged', async function () {
    const refStore = new ReferenceStore('ref_uuid', 'pool-ref')
    refStore._recordInMemory('existing-ref', 'existing-uuid')
    refStore._recordInMemory('replace-ref', 'old-uuid')
    const overlay = refStore.createOverlay()
    const queries = []
    const dbClient = {
      query: async (sql, params) => {
        queries.push({ sql, params })
        if (sql.startsWith('SELECT ref, uuid') && sql.includes('ref = ANY')) {
          return { rowCount: 1, rows: [{ ref: 'loaded-ref', uuid: 'loaded-uuid' }] }
        }
        if (sql.startsWith('SELECT ref, uuid') && sql.includes('uuid = ANY')) {
          return { rowCount: 1, rows: [{ ref: 'reverse-loaded-ref', uuid: 'reverse-loaded-uuid' }] }
        }
        return { rowCount: 0, rows: [] }
      },
    }

    await overlay.bulkRecordUuid(
      [
        ['replace-ref', 'new-uuid'],
        ['new-ref', 'new-uuid-2'],
      ],
      dbClient
    )
    const refs = await overlay.bulkSearchUuid(['existing-ref', 'new-ref', 'loaded-ref'], dbClient)
    const reverseRefs = await overlay.bulkSearchRef(dbClient, ['existing-uuid', 'reverse-loaded-uuid'])

    assert.deepStrictEqual(
      [...refs],
      [
        ['existing-ref', 'existing-uuid'],
        ['new-ref', 'new-uuid-2'],
        ['loaded-ref', 'loaded-uuid'],
      ]
    )
    assert.deepStrictEqual(
      [...reverseRefs],
      [
        ['existing-uuid', 'existing-ref'],
        ['reverse-loaded-uuid', 'reverse-loaded-ref'],
      ]
    )
    assert.strictEqual(refStore.ref2Uuid.has('new-ref'), false)
    assert.strictEqual(refStore.ref2Uuid.has('loaded-ref'), false)
    assert.strictEqual(refStore.ref2Uuid.has('reverse-loaded-ref'), false)
    assert.strictEqual(refStore.ref2Uuid.get('replace-ref'), 'old-uuid')
    assert.strictEqual(refStore.uuid2Ref.has('reverse-loaded-uuid'), false)

    overlay.mergeCache()

    assert.strictEqual(refStore.ref2Uuid.get('replace-ref'), 'new-uuid')
    assert.strictEqual(refStore.ref2Uuid.get('new-ref'), 'new-uuid-2')
    assert.strictEqual(refStore.ref2Uuid.get('loaded-ref'), 'loaded-uuid')
    assert.strictEqual(refStore.uuid2Ref.get('reverse-loaded-uuid'), 'reverse-loaded-ref')
    assert.strictEqual(refStore.ref2Uuid.get(NULL_REF), null)
    assert.strictEqual(refStore.uuid2Ref.get(null), NULL_REF)
    assert.strictEqual(queries.length, 3)
  })
})

suite('createClassNameFixer', function () {
  test('restores class names and preserves event and batch fields without mutating the input', function () {
    const fix = createClassNameFixer({ VM: {}, VBD: {}, host: {} })
    const snapshot = { uuid: 'uuid-1' }
    const batch = {
      token: 'token-1',
      events: [
        { class: 'vm', operation: 'add', ref: 'ref-1', snapshot },
        { class: 'vbd', operation: 'del', ref: 'ref-2' },
        { class: 'host', operation: 'mod', ref: 'ref-3' },
      ],
      valid_ref_counts: { vm: 2, vbd: 0, host: 1 },
    }
    const original = structuredClone(batch)

    const result = fix(batch)

    assert.deepStrictEqual(result, {
      token: 'token-1',
      events: [
        { class: 'VM', operation: 'add', ref: 'ref-1', snapshot },
        { class: 'VBD', operation: 'del', ref: 'ref-2' },
        { class: 'host', operation: 'mod', ref: 'ref-3' },
      ],
      valid_ref_counts: { VM: 2, VBD: 0, host: 1 },
    })
    assert.deepStrictEqual(batch, original)
    assert.notStrictEqual(result, batch)
    assert.notStrictEqual(result.events, batch.events)
    assert.notStrictEqual(result.valid_ref_counts, batch.valid_ref_counts)
    for (let i = 0; i < batch.events.length; i++) {
      assert.notStrictEqual(result.events[i], batch.events[i])
    }
    assert.strictEqual(result.events[0].snapshot, snapshot)
  })

  test('retains unknown events with an undefined class and removes unknown counts', function () {
    const fix = createClassNameFixer({ VM: {} })
    const result = fix({
      events: [
        { class: 'unknown', ref: 'ref-1' },
        { class: 'vm', ref: 'ref-2' },
      ],
      valid_ref_counts: { unknown: 3, vm: 1 },
    })

    assert.deepStrictEqual(result, {
      events: [
        { class: undefined, ref: 'ref-1' },
        { class: 'VM', ref: 'ref-2' },
      ],
      valid_ref_counts: { VM: 1 },
    })
  })

  test('handles empty batches and can be reused', function () {
    const fix = createClassNameFixer({ VM: {} })
    assert.deepStrictEqual(fix({ token: 'empty', events: [], valid_ref_counts: {} }), {
      token: 'empty',
      events: [],
      valid_ref_counts: {},
    })
    assert.deepStrictEqual(fix({ events: [{ class: 'vm' }], valid_ref_counts: { vm: 1 } }), {
      events: [{ class: 'VM' }],
      valid_ref_counts: { VM: 1 },
    })
  })
})
