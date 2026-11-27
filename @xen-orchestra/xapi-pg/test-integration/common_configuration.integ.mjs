import { after, afterEach, before, beforeEach, suite, test } from 'node:test'
import { getDbObjectsForSchemas, getSchemaPrefixes } from '../src/conmon_configuration.mjs'
import { ensureSchemasExistsWithoutConflict } from '../src/sql.mjs'
import { setupDatabase } from './database.mjs'

suite('sql.mjs integration tests', async function () {
  const database = setupDatabase({ after, afterEach, before, beforeEach })
  test('create the whole DDL successfully', async function () {
    const prefixes = getSchemaPrefixes()
    const schemas = await ensureSchemasExistsWithoutConflict(database.dbClient, 'pool1', prefixes)
    const result = await getDbObjectsForSchemas(schemas)
    for (const statement of result.getAllTheDDL()) {
      await database.dbClient.query(statement)
    }
  })
})
