import { DiskLargerBlock, DiskSmallerBlock, Disk, RandomAccessDisk, DiskBlock } from '@xen-orchestra/disk-transform'
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
  #nbAllocatedBlocks = 0

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
    this.#nbAllocatedBlocks = this.#disk.getBlockIndexesCount()
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
   * Scans every block index once, building a per-block presence bitmap and a per-L2-group
   * "has any allocated block" summary, so the rest of the generator never needs to call
   * `disk.hasBlock()` again. Yields back to the event loop periodically (time-budgeted, not a
   * fixed count) so a huge virtual disk doesn't block Node for seconds at a stretch — this was
   * previously done as three separate synchronous full scans (one per caller below), each one
   * capable of blocking the event loop on its own.
   * @private
   */
  async #buildBlockPresenceIndex(): Promise<{
    bitmap: Uint8Array
    groupHasData: Uint8Array
    nbBlocks: number
    nbL1Entries: number
  }> {
    const disk = this.#disk
    const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    const nbL2PerL1Entry = CLUSTER_SIZE / L2_ADDRESS_ENTRY_SIZE
    const nbL1Entries = Math.ceil(nbBlocks / nbL2PerL1Entry)

    const bitmap = new Uint8Array(Math.ceil(nbBlocks / 8))
    const groupHasData = new Uint8Array(nbL1Entries)

    let lastYield = process.hrtime.bigint()
    for (let i = 0; i < nbBlocks; i++) {
      if (disk.hasBlock(i)) {
        bitmap[i >> 3] |= 1 << (i & 7)
        groupHasData[Math.floor(i / nbL2PerL1Entry)] = 1
      }
      // check the clock every 65536 blocks: cheap enough to not affect throughput, frequent
      // enough to keep a single stretch of synchronous work under ~15ms
      if ((i & 0xffff) === 0) {
        const now = process.hrtime.bigint()
        if (Number(now - lastYield) / 1e6 > 15) {
          await new Promise(resolve => setImmediate(resolve))
          lastYield = process.hrtime.bigint()
        }
      }
    }

    return { bitmap, groupHasData, nbBlocks, nbL1Entries }
  }

  /**
   * Computes the size and structure of the L1/L2 addressing tables
   * @param groupHasData Per-L2-group "has any allocated block" summary from #buildBlockPresenceIndex
   * @param nbL1Entries Number of L1 entries (= number of possible L2 groups)
   * @returns Object containing total size
   * @private
   */
  #computeAddressingSpace(groupHasData: Uint8Array, nbL1Entries: number): { size: number } {
    // L1 table size (aligned to cluster size)
    let size = Math.ceil((nbL1Entries * 8) / CLUSTER_SIZE) * CLUSTER_SIZE

    // Add size for each L2 table that contains at least one allocated block. Just reading the
    // precomputed summary — no more per-block hasBlock() calls, so this stays fast regardless
    // of virtual disk size.
    for (let i = 0; i < nbL1Entries; i++) {
      if (groupHasData[i]) {
        size += CLUSTER_SIZE // Each L2 table takes one cluster
      }
    }

    return { size }
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
    const nbBlocks = this.#nbAllocatedBlocks

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
   * Generates the L1/L2 addressing tables from the precomputed presence bitmap/summary — no
   * more per-block hasBlock() scanning here, pass 2's inner loop only ever runs for groups
   * that #buildBlockPresenceIndex already found to have data.
   * @param bitmap Per-block presence bitmap from #buildBlockPresenceIndex
   * @param groupHasData Per-L2-group "has any allocated block" summary from #buildBlockPresenceIndex
   * @param nbBlocks Total number of blocks in the virtual disk
   * @param nbL1Entries Number of L1 entries
   * @private
   *
   * Based on QCOW2 spec:
   * - L1 table contains offsets to L2 tables
   * - L2 tables contain offsets to data clusters
   * - The COPIED flag (bit 63) indicates the cluster is allocated
   */
  *#yieldAddressingTables(
    bitmap: Uint8Array,
    groupHasData: Uint8Array,
    nbBlocks: number,
    nbL1Entries: number
  ): Generator<Buffer, void, unknown> {
    const QCOW_OFLAG_COPIED = 1n << 63n // Flag indicating cluster is allocated
    const nbEntriesPerL2Table = CLUSTER_SIZE / 8
    const hasBlock = (index: number) => (bitmap[index >> 3] & (1 << (index & 7))) !== 0

    // Generate L1 table
    const l1Table = getAlignedBuffer(nbL1Entries * 8)
    let l2Offset = this.#offset + l1Table.length

    // First pass: determine which L2 tables are needed
    for (let i = 0; i < nbL1Entries; i++) {
      if (groupHasData[i]) {
        l1Table.writeBigUint64BE(BigInt(l2Offset) | QCOW_OFLAG_COPIED, i * 8)
        l2Offset += CLUSTER_SIZE
      }
    }
    yield* this.#trackAndYield(l1Table)

    // Second pass: generate L2 tables — only visits groups already known to have data
    let dataClusterOffset = l2Offset
    for (let i = 0; i < nbL1Entries; i++) {
      if (!groupHasData[i]) {
        continue
      }
      const l2Table = getAlignedBuffer(1) // One cluster per L2 table

      for (let j = 0; j < nbEntriesPerL2Table; j++) {
        const blockIndex = i * nbEntriesPerL2Table + j
        if (blockIndex >= nbBlocks) {
          break // Last L2 table
        }

        if (hasBlock(blockIndex)) {
          // Write cluster offset with COPIED flag
          l2Table.writeBigUint64BE(BigInt(dataClusterOffset) | QCOW_OFLAG_COPIED, j * 8)
          dataClusterOffset += CLUSTER_SIZE
        }
      }

      yield* this.#trackAndYield(l2Table)
    }
  }

  /**
   * Creates a Readable stream from the generator
   * @param signal Optional AbortSignal to cancel the stream
   * @returns Readable stream with optional length property
   */
  async stream(signal?: AbortSignal): Promise<WithLength<Readable>> {
    const disk = this.#disk
    const nbAllocatedBlocks = this.#nbAllocatedBlocks
    const nbTotalBlock = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    // Single cooperative pass over every block: builds the presence bitmap/summary reused by
    // both the size computation below and the addressing tables generated inside the stream.
    const { bitmap, groupHasData, nbBlocks, nbL1Entries } = await this.#buildBlockPresenceIndex()
    // Compute table sizes
    const { size: addressTableSize } = this.#computeAddressingSpace(groupHasData, nbL1Entries)
    const { refCountL1Size, refCountL2Size } = this.#computeRefCountSize(addressTableSize)

    // Generate QCOW2 header (spec: The first cluster contains the file header)
    const header = getAlignedBuffer(1)
    header.writeUint32BE(0x514649fb, 0) // Magic ('QFI\xfb')
    header.writeUint32BE(2, 4) // Version 2
    header.writeBigUint64BE(0n, 8) // backing_file_offset (none)
    header.writeUInt32BE(0, 16) // backing_file_size (none)
    header.writeUInt32BE(Math.log2(CLUSTER_SIZE), 20) // cluster_bits
    header.writeBigUInt64BE(BigInt(nbTotalBlock * disk.getBlockSize()), 24) //aligned size
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
      signal?.throwIfAborted()
      yield* self.#trackAndYield(header)
      assert.strictEqual(self.#offset, CLUSTER_SIZE, 'header aligned')
      yield* self.#yieldRefCounts(expectedStreamLength / CLUSTER_SIZE)
      assert.strictEqual(self.#offset, CLUSTER_SIZE + refCountL1Size + refCountL2Size, 'refcounts aligned')
      yield* self.#yieldAddressingTables(bitmap, groupHasData, nbBlocks, nbL1Entries)
      assert.strictEqual(
        self.#offset,
        CLUSTER_SIZE + refCountL1Size + refCountL2Size + addressTableSize,
        'addresses aligned'
      )

      // Yield data clusters
      let nbGeneratedBlock = 0
      let previous = -1

      let truncatedBlock: DiskBlock | null = null
      for await (const { index, data } of disk.diskBlocks()) {
        signal?.throwIfAborted()
        if (index < previous) {
          throw new Error('Qcow can only be generated from sorted disk')
        }
        previous = index
        if (truncatedBlock !== null) {
          throw new Error(
            `Expecting a ${disk.getBlockSize()} bytes block, got a ${truncatedBlock.data.length}, for index ${truncatedBlock.index}`
          )
        }
        if (data.length < disk.getBlockSize()) {
          truncatedBlock = { data, index }
        }
        yield* self.#trackAndYield(Buffer.concat([data], disk.getBlockSize()))
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
 * @param options Optional options
 * @param options.signal Optional AbortSignal to cancel the stream
 * @returns Readable stream of QCOW2 data
 */
export async function toQcow2Stream(disk: Disk, { signal }: { signal?: AbortSignal } = {}): Promise<Readable> {
  const generator = new QcowStreamGenerator(disk)
  return await generator.stream(signal)
}
