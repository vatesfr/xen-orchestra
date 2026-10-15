import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { normalize } from '@xen-orchestra/fs/path'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'

import { BLOCK_STORE_PATH, HashedDiskDeduplicated, writeHbd } from '@xen-orchestra/backup-archive/disks/hashed'

const { beforeEach, afterEach, describe } = test

const BLOCK_SIZE = 4096

let tempDir, handler, diskDir, diskPath

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  diskDir = `xo-vm-backups/VMUUID/vdis/${uuid.v4()}`
  diskPath = `${diskDir}/20260814T120000000Z.hbd`
})

afterEach(async () => {
  await handler.forget()
  await rimraf(tempDir)
})

/**
 * Minimal source disk: yields `blocks` in order, then optionally throws
 */
function fakeSource(blocks, { virtualSize = blocks.reduce((sum, b) => sum + b.length, 0), failAfter } = {}) {
  let closed = false
  return {
    get closed() {
      return closed
    },
    getBlockSize: () => BLOCK_SIZE,
    getVirtualSize: () => virtualSize,
    async *diskBlocks() {
      for (const [index, data] of blocks.entries()) {
        if (index === failAfter) {
          throw new Error('source failure')
        }
        yield { index, data }
      }
    },
    async close() {
      closed = true
    },
  }
}

// what is left of the disk dir: `data/` itself is shared with the other disks of the dir
async function listDiskDir() {
  const list = async path => (await handler.list(path).catch(() => [])).sort()
  return { files: await list(diskDir), data: await list(`${diskDir}/data`) }
}

async function listStore() {
  const entries = []
  for (const ab of await handler.list(BLOCK_STORE_PATH).catch(() => [])) {
    for (const cd of await handler.list(`${BLOCK_STORE_PATH}/${ab}`)) {
      entries.push(...(await handler.list(`${BLOCK_STORE_PATH}/${ab}/${cd}`)))
    }
  }
  return entries
}

describe('writeHbd', () => {
  test('writes every block and reads them back', async () => {
    const blocks = [Buffer.alloc(BLOCK_SIZE, 1), Buffer.alloc(BLOCK_SIZE, 2), Buffer.alloc(BLOCK_SIZE, 3)]
    const transferred = await writeHbd(handler, diskPath, fakeSource(blocks), { uuid: uuid.v4() })

    assert.equal(transferred, 3 * BLOCK_SIZE)

    const disk = new HashedDiskDeduplicated({ handler, path: diskPath })
    await disk.init()
    assert.deepEqual(disk.getBlockIndexes(), [0, 1, 2])
    assert.equal(disk.getVirtualSize(), 3 * BLOCK_SIZE)
    assert.equal(disk.getMetadata().dedupType, 'PER_BACKUP_REPOSITORY')
    for (const [index, data] of blocks.entries()) {
      assert.deepEqual((await disk.readBlock(index)).data, data)
    }
  })

  test('pads a short last block with zeros', async () => {
    const blocks = [Buffer.alloc(BLOCK_SIZE, 1), Buffer.alloc(BLOCK_SIZE / 2, 2)]
    const transferred = await writeHbd(handler, diskPath, fakeSource(blocks), { uuid: uuid.v4() })

    // counts what was read from the source, not the padding
    assert.equal(transferred, BLOCK_SIZE + BLOCK_SIZE / 2)

    const disk = new HashedDiskDeduplicated({ handler, path: diskPath })
    await disk.init()
    const { data } = await disk.readBlock(1)
    assert.equal(data.length, BLOCK_SIZE)
    assert.deepEqual(data.subarray(0, BLOCK_SIZE / 2), Buffer.alloc(BLOCK_SIZE / 2, 2))
    assert.deepEqual(data.subarray(BLOCK_SIZE / 2), Buffer.alloc(BLOCK_SIZE / 2, 0))
  })

  test('identical blocks share a single store entry', async () => {
    const blocks = [Buffer.alloc(BLOCK_SIZE, 1), Buffer.alloc(BLOCK_SIZE, 1), Buffer.alloc(BLOCK_SIZE, 2)]
    await writeHbd(handler, diskPath, fakeSource(blocks), { uuid: uuid.v4() })

    assert.equal((await listStore()).length, 2)
  })

  test('stores parent uuid and path', async () => {
    const parentUuid = uuid.v4()
    await writeHbd(handler, diskPath, fakeSource([Buffer.alloc(BLOCK_SIZE, 1)]), {
      uuid: uuid.v4(),
      parentUuid,
      parentPath: '20260813T120000000Z.hbd',
    })

    const disk = new HashedDiskDeduplicated({ handler, path: diskPath })
    await disk.init()
    assert.equal(disk.isDifferencing(), true)
    assert.equal(disk.getParentUuid(), parentUuid)
    assert.equal(disk.getParentPath(), normalize(`${diskDir}/20260813T120000000Z.hbd`))
  })

  test('calls the validator with the disk path once written', async () => {
    let validatedPath
    await writeHbd(handler, diskPath, fakeSource([Buffer.alloc(BLOCK_SIZE, 1)]), {
      uuid: uuid.v4(),
      validator: async path => {
        // the disk must already be complete and readable
        const disk = new HashedDiskDeduplicated({ handler, path })
        await disk.init()
        assert.deepEqual(disk.getBlockIndexes(), [0])
        validatedPath = path
      },
    })

    assert.equal(validatedPath, diskPath)
  })

  describe('on failure', () => {
    test('removes the partial disk and releases its blocks', async () => {
      const source = fakeSource([Buffer.alloc(BLOCK_SIZE, 7), Buffer.alloc(BLOCK_SIZE, 8)], {
        virtualSize: 2 * BLOCK_SIZE,
        failAfter: 1,
      })
      await assert.rejects(writeHbd(handler, diskPath, source, { uuid: uuid.v4() }), { message: 'source failure' })

      assert.equal(source.closed, true)
      assert.deepEqual(await listDiskDir(), { files: ['data'], data: [] })
      assert.deepEqual(await listStore(), [])
    })

    test('keeps blocks still referenced by another disk', async () => {
      const shared = Buffer.alloc(BLOCK_SIZE, 1)
      const otherPath = `${diskDir}/20260813T120000000Z.hbd`
      await writeHbd(handler, otherPath, fakeSource([shared]), { uuid: uuid.v4() })

      const source = fakeSource([shared, Buffer.alloc(BLOCK_SIZE, 2)], { virtualSize: 2 * BLOCK_SIZE, failAfter: 1 })
      await assert.rejects(writeHbd(handler, diskPath, source, { uuid: uuid.v4() }))

      assert.equal((await listStore()).length, 1)
      const other = new HashedDiskDeduplicated({ handler, path: otherPath })
      await other.init()
      assert.deepEqual((await other.readBlock(0)).data, shared)
    })

    test('removes the disk when the validator rejects', async () => {
      await assert.rejects(
        writeHbd(handler, diskPath, fakeSource([Buffer.alloc(BLOCK_SIZE, 1)]), {
          uuid: uuid.v4(),
          validator: async () => {
            throw new Error('invalid')
          },
        }),
        { message: 'invalid' }
      )

      assert.deepEqual(await listDiskDir(), { files: ['data'], data: [] })
      assert.deepEqual(await listStore(), [])
    })

    test('does not start when the signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()
      await assert.rejects(
        writeHbd(handler, diskPath, fakeSource([Buffer.alloc(BLOCK_SIZE, 1)]), {
          uuid: uuid.v4(),
          signal: controller.signal,
        })
      )

      assert.deepEqual(await listDiskDir(), { files: [], data: [] })
    })
  })
})
