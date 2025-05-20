import { Disk, DiskBlock, FileAccessor, ProgressHandler } from '@xen-orchestra/disk-transform'

import { getHandler } from '@xen-orchestra/fs'
import assert from 'node:assert'
import { Readable } from 'node:stream'
import { readChunkStrict, skipStrict } from '@vates/read-chunk'
import fs from 'node:fs'

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

abstract class QcowDisk extends Disk {
  #qcowHeader: Qcow2Header | undefined
  #clustersIndex = new Map<number, number>()

  get clustersIndex(): Map<number, number> {
    return this.#clustersIndex
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

    const nbL1Entries = this.header.l1_size

    assert.ok(this.header.l1_table_offset < Number.MAX_SAFE_INTEGER)
    const l1TableBuffer = await this.readBuffer(Number(this.header.l1_table_offset), this.header.l1_size * 8)
    const l1Table = new Map()
    const nbClustersInFile = Math.ceil(this.getVirtualSize() / this.getBlockSize())
    const nbClusterPerL2Table = this.getBlockSize() / 8

    const clusters = this.#clustersIndex
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

    for (const [index, offset] of clusters) {
      console.log(`0x${(index * 64 * 1024).toString(16)} 0x${offset.toString(16)}`)
    }
  }
  getBlockIndexes(): Array<number> {
    return [...this.#clustersIndex.keys()]
  }
  hasBlock(index: number): boolean {
    return this.#clustersIndex.has(index)
  }

  async *buildDiskBlockGenerator(): AsyncGenerator<DiskBlock> {
    try {
      const indexes = this.getBlockIndexes()
      const blockSize = this.getBlockSize()
      for (let index = 0; index < indexes.length; index++) {
        const data = await this.readBuffer(indexes[index] * blockSize, blockSize)
        yield {
          index,
          data,
        }
        await this.progressHandler?.setProgress(index / indexes.length)
      }
      await this.progressHandler?.setProgress(1)
    } finally {
      await this.progressHandler?.done()
      await this.close()
    }
  }
}

class QCowFromAccessor extends QcowDisk {
  async readBuffer(offset: number, length: number): Promise<Buffer> {
    const buffer = Buffer.alloc(length)
    await this.#accessor.read(this.descriptor, buffer, offset)
    return buffer
  }
  _readBlock(index: number): Promise<DiskBlock> {
    throw new Error('Method not implemented.')
  }

  #accessor: FileAccessor
  #path: string
  #descriptor: number | undefined
  get descriptor(): number {
    if (this.#descriptor === undefined) {
      throw new Error("Can't get file decriptor before init")
    }
    return this.#descriptor
  }
  constructor(accessor: FileAccessor, path: string) {
    super()
    this.#accessor = accessor
    this.#path = path
  }
  _read

  async init() {
    this.#descriptor = await this.#accessor.openFile(this.#path)
    await super.init()
  }
  close(): Promise<void> {
    return this.#accessor.closeFile(this.descriptor)
  }
}

class QcowFromStream extends QcowDisk {
  #stream: Readable
  #streamOffset: number = 0
  #busy = false

  constructor(stream: Readable) {
    super()
    this.#stream = stream
  }
  async #read(length: number) {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    const data = await readChunkStrict(this.#stream, length)
    this.#streamOffset += length
    this.#busy = false
    return data
  }

  async #skip(length: number) {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    await skipStrict(this.#stream, length)
    this.#streamOffset += length
    this.#busy = false
  }

  async readBuffer(offset: number, length: number): Promise<Buffer> {
    if (offset < this.#streamOffset) {
      throw new Error("Can't read backward in stream")
    }
    if (offset > this.#streamOffset) {
      await this.#skip(offset - this.#streamOffset)
    }
    return this.#read(length)
  }
  async close(): Promise<void> {
    this.#stream.destroy()
  }
}

/*
const handler = getHandler({url:`file:///mnt/work/xen-orchestra/@xen-orchestra/qcow2`})
await handler.sync()
console.log({handler})
const disk = new QCowFromAccessor(handler, 'disk.qcow2')
await disk.init()
*/
const stream = fs.createReadStream('/mnt/work/xen-orchestra/@xen-orchestra/qcow2/disk.qcow2')

const disk = new QcowFromStream(stream)
await disk.init()
