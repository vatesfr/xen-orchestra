import { DiskLargerBlock, DiskSmallerBlock, Disk, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import assert from 'node:assert'
import { Readable } from 'node:stream'

// QCOW2 constants based on specification:
// in ./docs/qcow2.rst

const REFCOUNT_BYTES = 2 // Size of a reference count entry (spec: refcount_bits=16 default)
const CLUSTER_SIZE = 64 * 1024 // Standard cluster size (must be power of 2 between 512 and 2M)
const L2_ADDRESS_ENTRY_SIZE = 8 // Size of L2 table entries (64 bits)

/**
 * Creates a buffer aligned to cluster size boundaries, initialized with a value
 * @param length Desired minimum length
 * @returns Buffer with length rounded up to nearest cluster size multiple
 */
function getAlignedBuffer(length: number): Buffer {
  const aligned = Math.ceil(length / CLUSTER_SIZE) * CLUSTER_SIZE
  return Buffer.alloc(aligned, 0)
}

/**
 * Extended Readable stream type that may include a length property
 */
type WithLength<T> = T & { length?: number }

/**
 * Generates a valid QCOW2 stream from a Disk.
 *
 */
export class QcowStreamGenerator {
  #disk: Disk
  #offset = 0

  /**
   * Creates a new QCOW2 stream generator
   * @param disk The disk to convert to QCOW2 format
   */
  constructor(disk: Disk) {
    if (disk.getBlockSize() < CLUSTER_SIZE) {
      if (disk.isDifferencing() && !(disk instanceof RandomAccessDisk)) {
        throw new Error(`Can't create differential disk with larger block without random access`)
      }
      this.#disk = new DiskLargerBlock(disk as RandomAccessDisk, CLUSTER_SIZE)
    } else if (disk.getBlockSize() > CLUSTER_SIZE) {
      this.#disk = new DiskSmallerBlock(disk, CLUSTER_SIZE)
    } else {
      this.#disk = disk
    }
    assert.strictEqual(this.#disk.getBlockSize(), CLUSTER_SIZE)
  }

  /**
   * Tracks the offset and yields the buffer
   * @param buffer Buffer to yield
   * @private
   */
  *#trackAndYield(buffer: Buffer): Generator<Buffer, void, unknown> {
    this.#offset += buffer.length
    yield buffer
  }

  /**
   * Computes the size and structure of the L1/L2 addressing tables
   * @returns Object containing total size and number of L1 entries
   * @private
   */
  #computeAddressingSpace(): { size: number; nbL1Entries: number } {
    const disk = this.#disk
    const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    const nbL2PerL1Entry = CLUSTER_SIZE / L2_ADDRESS_ENTRY_SIZE
    const nbL1Entries = Math.ceil(nbBlocks / nbL2PerL1Entry)

    // L1 table size (aligned to cluster size)
    let size = Math.ceil((nbL1Entries * 8) / CLUSTER_SIZE) * CLUSTER_SIZE

    // Add size for each L2 table that contains at least one allocated block
    for (let i = 0; i < nbL1Entries; i++) {
      for (let j = 0; j < nbL2PerL1Entry; j++) {
        const blockIndex = i * nbL2PerL1Entry + j
        if (blockIndex >= nbBlocks) {
          break // Last L2 table
        }
        if (disk.hasBlock(blockIndex)) {
          size += CLUSTER_SIZE // Each L2 table takes one cluster
          break // We only need to know if this L2 table has any blocks
        }
      }
    }

    return { size, nbL1Entries }
  }

  /**
   * Computes the size of the reference count tables
   * @param addressTableSize Total size of L1/L2 tables
   * @returns Object containing sizes for L1 and L2 refcount tables
   * @private
   *
   * Based on QCOW2 spec:
   * - The refcount table is a lookup table for refcount blocks
   * - Each entry in the refcount table points to a refcount block
   * - Each refcount block contains (cluster_size / refcount_entry_size) entries
   */
  #computeRefCountSize(addressTableSize: number): { refCountL1Size: number; refCountL2Size: number } {
    const disk = this.#disk
    const nbBlocks = disk.getBlockIndexes().length

    // Total clusters needed (header + addressing tables + data clusters)
    let nbAllocatedClusters = 1 /* header */ + addressTableSize / CLUSTER_SIZE + nbBlocks

    // Refcount structure parameters
    const refCountsPerL2Table = Math.floor(CLUSTER_SIZE / 8) // Each L2 refcount table entry is 8 bytes
    const refcountsPerCluster = Math.floor(CLUSTER_SIZE / REFCOUNT_BYTES) // Each refcount is 2 bytes

    // Initial calculation
    let nbClustersL2 = Math.ceil(nbAllocatedClusters / refcountsPerCluster)
    let nbClustersL1 = Math.ceil(nbClustersL2 / refCountsPerL2Table)

    // Iterative calculation since refcount tables themselves need refcounts
    while (true) {
      const newNbAllocatedClusters = nbAllocatedClusters + nbClustersL1 + nbClustersL2
      const newNbClustersL2 = Math.ceil(newNbAllocatedClusters / refcountsPerCluster)
      if (newNbClustersL2 > nbClustersL2) {
        nbClustersL2 = newNbClustersL2
        nbClustersL1 = Math.ceil(nbClustersL2 / refCountsPerL2Table)
      } else {
        break
      }
    }

    return {
      refCountL1Size: nbClustersL1 * CLUSTER_SIZE, // L1 refcount table size
      refCountL2Size: nbClustersL2 * CLUSTER_SIZE, // L2 refcount blocks size
    }
  }

  /**
   * Generates the reference count tables
   * @param nbClusters Total number of clusters that need refcounts
   * @private
   */
  *#yieldRefCounts(nbClusters: number): Generator<Buffer, void, unknown> {
    const refCountsPerCluster = Math.floor(CLUSTER_SIZE / REFCOUNT_BYTES)
    const nbRefCountClusters = Math.ceil(nbClusters / refCountsPerCluster)
    const refCountsPerL2 = Math.floor(CLUSTER_SIZE / 8)
    const nbL1Entries = Math.ceil(nbRefCountClusters / refCountsPerL2)

    // Generate L1 refcount table
    const l1Table = getAlignedBuffer(nbL1Entries * 8)
    let l2Offset = this.#offset + l1Table.length

    // Write L1 entries pointing to L2 tables
    for (let i = 0; i < nbRefCountClusters; i++) {
      l1Table.writeBigUint64BE(BigInt(l2Offset), i * 8)
      l2Offset += CLUSTER_SIZE
    }
    yield* this.#trackAndYield(l1Table)

    // Generate L2 refcount tables with initial refcount of 1
    let written = 0
    for (let i = 0; i < nbRefCountClusters; i++) {
      const l2Table = getAlignedBuffer(1)
      for (let j = 0; j < refCountsPerCluster; j++) {
        if (written >= nbClusters) break
        l2Table.writeUInt16BE(1, j * REFCOUNT_BYTES)
        written++
      }
      yield* this.#trackAndYield(l2Table)
    }
  }

  /**
   * Generates the L1/L2 addressing tables
   * @private
   *
   * Based on QCOW2 spec:
   * - L1 table contains offsets to L2 tables
   * - L2 tables contain offsets to data clusters
   * - The COPIED flag (bit 63) indicates the cluster is allocated
   */
  *#yieldAddressingTables(): Generator<Buffer, void, unknown> {
    const disk = this.#disk
    const QCOW_OFLAG_COPIED = 1n << 63n // Flag indicating cluster is allocated

    const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    const nbEntriesPerL2Table = CLUSTER_SIZE / 8
    const nbL1Entries = Math.ceil(nbBlocks / nbEntriesPerL2Table)

    // Generate L1 table
    const l1Table = getAlignedBuffer(nbL1Entries * 8)
    let l2Offset = this.#offset + l1Table.length

    // First pass: determine which L2 tables are needed
    for (let i = 0; i < nbL1Entries; i++) {
      for (let j = 0; j < nbEntriesPerL2Table; j++) {
        const blockIndex = i * nbEntriesPerL2Table + j
        if (blockIndex >= nbBlocks) {
          break // Last L2 table
        }
        if (disk.hasBlock(blockIndex)) {
          l1Table.writeBigUint64BE(BigInt(l2Offset) | QCOW_OFLAG_COPIED, i * 8)
          l2Offset += CLUSTER_SIZE
          break // We only need to know if this L2 table has any blocks
        }
      }
    }
    yield* this.#trackAndYield(l1Table)

    // Second pass: generate L2 tables
    let dataClusterOffset = l2Offset
    for (let i = 0; i < nbL1Entries; i++) {
      let l2Table: Buffer | undefined

      for (let j = 0; j < nbEntriesPerL2Table; j++) {
        const blockIndex = i * nbEntriesPerL2Table + j
        if (blockIndex >= nbBlocks) {
          break // Last L2 table
        }

        if (disk.hasBlock(blockIndex)) {
          if (l2Table === undefined) {
            l2Table = getAlignedBuffer(1) // One cluster per L2 table
          }
          // Write cluster offset with COPIED flag
          l2Table.writeBigUint64BE(BigInt(dataClusterOffset) | QCOW_OFLAG_COPIED, j * 8)
          dataClusterOffset += CLUSTER_SIZE
        }
      }

      if (l2Table !== undefined) {
        yield* this.#trackAndYield(l2Table)
      }
    }
  }

  /**
   * Creates a Readable stream from the generator
   * @returns Readable stream with optional length property
   */
  stream(): WithLength<Readable> {
    const disk = this.#disk
    const nbAllocatedBlocks = disk.getBlockIndexes().length
    const nbTotalBlock = disk.getVirtualSize() / disk.getBlockSize()

    // Compute table sizes
    const { size: addressTableSize, nbL1Entries } = this.#computeAddressingSpace()
    const { refCountL1Size, refCountL2Size } = this.#computeRefCountSize(addressTableSize)

    // Generate QCOW2 header (spec: The first cluster contains the file header)
    const header = getAlignedBuffer(1)
    header.writeUint32BE(0x514649fb, 0) // Magic ('QFI\xfb')
    header.writeUint32BE(2, 4) // Version 2
    header.writeBigUint64BE(0n, 8) // backing_file_offset (none)
    header.writeUInt32BE(0, 16) // backing_file_size (none)
    header.writeUInt32BE(Math.log2(CLUSTER_SIZE), 20) // cluster_bits
    header.writeBigUInt64BE(BigInt(disk.getVirtualSize()), 24) // size
    header.writeUInt32BE(0, 32) // crypt_method: none
    header.writeUInt32BE(nbL1Entries, 36) // l1_size
    header.writeBigUInt64BE(BigInt(header.length + refCountL1Size + refCountL2Size), 40) // l1_table_offset
    header.writeBigUInt64BE(BigInt(header.length), 48) // refcount_table_offset
    header.writeUInt32BE(refCountL1Size / CLUSTER_SIZE, 56) // refcount_table_clusters
    header.writeUInt32BE(0, 60) // nb_snapshots
    header.writeUInt32BE(0, 64) // snapshots_offset
    // Calculate total stream length
    const expectedStreamLength =
      header.length + refCountL1Size + refCountL2Size + addressTableSize + nbAllocatedBlocks * CLUSTER_SIZE

    const self = this
    async function* generator(): AsyncGenerator<Buffer, void, unknown> {
      // Yield all parts in order
      yield* self.#trackAndYield(header)
      assert.strictEqual(self.#offset, CLUSTER_SIZE, 'header aligned')
      yield* self.#yieldRefCounts(expectedStreamLength / CLUSTER_SIZE)
      assert.strictEqual(self.#offset, CLUSTER_SIZE + refCountL1Size + refCountL2Size, 'refcounts aligned')
      yield* self.#yieldAddressingTables()
      assert.strictEqual(
        self.#offset,
        CLUSTER_SIZE + refCountL1Size + refCountL2Size + addressTableSize,
        'addresses aligned'
      )

      // Yield data clusters
      let nbGeneratedBlock = 0
      let previous = -1
      for await (const { index, data } of disk.diskBlocks()) {
        if (index < previous) {
          throw new Error('Qcow can only be generated from sorted disk')
        }
        previous = index
        yield* self.#trackAndYield(data)
        nbGeneratedBlock++
      }

      assert.strictEqual(
        nbGeneratedBlock,
        nbAllocatedBlocks,
        `expected ${nbAllocatedBlocks}, yield ${nbGeneratedBlock}`
      )
      // Verify we generated the expected amount of data
      assert.strictEqual(self.#offset, expectedStreamLength, 'stream length')
    }
    const stream = Readable.from(generator(), {
      highWaterMark: 10 * 1024 * 1024,
      objectMode: false,
    }) as WithLength<Readable>
    stream.length = expectedStreamLength
    return stream
  }
}

/**
 * Creates a QCOW2 stream from a RandomAccessDisk
 * @param disk The disk to convert
 * @returns Readable stream of QCOW2 data
 */
export function toQcow2Stream(disk: Disk): Readable {
  const generator = new QcowStreamGenerator(disk)
  return generator.stream()
}
