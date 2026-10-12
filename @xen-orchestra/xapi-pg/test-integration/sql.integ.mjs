import * as assert from 'node:assert'
import { after, afterEach, before, beforeEach, suite, test } from 'node:test'
import { Client as DBClient, escapeIdentifier } from 'pg'
import { ensureSchemasExistsWithoutConflict } from '../src/sql.mjs'
import { closeServer, createServer } from './pglite.mjs'

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
