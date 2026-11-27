// eslint-disable-next-line n/no-unpublished-import
import { PGlite } from '@electric-sql/pglite'
// eslint-disable-next-line n/no-unpublished-import
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { Client as DBClient, escapeIdentifier } from 'pg'

/** Starts pglite asynchronously in the main process and makes it listen on a unix socket in a temporary directory.
 * This convoluted connection scheme allows testing with the actual PG driver. */
export async function createServer() {
  const db = await PGlite.create({ postgresqlconf: 'max_prepared_transactions = 2' })
  const socketPath = await mkdtemp(join(tmpdir(), 'pg-'))
  const server = new PGLiteSocketServer({
    db,
    path: join(socketPath, '.s.PGSQL.5432'),
  })
  await server.start()
  return { server, socketPath }
}

export async function closeServer(server) {
  const db = server.db
  const path = dirname(server.path)
  await server.stop()
  db.close()
  await rm(path, { recursive: true, force: true })
}

export function setupDatabase({ after, afterEach, before, beforeEach }) {
  let server, socketPath, dbClient, initialSchemas

  async function allSchemas(client) {
    const result = await client.query('SELECT schema_name FROM information_schema.schemata')
    return new Set(result.rows.map(row => row.schema_name))
  }

  before(async () => {
    ;({ server, socketPath } = await createServer())
    const client = new DBClient({ connectionString: socketPath })
    await client.connect()
    try {
      initialSchemas = await allSchemas(client)
    } finally {
      await client.end()
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
    for (const schema of schemas.difference(initialSchemas)) {
      await dbClient.query(`DROP SCHEMA IF EXISTS ${escapeIdentifier(schema)} CASCADE`)
    }
    await dbClient.end()
  })

  return {
    get dbClient() {
      return dbClient
    },
  }
}
