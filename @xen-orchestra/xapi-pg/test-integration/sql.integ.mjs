import * as assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { after, afterEach, before, beforeEach, suite, test } from 'node:test'
import { Client as DBClient, escapeIdentifier, escapeLiteral } from 'pg'
import { ensureSchemasExistsWithoutConflict, executeSerialized } from '../src/sql.mjs'
import { closeServer, createServer, setupDatabase } from './database.mjs'

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

suite('executeSerialized PGlite integration tests', function () {
  const schema = `test_transaction_${randomUUID().replaceAll('-', '')}`
  const schemaEsc = escapeIdentifier(schema)
  const recordsTable = `${schemaEsc}.records`
  let server
  let socketPath
  let dbClient
  let dbClientEnded

  before(async () => {
    ;({ server, socketPath } = await createServer())
  })

  after(async () => {
    await closeServer(server)
  })

  beforeEach(async () => {
    dbClient = new DBClient({ connectionString: socketPath })
    await dbClient.connect()
    dbClient.once('end', () => {
      dbClientEnded = true
    })
    dbClientEnded = false
    await dbClient.query(`CREATE SCHEMA ${schemaEsc}`)
  })

  afterEach(async () => {
    if (dbClientEnded) {
      dbClient = new DBClient({ connectionString: socketPath })
      await dbClient.connect()
    }
    for (const tx of (await dbClient.query('SELECT gid FROM pg_prepared_xacts;')).rows) {
      await dbClient.query(`ROLLBACK PREPARED ${escapeLiteral(tx.gid)}`)
    }
    await dbClient.query(`DROP SCHEMA IF EXISTS ${schemaEsc} CASCADE`)
    await dbClient.end()
  })

  async function createRecordsTable() {
    await dbClient.query(`CREATE TABLE ${recordsTable} (id integer PRIMARY KEY, value text NOT NULL)`)
  }

  async function createPreparedSsiConflict() {
    const doctorsTable = `${schemaEsc}.doctors`
    const preparedTransaction = `ssi_${randomUUID().replaceAll('-', '')}`
    await dbClient.query(`CREATE TABLE ${doctorsTable} (id integer PRIMARY KEY, on_call boolean NOT NULL)`)
    await dbClient.query(`INSERT INTO ${doctorsTable} VALUES (1, TRUE), (2, TRUE)`)

    // Transaction A reads both doctors, then takes doctor 1 off call. Preparing it leaves its
    // changes uncommitted but frees PGlite's single connection for another transaction.
    // Transaction B in the tests also reads both doctors and tries to take doctor 2 off call.
    // Both see two doctors on call, but if run one after the other, the second would see only
    // one. PostgreSQL rejects B with a serialization error (40001) rather than allow these
    // conflicting observations; B can be retried after A finishes.
    await dbClient.query('BEGIN ISOLATION LEVEL SERIALIZABLE')
    await dbClient.query(`SELECT count(*) FROM ${doctorsTable} WHERE on_call`)
    await dbClient.query(`UPDATE ${doctorsTable} SET on_call = false WHERE id = 1`)
    await dbClient.query(`PREPARE TRANSACTION ${escapeLiteral(preparedTransaction)}`)
    return { doctorsTable, preparedTransaction }
  }

  test('returns the callback result after committing its writes', async function () {
    await createRecordsTable()
    let callbackCount = 0

    const result = await executeSerialized(dbClient, async client => {
      callbackCount++
      await client.query(`INSERT INTO ${recordsTable} VALUES (1, 'committed')`)
      return 'committed result'
    })

    assert.strictEqual(result, 'committed result')
    assert.strictEqual(callbackCount, 1)
    assert.deepStrictEqual((await dbClient.query(`SELECT * FROM ${recordsTable}`)).rows, [
      { id: 1, value: 'committed' },
    ])
  })

  test('retries a natural SSI serialization failure and commits the retried writes', async function () {
    const { doctorsTable, preparedTransaction } = await createPreparedSsiConflict()

    const serializationErrors = []
    let rollbackCount = 0
    const serializedClient = {
      query: async (sql, ...args) => {
        if (sql === 'ROLLBACK') rollbackCount++
        try {
          return await dbClient.query(sql, ...args)
        } catch (error) {
          if (error.code === '40001') serializationErrors.push({ sql, code: error.code })
          throw error
        }
      },
    }

    let callbackCount = 0
    const result = await executeSerialized(
      serializedClient,
      async client => {
        callbackCount++
        // this read set intersects with the previous transaction
        const onCallCount = (await client.query(`SELECT count(*) FROM ${doctorsTable} WHERE on_call`)).rows[0].count
        if (callbackCount === 1)
          // we shouldn't see the uncommitted changes from the other TX
          assert.strictEqual(onCallCount, '2')
        if (callbackCount === 2)
          // at the second try, we committed the interfering transaction, we should see its result
          assert.strictEqual(onCallCount, '1')
        await client.query(`UPDATE ${doctorsTable} SET on_call = false WHERE id = 2`)
        // here the DB doesn't know if the updated value is computed from the previous SELECT
        // the previous SELECT is tainted because it read values changed by the other uncommitted transaction.
        // This transaction is DOA, because the interfering transaction has already acquired all the locks for a commit.
        return 'committed after retry'
      },
      client => {
        if (callbackCount === 1) {
          return client.query(`COMMIT PREPARED ${escapeLiteral(preparedTransaction)}`)
        }
      }
    )

    assert.strictEqual(result, 'committed after retry')
    assert.strictEqual(callbackCount, 2)
    assert.strictEqual(rollbackCount, 1)
    assert.deepStrictEqual(serializationErrors, [
      { sql: `UPDATE ${doctorsTable} SET on_call = false WHERE id = 2`, code: '40001' },
    ])
    assert.strictEqual((await dbClient.query('SELECT gid FROM pg_prepared_xacts;')).rows.length, 0)
    assert.deepStrictEqual((await dbClient.query(`SELECT id, on_call FROM ${doctorsTable} ORDER BY id`)).rows, [
      { id: 1, on_call: false },
      { id: 2, on_call: false },
    ])
  })

  test('exhausts retries on repeated natural SSI serialization failures', async function () {
    await createRecordsTable()
    const { doctorsTable } = await createPreparedSsiConflict()

    let callbackCount = 0
    const serializationErrors = []
    let rollbackCount = 0
    const serializedClient = {
      query: async (sql, ...args) => {
        if (sql === 'ROLLBACK') rollbackCount++
        try {
          return await dbClient.query(sql, ...args)
        } catch (error) {
          if (error.code === '40001') serializationErrors.push({ sql, code: error.code })
          throw error
        }
      },
    }

    await assert.rejects(
      executeSerialized(serializedClient, async client => {
        callbackCount++
        await client.query(`SELECT count(*) FROM ${doctorsTable} WHERE on_call`)
        await client.query(`INSERT INTO ${recordsTable} VALUES (1, 'must roll back')`)
        await client.query(`UPDATE ${doctorsTable} SET on_call = false WHERE id = 2`)
      }),
      error => {
        assert.strictEqual(error.message, 'Serialization error, and retries are exhausted (3)')
        assert.strictEqual(error.cause.code, '40001')
        return true
      }
    )

    assert.strictEqual(callbackCount, 4)
    assert.strictEqual(rollbackCount, 4)
    assert.deepStrictEqual(
      serializationErrors,
      Array.from({ length: 4 }, () => ({
        sql: `UPDATE ${doctorsTable} SET on_call = false WHERE id = 2`,
        code: '40001',
      }))
    )
    assert.deepStrictEqual((await dbClient.query(`SELECT * FROM ${recordsTable}`)).rows, [])
    assert.deepStrictEqual((await dbClient.query(`SELECT id, on_call FROM ${doctorsTable} ORDER BY id`)).rows, [
      { id: 1, on_call: true },
      { id: 2, on_call: true },
    ])
  })

  test('rolls back writes and wraps a non-serialization database error without retrying', async function () {
    await createRecordsTable()
    let callbackCount = 0

    await assert.rejects(
      executeSerialized(dbClient, async client => {
        callbackCount++
        await client.query(`INSERT INTO ${recordsTable} VALUES (1, 'must roll back')`)
        await client.query(`SELECT * FROM ${schemaEsc}.missing_table`)
      }),
      error => {
        assert.strictEqual(error.cause.code, '42P01')
        return true
      }
    )

    assert.strictEqual(callbackCount, 1)
    assert.deepStrictEqual((await dbClient.query(`SELECT * FROM ${recordsTable}`)).rows, [])
  })

  test('does not call back or attempt rollback when BEGIN cannot reach PostgreSQL', async function () {
    await dbClient.end()
    let callbackCalled = false
    const queries = []
    const disconnectedClient = {
      query: async (sql, ...args) => {
        queries.push(sql)
        return dbClient.query(sql, ...args)
      },
    }

    await assert.rejects(
      executeSerialized(disconnectedClient, async () => {
        callbackCalled = true
      })
    )
    assert.strictEqual(callbackCalled, false)
    assert.deepStrictEqual(queries, ['BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE DEFERRABLE'])
  })

  test('propagates a real rollback connection failure without retrying', async function () {
    let callbackCount = 0
    let queryFailure
    let rollbackFailure

    await assert.rejects(
      executeSerialized(dbClient, async client => {
        callbackCount++
        try {
          await client.query('SELECT 1 / 0')
        } catch (error) {
          queryFailure = error
          await client.end()
          throw error
        }
      }),
      error => {
        rollbackFailure = error
        assert.notStrictEqual(error, queryFailure)
        return true
      }
    )

    assert.strictEqual(queryFailure.code, '22012')
    assert.strictEqual(callbackCount, 1)
    assert.ok(rollbackFailure)
  })
})
