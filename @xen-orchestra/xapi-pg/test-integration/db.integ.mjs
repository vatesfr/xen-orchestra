import * as assert from 'node:assert'
import { afterEach as teardown, beforeEach as setup, suite, test } from 'node:test'
import { escapeIdentifier, Client as DBClient } from 'pg'
import { convertClassesToTables, createViewsDDL, createViewNames, persistEntities } from '../src/db.mjs'
import { absRelationEsc } from '../src/sql.mjs'
import { ident } from '../src/types.mjs'

const DB_URL = 'postgresql://localhost:5432/postgres'

suite('live DB tests', function () {
  // https://stackoverflow.com/a/8084248
  const random_slug = (Math.random() + 1).toString(36).substring(2)
  const schema_prefix = 'test_' + random_slug
  const TABLE_SCHEMA = schema_prefix + '_xapi'
  const VIEW_SCHEMA = schema_prefix + '_xapi_view'
  const EVENT_SCHEMA = schema_prefix + '_xapi_events'
  let dbClient = null
  let VIEW_NAMES

  const identityResolver = async inputSet => new Map(inputSet.entries())

  async function createViews(classDict) {
    const viewNames = createViewNames(VIEW_SCHEMA, Object.values(classDict))
    const { statements: viewDDL } = createViewsDDL(VIEW_SCHEMA, classDict, viewNames)
    for (const statement of viewDDL) {
      await dbClient.query(statement)
    }
    return viewNames
  }

  async function getViewContent(cls) {
    return (
      await dbClient.query(`select *
                            from ${VIEW_NAMES.get(cls)}
                            ORDER BY uuid`)
    ).rows
  }

  setup(async function () {
    dbClient = new DBClient({ connectionString: DB_URL })
    await dbClient.connect()
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(TABLE_SCHEMA)}`)
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(EVENT_SCHEMA)}`)
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(VIEW_SCHEMA)}`)
  })
  teardown(async () => {
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(TABLE_SCHEMA)} CASCADE`)
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(EVENT_SCHEMA)} CASCADE`)
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(VIEW_SCHEMA)} CASCADE`)
    // the test runner waits for a timeout otherwise
    await dbClient.end()
  })

  async function runDDL(classesDict) {
    const xapiDbClasses = convertClassesToTables(classesDict, TABLE_SCHEMA)
    const mainDDL = []
    const indirectDDL = []
    for (const cls of Object.values(xapiDbClasses)) {
      const { mainTableDDL, throughTablesDDL } = cls.getSplitDDL()
      mainDDL.push(...mainTableDDL)
      indirectDDL.push(...throughTablesDDL)
    }
    const allDDL = mainDDL.concat(indirectDDL)
    for (const statement of allDDL) {
      await dbClient.query(statement)
    }
    const viewNames = await createViews(xapiDbClasses)
    VIEW_NAMES = viewNames
    return { viewNames, xapiDbClasses }
  }

  test('the underlying machinery of persistEntities work', async function () {
    const mapField = 'field1'
    const fieldType = '(clz ref -> int) map'
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        [mapField]: { description: 'description', name: mapField, type: fieldType },
      },
    }
    const clz = {
      name: 'clz',
      fields: { uuid: { name: 'uuid', type: 'string' } },
    }
    const expectedViewRows = [{ uuid: '#uuidRef1', field1: { '#uuidRef2': 10 } }]
    const expectedDbRecord = { value: 10, cls: '#uuidRef1', key: '#uuidRef2' }
    const xapiRecord = { uuid: '#uuidRef1', field1: { '#uuidRef2': 10 } }
    const { xapiDbClasses } = await runDDL({ cls, clz })
    const clzDb = xapiDbClasses.clz
    await dbClient.query(`INSERT INTO ${clzDb.getTableNameEsc()} (uuid)VALUES ('#uuidRef2')`)
    const xapiDbClass = xapiDbClasses.cls
    const { newRecords: nonref } = xapiDbClass.nonRefXapi2Db([xapiRecord])
    assert.deepEqual(nonref, [{ uuid: '#uuidRef1' }])
    await dbClient.query(`INSERT INTO ${xapiDbClass.getTableNameEsc()} (uuid)VALUES ('#uuidRef1')`)
    const refs = xapiDbClass.getRefsFromRecords([xapiRecord])
    assert.deepEqual(refs, new Set(['#uuidRef2']))
    const refRecords = xapiDbClass.refXapi2Db([xapiRecord], ident)
    assert.deepEqual(refRecords, {
      inside: [],
      separate: {
        field1: {
          allOwners: ['#uuidRef1'],
          records: [expectedDbRecord],
        },
      },
    })
    for (const [fieldName, { allOwners, records }] of Object.entries(refRecords.separate)) {
      const field = xapiDbClass.getField(fieldName)
      await field.customSaver.saveRows(dbClient, records, allOwners)
    }
    const quotedThroughTable = absRelationEsc(TABLE_SCHEMA, xapiDbClass.refFields[0].throughTableName)
    const tableResult = (await dbClient.query(`select * from ${quotedThroughTable}`)).rows
    assert.deepEqual(tableResult, [expectedDbRecord])
    assert.deepEqual(await getViewContent('cls'), expectedViewRows)
  })

  test('default values work', async function () {
    const mapField = 'field1'
    const fieldType = 'string'
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        [mapField]: { description: 'description', name: mapField, type: fieldType, default: 'lol1' },
        field2: {
          description: 'description2',
          name: 'field2',
          type: 'int',
          default: 10,
        }, // check that the default value is fed to the value converter
        field3: { description: 'description3', name: 'field3', type: 'datetime', default: '19700101T00:00:00Z' },
      },
    }
    const expectedViewRows = [
      { uuid: '#uuidRef1', field1: 'lol1', field2: 11, field3: new Date('1970-01-01T00:00:00Z') },
    ]
    const recordsByClass = { cls: [{ uuid: '#uuidRef1', field2: 11 }] }
    const { xapiDbClasses } = await runDDL({ cls })
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    assert.deepEqual(await getViewContent('cls'), expectedViewRows)
  })

  test('convertMapFKToDB insert value with map ref key and check view content', async function () {
    const mapField = 'field1'
    const fieldType = '(clz ref -> int) map'
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        [mapField]: { description: 'description', name: mapField, type: fieldType },
      },
    }
    const clz = {
      name: 'clz',
      fields: { uuid: { name: 'uuid', type: 'string' } },
    }
    const classesDict = { clz, cls }
    const expectedViewRows = [{ uuid: '#uuidRef1', field1: { '#uuidRef2': 10 } }]
    const xapiRecord = { uuid: '#uuidRef1', field1: { '#uuidRef2': 10 } }
    const recordsByClass = { cls: [xapiRecord], clz: [{ uuid: '#uuidRef2' }] }
    const { xapiDbClasses } = await runDDL(classesDict)
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    assert.deepEqual(await getViewContent('cls'), expectedViewRows)
    // check delete cascade
    await dbClient.query(`DELETE FROM ${xapiDbClasses.clz.getTableNameEsc()} WHERE uuid = '#uuidRef2'`)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: {} }])
  })

  test('convertMapFKToDB insert value with map ref value and check view content', async function () {
    const fieldType = '(int -> clz ref) map'
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        field1: { name: 'field1', type: fieldType, description: 'description' },
      },
    }
    const clz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const expectedViewRows = [{ uuid: '#uuidRef1', field1: { 10: '#uuidRef2', 11: '#uuidRef2' } }]
    const expectedDbRecords = [
      { key: '10', cls: '#uuidRef1', value: '#uuidRef2' },
      {
        key: '11',
        cls: '#uuidRef1',
        value: '#uuidRef2',
      },
    ]
    const xapiRecord = { uuid: '#uuidRef1', field1: { 10: '#uuidRef2', 11: '#uuidRef2' } }
    const classesDict = { cls, clz }
    const { xapiDbClasses } = await runDDL(classesDict)
    await persistEntities(dbClient, { clz: [{ uuid: '#uuidRef2' }] }, xapiDbClasses)
    const xapiDbClass = xapiDbClasses.cls

    const { newRecords: nonref } = xapiDbClass.nonRefXapi2Db([xapiRecord])
    assert.deepEqual(nonref, [{ uuid: '#uuidRef1' }])
    await persistEntities(dbClient, { cls: nonref }, xapiDbClasses)
    const refs = xapiDbClass.getRefsFromRecords([xapiRecord])
    assert.deepEqual(refs, new Set(['#uuidRef2']))
    const refRecords = xapiDbClass.refXapi2Db([xapiRecord], ident)
    assert.deepEqual(refRecords, {
      inside: [],
      separate: {
        field1: {
          allOwners: ['#uuidRef1'],
          records: expectedDbRecords,
        },
      },
    })
    for (const [fieldName, { allOwners, records }] of Object.entries(refRecords.separate)) {
      const field = xapiDbClass.getField(fieldName)
      await field.customSaver.saveRows(dbClient, records, allOwners)
    }
    const tableResult = (
      await dbClient.query(
        `select *
       from ${TABLE_SCHEMA}.${xapiDbClass.refFields[0].throughTableName}
       ORDER BY cls, key`
      )
    ).rows
    assert.deepEqual(tableResult, expectedDbRecords)
    assert.deepEqual(await getViewContent('cls'), expectedViewRows)
    // check that delete cascade works
    await dbClient.query(`DELETE FROM ${xapiDbClass.getTableNameEsc()} WHERE uuid = '#uuidRef1'`)
    assert.deepEqual(await getViewContent('cls'), [])
  })

  test('persistEntities work', async function () {
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        field1: { name: 'field1', type: '(int -> clz ref) map', description: 'description' },
      },
    }
    const clz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const expectedViewRows = [{ uuid: '#uuidRef1', field1: { 10: '#uuidRef2', 11: '#uuidRef2' } }]
    const xapiRecord = { uuid: '#uuidRef1', field1: { 10: '#uuidRef2', 11: '#uuidRef2' } }
    const classesDict = { cls, clz }
    const recordsByClass = { clz: [{ uuid: '#uuidRef2' }], cls: [xapiRecord] }
    const { viewNames, xapiDbClasses } = await runDDL(classesDict)
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    const viewResult = (
      await dbClient.query(`select *
                                            from ${viewNames.get('cls')}`)
    ).rows
    assert.deepEqual(viewResult, expectedViewRows)
  })

  test('persistEntities can delete map entries', async function () {
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        field1: { name: 'field1', type: '(int -> clz ref) map', description: 'description' },
      },
    }
    const clz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const expectedViewRows = [{ uuid: '#uuidRef1', field1: { 10: '#uuidRef2', 11: '#uuidRef2' } }]
    const xapiRecord = { uuid: '#uuidRef1', field1: { 10: '#uuidRef2', 11: '#uuidRef2' } }
    const classesDict = { cls, clz }
    const recordsByClass = { clz: [{ uuid: '#uuidRef2' }], cls: [xapiRecord] }
    const { xapiDbClasses } = await runDDL(classesDict)
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    const viewResult = await getViewContent('cls')
    assert.deepEqual(viewResult, expectedViewRows)
    // delete one entry and save
    delete xapiRecord.field1['10']
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    const expectedViewRows2 = [{ uuid: '#uuidRef1', field1: { 11: '#uuidRef2' } }]
    const viewResult2 = await getViewContent('cls')
    assert.deepEqual(viewResult2, expectedViewRows2)
  })

  test('set field work correctly', async function () {
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        field1: { name: 'field1', type: 'clz ref set', description: 'description' },
      },
    }
    const clz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const classesDict = { cls, clz }
    const bystander = { uuid: '#uuidZBystander', field1: ['#uuidRef4'] }
    let recordsByClass = {
      clz: [{ uuid: '#uuidRef2' }, { uuid: '#uuidRef3' }, { uuid: '#uuidRef4' }],
      cls: [
        {
          uuid: '#uuidRef1',
          field1: ['#uuidRef2', '#uuidRef3'],
        },
        bystander,
      ],
    }
    const { xapiDbClasses } = await runDDL(classesDict)
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver, null)
    assert.deepEqual(await getViewContent('cls'), [
      { uuid: '#uuidRef1', field1: ['#uuidRef2', '#uuidRef3'] },
      bystander,
    ])
    // delete one entry and save
    recordsByClass = { cls: [{ uuid: '#uuidRef1', field1: ['#uuidRef2'] }] }
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver, null)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: ['#uuidRef2'] }, bystander])
    // replace one entry
    recordsByClass.cls[0].field1 = ['#uuidRef3']
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver, null)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: ['#uuidRef3'] }, bystander])
    // check the on delete cascade on cls
    await dbClient.query(`DELETE FROM ${xapiDbClasses.cls.getTableNameEsc()} WHERE uuid = '#uuidRef1'`)
    assert.deepEqual(await getViewContent('cls'), [bystander])
    // check the delete cascade on clz
    recordsByClass = { cls: [{ uuid: '#uuidRef1', field1: ['#uuidRef2', '#uuidRef3'] }] }
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver, null)
    await dbClient.query(`DELETE FROM ${xapiDbClasses.clz.getTableNameEsc()} WHERE uuid = '#uuidRef2'`)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: ['#uuidRef3'] }, bystander])
    // check we can clear a set
    recordsByClass = { cls: [{ uuid: '#uuidRef1', field1: [] }] }
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver, null)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: [] }, bystander])
  })

  test('map field work correctly', async function () {
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        field1: { name: 'field1', type: '(clz ref -> int) map', description: 'description' },
      },
    }
    const clz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const classesDict = { cls, clz }
    const bystander = { uuid: '#uuidZBystander', field1: { '#uuidRef4': 10 } }
    let recordsByClass = {
      clz: [{ uuid: '#uuidRef2' }, { uuid: '#uuidRef3' }, { uuid: '#uuidRef4' }],
      cls: [
        {
          uuid: '#uuidRef1',
          field1: { '#uuidRef2': 1, '#uuidRef3': 2 },
        },
        bystander,
      ],
    }
    const { xapiDbClasses } = await runDDL(classesDict)
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    assert.deepEqual(await getViewContent('cls'), [
      {
        uuid: '#uuidRef1',
        field1: { '#uuidRef2': 1, '#uuidRef3': 2 },
      },
      bystander,
    ])
    // delete one entry and save
    recordsByClass = { cls: [{ uuid: '#uuidRef1', field1: { '#uuidRef2': 1 } }] }
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: { '#uuidRef2': 1 } }, bystander])
    // replace one entry
    recordsByClass.cls[0].field1 = { '#uuidRef3': 1110 }
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: { '#uuidRef3': 1110 } }, bystander])
    // check the on delete cascade on cls
    await dbClient.query(`DELETE FROM ${xapiDbClasses.cls.getTableNameEsc()} WHERE uuid = '#uuidRef1'`)
    assert.deepEqual(await getViewContent('cls'), [bystander])
    // check the delete cascade on clz
    recordsByClass = { cls: [{ uuid: '#uuidRef1', field1: { '#uuidRef2': 1, '#uuidRef3': 2 } }] }
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    await dbClient.query(`DELETE FROM ${xapiDbClasses.clz.getTableNameEsc()} WHERE uuid = '#uuidRef2'`)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: { '#uuidRef3': 2 } }, bystander])
    // check we can clear a map
    recordsByClass = { cls: [{ uuid: '#uuidRef1', field1: {} }] }
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    await dbClient.query(`DELETE FROM ${xapiDbClasses.clz.getTableNameEsc()} WHERE uuid = '#uuidRef2'`)
    assert.deepEqual(await getViewContent('cls'), [{ uuid: '#uuidRef1', field1: {} }, bystander])
  })

  test('ref field work correctly', async function () {
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        field1: { name: 'field1', type: 'clz ref', description: 'description' },
      },
    }
    const clz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const classesDict = { cls, clz }
    const recordsByClass = {
      clz: [{ uuid: '#uuidRef2' }, { uuid: '#uuidRef3' }, { uuid: '#uuidRef4' }],
      cls: [
        {
          uuid: '#uuidRef1',
          field1: '#uuidRef2',
        },
      ],
    }
    const { xapiDbClasses } = await runDDL(classesDict)
    await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    assert.deepEqual(await getViewContent('cls'), recordsByClass.cls)
  })

  test('persistNonRefRecordsToDB can save stuff', async function () {
    const cls = {
      name: 'cls',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        field1: { name: 'field1', type: 'int', description: 'description' },
      },
    }
    const expectedViewRows = [{ uuid: '#uuidRef1', field1: 10 }]
    const classesDict = { cls }
    const recordsByClass = { cls: [{ uuid: '#uuidRef1', field1: 10 }] }
    const { xapiDbClasses } = await runDDL(classesDict)
    await xapiDbClasses.cls.persistNonRefRecordsToDB(dbClient, recordsByClass.cls)
    const viewResult = await getViewContent('cls')
    assert.deepEqual(viewResult, expectedViewRows)
  })
})
