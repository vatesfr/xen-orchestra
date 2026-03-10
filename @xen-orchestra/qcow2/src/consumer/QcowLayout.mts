import { Disk, DiskLargerBlock, DiskSmallerBlock, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import assert from 'node:assert'

export const CLUSTER_SIZE = 64 * 1024
export const L2_ADDRESS_ENTRY_SIZE = 8
export const REFCOUNT_BYTES = 2
export const QCOW_OFLAG_COPIED = 1n << 63n

export type BlockEntry = { blockIndex: number; fileOffset: number }

export function getAlignedBuffer(length: number): Buffer {
  return Buffer.alloc(Math.ceil(length / CLUSTER_SIZE) * CLUSTER_SIZE, 0)
}

/**
 * Abstract base class shared by QcowStreamGenerator and ConsumerQcowRaw.
 *
 * Owns the normalized disk and provides protected methods that compute QCOW2
 * layout sizes and build each metadata section as a Buffer, independent of
 * whether the caller will stream or assemble them.
 */
export abstract class QcowLayout {
  readonly #disk: Disk

  constructor(disk: Disk) {
    if (disk.getBlockSize() < CLUSTER_SIZE) {
      if (disk.isDifferencing() && !(disk instanceof RandomAccessDisk)) {
        const err = new Error(`Can't create differential disk with larger block without random access`)
        ;(err as NodeJS.ErrnoException).code = 'ERR_QCOW_RANDOM_ACCESS_REQUIRED'
        throw err
      }
      this.#disk = new DiskLargerBlock(disk as RandomAccessDisk, CLUSTER_SIZE)
    } else if (disk.getBlockSize() > CLUSTER_SIZE) {
      this.#disk = new DiskSmallerBlock(disk, CLUSTER_SIZE)
    } else {
      this.#disk = disk
    }
    assert.strictEqual(this.#disk.getBlockSize(), CLUSTER_SIZE)
  }

  protected get disk(): Disk {
    return this.#disk
  }

  // ── Size computation ────────────────────────────────────────────────────────

  /**
   * Returns the total byte size of the L1 + L2 address table section and the
   * number of L1 entries.
   */
  protected _computeAddressingSpace(): { size: number; nbL1Entries: number } {
    const disk = this.#disk
    const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    const nbL2PerL1Entry = CLUSTER_SIZE / L2_ADDRESS_ENTRY_SIZE
    const nbL1Entries = Math.ceil(nbBlocks / nbL2PerL1Entry)

    // L1 table (cluster-aligned) + one cluster per L2 table that has blocks
    let size = Math.ceil((nbL1Entries * 8) / CLUSTER_SIZE) * CLUSTER_SIZE
    for (let i = 0; i < nbL1Entries; i++) {
      for (let j = 0; j < nbL2PerL1Entry; j++) {
        const blockIndex = i * nbL2PerL1Entry + j
        if (blockIndex >= nbBlocks) break
        if (disk.hasBlock(blockIndex)) {
          size += CLUSTER_SIZE
          break
        }
      }
    }
    return { size, nbL1Entries }
  }

  /**
   * Returns the cluster-aligned sizes of the refcount L1 table and L2 blocks.
   * Uses an iterative calculation because the refcount tables themselves need
   * refcount entries.
   */
  protected _computeRefCountSize(addressTableSize: number): { refCountL1Size: number; refCountL2Size: number } {
    const nbAllocatedBlocks = this.#disk.getBlockIndexes().length
    const refCountsPerL2Table = Math.floor(CLUSTER_SIZE / 8)
    const refcountsPerCluster = Math.floor(CLUSTER_SIZE / REFCOUNT_BYTES)

    let nbAllocatedClusters = 1 /* header */ + addressTableSize / CLUSTER_SIZE + nbAllocatedBlocks
    let nbClustersL2 = Math.ceil(nbAllocatedClusters / refcountsPerCluster)
    let nbClustersL1 = Math.ceil(nbClustersL2 / refCountsPerL2Table)

    while (true) {
      const newTotal = nbAllocatedClusters + nbClustersL1 + nbClustersL2
      const newL2 = Math.ceil(newTotal / refcountsPerCluster)
      if (newL2 > nbClustersL2) {
        nbClustersL2 = newL2
        nbClustersL1 = Math.ceil(nbClustersL2 / refCountsPerL2Table)
      } else {
        break
      }
    }

    return {
      refCountL1Size: nbClustersL1 * CLUSTER_SIZE,
      refCountL2Size: nbClustersL2 * CLUSTER_SIZE,
    }
  }

  // ── Buffer builders ─────────────────────────────────────────────────────────

  /**
   * Builds the QCOW2 header cluster (always exactly CLUSTER_SIZE bytes).
   */
  protected _buildHeader(nbL1Entries: number, refCountL1Size: number, refCountL2Size: number): Buffer {
    const disk = this.#disk
    const nbTotalBlock = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    const l1TableOffset = CLUSTER_SIZE + refCountL1Size + refCountL2Size

    const header = getAlignedBuffer(1)
    header.writeUInt32BE(0x514649fb, 0) // magic ('QFI\xfb')
    header.writeUInt32BE(2, 4) // version 2
    header.writeBigUInt64BE(0n, 8) // backing_file_offset (none)
    header.writeUInt32BE(0, 16) // backing_file_size
    header.writeUInt32BE(Math.log2(CLUSTER_SIZE), 20) // cluster_bits
    header.writeBigUInt64BE(BigInt(nbTotalBlock * disk.getBlockSize()), 24) // size (aligned)
    header.writeUInt32BE(0, 32) // crypt_method: none
    header.writeUInt32BE(nbL1Entries, 36) // l1_size
    header.writeBigUInt64BE(BigInt(l1TableOffset), 40) // l1_table_offset
    header.writeBigUInt64BE(BigInt(CLUSTER_SIZE), 48) // refcount_table_offset
    header.writeUInt32BE(refCountL1Size / CLUSTER_SIZE, 56) // refcount_table_clusters
    header.writeUInt32BE(0, 60) // nb_snapshots
    header.writeBigUInt64BE(0n, 64) // snapshots_offset
    return header
  }

  /**
   * Builds the refcount L1 table and all refcount L2 blocks as a single
   * contiguous buffer of size refCountL1Size + refCountL2Size.
   *
   * The refcount section always starts immediately after the header
   * (absolute offset = CLUSTER_SIZE), so L2 block absolute addresses are
   * computed as CLUSTER_SIZE + refCountL1Size + i * CLUSTER_SIZE.
   *
   * @param totalClusters  Total clusters in the virtual file (totalSize / CLUSTER_SIZE)
   */
  protected _buildRefCountTables(refCountL1Size: number, refCountL2Size: number, totalClusters: number): Buffer {
    const nbClustersL2 = refCountL2Size / CLUSTER_SIZE
    const refcountsPerCluster = Math.floor(CLUSTER_SIZE / REFCOUNT_BYTES)
    const refCountL2StartAbs = CLUSTER_SIZE + refCountL1Size

    const buf = Buffer.alloc(refCountL1Size + refCountL2Size, 0)

    // L1 table: entry i → absolute offset of the i-th L2 block
    for (let i = 0; i < nbClustersL2; i++) {
      buf.writeBigUInt64BE(BigInt(refCountL2StartAbs + i * CLUSTER_SIZE), i * 8)
    }

    // L2 blocks: refcount = 1 for every allocated cluster
    let written = 0
    for (let i = 0; i < nbClustersL2 && written < totalClusters; i++) {
      const blockBase = refCountL1Size + i * CLUSTER_SIZE
      for (let j = 0; j < refcountsPerCluster && written < totalClusters; j++) {
        buf.writeUInt16BE(1, blockBase + j * REFCOUNT_BYTES)
        written++
      }
    }

    return buf
  }

  /**
   * Builds the L1 + L2 address tables as a single contiguous buffer and
   * returns the sorted list of allocated block entries (ascending file offset).
   *
   * @param l1TableOffset   Absolute offset of the L1 table in the virtual file
   * @param dataClusterStart  Absolute offset where data clusters begin
   */
  protected _buildAddressingTables(
    l1TableOffset: number,
    dataClusterStart: number
  ): { buffer: Buffer; sortedBlocks: BlockEntry[] } {
    const disk = this.#disk
    const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    const nbL2PerL1Entry = CLUSTER_SIZE / L2_ADDRESS_ENTRY_SIZE
    const nbL1Entries = Math.ceil(nbBlocks / nbL2PerL1Entry)
    const l1TableSize = Math.ceil((nbL1Entries * 8) / CLUSTER_SIZE) * CLUSTER_SIZE

    // Count how many L2 tables are needed to size the buffer upfront
    let nbL2Tables = 0
    for (let i = 0; i < nbL1Entries; i++) {
      for (let j = 0; j < nbL2PerL1Entry; j++) {
        const blockIndex = i * nbL2PerL1Entry + j
        if (blockIndex >= nbBlocks) break
        if (disk.hasBlock(blockIndex)) {
          nbL2Tables++
          break
        }
      }
    }

    const buf = Buffer.alloc(l1TableSize + nbL2Tables * CLUSTER_SIZE, 0)

    // First pass: write L1 entries with offsets to their L2 tables
    let nextL2Abs = l1TableOffset + l1TableSize
    for (let i = 0; i < nbL1Entries; i++) {
      let hasAny = false
      for (let j = 0; j < nbL2PerL1Entry; j++) {
        const blockIndex = i * nbL2PerL1Entry + j
        if (blockIndex >= nbBlocks) break
        if (disk.hasBlock(blockIndex)) {
          hasAny = true
          break
        }
      }
      if (hasAny) {
        buf.writeBigUInt64BE(BigInt(nextL2Abs) | QCOW_OFLAG_COPIED, i * 8)
        nextL2Abs += CLUSTER_SIZE
      }
    }

    // Second pass: fill L2 tables and record data cluster positions
    let dataOffset = dataClusterStart
    let l2RelOffset = l1TableSize // position within buf
    const sortedBlocks: BlockEntry[] = []

    for (let i = 0; i < nbL1Entries; i++) {
      let l2InBuf: number | undefined

      for (let j = 0; j < nbL2PerL1Entry; j++) {
        const blockIndex = i * nbL2PerL1Entry + j
        if (blockIndex >= nbBlocks) break
        if (disk.hasBlock(blockIndex)) {
          if (l2InBuf === undefined) {
            l2InBuf = l2RelOffset
            l2RelOffset += CLUSTER_SIZE
          }
          buf.writeBigUInt64BE(BigInt(dataOffset) | QCOW_OFLAG_COPIED, l2InBuf + j * 8)
          sortedBlocks.push({ blockIndex, fileOffset: dataOffset })
          dataOffset += CLUSTER_SIZE
        }
      }
    }

    return { buffer: buf, sortedBlocks }
  }
}
