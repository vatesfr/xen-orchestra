import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'

import { HashedDiskDeduplicated } from './HashedDiskDeduplicated.mts'

const BLOCK_SIZE = 2 * 1024 * 1024
const BLOCK_COUNT = 100
const UNIQUE_PAYLOADS = 70

async function listFiles(handler, dir) {
  const found = []
  for (const entry of await handler.list(dir, { prependDir: true })) {
    try {
      found.push(...(await listFiles(handler, entry)))
    } catch (error) {
      if (error.code !== 'ENOTDIR') {
        throw error
      }
      found.push(entry)
    }
  }
  return found
}

// index i holds payload (i % UNIQUE_PAYLOADS), so the last 30 blocks repeat earlier content
const payloadOf = index => Buffer.alloc(BLOCK_SIZE, (index % UNIQUE_PAYLOADS) % 256)

test('a full disk round trips, and duplicate payloads are stored once', async () => {
  const tempDir = await pFromCallback(cb => tmp.dir(cb))
  const handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()

  try {
    const path = 'xo-vm-backups/VMUUID/vdis/job/vdi/20260814T120000000Z.hbd'
    const disk = await HashedDiskDeduplicated.create({
      handler,
      path,
      virtualSize: BLOCK_SIZE * BLOCK_COUNT,
      blockSize: BLOCK_SIZE,
      uuid: 'integ-disk-uuid',
    })

    for (let index = 0; index < BLOCK_COUNT; index++) {
      assert.equal(await disk.writeBlock({ index, data: payloadOf(index) }), BLOCK_SIZE)
    }

    assert.equal(disk.getBlockIndexes().length, BLOCK_COUNT)
    assert.equal(disk.getSizeOnDisk(), BLOCK_COUNT * BLOCK_SIZE)

    // the repeated payloads share a hash, so they share a file
    assert.equal(disk.getBlockHashAt(0), disk.getBlockHashAt(UNIQUE_PAYLOADS))

    await disk.close()

    // reopen from scratch: nothing may be kept in memory
    const reopened = new HashedDiskDeduplicated({ handler, path })
    await reopened.init()

    assert.equal(reopened.getBlockIndexes().length, BLOCK_COUNT)
    for (let index = 0; index < BLOCK_COUNT; index++) {
      const { data } = await reopened.readBlock(index)
      assert.ok(data.equals(payloadOf(index)), `block ${index} differs`)
    }

    const blockFiles = (await listFiles(handler, 'xo-vm-backups')).filter(file => file.includes('/blocks/'))
    assert.equal(blockFiles.length, UNIQUE_PAYLOADS, `${BLOCK_COUNT} blocks stored as ${UNIQUE_PAYLOADS} files`)

    await reopened.unlink()
    assert.deepEqual(await listFiles(handler, 'xo-vm-backups'), [])
  } finally {
    await handler.forget()
    await rimraf(tempDir)
  }
})
