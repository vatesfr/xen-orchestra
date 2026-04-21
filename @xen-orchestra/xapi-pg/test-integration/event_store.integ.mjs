import * as assert from 'node:assert'
import { after, afterEach as teardown, before, beforeEach as setup, suite, test } from 'node:test'
import { Client as DBClient, escapeIdentifier } from 'pg'
import { convertClassesToTables, createViewsDDL, createViewNames } from '../src/db.mjs'
import { createEventModels } from '../src/db_history.mjs'
import { EventStore } from '../src/event_store.mjs'
import { closeServer, createServer } from './pglite.mjs'

suite('EventStore tests', function () {
  const random_slug = (Math.random() + 1).toString(36).substring(2)
  const schema_prefix = 'test_es_' + random_slug
  const TABLE_SCHEMA = schema_prefix + '_xapi'
  const VIEW_SCHEMA = schema_prefix + '_xapi_view'
  const EVENT_SCHEMA = schema_prefix + '_xapi_events'
  let dbClient = null
  let eventStore = null
  let xapiDbClasses = null
  let historyTableName = null
  let server
  let socketPath
  before(async () => {
    ;({ server, socketPath } = await createServer())
  })
  after(async () => {
    await closeServer(server)
  })
  setup(async function () {
    dbClient = new DBClient({ connectionString: socketPath })
    await dbClient.connect()
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(TABLE_SCHEMA)}`)
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(EVENT_SCHEMA)}`)
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(VIEW_SCHEMA)}`)

    const classesDict = {
      host: {
        name: 'host',
        fields: {
          uuid: { name: 'uuid', type: 'string' },
          name_label: { name: 'name_label', type: 'string' },
        },
      },
      VM: {
        name: 'VM',
        fields: {
          uuid: { name: 'uuid', type: 'string' },
          name_label: { name: 'name_label', type: 'string' },
          power_state: { name: 'power_state', type: 'string' },
          host: { name: 'host', type: 'host ref' },
        },
      },
    }

    xapiDbClasses = convertClassesToTables(classesDict, TABLE_SCHEMA)

    // Run DDL for classes
    for (const cls of Object.values(xapiDbClasses)) {
      const ddl = cls.getDDL()
      for (const statement of ddl) {
        await dbClient.query(statement)
      }
    }

    // Run DDL for views
    const viewNames = createViewNames(VIEW_SCHEMA, Object.values(xapiDbClasses))
    const { statements: viewDDL } = createViewsDDL(VIEW_SCHEMA, xapiDbClasses, viewNames)
    for (const statement of viewDDL) {
      await dbClient.query(statement)
    }

    // Run DDL for history
    const eventModels = await createEventModels(EVENT_SCHEMA)
    const historyDDL = eventModels.getDDL()
    for (const statement of historyDDL) {
      await dbClient.query(statement)
    }
    historyTableName = eventModels.historyTableName

    eventStore = new EventStore(
      xapiDbClasses,
      {
        eventTableName: eventModels.eventTableName,
        historyTableName: eventModels.historyTableName,
        ref2UuidTableName: eventModels.ref2UuidTableName,
      },
      'pool_ref_1',
      viewNames
    )
  })

  teardown(async () => {
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(TABLE_SCHEMA)} CASCADE`)
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(EVENT_SCHEMA)} CASCADE`)
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(VIEW_SCHEMA)} CASCADE`)
    await dbClient.end()
  })

  test('ingestEvents can add a new record', async function () {
    const eventResult = {
      token: 'token1',
      events: [
        {
          id: '1',
          timestamp: '2026-04-14T21:00:00Z',
          class: 'VM',
          ref: 'OpaqueRef:vm1',
          operation: 'add',
          snapshot: {
            uuid: 'uuid-vm1',
            name_label: 'My VM',
            power_state: 'Halted',
            host: 'OpaqueRef:host1',
          },
        },
      ],
      valid_ref_counts: { VM: 1 },
    }

    const unknownRefs = await eventStore.ingestEvents(dbClient, eventResult, '', 'session1')
    assert.strictEqual(unknownRefs.size, 1) // Host ref is unknown
    assert.ok(unknownRefs.has('OpaqueRef:host1'))

    // Check if record is in DB
    const records = (await dbClient.query(`SELECT * FROM ${xapiDbClasses.VM.getTableNameEsc()}`)).rows
    assert.strictEqual(records.length, 1)
    assert.strictEqual(records[0].uuid, 'uuid-vm1')
    assert.strictEqual(records[0].name_label, 'My VM')

    // Check history
    const history = (await dbClient.query(`SELECT * FROM ${historyTableName} WHERE class = 'VM'`)).rows
    assert.strictEqual(history.length, 1)
    assert.strictEqual(history[0].uuid, 'uuid-vm1')
    assert.strictEqual(history[0].last_operation, 'add')
  })

  test('ingestEvents can modify an existing record', async function () {
    // First add
    await eventStore.ingestEvents(
      dbClient,
      {
        token: 'token1',
        events: [
          {
            id: '1',
            class: 'VM',
            ref: 'OpaqueRef:vm1',
            operation: 'add',
            snapshot: { uuid: 'uuid-vm1', name_label: 'My VM', power_state: 'Halted' },
          },
        ],
        valid_ref_counts: { VM: 1 },
      },
      '',
      'session1'
    )

    // Then modify
    const modEventResult = {
      token: 'token2',
      events: [
        {
          id: '2',
          timestamp: '2026-04-14T21:05:00Z',
          class: 'VM',
          ref: 'OpaqueRef:vm1',
          operation: 'mod',
          snapshot: {
            uuid: 'uuid-vm1',
            name_label: 'My Updated VM',
            power_state: 'Running',
          },
        },
      ],
      valid_ref_counts: { VM: 1 },
    }

    await eventStore.ingestEvents(dbClient, modEventResult, 'token1', 'session1')

    const records = (await dbClient.query(`SELECT * FROM ${xapiDbClasses.VM.getTableNameEsc()}`)).rows
    assert.strictEqual(records.length, 1)
    assert.strictEqual(records[0].name_label, 'My Updated VM')
    assert.strictEqual(records[0].power_state, 'Running')

    const history = (await dbClient.query(`SELECT * FROM ${historyTableName} WHERE class = 'VM'`)).rows
    assert.strictEqual(history[0].last_operation, 'mod')
  })

  test('ingestEvents can delete a record', async function () {
    // First add
    await eventStore.ingestEvents(
      dbClient,
      {
        token: 'token1',
        events: [
          {
            id: '1',
            class: 'VM',
            ref: 'OpaqueRef:vm1',
            operation: 'add',
            snapshot: { uuid: 'uuid-vm1', name_label: 'My VM', power_state: 'Halted' },
          },
        ],
        valid_ref_counts: { VM: 1 },
      },
      '',
      'session1'
    )

    // Then delete
    const delEventResult = {
      token: 'token2',
      events: [
        {
          id: '2',
          timestamp: '2026-04-14T21:10:00Z',
          class: 'VM',
          ref: 'OpaqueRef:vm1',
          operation: 'del',
        },
      ],
      valid_ref_counts: { VM: 0 },
    }

    await eventStore.ingestEvents(dbClient, delEventResult, 'token1', 'session1')

    const records = (await dbClient.query(`SELECT * FROM ${xapiDbClasses.VM.getTableNameEsc()}`)).rows
    assert.strictEqual(records.length, 0)

    const history = (await dbClient.query(`SELECT * FROM ${historyTableName} WHERE class = 'VM'`)).rows
    assert.strictEqual(history[0].last_operation, 'del')
  })

  test('eventsFrom can retrieve events', async function () {
    await eventStore.ingestEvents(
      dbClient,
      {
        token: 'token1',
        events: [
          {
            id: '1',
            class: 'VM',
            ref: 'OpaqueRef:vm1',
            operation: 'add',
            snapshot: { uuid: 'uuid-vm1', name_label: 'VM1', power_state: 'Halted' },
          },
        ],
        valid_ref_counts: { VM: 1 },
      },
      '',
      'session1'
    )

    await eventStore.ingestEvents(
      dbClient,
      {
        token: 'token2',
        events: [
          {
            id: '2',
            class: 'VM',
            ref: 'OpaqueRef:vm2',
            operation: 'add',
            snapshot: { uuid: 'uuid-vm2', name_label: 'VM2', power_state: 'Halted' },
          },
        ],
        valid_ref_counts: { VM: 2 },
      },
      'token1',
      'session1'
    )

    const result = await eventStore.eventsFrom(dbClient, 'token1')
    assert.strictEqual(result.token, 'token2')
    assert.strictEqual(result.events.length, 1)
    assert.strictEqual(result.events[0].ref, 'OpaqueRef:vm2')
    assert.strictEqual(result.events[0].operation, 'add')
  })

  test('ingestEvents filters events with unknown classes', async function () {
    const eventResult = {
      token: 'token1',
      events: [
        {
          id: '1',
          timestamp: '2026-04-14T21:00:00Z',
          class: 'UNKNOWN_CLASS',
          ref: 'OpaqueRef:unknown1',
          operation: 'add',
          snapshot: { uuid: 'uuid-unknown1' },
        },
        {
          id: '2',
          timestamp: '2026-04-14T21:00:00Z',
          class: 'VM',
          ref: 'OpaqueRef:vm1',
          operation: 'add',
          snapshot: { uuid: 'uuid-vm1', name_label: 'VM1' },
        },
      ],
      valid_ref_counts: { VM: 1 },
    }

    await eventStore.ingestEvents(dbClient, eventResult, '', 'session1')

    // VM should be ingested, UNKNOWN_CLASS should be ignored
    const records = (await dbClient.query(`SELECT * FROM ${xapiDbClasses.VM.getTableNameEsc()}`)).rows
    assert.strictEqual(records.length, 1)
    assert.strictEqual(records[0].uuid, 'uuid-vm1')
  })

  test('convertBatchOfViewRecords converts references', async function () {
    const vmUuid = 'uuid-vm1'
    const vmRef = 'OpaqueRef:vm1'
    const hostUuid = 'uuid-host1'
    const hostRef = 'OpaqueRef:host1'

    // Setup references in refStore
    await eventStore.refStore.bulkRecordUuid(
      [
        [vmRef, vmUuid],
        [hostRef, hostUuid],
      ],
      dbClient
    )
    const batchPerClass = {
      VM: [
        {
          uuid: vmUuid,
          name_label: 'My VM',
          host: hostUuid,
        },
      ],
    }
    const { batchPerClass: resultBatch, converter } = await eventStore.convertBatchOfViewRecords(
      dbClient,
      batchPerClass
    )
    assert.strictEqual(converter(vmUuid), vmRef)
    assert.strictEqual(converter(hostUuid), hostRef)
    // host field should be converted to hostRef
    assert.strictEqual(resultBatch.VM[0].host, hostRef)
  })

  test('get_all_records returns all records for a class indexed by ref', async function () {
    const vmUuid = 'uuid-vm-all-1'
    const vmRef = 'OpaqueRef:vm-all-1'
    // Ingest a record first
    await eventStore.ingestEvents(
      dbClient,
      {
        token: 'token-all',
        events: [
          {
            id: 'all-1',
            class: 'VM',
            ref: vmRef,
            operation: 'add',
            snapshot: { uuid: vmUuid, name_label: 'VM ALL 1', power_state: 'Halted' },
          },
        ],
        valid_ref_counts: { VM: 1 },
      },
      '',
      'session-all'
    )
    const records = await eventStore.get_all_records(dbClient, 'VM')
    assert.ok(records[vmRef])
    assert.strictEqual(records[vmRef].uuid, vmUuid)
    assert.strictEqual(records[vmRef].name_label, 'VM ALL 1')
  })

  test('eventsFrom covers mod and del events properly', async function () {
    const vmUuid = 'uuid-vm-events-proper'
    const vmRef = 'OpaqueRef:vm-events-proper'
    // 1. Add record
    await eventStore.ingestEvents(
      dbClient,
      {
        token: 'token-p1',
        events: [
          {
            id: 'p1',
            class: 'VM',
            ref: vmRef,
            operation: 'add',
            snapshot: { uuid: vmUuid, name_label: 'VM Events 1', power_state: 'Halted' },
          },
        ],
        valid_ref_counts: { VM: 1 },
      },
      '',
      'session-p1'
    )
    // 2. Mod record
    await eventStore.ingestEvents(
      dbClient,
      {
        token: 'token-p2',
        events: [
          {
            id: 'p2',
            class: 'VM',
            ref: vmRef,
            operation: 'mod',
            snapshot: { uuid: vmUuid, name_label: 'VM Events 1 Mod', power_state: 'Running' },
          },
        ],
        valid_ref_counts: { VM: 1 },
      },
      'token-p1',
      'session-p1'
    )
    // Now check for mod event
    const resultMod = await eventStore.eventsFrom(dbClient, 'token-p1')
    assert.strictEqual(resultMod.token, 'token-p2')
    const modEvent = resultMod.events.find(e => e.operation === 'mod' && e.ref === vmRef)
    assert.ok(modEvent, 'Mod event should be present')
    assert.strictEqual(modEvent.snapshot.name_label, 'VM Events 1 Mod')
    // 3. Del record
    await eventStore.ingestEvents(
      dbClient,
      {
        token: 'token-p3',
        events: [
          {
            id: 'p3',
            class: 'VM',
            ref: vmRef,
            operation: 'del',
          },
        ],
        valid_ref_counts: { VM: 0 },
      },
      'token-p2',
      'session-p1'
    )
    // Now check for del event
    const resultDel = await eventStore.eventsFrom(dbClient, 'token-p2')
    assert.strictEqual(resultDel.token, 'token-p3')
    const delEvent = resultDel.events.find(e => e.operation === 'del' && e.ref === vmRef)
    assert.ok(delEvent, 'Del event should be present')
  })
})
