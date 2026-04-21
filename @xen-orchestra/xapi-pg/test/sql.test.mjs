import * as assert from 'node:assert'
import { suite, test } from 'node:test'
import {
  absRelationEsc,
  absReferenceEsc,
  TableCreator,
  createInsert,
  SetFieldDbSaver,
  MapFieldDbSaver,
  createViewDDL,
} from '../src/sql.mjs'
import { UUID_TYPE } from '../src/types.mjs'

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
      const saver = new SetFieldDbSaver('"s"."t"', 'field', 'owner_uuid', 'ref_uuid')
      assert.ok(saver.mergeStatement.includes('MERGE INTO "s"."t" t'))
      assert.ok(saver.mergeStatement.includes(`USING UNNEST($1::${UUID_TYPE}[], $2::${UUID_TYPE}[])`))
      assert.ok(saver.mergeStatement.includes('AS src("owner_uuid", "ref_uuid")'))
      // Check for unquoted identifiers in ON clause if that's what's happening
      assert.ok(
        saver.mergeStatement.includes('t."owner_uuid" = src."owner_uuid"') ||
          saver.mergeStatement.includes('t.owner_uuid = src.owner_uuid')
      )
      assert.ok(
        saver.mergeStatement.includes('t."ref_uuid" = src."ref_uuid"') ||
          saver.mergeStatement.includes('t.ref_uuid = src.ref_uuid')
      )
    })
  })

  suite('MapFieldDbSaver', function () {
    test('mergeStatement is correctly generated', function () {
      const saver = new MapFieldDbSaver('"s"."t"', 'field', 'owner_uuid', 'text', 'uuid')
      assert.ok(saver.mergeStatement.includes('MERGE INTO "s"."t" t'))
      assert.ok(saver.mergeStatement.includes(`USING UNNEST($1::${UUID_TYPE}[], $2::text[], $3::uuid[])`))
      assert.ok(saver.mergeStatement.includes('AS src("owner_uuid", key, value)'))
      assert.ok(saver.mergeStatement.includes('t."owner_uuid" = src."owner_uuid" AND t.key = src.key'))
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
