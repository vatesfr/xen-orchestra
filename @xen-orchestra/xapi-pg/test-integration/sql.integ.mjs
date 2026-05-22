import * as assert from 'node:assert'
import { after, afterEach, before, beforeEach, suite, test } from 'node:test'
import { Client as DBClient, escapeIdentifier } from 'pg'
import {
  absRelationEsc,
  absReferenceEsc,
  TableCreator,
  createInsert,
  SetFieldDbSaver,
  MapFieldDbSaver,
  createViewDDL,
  ensureSchemasExistsWithoutConflict,
} from '../src/sql.mjs'
import { UUID_TYPE } from '../src/types.mjs'
import { closeServer, createServer } from './pglite.mjs'

suite('sql.mjs unit tests', function () {
  test('absRelationEsc escapes schema and table name', function () {
    const actual = absRelationEsc('my_schema', 'my_table')
    assert.strictEqual(actual, '"my_schema"."my_table"')
  })

  test('absReferenceEsc escapes schema, table, and column name', function () {
    const actual = absReferenceEsc('my_schema', 'my_table', 'my_col')
    assert.strictEqual(actual, '"my_schema"."my_table"("my_col")')
  })

  suite('TableCreator', function () {
    test('addColumn adds basic column', function () {
      const tc = new TableCreator('s', 't', 'table comment')
      tc.addColumn('col1', 'text')
      const ddl = tc.getDDL()
      assert.ok(ddl.immediate[0].includes('"col1" text'))
      assert.ok(ddl.delayed.some(s => s.includes('COMMENT ON TABLE "s"."t" IS \'table comment\'')))
    })

    test('addColumn adds comment column', function () {
      const tc = new TableCreator('s', 't', 'table comment')
      tc.addColumn('col1', 'text', undefined, null, 'test comment')
      const ddl = tc.getDDL()
      assert.ok(ddl.immediate[0].includes('"col1" text'))
      assert.ok(ddl.delayed.some(s => s.includes('COMMENT ON COLUMN "s"."t"."col1" IS \'test comment\'')))
    })

    test('addColumn adds column with default value', function () {
      const tc = new TableCreator('s', 't')
      tc.addColumn('col1', 'text', 'default_val')
      const ddl = tc.getDDL()
      assert.ok(ddl.immediate[0].includes('"col1" text DEFAULT \'default_val\''))
    })

    test('addColumn adds column with reference (delayed)', function () {
      const tc = new TableCreator('s', 't')
      tc.addColumn('col1', 'uuid', null, { schema: 's2', table: 't2', column: 'uuid' })
      const ddl = tc.getDDL()
      // References are delayed
      assert.ok(
        ddl.immediate[0].includes('CREATE TABLE IF NOT EXISTS "s"."t" ()') ||
          ddl.immediate[0].includes('CREATE TABLE IF NOT EXISTS "s"."t" (PRIMARY KEY ())')
      )
      assert.ok(ddl.delayed.some(s => s.includes('ALTER TABLE "s"."t"')))
      assert.ok(ddl.delayed.some(s => s.includes('ADD COLUMN IF NOT EXISTS "col1" uuid REFERENCES "s2"."t2"("uuid")')))
    })

    test('addPrimaryKey adds primary key to immediate DDL if columns are available', function () {
      const tc = new TableCreator('s', 't')
      tc.addColumn('id', 'uuid')
      tc.addPrimaryKey('id')
      const ddl = tc.getDDL()
      assert.ok(ddl.immediate[0].includes('PRIMARY KEY ("id")'))
    })

    test('addPrimaryKey adds primary key to delayed DDL if some columns are references', function () {
      const tc = new TableCreator('s', 't')
      tc.addColumn('id', 'uuid', null, { schema: 's2', table: 't2', column: 'uuid' })
      tc.addPrimaryKey('id')
      const ddl = tc.getDDL()
      assert.ok(!ddl.immediate[0].includes('PRIMARY KEY'))
      assert.ok(ddl.delayed.some(s => s.includes('ALTER TABLE "s"."t"')))
      assert.ok(ddl.delayed.some(s => s.includes('ADD PRIMARY KEY ("id")')))
    })

    test('addIndex adds index to delayed DDL', function () {
      const tc = new TableCreator('s', 't')
      tc.addColumn('col1', 'text')
      tc.addIndex('idx_col1', ['col1'])
      const ddl = tc.getDDL()
      assert.ok(ddl.delayed.some(s => s.includes('CREATE INDEX IF NOT EXISTS "idx_col1" ON "s"."t" ("col1")')))
    })
  })

  suite('createInsert', function () {
    const mockXapiDbClass = {
      getTableNameEsc: () => '"s"."t"',
      getField: name => ({
        sequelizeDef: { type: 'uuid' },
      }),
    }

    test('generates correct SQL with NOTHING conflict action', function () {
      const columns = ['uuid', 'name']
      const records = [{ uuid: 'u1', name: 'n1' }]
      const result = createInsert(mockXapiDbClass, [], columns, records)

      assert.ok(result.sql.includes('INSERT INTO "s"."t" ("uuid", "name")'))
      assert.ok(result.sql.includes('ON CONFLICT (uuid) DO NOTHING'))
      assert.strictEqual(result.bind.length, 2)
      assert.deepStrictEqual(result.bind[0], ['u1'])
      assert.deepStrictEqual(result.bind[1], ['n1'])
    })

    test('generates correct SQL with UPDATE SET conflict action', function () {
      const columns = ['uuid', 'name']
      const records = [{ uuid: 'u1', name: 'n1' }]
      const result = createInsert(mockXapiDbClass, ['name'], columns, records)

      assert.ok(result.sql.includes('ON CONFLICT (uuid) DO UPDATE SET "name" = EXCLUDED."name"'))
    })
  })

  suite('SetFieldDbSaver', function () {
    test('mergeStatement is correctly generated', function () {
      const saver = new SetFieldDbSaver('"s"."t"', 'field')
      assert.ok(saver.mergeStatement.includes('MERGE INTO "s"."t" t'))
      assert.ok(saver.mergeStatement.includes(`USING UNNEST($1::${UUID_TYPE}[], $2::${UUID_TYPE}[])`))
      assert.ok(saver.mergeStatement.includes('AS src(owner, member)'), saver.mergeStatement)
      // Check for unquoted identifiers in ON clause if that's what's happening
      assert.ok(saver.mergeStatement.includes('t.owner = src.owner'))
      assert.ok(saver.mergeStatement.includes('t.member = src.member'))
    })
  })

  suite('MapFieldDbSaver', function () {
    test('mergeStatement is correctly generated', function () {
      const saver = new MapFieldDbSaver('"s"."t"', 'field', 'text', 'uuid')
      assert.ok(saver.mergeStatement.includes('MERGE INTO "s"."t" t'))
      assert.ok(saver.mergeStatement.includes(`USING UNNEST($1::${UUID_TYPE}[], $2::text[], $3::uuid[])`))
      assert.ok(saver.mergeStatement.includes('AS src(owner, key, value)'))
      assert.ok(saver.mergeStatement.includes('t.owner = src.owner AND t.key = src.key'))
      assert.ok(saver.mergeStatement.includes('UPDATE SET value = src.value'))
    })
  })

  suite('createViewDDL', function () {
    test('generates CREATE OR REPLACE VIEW statement', function () {
      const mockCls = {
        getTableNameEsc: () => '"s"."t"',
        fields: [
          { name: 'f1', viewExpressionEsc: '"f1"', viewLateral: null, comment: 'c1' },
          {
            name: 'f2',
            viewExpressionEsc: 'lat."f2"',
            viewLateral: 'LEFT JOIN LATERAL (...) lat ON TRUE',
            comment: 'c2',
          },
        ],
        xapiClass: { description: 'view description' },
      }
      const ddlStatements = []
      const commentStatements = []
      createViewDDL(mockCls, '"s"."v"', ddlStatements, commentStatements)

      assert.strictEqual(ddlStatements.length, 1)
      assert.ok(ddlStatements[0].includes('CREATE OR REPLACE VIEW "s"."v" AS SELECT "f1", lat."f2"'))
      assert.ok(ddlStatements[0].includes('FROM "s"."t"'))
      assert.ok(ddlStatements[0].includes('LEFT JOIN LATERAL (...) lat ON TRUE'))

      assert.ok(commentStatements.includes('COMMENT ON COLUMN "s"."v"."f1" IS \'c1\''))
      assert.ok(commentStatements.includes('COMMENT ON COLUMN "s"."v"."f2" IS \'c2\''))
      assert.ok(commentStatements.includes('COMMENT ON VIEW "s"."v" IS \'view description\''))
    })
  })
})

suite('sql.mjs integration tests', async function () {
  async function allSchemas(dbClient) {
    const result = await dbClient.query('SELECT schema_name FROM information_schema.schemata')
    return new Set(result.rows.map(row => row.schema_name))
  }
  let server, socketPath, dbClient, initial_schemas
  before(async () => {
    ;({ server, socketPath } = await createServer())
    dbClient = new DBClient({ connectionString: socketPath })
    await dbClient.connect()
    try {
      initial_schemas = await allSchemas(dbClient)
    } finally {
      await dbClient.end()
    }
  })
  after(async () => {
    await closeServer(server)
  })
  beforeEach(async () => {
    dbClient = new DBClient({ connectionString: socketPath })
    await dbClient.connect()
  })
  afterEach(async () => {
    const schemas = await allSchemas(dbClient)
    for (const schema of schemas.difference(initial_schemas)) {
      await dbClient.query(`DROP SCHEMA IF EXISTS ${escapeIdentifier(schema)} CASCADE`)
    }
    await dbClient.end()
  })

  async function assertSchemaExists(schemaName) {
    const result = await dbClient.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [
      schemaName,
    ])
    assert.strictEqual(result.rows.length, 1)
  }
  suite('ensureSchemasExistsWithoutConflict', function () {
    test('creates multiple schemas successfully', async function () {
      const prefixes = {
        tableSchema: 't',
        viewSchema: 'v',
      }
      const schemas = await ensureSchemasExistsWithoutConflict(dbClient, 'pool1', prefixes)
      for (const key of Object.keys(prefixes)) {
        await assertSchemaExists(schemas[key])
      }
    })

    test('does not fail when schema already exists', async function () {
      const prefixes = {
        tableSchema: 't',
      }
      const schemas = await ensureSchemasExistsWithoutConflict(dbClient, 'pool1', prefixes)
      await assertSchemaExists(schemas.tableSchema)
      const schemas2 = await ensureSchemasExistsWithoutConflict(dbClient, 'pool1', prefixes)
      await assertSchemaExists(schemas2.tableSchema)
      assert.deepStrictEqual(schemas, schemas2)
    })

    test('does not fail when schema of the same name conflicts', async function () {
      const prefixes = {
        tableSchema: 't',
      }
      const schemas = await ensureSchemasExistsWithoutConflict(dbClient, 'pool1', prefixes)
      await dbClient.query(`COMMENT ON SCHEMA ${escapeIdentifier(schemas.tableSchema)} IS NULL`)
      await assertSchemaExists(schemas.tableSchema)
      const schemas2 = await ensureSchemasExistsWithoutConflict(dbClient, 'pool1', prefixes)
      await assertSchemaExists(schemas2.tableSchema)
      assert.notEqual(schemas.tableSchema, schemas2.tableSchema)
    })
    test('all schemas get the same suffix even if one is in conflict', async function () {
      const prefixes = {
        tableSchema: 't',
      }
      const schemas = await ensureSchemasExistsWithoutConflict(dbClient, 'pool1', prefixes)
      await dbClient.query(`COMMENT ON SCHEMA ${escapeIdentifier(schemas.tableSchema)} IS NULL`)
      const prefixes2 = {
        tableSchema: 't',
        viewSchema: 'v',
      }
      const schemas2 = await ensureSchemasExistsWithoutConflict(dbClient, 'pool1', prefixes2)
      await assertSchemaExists(schemas2.tableSchema)
      await assertSchemaExists(schemas2.viewSchema)
      const suffixes = Object.keys(schemas2).map(key => schemas2[key].substring(prefixes2[key].length))
      assert.equal(suffixes[0], suffixes[1])
    })
  })
})
