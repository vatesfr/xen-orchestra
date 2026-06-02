import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'
import { QcowDisk } from './QcowDisk.mjs'
import { DiskBlock } from '@xen-orchestra/disk-transform'

// Minimal in-memory QcowDisk for testing
class InMemoryQcowDisk extends QcowDisk {
  #buffer: Buffer

  constructor(buffer: Buffer) {
    super()
    this.#buffer = buffer
  }

  async readBuffer(offset: number, length: number): Promise<Buffer> {
    return Buffer.from(this.#buffer.subarray(offset, offset + length))
  }

  async close(): Promise<void> {}
}

// Build a minimal valid QCOW2 buffer in memory from a list of blocks
function buildQcow2({
  clusterBits = 12,
  blocks,
}: {
  clusterBits?: number
  blocks: Array<{ index: number; fill: number }>
}): Buffer {
  const clusterSize = 1 << clusterBits
  const nbClusterPerL2Table = clusterSize / 8

  const maxIndex = blocks.length === 0 ? 0 : Math.max(...blocks.map(b => b.index))
  const nbVirtualClusters = maxIndex + 1
  const virtualSize = nbVirtualClusters * clusterSize
  const l1Size = Math.ceil(nbVirtualClusters / nbClusterPerL2Table)

  // Which L1 slots are used, in order
  const usedL1Slots = [...new Set(blocks.map(b => Math.floor(b.index / nbClusterPerL2Table)))].sort((a, b) => a - b)

  // Layout:
  //   cluster 0           : header
  //   cluster 1           : L1 table
  //   cluster 2 .. 2+n-1  : L2 tables (one per used L1 slot)
  //   remaining           : data clusters (one per block, sorted by index)
  const l2TableCluster = new Map<number, number>() // l1Slot -> cluster index
  usedL1Slots.forEach((l1Slot, i) => l2TableCluster.set(l1Slot, 2 + i))

  const firstDataCluster = 2 + usedL1Slots.length
  const sortedBlocks = blocks.slice().sort((a, b) => a.index - b.index)
  const blockCluster = new Map<number, number>() // block index -> cluster index
  sortedBlocks.forEach(({ index }, i) => blockCluster.set(index, firstDataCluster + i))

  const buf = Buffer.alloc((firstDataCluster + blocks.length) * clusterSize, 0)

  // Header
  const l1TableOffset = clusterSize
  buf.writeUInt32BE(0x514649fb, 0)
  buf.writeUInt32BE(3, 4)
  buf.writeBigUInt64BE(0n, 8)
  buf.writeUInt32BE(0, 16)
  buf.writeUInt32BE(clusterBits, 20)
  buf.writeBigUInt64BE(BigInt(virtualSize), 24)
  buf.writeUInt32BE(0, 32)
  buf.writeUInt32BE(l1Size, 36)
  buf.writeBigUInt64BE(BigInt(l1TableOffset), 40)
  buf.writeBigUInt64BE(0n, 48)
  buf.writeUInt32BE(0, 56)
  buf.writeUInt32BE(0, 60)
  buf.writeBigUInt64BE(0n, 64)
  buf.writeBigUInt64BE(0n, 72)
  buf.writeBigUInt64BE(0n, 80)
  buf.writeBigUInt64BE(0n, 88)
  buf.writeUInt32BE(4, 96)
  buf.writeUInt32BE(104, 100)

  // L1 table
  for (const [l1Slot, l2Cluster] of l2TableCluster) {
    buf.writeBigUInt64BE(BigInt(l2Cluster * clusterSize), l1TableOffset + l1Slot * 8)
  }

  // L2 tables and data clusters
  for (const block of blocks) {
    const l1Slot = Math.floor(block.index / nbClusterPerL2Table)
    const l2Slot = block.index % nbClusterPerL2Table
    const l2TableOffset = l2TableCluster.get(l1Slot)! * clusterSize
    const dataOffset = blockCluster.get(block.index)! * clusterSize

    buf.writeBigUInt64BE(BigInt(dataOffset), l2TableOffset + l2Slot * 8)
    buf.fill(block.fill, dataOffset, dataOffset + clusterSize)
  }

  return buf
}

describe('QcowDisk', { concurrency: 1 }, () => {
  test('readBlock throws if init has not been called', async () => {
    const disk = new InMemoryQcowDisk(Buffer.alloc(0))
    await assert.rejects(() => disk.readBlock(0), /init\(\) has not been called/)
  })

  test('hasBlock throws if init has not been called', async () => {
    const disk = new InMemoryQcowDisk(Buffer.alloc(0))
    assert.throws(() => disk.hasBlock(0), /init\(\) has not been called/)
  })

  test('init parses header correctly', async () => {
    const clusterBits = 12
    const clusterSize = 1 << clusterBits
    const buf = buildQcow2({ clusterBits, blocks: [{ index: 0, fill: 0xaa }] })

    const disk = new InMemoryQcowDisk(buf)
    await disk.init()

    assert.equal(disk.header.version, 3)
    assert.equal(disk.header.cluster_bits, clusterBits)
    assert.equal(disk.getBlockSize(), clusterSize)
  })

  test('hasBlock returns true for allocated blocks, false for unallocated', async () => {
    const buf = buildQcow2({
      blocks: [
        { index: 0, fill: 0xaa },
        { index: 1, fill: 0xbb },
        { index: 5, fill: 0xcc },
      ],
    })

    const disk = new InMemoryQcowDisk(buf)
    await disk.init()

    assert.equal(disk.hasBlock(0), true)
    assert.equal(disk.hasBlock(1), true)
    assert.equal(disk.hasBlock(5), true)
    assert.equal(disk.hasBlock(2), false)
    assert.equal(disk.hasBlock(3), false)
    assert.equal(disk.hasBlock(4), false)
    assert.equal(disk.hasBlock(100), false)
  })

  test('readBlock returns the correct data', async () => {
    const clusterBits = 12
    const clusterSize = 1 << clusterBits

    const buf = buildQcow2({
      clusterBits,
      blocks: [
        { index: 0, fill: 0xaa },
        { index: 5, fill: 0xcc },
      ],
    })

    const disk = new InMemoryQcowDisk(buf)
    await disk.init()

    const block0 = await disk.readBlock(0)
    assert.equal(block0.index, 0)
    assert.equal(block0.data.length, clusterSize)
    assert.ok(
      block0.data.every(b => b === 0xaa),
      'block 0 data should be 0xAA'
    )

    const block5 = await disk.readBlock(5)
    assert.equal(block5.index, 5)
    assert.ok(
      block5.data.every(b => b === 0xcc),
      'block 5 data should be 0xCC'
    )
  })

  test('readBlock throws for unallocated block', async () => {
    const buf = buildQcow2({ blocks: [{ index: 0, fill: 0xaa }] })

    const disk = new InMemoryQcowDisk(buf)
    await disk.init()

    await assert.rejects(() => disk.readBlock(1), /unallocated/)
  })

  test('getBlockIndexes returns all allocated block indexes', async () => {
    const buf = buildQcow2({
      blocks: [
        { index: 0, fill: 0xaa },
        { index: 1, fill: 0xbb },
        { index: 5, fill: 0xcc },
      ],
    })

    const disk = new InMemoryQcowDisk(buf)
    await disk.init()

    const indexes = disk.getBlockIndexes().sort((a, b) => a - b)
    assert.deepEqual(indexes, [0, 1, 5])
  })

  // Previous implementation inserted every cluster index into a JS Map during init().
  // With cluster_bits=16 (8192 entries per L2 table) and l1_size=2049, the disk has
  // 2049 * 8192 = 16,785,408 clusters — just above V8's 2^24 Map limit.
  //
  // The virtual readBuffer generates L1/L2 data on the fly, so no large buffer is needed.
  test('does not throw Map maximum size exceeded on large fully-allocated disk', async () => {
    const CLUSTER_BITS = 16
    const CLUSTER_SIZE = 1 << CLUSTER_BITS // 65536
    const NB_CLUSTER_PER_L2 = CLUSTER_SIZE / 8 // 8192
    const L1_SIZE = 2049 // 2049 * 8192 = 16,785,408 > 2^24
    const L1_TABLE_OFFSET = CLUSTER_SIZE
    const FAKE_L2_OFFSET = CLUSTER_SIZE * 2
    const VIRTUAL_SIZE = L1_SIZE * NB_CLUSTER_PER_L2 * CLUSTER_SIZE

    const headerBuf = Buffer.alloc(1024, 0)
    headerBuf.writeUInt32BE(0x514649fb, 0)
    headerBuf.writeUInt32BE(3, 4)
    headerBuf.writeBigUInt64BE(0n, 8)
    headerBuf.writeUInt32BE(0, 16)
    headerBuf.writeUInt32BE(CLUSTER_BITS, 20)
    headerBuf.writeBigUInt64BE(BigInt(VIRTUAL_SIZE), 24)
    headerBuf.writeUInt32BE(0, 32)
    headerBuf.writeUInt32BE(L1_SIZE, 36)
    headerBuf.writeBigUInt64BE(BigInt(L1_TABLE_OFFSET), 40)
    headerBuf.writeBigUInt64BE(0n, 48)
    headerBuf.writeUInt32BE(0, 56)
    headerBuf.writeUInt32BE(0, 60)
    headerBuf.writeBigUInt64BE(0n, 64)
    headerBuf.writeBigUInt64BE(0n, 72)
    headerBuf.writeBigUInt64BE(0n, 80)
    headerBuf.writeBigUInt64BE(0n, 88)
    headerBuf.writeUInt32BE(4, 96)
    headerBuf.writeUInt32BE(104, 100)

    const l1TableBuf = Buffer.alloc(L1_SIZE * 8, 0)
    for (let i = 0; i < L1_SIZE; i++) {
      l1TableBuf.writeBigUInt64BE(BigInt(FAKE_L2_OFFSET), i * 8)
    }

    class VirtualQcowDisk extends QcowDisk {
      async readBuffer(offset: number, length: number): Promise<Buffer> {
        if (offset === 0) return headerBuf.subarray(0, length)
        if (offset === L1_TABLE_OFFSET) return l1TableBuf.subarray(0, length)
        // L2 table: all entries non-zero (0x20 & 0x00ffffffffffe0n = 0x20 ≠ 0)
        return Buffer.alloc(length, 0x20)
      }
      async close(): Promise<void> {}
    }

    const disk = new VirtualQcowDisk()
    await assert.doesNotReject(() => disk.init(), 'init should not throw on a large disk')

    // Spot-check that blocks across different L1 slots are seen as allocated
    assert.equal(disk.hasBlock(0), true)
    assert.equal(disk.hasBlock(NB_CLUSTER_PER_L2), true) // first block in L1 slot 1
    assert.equal(disk.hasBlock(NB_CLUSTER_PER_L2 * 2), true) // first block in L1 slot 2
  })

  test('handles blocks spanning multiple L2 tables', async () => {
    const clusterBits = 12
    const nbClusterPerL2Table = (1 << clusterBits) / 8 // 512 with clusterBits=12

    // Place blocks at the boundary between L1 slot 0 and L1 slot 1
    const blocks = [
      { index: 0, fill: 0x11 }, // L1 slot 0, L2 slot 0
      { index: nbClusterPerL2Table - 1, fill: 0x22 }, // L1 slot 0, L2 slot 511
      { index: nbClusterPerL2Table, fill: 0x33 }, // L1 slot 1, L2 slot 0
      { index: nbClusterPerL2Table * 2 - 1, fill: 0x44 }, // L1 slot 1, L2 slot 511
    ]

    const buf = buildQcow2({ clusterBits, blocks })
    const disk = new InMemoryQcowDisk(buf)

    await assert.doesNotReject(() => disk.init(), 'init should not throw on multi-L2 table disk')

    for (const { index, fill } of blocks) {
      assert.equal(disk.hasBlock(index), true, `block ${index} should be allocated`)
      const block = await disk.readBlock(index)
      assert.ok(
        block.data.every(b => b === fill),
        `block ${index} data mismatch`
      )
    }

    // Blocks between the allocated ones should not be present
    assert.equal(disk.hasBlock(1), false)
    assert.equal(disk.hasBlock(nbClusterPerL2Table + 1), false)

    const indexes = disk.getBlockIndexes().sort((a, b) => a - b)
    assert.deepEqual(
      indexes,
      blocks.map(b => b.index).sort((a, b) => a - b)
    )
  })
})
