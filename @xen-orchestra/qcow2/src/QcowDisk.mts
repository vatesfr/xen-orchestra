import { Disk, DiskBlock, RandomAccessDisk  } from '@xen-orchestra/disk-transform'
 
import assert from 'node:assert' 

interface Qcow2Header {
  magic: number
  version: number
  backing_file_offset: bigint
  backing_file_size: number
  cluster_bits: number
  size: bigint
  crypt_method: number
  l1_size: number
  l1_table_offset: bigint
  refcount_table_offset: bigint
  refcount_table_clusters: number
  nb_snapshots: number
  snapshots_offset: bigint
}

export abstract class QcowDisk extends RandomAccessDisk {
  #qcowHeader: Qcow2Header | undefined
  // in qcow land, the data are stored in clusters
  #dataClustersIndex = new Map<number, number>()

  get dataClustersIndex(): Map<number, number> {
    return this.#dataClustersIndex
  }

  get header(): Qcow2Header {
    if (this.#qcowHeader === undefined) {
      throw new Error('Call Init before reading the header')
    }
    return this.#qcowHeader
  }
  getVirtualSize(): number {
    const size = this.header.size
    assert.ok(size < Number.MAX_SAFE_INTEGER)
    return Number(size)
  }
  getBlockSize(): number {
    const clusterSize = 1 << this.header.cluster_bits
    return clusterSize
  }

  isDifferencing(): boolean {
    return this.header.backing_file_offset !== 0n
  }

  abstract readBuffer(offset: number, length: number): Promise<Buffer>


  async readBlock(index: number): Promise<DiskBlock> {
    const offset = this.dataClustersIndex.get(index)
    if(offset === undefined){
        throw new Error(`Can't read unallocated block, index:${index}`)
    }
    const data = await this.readBuffer(offset, this.getBlockSize())
    return {
        index,
        data
    }
  }
  
  async init(): Promise<void> {
    const buffer = await this.readBuffer(0, 1024)
    this.#qcowHeader = {
      magic: buffer.readUInt32BE(0),
      version: buffer.readUInt32BE(4),
      backing_file_offset: buffer.readBigUInt64BE(8),
      backing_file_size: buffer.readUInt32BE(16),
      cluster_bits: buffer.readUInt32BE(20),
      size: buffer.readBigUInt64BE(24),
      crypt_method: buffer.readUInt32BE(32),
      l1_size: buffer.readUInt32BE(36),
      l1_table_offset: buffer.readBigUInt64BE(40),
      refcount_table_offset: buffer.readBigUInt64BE(48),
      refcount_table_clusters: buffer.readUInt32BE(56),
      nb_snapshots: buffer.readUInt32BE(60),
      snapshots_offset: buffer.readBigUInt64BE(64),
    }

    assert.ok(this.header.l1_table_offset < Number.MAX_SAFE_INTEGER)
    const l1TableBuffer = await this.readBuffer(Number(this.header.l1_table_offset), this.header.l1_size * 8)
    const nbClustersInFile = Math.ceil(this.getVirtualSize() / this.getBlockSize())
    const nbClusterPerL2Table = this.getBlockSize() / 8

    const clusters = this.#dataClustersIndex
    clusters.clear()

    for (let i = 0; i < l1TableBuffer.length; i += 8) {
      const l2TableIndex = i / 8
      const l2Offset = Number(l1TableBuffer.readBigUInt64BE(i) & 0x00fffffffffff8n)
      if (l2Offset !== 0) {
        // the last table may be smaller
        const nbClusterInTable = Math.min(nbClusterPerL2Table, nbClustersInFile - l2TableIndex * nbClusterPerL2Table)
        const l2TableBuffer = await this.readBuffer(l2Offset, nbClusterInTable * 8)
        for (let j = 0; j < l2TableBuffer.length; j += 8) {
          const clusterOffset = Number(l2TableBuffer.readBigUInt64BE(j) & 0x00fffffffffff8n)
          if (clusterOffset !== 0) {
            clusters.set(l2TableIndex * nbClusterPerL2Table + j / 8, clusterOffset)
          }
        }
      }
    }
  }
  
  getBlockIndexes(): Array<number> {
    return [...this.#dataClustersIndex.keys()]
  }
  hasBlock(index: number): boolean {
    return this.#dataClustersIndex.has(index)
  }
}
