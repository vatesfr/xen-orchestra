import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import assert from 'node:assert'
import { BlockEntry, CLUSTER_SIZE, QcowLayout } from './QcowLayout.mjs'

/**
 * Presents a virtual QCOW2 file generated from a RandomAccessDisk,
 * supporting random reads at any byte position.
 *
 * The source disk is treated as completely immutable: init() pre-computes
 * all QCOW2 metadata (header, refcount tables, L1/L2 address tables) into
 * a single in-memory buffer, and data clusters are fetched on demand via
 * readBlock().
 *
 * Virtual file layout (identical to ConsumerQcowStream output):
 *   [0,              CLUSTER_SIZE)               header cluster
 *   [+CLUSTER_SIZE,  +refCountL1Size)             refcount table (L1)
 *   [+refCountL1,    +refCountL2Size)             refcount blocks (L2)
 *   [+refCountL2,    +addressTableSize)           L1 + L2 address tables
 *   [metadata end,   +nbAllocatedBlocks*CS)       data clusters (sorted by index)
 */
// TODO: implement Disposable pattern once AsyncDisposable reaches Node.js LTS
// (see guidelines.md § Resource Management)
export class ConsumerQcowRaw extends QcowLayout {
  #metadata: Buffer | null = null
  #metadataSize = 0
  #totalSize = 0
  // Sorted ascending by fileOffset, one entry per allocated block
  #sortedBlocks: BlockEntry[] = []

  constructor(disk: RandomAccessDisk) {
    super(disk)
  }

  /** Total byte length of the virtual QCOW2 file (available after init()). */
  get totalSize(): number {
    return this.#totalSize
  }

  async init(): Promise<void> {
    await this.disk.init()

    const { size: addressTableSize, nbL1Entries } = this._computeAddressingSpace()
    const { refCountL1Size, refCountL2Size } = this._computeRefCountSize(addressTableSize)

    const metadataSize = CLUSTER_SIZE + refCountL1Size + refCountL2Size + addressTableSize
    const nbAllocatedBlocks = this.disk.getBlockIndexes().length
    const totalSize = metadataSize + nbAllocatedBlocks * CLUSTER_SIZE
    const l1TableOffset = CLUSTER_SIZE + refCountL1Size + refCountL2Size

    const header = this._buildHeader(nbL1Entries, refCountL1Size, refCountL2Size)
    const refCountTables = this._buildRefCountTables(refCountL1Size, refCountL2Size, totalSize / CLUSTER_SIZE)
    const { buffer: addressTables, sortedBlocks } = this._buildAddressingTables(l1TableOffset, metadataSize)

    this.#metadata = Buffer.concat([header, refCountTables, addressTables])
    this.#metadataSize = metadataSize
    this.#totalSize = totalSize
    this.#sortedBlocks = sortedBlocks

    assert.strictEqual(this.#metadata.length, metadataSize, 'metadata size mismatch')
  }

  /**
   * Reads `length` bytes starting at byte position `start` in the virtual
   * QCOW2 file.  Regions that are unallocated in the source disk are zeros.
   */
  async read(start: number, length: number): Promise<Buffer> {
    assert.ok(this.#metadata !== null, 'ConsumerQcowRaw: call init() before read()')
    assert.ok(start >= 0, `ConsumerQcowRaw: start must be non-negative, got ${start}`)
    assert.ok(length >= 0, `ConsumerQcowRaw: length must be non-negative, got ${length}`)
    assert.ok(
      start + length <= this.#totalSize,
      `ConsumerQcowRaw: range [${start}, ${start + length}) exceeds file size ${this.#totalSize}`
    )

    const result = Buffer.alloc(length, 0)
    const end = start + length

    this.#copyFromMetadata(result, start, end)
    await this.#copyFromDataClusters(result, start, end)

    return result
  }

  #copyFromMetadata(result: Buffer, start: number, end: number): void {
    if (start >= this.#metadataSize) return
    const copyEnd = Math.min(end, this.#metadataSize)
    this.#metadata!.copy(result, 0, start, copyEnd)
  }

  async #copyFromDataClusters(result: Buffer, start: number, end: number): Promise<void> {
    if (end <= this.#metadataSize) return

    const dataStart = Math.max(start, this.#metadataSize)
    const blocks = this.#sortedBlocks

    // Binary search for the first block that overlaps [dataStart, end)
    let lo = 0
    let hi = blocks.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (blocks[mid].fileOffset + CLUSTER_SIZE <= dataStart) {
        lo = mid + 1
      } else {
        hi = mid
      }
    }

    for (let k = lo; k < blocks.length; k++) {
      const { blockIndex, fileOffset } = blocks[k]
      if (fileOffset >= end) break

      const overlapStart = Math.max(dataStart, fileOffset)
      const overlapEnd = Math.min(end, fileOffset + CLUSTER_SIZE)
      const offsetInBlock = overlapStart - fileOffset
      const offsetInResult = overlapStart - start
      const copyLength = overlapEnd - overlapStart

      // DiskLargerBlock extends RandomAccessDisk; DiskSmallerBlock implements
      // readBlock() for RandomAccessDisk sources — both are safe to cast.
      const { data } = await (this.disk as unknown as RandomAccessDisk).readBlock(blockIndex)
      data.copy(result, offsetInResult, offsetInBlock, offsetInBlock + copyLength)
    }
  }

  async close(): Promise<void> {
    await this.disk.close()
  }
}
