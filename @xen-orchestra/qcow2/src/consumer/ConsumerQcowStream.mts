import { DiskBlock, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import assert from 'node:assert'
import { Readable } from 'node:stream'
import fs from 'node:fs/promises'

const REFCOUNT_BYTES = 2 // the size of a reference count entries
const CLUSTER_SIZE = 64 * 1024
const L2_ADDRESS_ENTRY_SIZE = 8

function getAlignedBuffer(length: number, value: number = 0) {
  const aligned = Math.ceil(length / CLUSTER_SIZE) * CLUSTER_SIZE
  return Buffer.alloc(aligned, value)
}

type WithLength<T> = T & { length?: number }
export class QcowStreamGenerator {
  #disk: RandomAccessDisk
  #offset = 0
  #expectedStreamLength?: number
  constructor(disk: RandomAccessDisk) {
    this.#disk = disk
  }

  *#trackAndYield(buffer: Buffer) {
    this.#offset += buffer.length
    yield buffer
  }

  #computeAddressingSpace(): { size: number; nbL1Entries: number } {
    const disk = this.#disk
    const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    const nbL2PerL1Entry = CLUSTER_SIZE / L2_ADDRESS_ENTRY_SIZE
    const nbL1Entries = Math.ceil(nbBlocks / nbL2PerL1Entry)
    let size = Math.ceil((nbL1Entries * 8) / CLUSTER_SIZE) * CLUSTER_SIZE
    for (let i = 0; i < nbL1Entries; i++) {
      for (let j = 0; j < nbL2PerL1Entry; j++) {
        let blockIndex = i * nbL1Entries + j
        if (blockIndex >= nbBlocks) {
          // last l2 table
          break
        }
        if (disk.hasBlock(blockIndex)) {
          size += CLUSTER_SIZE
          break
        }
      }
    }
    return { size, nbL1Entries }
  }

  #computeRefCountSize(addressTableSize: number): { refCountL1Size: number; refCountL2Size: number } {
    const disk = this.#disk
    const nbBlocks = disk.getBlockIndexes().length
    // refcount count all the clusters including itself
    // from https://github.com/qemu/qemu/blob/a9cd5bc6399a80fcf233ed0fffe6067b731227d8/scripts/qcow2-to-stdout.py#L218
    // Now we have a problem because allocated_refcount_blocks and allocated_refcount_tables...
    // (a) increase total_allocated_clusters, and
    // (b) need to be recalculated when total_allocated_clusters is increased
    // So we need to repeat the calculation as long as the numbers change
    const nbAllocatedClusters = 1 /*header */ + addressTableSize / CLUSTER_SIZE + nbBlocks
    const refCountsPerL2Table = Math.floor(CLUSTER_SIZE / 8)
    const refcountsPerCluster = Math.floor(CLUSTER_SIZE / REFCOUNT_BYTES)
    let nbClustersL2 = Math.ceil(nbAllocatedClusters / refcountsPerCluster)
    let nbClustersL1 = Math.ceil(nbClustersL2 / refCountsPerL2Table)
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
    console.log({ nbClustersL1, nbClustersL2 })
    return { refCountL1Size: nbClustersL1 * CLUSTER_SIZE, refCountL2Size: nbClustersL2 * CLUSTER_SIZE }
  }

  *#yieldRefCounts(nbClusters: number) {
    const refCountsPerCluster = Math.floor(CLUSTER_SIZE / REFCOUNT_BYTES)
    const nbRefCountClusters = Math.ceil(nbClusters / refCountsPerCluster)
    const refCountsPerL2 = Math.floor(CLUSTER_SIZE / 8)
    const nbL1Entries = Math.ceil(nbRefCountClusters / refCountsPerL2)

    const l1Table = getAlignedBuffer(nbL1Entries * 8)
    let l2Offset = this.#offset + l1Table.length

    for (let i = 0; i < nbL1Entries; i++) {
      l1Table.writeBigUint64BE(BigInt(l2Offset), i * 8)
      l2Offset += CLUSTER_SIZE
    }
    yield* this.#trackAndYield(l1Table)

    let written = 0
    for (let i = 0; i < nbL1Entries; i++) {
      const l2Table = getAlignedBuffer(1)
      for (let j = 0; j < refCountsPerCluster; j++) {
        if (written >= nbClusters) break
        l2Table.writeUInt16BE(1, j * REFCOUNT_BYTES)
        written++
      }
      yield* this.#trackAndYield(l2Table)
    }
  }

  *#yieldAddressingTables() {
    const disk = this.#disk
    const QCOW_OFLAG_COPIED = 1n << 63n
    // first level contains the adress of the cluster containing the L2 corresponding table
    // seconde level contains the adresse
    const nbBlocks = Math.ceil(disk.getVirtualSize() / disk.getBlockSize())
    const nbEntriesPerL2Table = CLUSTER_SIZE / 8
    const nbL1Entries = Math.ceil(nbBlocks / nbEntriesPerL2Table)
    const l1Table = getAlignedBuffer(nbL1Entries * 8)
    let l2Offset = this.#offset + l1Table.length
    //first pass, check which L2 tables are instatiated
    for (let i = 0; i < nbL1Entries; i++) {
      for (let j = 0; j < nbEntriesPerL2Table; j++) {
        let blockIndex = i * nbL1Entries + j
        if (blockIndex >= nbBlocks) {
          // last l2 table
          break
        }
        if (disk.hasBlock(blockIndex)) {
          console.log({ l2Offset })
          l1Table.writeBigUint64BE(BigInt(l2Offset) | QCOW_OFLAG_COPIED, i * 8)
          l2Offset += CLUSTER_SIZE
          break // we only need to know if the L2 table contains at least one block
        }
      }
    }
    yield* this.#trackAndYield(l1Table)

    // now the L2 addressing tables
    let dataClusterOffset = l2Offset
    for (let i = 0; i < nbL1Entries; i++) {
      let l2Table: Buffer
      for (let j = 0; j < nbEntriesPerL2Table; j++) {
        let blockIndex = i * nbL1Entries + j
        if (blockIndex >= nbBlocks) {
          // last l2 table
          console.log('break', [blockIndex])
          break
        }
        if (disk.hasBlock(blockIndex)) {
          if (l2Table === undefined) {
            console.log('instantiate table')
            l2Table = getAlignedBuffer(1) // one cluster
          }
          l2Table.writeBigUint64BE(BigInt(dataClusterOffset) | QCOW_OFLAG_COPIED, j * 8)
          dataClusterOffset += CLUSTER_SIZE
        }
      }
      if (l2Table !== undefined) {
        console.log('yield table')
        yield* this.#trackAndYield(l2Table)
      }
    }
  }

  async *generator() {
    const disk = this.#disk
    const nbAllocatedBlocks = disk.getBlockIndexes().length
    const nbTotalBlock = disk.getVirtualSize() / disk.getBlockSize()
    const { size: addressTableSize, nbL1Entries } = this.#computeAddressingSpace()
    const { refCountL1Size, refCountL2Size } = this.#computeRefCountSize(addressTableSize)

    const header = getAlignedBuffer(1)
    header.writeUint32BE(0x514649fb, 0)
    header.writeUint32BE(2, 4) //version
    header.writeBigUint64BE(0n, 8) // backing_file_offset
    header.writeUInt32BE(0, 16) // backing_file_size
    header.writeUInt32BE(Math.log2(CLUSTER_SIZE), 20) // 64KB clusters
    header.writeBigUInt64BE(BigInt(disk.getVirtualSize()), 24)
    header.writeUInt32BE(0, 32) //crypt : none
    header.writeUInt32BE(nbL1Entries, 36) // number of entries in L1 addressing table
    header.writeBigUInt64BE(BigInt(header.length + refCountL1Size + refCountL2Size), 40) //l1 offset , after ref counts
    header.writeBigUInt64BE(BigInt(header.length), 48) //ref count offset
    header.writeUInt32BE(refCountL2Size / CLUSTER_SIZE, 56) //ref count size in clusters
    header.writeUInt32BE(0, 60) //nb_snapshots
    header.writeUInt32BE(0, 64) //snapshots_offset

    this.#expectedStreamLength =
      header.length + refCountL1Size + refCountL2Size + addressTableSize + nbAllocatedBlocks * CLUSTER_SIZE
    yield* this.#trackAndYield(header)
    yield* this.#yieldRefCounts(this.#expectedStreamLength / CLUSTER_SIZE)
    yield* this.#yieldAddressingTables()
    for (let i = 0; i < nbTotalBlock; i++) {
      if (disk.hasBlock(i)) {
        const { data } = await disk.readBlock(i)
        yield* this.#trackAndYield(data)
      }
    }
    assert.strictEqual(this.#offset, this.#expectedStreamLength)
  }

  stream(): WithLength<Readable> {
    const stream = Readable.from(this.generator(), {
      highWaterMark: 10 * 1024 * 1024,
      objectMode: false,
    }) as WithLength<Readable>
    stream.length = this.#expectedStreamLength
    return stream
  }
}

export function toQcow2Stream(disk: RandomAccessDisk): Readable {
  const generator = new QcowStreamGenerator(disk)
  return generator.stream()
}

class MockDisk extends RandomAccessDisk {
  #size: number
  #blockIndex: Array<number>
  constructor(nbBlocks: number, blockIndex: Array<number>) {
    super()
    this.#size = nbBlocks * this.getBlockSize()
    this.#blockIndex = blockIndex
  }
  async readBlock(index: number): Promise<DiskBlock> {
    return {
      index,
      data: Buffer.alloc(this.getBlockSize(), index % 256),
    }
  }
  getVirtualSize(): number {
    return this.#size
  }
  getBlockSize(): number {
    return 64 * 1024
  }
  async init(): Promise<void> {}
  async close(): Promise<void> {}
  isDifferencing(): boolean {
    return false
  }
  getBlockIndexes(): Array<number> {
    return this.#blockIndex
  }
  hasBlock(index: number): boolean {
    return this.#blockIndex.includes(index)
  }
}

const disk = new MockDisk(128, [0, 34, 35, 67, 94])

await fs.writeFile('/tmp/file.qcow2', toQcow2Stream(disk))
