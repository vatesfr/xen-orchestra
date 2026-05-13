import * as assert from 'node:assert'
import { after, afterEach, before, beforeEach, suite, test } from 'node:test'
import { Client as DBClient, escapeIdentifier } from 'pg'
import { convertClassesToTables, createViewNames, createViewsDDL, persistEntities } from '../src/db.mjs'
import { absRelationEsc } from '../src/sql.mjs'
import { ident } from '../src/types.mjs'
import { closeServer, createServer } from './pglite.mjs'

function normalizeSQLStatement(expectedMerge) {
  return expectedMerge.replace(/\n/g, '').replace(/\s+/g, ' ').trim()
}

suite('live DB tests', async function () {
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
  let server
  let socketPath
  before(async () => {
    ;({ server, socketPath } = await createServer())
  })
  after(async () => {
    await closeServer(server)
  })
  beforeEach(async () => {
    dbClient = new DBClient({ connectionString: socketPath })
    await dbClient.connect()
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(TABLE_SCHEMA)}`)
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(EVENT_SCHEMA)}`)
    await dbClient.query(`CREATE SCHEMA ${escapeIdentifier(VIEW_SCHEMA)}`)
  })
  afterEach(async () => {
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(TABLE_SCHEMA)} CASCADE`)
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(EVENT_SCHEMA)} CASCADE`)
    await dbClient.query(`DROP SCHEMA ${escapeIdentifier(VIEW_SCHEMA)} CASCADE`)
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

  await test('the underlying machinery of persistEntities work', async function () {
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
    const expectedDbRecord = { value: 10, owner: '#uuidRef1', key: '#uuidRef2' }
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
      { owner: '#uuidRef1', key: '10', value: '#uuidRef2' },
      { owner: '#uuidRef1', key: '11', value: '#uuidRef2' },
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
       ORDER BY owner, key`
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

  suite('set field work correctly', async function () {
    const networkClass = {
      name: 'network',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        field1: { name: 'VIFs', type: 'VIF ref set', description: 'list of connected VIFs' },
      },
    }
    const VIFClass = { name: 'VIF', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const classesDict = { network: networkClass, VIF: VIFClass }
    const recordsByClass = {
      VIF: [{ uuid: '#vif1' }, { uuid: '#vif2' }, { uuid: '#vif3' }, { uuid: '#vif4' }],
      network: [
        { uuid: '#network1', VIFs: ['#vif1', '#vif2'] },
        { uuid: '#network2', VIFs: ['#vif4'] },
      ],
    }
    let xapiDbClasses, viewNames
    const bystanderNetwork = recordsByClass.network[1]
    beforeEach(async function () {
      ;({ xapiDbClasses, viewNames } = await runDDL(classesDict))
      await persistEntities(dbClient, recordsByClass, xapiDbClasses, identityResolver)
    })
    afterEach(async function () {
      await dbClient.query(`DELETE FROM ${xapiDbClasses.VIF.getTableNameEsc()}`)
      await dbClient.query(`DELETE FROM ${xapiDbClasses.network.getTableNameEsc()}`)
    })
    async function getAllSetsRows() {
      return (
        await dbClient.query(
          `SELECT *
           FROM ${absRelationEsc(TABLE_SCHEMA, xapiDbClasses.network.getField('VIFs').throughTableName)}
           ORDER BY owner, member`
        )
      ).rows
    }
    test('persistEntities() works', async () => {
      assert.deepEqual(await getViewContent('network'), [
        { uuid: '#network1', VIFs: ['#vif1', '#vif2'] },
        bystanderNetwork,
      ])
    })
    test('persistEntities() can delete one set entry', async () => {
      const editedNetwork1 = { network: [{ uuid: '#network1', VIFs: ['#vif2'] }] }
      await persistEntities(dbClient, editedNetwork1, xapiDbClasses, identityResolver)
      assert.deepEqual(await getViewContent('network'), [{ uuid: '#network1', VIFs: ['#vif2'] }, bystanderNetwork])
    })
    test('persistEntities() can replace the whole set', async () => {
      const editedNetwork1 = { network: [{ uuid: '#network1', VIFs: ['#vif3'] }] }
      await persistEntities(dbClient, editedNetwork1, xapiDbClasses, identityResolver)
      assert.deepEqual(await getViewContent('network'), [{ uuid: '#network1', VIFs: ['#vif3'] }, bystanderNetwork])
    })
    test('persistEntities() can delete cascade on set owner', async () => {
      await dbClient.query(`DELETE FROM ${xapiDbClasses.network.getTableNameEsc()} WHERE uuid = '#network1'`)
      assert.deepEqual(await getAllSetsRows(), [{ member: '#vif4', owner: '#network2' }])
    })
    test('persistEntities() can delete cascade on set target', async () => {
      await dbClient.query(`DELETE FROM ${xapiDbClasses.VIF.getTableNameEsc()} WHERE uuid = '#vif2'`)
      assert.deepEqual(await getAllSetsRows(), [
        { member: '#vif1', owner: '#network1' },
        { member: '#vif4', owner: '#network2' },
      ])
    })
    test('persistEntities() can clear a whole set', async () => {
      const editedNetwork1 = { network: [{ uuid: '#network1', VIFs: [] }] }
      await persistEntities(dbClient, editedNetwork1, xapiDbClasses, identityResolver)
      assert.deepEqual(await getViewContent('network'), [{ uuid: '#network1', VIFs: [] }, bystanderNetwork])
    })
    test('we get the correct MERGE statement', async () => {
      const expectedMerge = `
        MERGE INTO "${TABLE_SCHEMA}"."network_VIFs" t
              USING UNNEST($1::VARCHAR(40)[], $2::VARCHAR(40)[]) AS src(owner, member)
              ON (t.owner = src.owner AND t.member = src.member)
              WHEN MATCHED THEN DO NOTHING
              WHEN NOT MATCHED THEN INSERT (owner, member) VALUES (src.owner, src.member)
              WHEN NOT MATCHED BY SOURCE AND t.owner = ANY ($3::VARCHAR(40)[]) THEN DELETE;`
      /** quick primer on `MERGE`:
       *   - SOURCE is the new set of rows, coming from the client (`USING`)
       *   - TARGET it the existing table (`INTO`, the through table of the materialized association, `"network_VIFs"`)
       *   - `$3` contains the unique values of `$1`
       *   - `= ANY ()` is the inclusion test for arrays (`IN` is for rows).
       *   - we join on the primary key of the through table (`t.owner`, `t.member`)
       *   - the scan is a FULL OUTER JOIN i.e., both the entire `SOURCE` and the TARGET (limited to `WHERE t.owner = ANY($3)`)
       *       are scanned (because of `WHEN NOT MATCHED BY SOURCE`)
       */
      const expectedMergeNoSpace = normalizeSQLStatement(expectedMerge)
      const actualMergeNoSpace = normalizeSQLStatement(
        xapiDbClasses.network.getField('VIFs').customSaver.mergeStatement
      )
      assert.equal(actualMergeNoSpace, expectedMergeNoSpace)
      const $1 = ['#network1', '#network1']
      const $2 = ['#vif3', '#vif4']
      const $3 = ['#network1'] // unique values of $1
      const sqlArray = arr => `'{ ${arr.join(',')} }'` // https://www.postgresql.org/docs/current/arrays.html#ARRAYS-INPUT
      const manualMerge = `
        MERGE INTO "${TABLE_SCHEMA}"."network_VIFs" t
              USING UNNEST(${sqlArray($1)}::VARCHAR(40)[], ${sqlArray($2)}::VARCHAR(40)[]) AS src(owner, member)
              ON (t.owner = src.owner AND t.member = src.member)
              WHEN MATCHED THEN DO NOTHING
              WHEN NOT MATCHED THEN INSERT (owner, member) VALUES (src.owner, src.member)
              WHEN NOT MATCHED BY SOURCE AND t.owner = ANY (${sqlArray($3)}::VARCHAR(40)[]) THEN DELETE;`
      await dbClient.query(manualMerge)
      const rows = await getAllSetsRows()
      assert.deepEqual(rows, [
        { owner: '#network1', member: '#vif3' },
        { owner: '#network1', member: '#vif4' },
        { owner: '#network2', member: '#vif4' }, // bystander left untouched
      ])
    })
    test('we get the correct CREATE VIEW statement', async () => {
      const ddl = createViewsDDL(VIEW_SCHEMA, xapiDbClasses, new Map([['network', viewNames.get('network')]]))
      /** - `LATERAL` allows us to run a query referencing the table in the `FROM` (the `WHERE linked."network"=uuid` would error otherwise)
       *  - `LEFT JOIN` forces the lateral query to run from every row of the table `network`, including the ones whose VIFs is empty
       *  - `array_agg()` transforms the `SELECT` rows into an array (GROUP BY is implicitly "all in one group")
       *  - `array_agg()` returns NULL if the `SELECT` has no rows
       *  - `COALESCE(..., '{}')` transforms NULL into an empty array
       *  - `LEFT JOIN ... ON TRUE` because the subquery is returning only one row on the right per row on the left, no need to join anything.
       *
       *  In the end, `VIFs_t` becomes a relation containing only one row and one column (containing an array of VIF uuids).
       *
       *  Note that the table at the end of the relationship (`VIF`) is never used.
       */
      const expectedCreateView = `
            CREATE OR REPLACE VIEW "${VIEW_SCHEMA}"."network" AS
              SELECT "uuid", "VIFs_t"."VIFs"
              FROM "${TABLE_SCHEMA}"."network"
              LEFT JOIN LATERAL (
                  SELECT COALESCE(array_agg(linked.member ORDER BY linked.member), '{}') AS "VIFs"
                  FROM "${TABLE_SCHEMA}"."network_VIFs" AS linked
                  WHERE linked.owner=uuid ) AS "VIFs_t"
                ON TRUE;`
      const createViewStatement = ddl.statements
        .map(normalizeSQLStatement)
        .find(s => s.match(/^CREATE (?:OR REPLACE)? VIEW/))
      assert.equal(createViewStatement, normalizeSQLStatement(expectedCreateView))
    })
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
