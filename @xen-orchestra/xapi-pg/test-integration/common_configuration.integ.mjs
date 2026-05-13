import { after, afterEach, before, beforeEach, suite, test } from 'node:test'
import { Client as DBClient, escapeIdentifier } from 'pg'
import { getDbObjectsForSchemas, getSchemaPrefixes } from '../src/conmon_configuration.mjs'
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
  test('create the whole DDL successfully', async function () {
    const prefixes = getSchemaPrefixes()
    const schemas = await ensureSchemasExistsWithoutConflict(dbClient, 'pool1', prefixes)
    const result = await getDbObjectsForSchemas(schemas)
    for (const statement of result.getAllTheDDL()) {
      await dbClient.query(statement)
    }
  })
})
