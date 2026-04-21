import * as assert from 'node:assert'
import { after, afterEach, before, beforeEach, suite, test } from 'node:test'
import { Client as DBClient, escapeIdentifier } from 'pg'
import {
  createEventModels,
  eventsFrom,
  getValidRefCounts,
  recordEventsForClass,
  ReferenceStore,
} from '../src/db_history.mjs'
import { closeServer, createServer } from './pglite.mjs'

suite('db_history tests', async function () {
  const random_slug = (Math.random() + 1).toString(36).substring(2)
  const schema_prefix = 'test_history_' + random_slug
  const EVENT_SCHEMA = schema_prefix + '_events'
  let dbClient = null
  let server
  let socketPath
  before(async () => {
    ;({ server, socketPath } = await createServer())
  })
  after(async () => {
    await closeServer(server)
  })
  beforeEach(async function () {
    dbClient = new DBClient({ connectionString: socketPath })
    await dbClient.connect()
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(EVENT_SCHEMA)}`)
  })

  afterEach(async function () {
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(EVENT_SCHEMA)} CASCADE`)
    await dbClient.end()
  })

  test('createEventModels creates the required models', async function () {
    const { historyTableName, eventTableName, ref2UuidTableName, getDDL } = await createEventModels(EVENT_SCHEMA)
    for (const statement of getDDL()) {
      await dbClient.query(statement)
    }
    assert.ok(eventTableName)
    assert.ok(ref2UuidTableName)
    assert.ok(historyTableName)

    const results = (
      await dbClient.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1`, [EVENT_SCHEMA])
    ).rows
    const tables = new Set(results.map(r => r.table_name))
    assert.ok(tables.has('event'))
    assert.ok(tables.has('history'))
    assert.ok(tables.has('ref_uuid_assoc'))
  })

  test('recordEventsForClass and eventsFrom work together', async function () {
    const { historyTableName, eventTableName, getDDL } = await createEventModels(EVENT_SCHEMA)
    for (const statement of getDDL()) {
      await dbClient.query(statement)
    }

    const token1 = 'token1'
    const token2 = 'token2'
    const token3 = 'token3'
    await dbClient.query(`INSERT INTO ${eventTableName} (token) VALUES ($1), ($2), ($3)`, [token1, token2, token3])
    await recordEventsForClass(
      dbClient,
      [{ snapshot: { uuid: 'uuid1' }, operation: 'add' }],
      'VM',
      historyTableName,
      token1
    )
    await recordEventsForClass(
      dbClient,
      [{ snapshot: { uuid: 'uuid1' }, operation: 'mod' }],
      'VM',
      historyTableName,
      token2
    )
    await recordEventsForClass(
      dbClient,
      [{ snapshot: { uuid: 'uuid2' }, operation: 'add' }],
      'VM',
      historyTableName,
      token2
    )

    const result1 = await eventsFrom(dbClient, historyTableName, 'VM', token1)
    // uuid1 was created at token1 (lte token1), modified at token2 (gte token1) -> mod
    // uuid2 was created at token2 (gt token1) -> add
    assert.deepStrictEqual(result1.add, ['uuid2'])
    assert.deepStrictEqual(result1.mod, ['uuid1'])
    assert.deepStrictEqual(result1.del, [])

    await recordEventsForClass(
      dbClient,
      [{ snapshot: { uuid: 'uuid1' }, operation: 'del' }],
      'VM',
      historyTableName,
      token3
    )
    const result2 = await eventsFrom(dbClient, historyTableName, 'VM', token2)
    // uuid1 was created at token1 (lte token2), deleted at token3 (gte token2) -> del
    // uuid2 was created at token2 (lte token2), no further op -> not in resultKeep unless it was mod/del
    assert.deepStrictEqual(result2.add, [])
    assert.deepStrictEqual(result2.mod, [])
    assert.deepStrictEqual(result2.del, ['uuid1'])
  })

  test('getValidRefCounts returns correct count', async function () {
    const { historyTableName, eventTableName, getDDL } = await createEventModels(EVENT_SCHEMA)
    for (const statement of getDDL()) {
      await dbClient.query(statement)
    }

    const token1 = 'token1'
    await dbClient.query(`INSERT INTO ${eventTableName} (token) VALUES ($1)`, [token1])
    await recordEventsForClass(
      dbClient,
      [
        { snapshot: { uuid: 'uuid1' }, operation: 'add' },
        { snapshot: { uuid: 'uuid2' }, operation: 'add' },
        { snapshot: { uuid: 'uuid3' }, operation: 'del' },
      ],
      'VM',
      historyTableName,
      token1
    )

    const count = await getValidRefCounts(dbClient, 'VM', historyTableName)
    assert.strictEqual(count, 2)
  })

  test('ReferenceStore stores and retrieves associations', async function () {
    const { ref2UuidTableName, getDDL } = await createEventModels(EVENT_SCHEMA)
    for (const statement of getDDL()) {
      await dbClient.query(statement)
    }
    const lifetimeRef = 'pool_ref'
    const store = new ReferenceStore(ref2UuidTableName, lifetimeRef)
    await store.bulkRecordUuid(
      [
        ['ref1', 'uuid1'],
        ['ref2', 'uuid2'],
      ],
      dbClient
    )
    const uuids = await store.bulkSearchUuid(['ref1', 'ref2', 'ref3'], dbClient)
    assert.strictEqual(uuids.get('ref1'), 'uuid1')
    assert.strictEqual(uuids.get('ref2'), 'uuid2')
    assert.strictEqual(uuids.has('ref3'), false)
    const refs = await store.bulkSearchRef(dbClient, ['uuid1', 'uuid2', 'uuid4'])
    assert.strictEqual(refs.get('uuid1'), 'ref1')
    assert.strictEqual(refs.get('uuid2'), 'ref2')
    assert.strictEqual(refs.has('uuid4'), false)
    const store2 = new ReferenceStore(ref2UuidTableName, lifetimeRef)
    const uuids2 = await store2.bulkSearchUuid(['ref1'], dbClient)
    assert.strictEqual(uuids2.get('ref1'), 'uuid1')
    const refs2 = await store2.bulkSearchRef(dbClient, ['uuid2'])
    assert.strictEqual(refs2.get('uuid2'), 'ref2')
  })

  test('ReferenceStore handle NULL_REF', async function () {
    const { ref2UuidTableName } = await createEventModels(EVENT_SCHEMA)
    const store = new ReferenceStore(ref2UuidTableName, 'lifetime')
    const uuids = await store.bulkSearchUuid(['OpaqueRef:NULL'])
    assert.strictEqual(uuids.get('OpaqueRef:NULL'), null)
    const refs = await store.bulkSearchRef(dbClient, [null])
    assert.strictEqual(refs.get(null), 'OpaqueRef:NULL')
    await assert.rejects(async () => {
      await store.bulkRecordUuid([['OpaqueRef:NULL', 'some-uuid']])
    }, /OpaqueRef:NULL should always be associated to null/)
  })
})
