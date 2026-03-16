import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import execa from 'execa'
import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import computeGeometryForSize from '../_computeGeometryForSize.js'

import { toVhdStream } from './index.mjs'

const DEFAULT_BLOCK_SIZE = 0x00200000 // 2MB, from vhd-lib spec

class MockDisk extends RandomAccessDisk {
  #size
  #blockIndexes

  constructor(nbBlocks, blockIndexes) {
    super()
    // VHD virtual size must match the CHS-geometry-aligned actual size so that
    // qemu-img derives the same maxTableEntries from both footer and geometry fields
    const { actualSize } = computeGeometryForSize(nbBlocks * DEFAULT_BLOCK_SIZE)
    this.#size = actualSize
    this.#blockIndexes = blockIndexes
  }

  async readBlock(index) {
    const remaining = this.#size - DEFAULT_BLOCK_SIZE * index
    return {
      index,
      data: Buffer.alloc(Math.min(remaining, DEFAULT_BLOCK_SIZE), index % 256),
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

async function writeStreamToFile(stream, filePath) {
  const fileHandle = await fs.open(filePath, 'w')
  try {
    await pipeline(stream, fileHandle.createWriteStream())
  } finally {
    await fileHandle.close()
  }
}

describe('DiskConsumerVhdStream', () => {
  it('should generate valid VHD files', async () => {
    const testCases = [
      { name: 'empty disk', nbBlocks: 8, blockIndexes: [] },
      { name: 'sparse disk', nbBlocks: 8, blockIndexes: [0, 3, 7] },
      { name: 'fully allocated disk', nbBlocks: 4, blockIndexes: Array.from({ length: 4 }, (_, i) => i) },
    ]

    for (const { name, nbBlocks, blockIndexes } of testCases) {
      const disk = new MockDisk(nbBlocks, blockIndexes)
      const tmpVhd = join(tmpdir(), `test-vhd-${Date.now()}-${name.replace(/\s+/g, '-')}.vhd`)
      const tmpRaw = `${tmpVhd}.raw`
      try {
        const stream = await toVhdStream(disk)
        await writeStreamToFile(stream, tmpVhd)

        // qemu-img check doesn't support vpc format; convert to raw and verify
        // the output size matches the declared virtual size
        await execa('qemu-img', ['convert', '-f', 'vpc', '-O', 'raw', tmpVhd, tmpRaw])
        const { size } = await fs.stat(tmpRaw)
        assert.strictEqual(size, disk.getVirtualSize(), `Raw size mismatch for ${name}`)
      } finally {
        await fs.unlink(tmpVhd).catch(() => {})
        await fs.unlink(tmpRaw).catch(() => {})
      }
    }
  })

  it('should generate files with correct metadata', async () => {
    const NB_BLOCKS = 4
    const disk = new MockDisk(NB_BLOCKS, [0, 1])
    const tmpVhd = join(tmpdir(), `test-vhd-metadata-${Date.now()}.vhd`)
    const tmpRaw = `${tmpVhd}.raw`
    try {
      const stream = await toVhdStream(disk)
      await writeStreamToFile(stream, tmpVhd)

      const { stdout } = await execa('qemu-img', ['info', tmpVhd])
      assert.match(stdout, /file format: vpc/, 'File format should be vpc (VHD)')

      await execa('qemu-img', ['convert', '-f', 'vpc', '-O', 'raw', tmpVhd, tmpRaw])
      const { size } = await fs.stat(tmpRaw)
      assert.strictEqual(size, disk.getVirtualSize(), 'Raw size should match declared virtual size')
    } finally {
      await fs.unlink(tmpVhd).catch(() => {})
      await fs.unlink(tmpRaw).catch(() => {})
    }
  })

  it('should abort stream when signal is aborted before start', async () => {
    const disk = new MockDisk(
      8,
      Array.from({ length: 8 }, (_, i) => i)
    )
    const controller = new AbortController()
    controller.abort()

    const stream = await toVhdStream(disk, { signal: controller.signal })
    await assert.rejects(
      async () => {
        // eslint-disable-next-line no-unused-vars
        for await (const _chunk of stream) {
          // should not reach here
        }
      },
      err => {
        assert(err instanceof Error)
        assert.strictEqual(err.name, 'AbortError')
        return true
      }
    )
  })

  it('should abort stream mid-way when signal is aborted', async () => {
    const NB_BLOCKS = 16
    const disk = new MockDisk(
      NB_BLOCKS,
      Array.from({ length: NB_BLOCKS }, (_, i) => i)
    )
    const controller = new AbortController()

    const stream = await toVhdStream(disk, { signal: controller.signal })
    let chunksReceived = 0

    await assert.rejects(
      async () => {
        // eslint-disable-next-line no-unused-vars
        for await (const _chunk of stream) {
          chunksReceived++
          if (chunksReceived === 1) {
            controller.abort()
          }
        }
      },
      err => {
        assert(err instanceof Error)
        assert.strictEqual(err.name, 'AbortError')
        return true
      }
    )

    assert(chunksReceived >= 1, 'should have received at least one chunk before abort')
  })
})
