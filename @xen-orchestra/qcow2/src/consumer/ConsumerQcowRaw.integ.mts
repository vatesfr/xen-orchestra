import { describe, it } from 'node:test'
import assert from 'node:assert'
import execa from 'execa'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type DiskBlock, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { ConsumerQcowRaw } from './ConsumerQcowRaw.mjs'
import { toQcow2Stream } from './ConsumerQcowStream.mjs'

const CLUSTER_SIZE = 64 * 1024
const QCOW2_MAGIC = 0x514649fb
const QCOW2_VERSION_OFFSET = 4
const QCOW2_L1_OFFSET_FIELD = 40

// ── Test fixture ──────────────────────────────────────────────────────────────

class MockDisk extends RandomAccessDisk {
  readonly #size: number
  readonly #blockIndexes: number[]

  constructor(nbBlocks: number, blockIndexes: number[], size = -1) {
    super()
    this.#size = size !== -1 ? size : nbBlocks * this.getBlockSize()
    this.#blockIndexes = blockIndexes
  }

  async readBlock(index: number): Promise<DiskBlock> {
    const remaining = this.#size - this.getBlockSize() * index
    return {
      index,
      data: Buffer.alloc(Math.min(remaining, this.getBlockSize()), index % 256),
    }
  }

  getVirtualSize(): number {
    return this.#size
  }
  getBlockSize(): number {
    return CLUSTER_SIZE
  }
  async init(): Promise<void> {}
  async close(): Promise<void> {}
  isDifferencing(): boolean {
    return false
  }
  getBlockIndexes(): number[] {
    return this.#blockIndexes
  }
  hasBlock(index: number): boolean {
    return this.#blockIndexes.includes(index)
  }
}

async function collectStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

const TEST_CASES = [
  { name: 'empty disk', nbBlocks: 128, blockIndexes: [] as number[] },
  { name: 'sparse disk', nbBlocks: 128, blockIndexes: [0, 34, 35, 67, 94] },
  { name: 'fully allocated disk', nbBlocks: 128, blockIndexes: Array.from({ length: 128 }, (_, i) => i) },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ConsumerQcowRaw', () => {
  /**
   * Core correctness: every byte produced by ConsumerQcowRaw.read() must
   * match what ConsumerQcowStream would stream for the same disk.
   */
  describe('full-file read is byte-for-byte identical to ConsumerQcowStream', () => {
    for (const { name, nbBlocks, blockIndexes } of TEST_CASES) {
      it(name, async () => {
        const streamDisk = new MockDisk(nbBlocks, blockIndexes)
        const rawDisk = new MockDisk(nbBlocks, blockIndexes)

        const expected = await collectStream(toQcow2Stream(streamDisk))

        const consumer = new ConsumerQcowRaw(rawDisk)
        await consumer.init()

        assert.strictEqual(consumer.totalSize, expected.length, `totalSize must equal stream length for "${name}"`)

        const actual = await consumer.read(0, consumer.totalSize)
        await consumer.close()

        assert.deepStrictEqual(actual, expected, `output must match ConsumerQcowStream for "${name}"`)
      })
    }
  })

  /**
   * Random-access correctness: arbitrary sub-ranges must match the
   * corresponding slice of the reference stream.
   */
  describe('partial reads return the correct slice of the virtual file', () => {
    it('reads the QCOW2 magic and version from the header', async () => {
      const disk = new MockDisk(16, [0, 5, 10])
      const consumer = new ConsumerQcowRaw(disk)
      await consumer.init()

      const header8 = await consumer.read(0, 8)
      await consumer.close()

      assert.strictEqual(header8.readUInt32BE(0), QCOW2_MAGIC, 'first 4 bytes must be the QCOW2 magic')
      assert.strictEqual(header8.readUInt32BE(QCOW2_VERSION_OFFSET), 2, 'version field must be 2')
    })

    it('reads the l1_table_offset field and it points past the refcount tables', async () => {
      const disk = new MockDisk(128, [0, 34, 35, 67, 94])
      const consumer = new ConsumerQcowRaw(disk)
      await consumer.init()

      const fieldBuf = await consumer.read(QCOW2_L1_OFFSET_FIELD, 8)
      const l1TableOffset = Number(fieldBuf.readBigUInt64BE(0))
      await consumer.close()

      // l1_table_offset must be a multiple of CLUSTER_SIZE and beyond the header
      assert.ok(l1TableOffset > CLUSTER_SIZE, 'l1_table_offset must be past the header cluster')
      assert.strictEqual(l1TableOffset % CLUSTER_SIZE, 0, 'l1_table_offset must be cluster-aligned')
    })

    it('cross-section reads match the reference stream', async () => {
      const blockIndexes = [0, 34, 35, 67, 94]
      const streamDisk = new MockDisk(128, blockIndexes)
      const rawDisk = new MockDisk(128, blockIndexes)

      const reference = await collectStream(toQcow2Stream(streamDisk))

      const consumer = new ConsumerQcowRaw(rawDisk)
      await consumer.init()

      // Reads that straddle section boundaries
      const ranges: Array<[start: number, length: number, label: string]> = [
        [CLUSTER_SIZE - 8, 16, 'header / refcount-L1 boundary'],
        [consumer.totalSize - 2 * CLUSTER_SIZE - 4, CLUSTER_SIZE + 8, 'two adjacent data clusters'],
        [consumer.totalSize - CLUSTER_SIZE - 1, 2, 'metadata-end / last-cluster boundary'],
      ]

      for (const [start, length, label] of ranges) {
        if (start < 0 || start + length > consumer.totalSize) continue
        const actual = await consumer.read(start, length)
        const expected = reference.subarray(start, start + length)
        assert.deepStrictEqual(actual, expected, `read must match reference at ${label}`)
      }

      await consumer.close()
    })

    it('reads within a data cluster return the correct block fill', async () => {
      const BLOCK_INDEX = 7
      const disk = new MockDisk(16, [BLOCK_INDEX])
      const consumer = new ConsumerQcowRaw(disk)
      await consumer.init()

      // Only one allocated block → its cluster is at the very end of the file
      const clusterOffset = consumer.totalSize - CLUSTER_SIZE
      const clusterData = await consumer.read(clusterOffset, CLUSTER_SIZE)
      await consumer.close()

      // MockDisk fills each block with (index % 256) repeated
      const expectedFill = BLOCK_INDEX % 256
      assert.ok(
        clusterData.every(byte => byte === expectedFill),
        `block ${BLOCK_INDEX} must be filled with 0x${expectedFill.toString(16)}`
      )
    })

    it('read of length 0 returns an empty buffer', async () => {
      const disk = new MockDisk(16, [0])
      const consumer = new ConsumerQcowRaw(disk)
      await consumer.init()
      const empty = await consumer.read(8, 0)
      await consumer.close()
      assert.strictEqual(empty.length, 0, 'zero-length read must return empty buffer')
    })
  })

  /**
   * End-to-end format validation: write the file produced by ConsumerQcowRaw
   * to disk and verify it with qemu-img.
   */
  describe('qemu-img validates the generated file', () => {
    for (const { name, nbBlocks, blockIndexes } of TEST_CASES) {
      it(name, async () => {
        const disk = new MockDisk(nbBlocks, blockIndexes)
        const consumer = new ConsumerQcowRaw(disk)
        await consumer.init()

        const tmpFile = join(tmpdir(), `test-qcow-raw-${Date.now()}-${name.replace(/\s+/g, '-')}.qcow2`)
        try {
          await fs.writeFile(tmpFile, await consumer.read(0, consumer.totalSize))
          await consumer.close()

          const { stderr, stdout } = await execa('qemu-img', ['check', tmpFile])
          assert.strictEqual(stderr, '', `qemu-img reported errors for "${name}"`)
          assert.match(stdout, /No errors were found/, `qemu-img validation failed for "${name}"`)
        } finally {
          await fs.unlink(tmpFile).catch(() => {})
        }
      })
    }
  })

  /**
   * Error handling: verify that calling read() before init() throws a
   * descriptive error rather than crashing silently.
   */
  describe('error handling', () => {
    it('read() before init() throws with a descriptive message', async () => {
      const disk = new MockDisk(16, [0])
      const consumer = new ConsumerQcowRaw(disk)

      await assert.rejects(
        () => consumer.read(0, 4),
        (err: Error) => {
          assert.ok(err.message.includes('init()'), `error message must mention init(), got: "${err.message}"`)
          return true
        }
      )
    })

    it('read() beyond totalSize throws with a descriptive message', async () => {
      const disk = new MockDisk(16, [0])
      const consumer = new ConsumerQcowRaw(disk)
      await consumer.init()

      await assert.rejects(
        () => consumer.read(consumer.totalSize - 1, 2),
        (err: Error) => {
          assert.ok(
            err.message.includes('exceeds file size'),
            `error message must mention 'exceeds file size', got: "${err.message}"`
          )
          return true
        }
      )
      await consumer.close()
    })
  })
})
