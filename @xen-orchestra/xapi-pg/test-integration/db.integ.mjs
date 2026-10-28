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

  suite('map field work correctly', async function () {
    const networkClass = {
      name: 'network',
      fields: {
        uuid: { name: 'uuid', type: 'string' },
        assigned_ips: { name: 'assigned_ips', type: '(VIF ref -> string) map', description: 'assigned IPs' },
      },
    }
    const VIFClass = { name: 'VIF', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const classesDict = { network: networkClass, VIF: VIFClass }
    const recordsByClass = {
      VIF: [{ uuid: '#vif1' }, { uuid: '#vif2' }, { uuid: '#vif3' }, { uuid: '#vif4' }],
      network: [
        { uuid: '#network1', assigned_ips: { '#vif1': '192.168.0.1', '#vif2': '192.168.0.2' } },
        { uuid: '#network2', assigned_ips: { '#vif4': '192.168.4.4' } },
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
    async function getAllMapRows() {
      return (
        await dbClient.query(
          `SELECT *
           FROM ${absRelationEsc(TABLE_SCHEMA, xapiDbClasses.network.getField('assigned_ips').throughTableName)}
           ORDER BY owner, key`
        )
      ).rows
    }
    test('persistEntities() works', async () => {
      assert.deepEqual(await getViewContent('network'), [
        { uuid: '#network1', assigned_ips: { '#vif1': '192.168.0.1', '#vif2': '192.168.0.2' } },
        bystanderNetwork,
      ])
    })
    test('persistEntities() can delete one map entry', async () => {
      const editedNetwork1 = { network: [{ uuid: '#network1', assigned_ips: { '#vif1': '192.168.0.1' } }] }
      await persistEntities(dbClient, editedNetwork1, xapiDbClasses, identityResolver)
      assert.deepEqual(await getViewContent('network'), [
        { uuid: '#network1', assigned_ips: { '#vif1': '192.168.0.1' } },
        bystanderNetwork,
      ])
    })
    test('persistEntities() can replace the whole map', async () => {
      const editedNetwork1 = { network: [{ uuid: '#network1', assigned_ips: { '#vif3': '192.168.0.3' } }] }
      await persistEntities(dbClient, editedNetwork1, xapiDbClasses, identityResolver)
      assert.deepEqual(await getViewContent('network'), [
        { uuid: '#network1', assigned_ips: { '#vif3': '192.168.0.3' } },
        bystanderNetwork,
      ])
    })
    test('can delete cascade on map owner', async () => {
      await dbClient.query(`DELETE FROM ${xapiDbClasses.network.getTableNameEsc()} WHERE uuid = '#network1'`)
      assert.deepEqual(await getAllMapRows(), [{ owner: '#network2', key: '#vif4', value: '192.168.4.4' }])
    })
    test('can delete cascade on map target', async () => {
      await dbClient.query(`DELETE FROM ${xapiDbClasses.VIF.getTableNameEsc()} WHERE uuid = '#vif2'`)
      assert.deepEqual(await getAllMapRows(), [
        { owner: '#network1', key: '#vif1', value: '192.168.0.1' },
        { owner: '#network2', key: '#vif4', value: '192.168.4.4' },
      ])
    })
    test('persistEntities() can clear a whole map', async () => {
      const editedNetwork1 = { network: [{ uuid: '#network1', assigned_ips: {} }] }
      await persistEntities(dbClient, editedNetwork1, xapiDbClasses, identityResolver)
      assert.deepEqual(await getViewContent('network'), [{ uuid: '#network1', assigned_ips: {} }, bystanderNetwork])
    })

    test('we get the correct MERGE statement', async () => {
      const expectedMerge = `
        MERGE INTO "${TABLE_SCHEMA}"."network_assigned_ips" t
              USING UNNEST($1::VARCHAR(40)[], $2::VARCHAR(40)[], $3::TEXT[]) AS src(owner, key, value)
              ON (t.owner = src.owner AND t.key = src.key)
              WHEN MATCHED THEN UPDATE SET value = src.value
              WHEN NOT MATCHED THEN INSERT (owner, key, value) VALUES (src.owner, src.key, src.value)
              WHEN NOT MATCHED BY SOURCE AND t.owner = ANY($4::VARCHAR(40)[]) THEN DELETE;`
      /** quick primer on `MERGE`:
       *   - SOURCE is the new set of rows, coming from the client (`USING`)
       *   - TARGET it the existing table (`INTO`, the through table of the materialized association, `"network_assigned_ips"`)
       *   - `$4` contains the unique values of `$1`
       *   - `= ANY ()` is the inclusion test for arrays (`IN` is for rows).
       *   - we join on the primary key of the through table (`t.owner`, `t.key`)
       *   - the scan is a FULL OUTER JOIN i.e., both the entire `SOURCE` and the TARGET (limited to `WHERE t.owner = ANY($3)`)
       *       are scanned (because of `WHEN NOT MATCHED BY SOURCE`)
       */
      const expectedMergeNoSpace = normalizeSQLStatement(expectedMerge)
      const actualMergeNoSpace = normalizeSQLStatement(
        xapiDbClasses.network.getField('assigned_ips').customSaver.mergeStatement
      )
      assert.equal(actualMergeNoSpace, expectedMergeNoSpace)
      const $1 = ['#network1', '#network1']
      const $2 = ['#vif3', '#vif4']
      const $3 = ['192.168.0.13', '192.168.0.14']
      const $4 = ['#network1'] // unique values of $1
      const sqlArray = arr => `'{ ${arr.join(',')} }'` // https://www.postgresql.org/docs/current/arrays.html#ARRAYS-INPUT
      const manualMerge = `
        MERGE INTO "${TABLE_SCHEMA}"."network_assigned_ips" t
              USING UNNEST(${sqlArray($1)}::VARCHAR(40)[], ${sqlArray($2)}::VARCHAR(40)[], ${sqlArray($3)}::TEXT[]) AS src(owner, key, value)
              ON (t.owner = src.owner AND t.key = src.key)
              WHEN MATCHED THEN UPDATE SET value = src.value
              WHEN NOT MATCHED THEN INSERT (owner, key, value) VALUES (src.owner, src.key, src.value)
              WHEN NOT MATCHED BY SOURCE AND t.owner = ANY (${sqlArray($4)}::VARCHAR(40)[]) THEN DELETE;`
      await dbClient.query(manualMerge)
      const rows = await getAllMapRows()
      assert.deepEqual(rows, [
        { owner: '#network1', key: '#vif3', value: '192.168.0.13' },
        { owner: '#network1', key: '#vif4', value: '192.168.0.14' },
        { owner: '#network2', key: '#vif4', value: '192.168.4.4' }, // bystander left untouched
      ])
    })
    test('we get the correct CREATE VIEW statement', async () => {
      const ddl = createViewsDDL(VIEW_SCHEMA, xapiDbClasses, new Map([['network', viewNames.get('network')]]))
      /** - `LATERAL` allows us to run a query referencing the table in the `FROM` (the `WHERE linked."network"=uuid` would error otherwise)
       *  - `LEFT JOIN` forces the lateral query to run from every row of the table `network`, including the ones whose assigned_ips is empty
       *  - `json_object_agg()` transforms the `SELECT` rows into a JSON object (GROUP BY is implicitly "all in one group")
       *  - `json_object_agg()` returns NULL if the `SELECT` has no rows
       *  - `COALESCE(..., '{}')` transforms NULL into an empty object
       *  - `LEFT JOIN ... ON TRUE` because the subquery is returning only one row on the right per row on the left, no need to join anything.
       *
       *  In the end, `assigned_ips_t` becomes a relation containing only one row and one column (containing an object).
       *
       *  Note that the table at the end of the relationship (`VIF`) is never used.
       */
      const expectedCreateView = `
            CREATE OR REPLACE VIEW "${VIEW_SCHEMA}"."network" AS
              SELECT "uuid", "assigned_ips_t"."assigned_ips"
              FROM "${TABLE_SCHEMA}"."network"
              LEFT JOIN LATERAL (
                  SELECT COALESCE(json_object_agg(linked."key", linked."value" ORDER BY linked."key"), '{}') AS "assigned_ips"
                  FROM "${TABLE_SCHEMA}"."network_assigned_ips" AS linked
                  WHERE linked.owner=uuid ) AS "assigned_ips_t"
                ON TRUE;`
      const createViewStatement = ddl.statements
        .map(normalizeSQLStatement)
        .find(s => s.match(/^CREATE (?:OR REPLACE)? VIEW/))
      assert.equal(createViewStatement, normalizeSQLStatement(expectedCreateView))
    })
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
    test('can delete cascade on set owner', async () => {
      await dbClient.query(`DELETE FROM ${xapiDbClasses.network.getTableNameEsc()} WHERE uuid = '#network1'`)
      assert.deepEqual(await getAllSetsRows(), [{ member: '#vif4', owner: '#network2' }])
    })
    test('can delete cascade on set target', async () => {
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
