import * as assert from 'node:assert'
import { after, afterEach, before, beforeEach, suite, test } from 'node:test'
import { escapeIdentifier } from 'pg'
import { ensureSchemasExistsWithoutConflict } from '../src/sql.mjs'
import { setupDatabase } from './database.mjs'

suite('sql.mjs integration tests', async function () {
  const database = setupDatabase({ after, afterEach, before, beforeEach })

  async function assertSchemaExists(schemaName) {
    const result = await database.dbClient.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [schemaName]
    )
    assert.strictEqual(result.rows.length, 1)
  }
  suite('ensureSchemasExistsWithoutConflict', function () {
    test('creates multiple schemas successfully', async function () {
      const prefixes = {
        tableSchema: 't',
        viewSchema: 'v',
      }
      const schemas = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes)
      for (const key of Object.keys(prefixes)) {
        await assertSchemaExists(schemas[key])
      }
    })

    test('does not fail when schema already exists', async function () {
      const prefixes = {
        tableSchema: 't',
      }
      const schemas = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes)
      await assertSchemaExists(schemas.tableSchema)
      const schemas2 = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes)
      await assertSchemaExists(schemas2.tableSchema)
      assert.deepStrictEqual(schemas, schemas2)
    })

    test('force drops and recreates existing schemas', async function () {
      const prefixes = { tableSchema: 't', viewSchema: 'v' }
      const schemas = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes)
      await database.dbClient.query(`CREATE TABLE ${escapeIdentifier(schemas.tableSchema)}.existing_table (id integer)`)

      const recreated = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes, true)
      assert.deepStrictEqual(recreated, schemas)
      for (const schema of Object.values(recreated)) {
        await assertSchemaExists(schema)
      }
      const result = await database.dbClient.query(
        'SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2',
        [recreated.tableSchema, 'existing_table']
      )
      assert.strictEqual(result.rows.length, 0)
    })

    test('does not fail when schema of the same name conflicts', async function () {
      const prefixes = {
        tableSchema: 't',
      }
      const schemas = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes)
      await database.dbClient.query(`COMMENT ON SCHEMA ${escapeIdentifier(schemas.tableSchema)} IS NULL`)
      await assertSchemaExists(schemas.tableSchema)
      const schemas2 = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes)
      await assertSchemaExists(schemas2.tableSchema)
      assert.notEqual(schemas.tableSchema, schemas2.tableSchema)
    })
    test('all schemas get the same suffix even if one is in conflict', async function () {
      const prefixes = {
        tableSchema: 't',
      }
      const schemas = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes)
      await database.dbClient.query(`COMMENT ON SCHEMA ${escapeIdentifier(schemas.tableSchema)} IS NULL`)
      const prefixes2 = {
        tableSchema: 't',
        viewSchema: 'v',
      }
      const schemas2 = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes2)
      await assertSchemaExists(schemas2.tableSchema)
      await assertSchemaExists(schemas2.viewSchema)
      const suffixes = Object.keys(schemas2).map(key => schemas2[key].substring(prefixes2[key].length))
      assert.equal(suffixes[0], suffixes[1])
    })
  })
})
