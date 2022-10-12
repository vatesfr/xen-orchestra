'use strict'
const NbdClient = require('./index.js')
const { spawn } = require('node:child_process')
const fs = require('node:fs/promises')
const { test } = require('tap')
const tmp = require('tmp')
const { pFromCallback } = require('promise-toolbox')
const { asyncEach } = require('@vates/async-each')

const FILE_SIZE = 2 * 1024 * 1024

async function createTempFile(size) {
  const tmpPath = await pFromCallback(cb => tmp.file(cb))
  const data = Buffer.alloc(size, 0)
  for (let i = 0; i < size; i += 4) {
    data.writeUInt32BE(i, i)
  }
  await fs.writeFile(tmpPath, data)

  return tmpPath
}

test('it works with unsecured network', async tap => {
  const path = await createTempFile(FILE_SIZE)

  const nbdServer = spawn(
    'nbdkit',
    [
      'file',
      path,
      '--newstyle', //
      '--exit-with-parent',
      '--read-only',
      '--export-name=MY_SECRET_EXPORT',
    ],
    {
      stdio: ['inherit', 'inherit', 'inherit'],
    }
  )

  const client = new NbdClient({
    address: 'localhost',
    exportname: 'MY_SECRET_EXPORT',
    secure: false,
  })

  await client.connect()
  tap.equal(client.exportSize, BigInt(FILE_SIZE))
  const CHUNK_SIZE = 128 * 1024 // non default size
  const indexes = []
  for (let i = 0; i < FILE_SIZE / CHUNK_SIZE; i++) {
    indexes.push(i)
  }
  // read mutiple blocks in parallel
  await asyncEach(
    indexes,
    async i => {
      const block = await client.readBlock(i, CHUNK_SIZE)
      let blockOk = true
      let firstFail
      for (let j = 0; j < CHUNK_SIZE; j += 4) {
        const wanted = i * CHUNK_SIZE + j
        const found = block.readUInt32BE(j)
        blockOk = blockOk && found === wanted
        if (!blockOk && firstFail === undefined) {
          firstFail = j
        }
      }
      tap.ok(blockOk, `check block ${i} content`)
    },
    { concurrency: 8 }
  )
  await client.disconnect()
  nbdServer.kill()
  await fs.unlink(path)
})
