import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import tmp from 'tmp'
import { rimraf } from 'rimraf'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { Disposable, pFromCallback } from 'promise-toolbox'
import { RandomAccessDisk } from '@xen-orchestra/disk-transform'

import { openVhd } from '../index.js'
import computeGeometryForSize from '../_computeGeometryForSize.js'
import { writeToVhdDirectory } from './index.mjs'

const DEFAULT_BLOCK_SIZE = 0x00200000 // 2MB, from vhd-lib spec

class MockDisk extends RandomAccessDisk {
  #size
  #blockIndexes
  #fillByte

  constructor(nbBlocks, blockIndexes, fillByte) {
    super()
    // VHD virtual size must match the CHS-geometry-aligned actual size so that
    // qemu-img derives the same maxTableEntries from both footer and geometry fields
    const { actualSize } = computeGeometryForSize(nbBlocks * DEFAULT_BLOCK_SIZE)
    this.#size = actualSize
    this.#blockIndexes = blockIndexes
    this.#fillByte = fillByte
  }

  async readBlock(index) {
    const remaining = this.#size - DEFAULT_BLOCK_SIZE * index
    return {
      index,
      data: Buffer.alloc(Math.min(remaining, DEFAULT_BLOCK_SIZE), this.#fillByte),
    }
  }

  getVirtualSize() {
    return this.#size
  }

  getBlockSize() {
    return DEFAULT_BLOCK_SIZE
  }

  isDifferencing() {
    return false
  }

  getBlockIndexes() {
    return this.#blockIndexes
  }

  hasBlock(index) {
    return this.#blockIndexes.includes(index)
  }

  async init() {}
  async close() {}
}

describe('DiskConsumerVhdDirectory', () => {
  it('writes a valid VHD directory that can be read back', async () => {
    const tempDir = await pFromCallback(cb => tmp.dir(cb))
    try {
      await Disposable.use(async function* () {
        const handler = yield getSyncedHandler({ url: 'file://' + tempDir })
        const aliasPath = 'disk.alias.vhd'
        const disk = new MockDisk(2, [0, 1], 0x42)

        const size = await writeToVhdDirectory({
          disk,
          target: { handler, path: aliasPath, concurrency: 1, validator: async () => {} },
        })
        assert.ok(size > 0, 'reported size should be greater than 0')

        const vhd = yield openVhd(handler, aliasPath)
        assert.equal(vhd.header.cookie, 'cxsparse')
        assert.equal(vhd.footer.cookie, 'conectix')

        await vhd.readBlockAllocationTable()
        const { data } = await vhd.readBlock(1)
        assert.ok(
          data.every(byte => byte === 0x42),
          'block 1 should contain the source disk data'
        )
      })
    } finally {
      await rimraf(tempDir)
    }
  })

  it('calls the validator on the data path before creating the alias', async () => {
    const tempDir = await pFromCallback(cb => tmp.dir(cb))
    try {
      await Disposable.use(async function* () {
        const handler = yield getSyncedHandler({ url: 'file://' + tempDir })
        const aliasPath = 'disk.alias.vhd'
        const disk = new MockDisk(1, [0], 0x11)

        let validatedPath
        await writeToVhdDirectory({
          disk,
          target: {
            handler,
            path: aliasPath,
            concurrency: 1,
            validator: async dataPath => {
              validatedPath = dataPath
              // alias must not exist yet: validator runs before it is created
              assert.equal(await handler.list('.', { filter: f => f === aliasPath }).then(l => l.length), 0)
            },
          },
        })

        assert.equal(validatedPath, './data/disk.vhd')
      })
    } finally {
      await rimraf(tempDir)
    }
  })

  it('cleans up data and alias when the validator rejects', async () => {
    const tempDir = await pFromCallback(cb => tmp.dir(cb))
    try {
      await Disposable.use(async function* () {
        const handler = yield getSyncedHandler({ url: 'file://' + tempDir })
        const aliasPath = 'disk.alias.vhd'
        const disk = new MockDisk(1, [0], 0x11)

        await assert.rejects(
          writeToVhdDirectory({
            disk,
            target: {
              handler,
              path: aliasPath,
              concurrency: 1,
              validator: async () => {
                throw new Error('boom')
              },
            },
          }),
          /boom/
        )

        assert.equal(await handler.list('.').then(l => l.includes(aliasPath)), false, 'alias should have been removed')
        // rmtree only removes the vhd directory itself, not the now-empty parent 'data/' dir
        assert.deepEqual(
          await handler.list('data', { ignoreMissing: true }),
          [],
          'the vhd directory (data/disk.vhd) should have been removed'
        )
      })
    } finally {
      await rimraf(tempDir)
    }
  })

  it('overwrites a stale write left by an interrupted previous attempt (regression)', async () => {
    const tempDir = await pFromCallback(cb => tmp.dir(cb))
    try {
      await Disposable.use(async function* () {
        const handler = yield getSyncedHandler({ url: 'file://' + tempDir })
        const aliasPath = 'disk.alias.vhd'
        const NB_BLOCKS = 2

        // First attempt: a full write (blocks + footer/header/BAT + alias). In the real
        // failure, the process crashed (or the job retried) right after this completed,
        // before the backup's metadata JSON was ever persisted, so on the next run this
        // exact same alias path gets recomputed and reused.
        const firstDisk = new MockDisk(NB_BLOCKS, [0, 1], 0xaa)
        await writeToVhdDirectory({
          disk: firstDisk,
          target: { handler, path: aliasPath, concurrency: 1, validator: async () => {} },
        })

        // Second attempt reuses the exact same alias path. Before the fix, block writes
        // and/or the final alias creation used exclusive-create ('wx') and threw EEXIST
        // against the first attempt's leftover files, aborting the whole backup.
        const secondDisk = new MockDisk(NB_BLOCKS, [0, 1], 0xbb)
        await assert.doesNotReject(
          writeToVhdDirectory({
            disk: secondDisk,
            target: { handler, path: aliasPath, concurrency: 1, validator: async () => {} },
          })
        )

        // the alias must resolve to the second attempt's data, not a mix with the first
        const vhd = yield openVhd(handler, aliasPath)
        await vhd.readBlockAllocationTable()
        const { data } = await vhd.readBlock(0)
        assert.ok(
          data.every(byte => byte === 0xbb),
          'block 0 should contain only the second attempt data, found leftover bytes from the first attempt'
        )
      })
    } finally {
      await rimraf(tempDir)
    }
  })
})
