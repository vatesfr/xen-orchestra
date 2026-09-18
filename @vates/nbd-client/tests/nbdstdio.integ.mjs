import assert from 'node:assert'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { pFromCallback } from 'promise-toolbox'
import { test } from 'tap'
import tmp from 'tmp'

import NbdStdioClient from '../NbdStdioClient.mjs'

// nbdkit in single connection mode: the real thing this client targets
const NBDKIT = path => ({
  command: 'nbdkit',
  args: ['--single', '--exit-with-parent', '--read-only', 'file', path],
})

// a tiny NBD server we can ask to die in the middle of the transfer, which
// nbdkit won't do
const FLAKY_SERVER = fileURLToPath(new URL('./stdio-nbd-server.mjs', import.meta.url))

const CHUNK_SIZE = 64 * 1024
const FILE_SIZE = CHUNK_SIZE * 8 + 1232 // non aligned file size

async function createTempFile(size) {
  const tmpPath = await pFromCallback(cb => tmp.file(cb))
  const data = Buffer.alloc(size)
  for (let i = 0; i < size; i += 4) {
    data.writeUInt32BE(i, i)
  }
  await fs.writeFile(tmpPath, data)
  return tmpPath
}

function checkBlock(tap, block, index) {
  tap.equal(block.length, Math.min(CHUNK_SIZE, FILE_SIZE - index * CHUNK_SIZE), `block ${index} length`)
  let ok = true
  for (let i = 0; i < block.length; i += 4) {
    ok = ok && block.readUInt32BE(i) === index * CHUNK_SIZE + i
  }
  tap.ok(ok, `block ${index} content`)
}

async function readWholeExport(tap, client) {
  for (let index = 0; index < Math.ceil(FILE_SIZE / CHUNK_SIZE); index++) {
    checkBlock(tap, await client.readBlock(index, CHUNK_SIZE), index)
  }
}

const isAlive = pid => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return false
  }
}

test('it reads an export served by nbdkit on stdin/stdout', async tap => {
  const path = await createTempFile(FILE_SIZE)
  const client = new NbdStdioClient(NBDKIT(path))

  await client.connect()
  const { pid } = client
  tap.equal(client.exportSize, BigInt(FILE_SIZE))

  await readWholeExport(tap, client)

  await client.disconnect()
  tap.notOk(isAlive(pid), 'the server process is stopped after disconnect')

  // double disconnection shouldn't pose any problem
  await client.disconnect()
  await fs.unlink(path)
})

test('it fails when the server does not serve the requested export', async tap => {
  const path = await createTempFile(CHUNK_SIZE)
  // the file plugin of nbdkit ignores the export name, so use our own server here
  const client = new NbdStdioClient(
    {
      command: process.execPath,
      args: [FLAKY_SERVER, path, '--export-name=MY_SECRET_EXPORT'],
      exportname: 'NOPE',
    },
    { connectTimeout: 5e3 }
  )
  await assert.rejects(client.connect())
  tap.match(client.stderr, /NOPE/, 'the stderr of the server is captured')
  await fs.unlink(path)
})

test('it recovers from a server dying in the middle of the transfer', async tap => {
  const path = await createTempFile(FILE_SIZE)
  const client = new NbdStdioClient(
    { command: process.execPath, args: [FLAKY_SERVER, path, '--die-after=3'] },
    { waitBeforeReconnect: 100 }
  )

  await client.connect()
  await readWholeExport(tap, client)
  await client.disconnect()
  await fs.unlink(path)
})

test('it fails cleanly when the server cannot be spawned', async () => {
  const client = new NbdStdioClient({ command: '/does/not/exist' })
  await assert.rejects(client.connect(), ({ code, command }) => code === 'ENOENT' && command === '/does/not/exist')
  // nothing to disconnect from
  await client.disconnect()
})

test('it does not implement getMap', async () => {
  const client = new NbdStdioClient({ command: 'nbdkit' })
  await assert.rejects(client.getMap(), ({ code }) => code === 'NBD_MAP_UNSUPPORTED')
})
