// eslint-disable-next-line n/no-unpublished-import
import { PGlite } from '@electric-sql/pglite'
// eslint-disable-next-line n/no-unpublished-import
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

/** Starts pglite asynchronously in the main process and makes it listen on a unix socket in a temporary directory.
 * This convoluted connection scheme allows testing with the actual PG driver. */
export async function createServer() {
  const db = await PGlite.create()
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
