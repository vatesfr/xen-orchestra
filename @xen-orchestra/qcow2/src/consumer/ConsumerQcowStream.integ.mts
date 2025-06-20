// ConsumerQcowStream.integ.ts
import { describe, it } from 'node:test'
import assert from 'node:assert'
import execa from 'execa'

import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DiskBlock, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { toQcow2Stream } from './ConsumerQcowStream.mjs' // Adjust import path as needed

class MockDisk extends RandomAccessDisk {
  private readonly size: number
  private readonly blockIndex: number[]

  constructor(nbBlocks: number, blockIndex: number[]) {
    super()
    this.size = nbBlocks * this.getBlockSize()
    this.blockIndex = blockIndex
  }

  async readBlock(index: number): Promise<DiskBlock> {
    return {
      index,
      data: Buffer.alloc(this.getBlockSize(), index % 256),
    }
  }

  getVirtualSize(): number {
    return this.size
  }

  getBlockSize(): number {
    return 64 * 1024
  }

  async init(): Promise<void> {}
  async close(): Promise<void> {}

  isDifferencing(): boolean {
    return false
  }

  getBlockIndexes(): number[] {
    return this.blockIndex
  }

  hasBlock(index: number): boolean {
    return this.blockIndex.includes(index)
  }
}

describe('QCOW2 Stream Generation', () => {
  it('should generate valid qcow2 files', async () => {
    interface TestCase {
      name: string
      nbBlocks: number
      blockIndexes: number[]
    }

    const testCases: TestCase[] = [
      {
        name: 'empty disk',
        nbBlocks: 128,
        blockIndexes: [],
      },
      {
        name: 'sparse disk',
        nbBlocks: 128,
        blockIndexes: [0, 34, 35, 67, 94],
      },
      {
        name: 'fully allocated disk',
        nbBlocks: 128,
        blockIndexes: Array.from({ length: 128 }, (_, i) => i),
      },
    ]

    for (const testCase of testCases) {
      const disk = new MockDisk(testCase.nbBlocks, testCase.blockIndexes)
      const tmpFile = join(tmpdir(), `test-${Date.now()}-${testCase.name.replace(/\s+/g, '-')}.qcow2`)

      try {
        // Generate and write the QCOW2 file
        const stream = toQcow2Stream(disk)
        const file = await fs.open(tmpFile, 'w')
        await new Promise((resolve, reject) => {
          const writeStream = file.createWriteStream()
          stream.pipe(writeStream)
          writeStream.on('finish', () => resolve(undefined))
          writeStream.on('error', reject)
        })
        await file.close()

        // Verify with qemu-img
        const { stdout, stderr } = await execa('qemu-img', ['check', tmpFile])

        // Check for errors in stderr
        assert.strictEqual(stderr, '', `qemu-img check reported errors for ${testCase.name}`)

        // Check for "No errors were found" in stdout
        assert.match(stdout, /No errors were found/, `Validation failed for ${testCase.name}`)

        // Additional validation - file should exist and be non-zero size
        const stats = await fs.stat(tmpFile)
        assert(stats.size > 0, `Generated file is empty for ${testCase.name}`)

        console.log(`✅ ${testCase.name} passed validation`)
      } catch (err) {
        console.error(`Error in test case "${testCase.name}":`, err)
        throw err
      } finally {
        // Clean up
        try {
          await fs.unlink(tmpFile)
        } catch (err) {
          console.error(`Failed to clean up ${tmpFile}:`, err)
        }
      }
    }
  })

  it('should generate files with correct metadata', async () => {
    const disk = new MockDisk(128, [0, 1, 2, 64, 65])
    const tmpFile = join(tmpdir(), `test-metadata-${Date.now()}.qcow2`)

    try {
      // Generate and write the QCOW2 file
      const stream = toQcow2Stream(disk)
      const file = await fs.open(tmpFile, 'w')
      await new Promise((resolve, reject) => {
        const writeStream = file.createWriteStream()
        stream.pipe(writeStream)
        writeStream.on('finish', () => resolve(undefined))
        writeStream.on('error', reject)
      })
      await file.close()

      // Use qemu-img info to verify metadata
      const { stdout } = await execa('qemu-img', ['info', tmpFile])

      // Verify key metadata
      assert.match(stdout, /file format: qcow2/, 'File format should be qcow2')
      assert.match(stdout, /virtual size: 8 MiB/, 'Virtual size should match disk size')
      assert.match(stdout, /cluster_size: 65536/, 'Cluster size should be 64k')

      console.log('✅ Metadata validation passed')
    } catch (err) {
      console.error('Error in metadata test:', err)
      throw err
    } finally {
      try {
        await fs.unlink(tmpFile)
      } catch (err) {
        console.error('Failed to clean up:', err)
      }
    }
  })

  it('should handle large disks', async () => {
    // Test with a larger disk (1GB)
    const NB_BLOCKS = 16384
    const RATIO = 3
    const disk = new MockDisk(
      NB_BLOCKS,
      Array.from({ length: NB_BLOCKS / RATIO }, (_, i) => i * RATIO)
    )
    const tmpFile = join(tmpdir(), `test-large-${Date.now()}.qcow2`)
    try {
      const stream = toQcow2Stream(disk)
      const file = await fs.open(tmpFile, 'w')
      await new Promise((resolve, reject) => {
        const writeStream = file.createWriteStream()
        stream.pipe(writeStream)
        writeStream.on('finish', () => resolve(undefined))
        writeStream.on('error', reject)
      })
      await file.close()
      const { stdout } = await execa('qemu-img', ['check', tmpFile])

      assert.match(stdout, /No errors were found/, 'Large file validation failed')
      console.log('✅ Large disk validation passed')
    } catch (err) {
      console.error('Error in large disk test:', err)
      process.exit()
      throw err
    } finally {
      try {
        await fs.unlink(tmpFile)
      } catch (err) {
        console.error('Failed to clean up large test file:', err)
      }
    }
  })
})
