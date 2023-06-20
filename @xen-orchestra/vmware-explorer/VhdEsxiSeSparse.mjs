// from https://github.com/qemu/qemu/commit/98eb9733f4cf2eeab6d12db7e758665d2fd5367b#

import { notEqual, ok, strictEqual } from 'node:assert'
import { VhdAbstract } from 'vhd-lib'
import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { DEFAULT_BLOCK_SIZE as VHD_BLOCK_SIZE_BYTES, DISK_TYPES, FOOTER_SIZE } from 'vhd-lib/_constants.js'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { createLogger }  from '@xen-orchestra/log'

const { debug } = createLogger('vates:disposable:debounceResource')

// one big difference with the other versions of VMDK is that the grain tables are actually sparse, they are pre-allocated but not used in grain order,
// so we have to read the grain directory to know where to find the grain tables

// const SE_SPARSE_DIR_NON_ALLOCATED = 0
const SE_SPARSE_DIR_ALLOCATED = 1

const SE_SPARSE_GRAIN_NON_ALLOCATED = 0
const SE_SPARSE_GRAIN_UNMAPPED = 1 // grain has been unmapped, but index of previous grain still readable for reclamation
const SE_SPARSE_GRAIN_ZERO = 2
const SE_SPARSE_GRAIN_ALLOCATED = 3

// a buffer full of 1
const ones = n => (1n << BigInt(n)) - 1n

// cast a bigint as a number
function asNumber (n) {
  if (n > Number.MAX_SAFE_INTEGER)
    throw new Error(`can't handle ${n} ${Number.MAX_SAFE_INTEGER} ${n & 0x00000000ffffffffn}`)
  return Number(n)
}

// read an int 64 as a number
const readInt64 = (buffer, index) => asNumber(buffer.readBigInt64LE(index * 8))

/**
 * @returns {{topNibble: number, low60: bigint}} topNibble is the first 4 bits of the 64 bits entry, indexPart is the remaining 60 bits
 */
function readTaggedEntry (buffer, index) {
  const entry = buffer.readBigInt64LE(index * 8)
  return {topNibble: Number(entry >> 60n), low60: entry & ones(60)}
}

function readSeSparseDir (buffer, index) {
  const {topNibble, low60} = readTaggedEntry(buffer, index)
  return {type: topNibble, tableIndex: asNumber(low60)}
}

function readSeSparseTable (buffer, index) {
  const {topNibble, low60} = readTaggedEntry(buffer, index)
  // https://lists.gnu.org/archive/html/qemu-block/2019-06/msg00934.html
  const topIndexPart = low60 >> 48n // bring the top 12 bits down
  const bottomIndexPart = (low60 & ones(48)) << 12n // bring the bottom 48 bits up
  return {type: topNibble, grainIndex: asNumber(bottomIndexPart | topIndexPart)}
}

/**
 *
 * @param {array} array
 * @param {function(item: *, currentPartition: array): boolean} splitPredicate return true when the item should be in a new partition
 * @returns {[[]]} array of arrays
 */
function partitionArray (array, splitPredicate) {
  const partitions = []
  for (const item of array) {
    if (partitions.length === 0 || splitPredicate(item, partitions[partitions.length - 1]))
      partitions.push([item])
    else
      partitions[partitions.length - 1].push(item)
  }
  return partitions
}

/**
 * A compressed format for storing grain tables in memory.
 * The tradeoff is reduced memory usage but no mutation.
 */
class CompressedTable {
  // set of zero-filled grains indices (SE_SPARSE_GRAIN_ZERO and SE_SPARSE_GRAIN_UNMAPPED)
  zeroGrainsSet = new Set()

  // TABLE COMPRESSION
  // an estimator just think that "address(grainId + 1) == address(grainId) + 1"  (grains follow each other in file)
  // allocatedGrainsFollowers[i] tells the number of time the estimator was right after allocatedGrains[i]
  // `allocatedGrains` only contains entries for grains breaking the estimator

  // those 3 arrays are supposed to be in sync, using columnar storage for memory savings
  // contains grainId in sorted order
  allocatedGrains = []
  // offset index for grainId (byte offset in file is grainOffsetBytes + allocatedGrainsAddresses[i] * grainSizeBytes)
  allocatedGrainsAddresses = []
  // how many grains after grainId have their offset index exactly following in the file.
  // file content would be : [grainId, grainId + 1, grainId + 2, ... grainId + allocatedGrainsFollowers[grainId] - 1]
  allocatedGrainsFollowers = []

  // cache the last pivot index to speed up binary search in continuous accesses
  lastIndex = 0

  /**
   * binary search the index of the predecessor of grainId in allocatedGrains
   * @param grainId needle
   * @returns {number} index or -1 if grainId is before the first grain
   */
  #findPredecessorIndex (grainId) {
    const biggestIndex = this.allocatedGrains.length - 1
    if (this.allocatedGrains[biggestIndex] <= grainId)
      return biggestIndex
    const isPredecessor = (index) => this.allocatedGrains[index] <= grainId && grainId < this.allocatedGrains[index + 1]
    // sequential read shortcuts
    if (isPredecessor(this.lastIndex))
      return this.lastIndex
    if (isPredecessor(this.lastIndex + 1))
      return this.lastIndex + 1
    let low = 0
    let high = biggestIndex
    while (low <= high) {
      const pivot = Math.floor((low + high) / 2)
      const pVal = this.allocatedGrains[pivot]
      if (pVal < grainId)
        low = pivot + 1
      else if (pVal > grainId)
        high = pivot - 1
      else
        return pivot

    }
    return high
  }

  /**
   *
   * @param grainId
   * @returns {{grainIndex: number, type: number}} type is one of SE_SPARSE_GRAIN_ZERO, SE_SPARSE_GRAIN_ALLOCATED, SE_SPARSE_GRAIN_NON_ALLOCATED
   */
  findGrain (grainId) {
    if (this.zeroGrainsSet.has(grainId)) {
      return {type: SE_SPARSE_GRAIN_ZERO, grainIndex: NaN}
    }
    const index = this.#findPredecessorIndex(grainId)
    if (index > 0) {
      this.lastIndex = index
      const distanceFromPredecessor = grainId - this.allocatedGrains[index]
      const isAllocated = distanceFromPredecessor <= this.allocatedGrainsFollowers[index]
      if (isAllocated) {
        return {
          type: SE_SPARSE_GRAIN_ALLOCATED,
          grainIndex: this.allocatedGrainsAddresses[index] + distanceFromPredecessor
        }
      }
    }
    return {type: SE_SPARSE_GRAIN_NON_ALLOCATED, grainIndex: NaN}
  }
}

class TableCompressor {
  nextGrainId = NaN
  estimatedNextGrainAddress = NaN
  compressedTable = new CompressedTable()

  // stats
  addCalls = 0

  addGrain (grainId, offsetIndex) {
    this.addCalls++
    ok(isNaN(this.nextGrainId) || grainId >= this.nextGrainId, 'grainId must be increasing')
    if (grainId === this.nextGrainId && offsetIndex === this.estimatedNextGrainAddress) {
      // the estimator was right, no new entry
      this.compressedTable.allocatedGrainsFollowers[this.compressedTable.allocatedGrainsFollowers.length - 1]++
    } else {
      // the estimator was wrong, we need to add an entry
      this.compressedTable.allocatedGrains.push(grainId)
      this.compressedTable.allocatedGrainsAddresses.push(offsetIndex)
      this.compressedTable.allocatedGrainsFollowers.push(0)
    }
    this.nextGrainId = grainId + 1
    this.estimatedNextGrainAddress = offsetIndex + 1
  }

  addZeroGrain (grainId) {
    this.compressedTable.zeroGrainsSet.add(grainId)
  }

  build () {
    return this.compressedTable
  }
}

export default class VhdEsxiSeSparse extends VhdAbstract {
  #esxi
  #datastore
  #parentVhd
  #path
  #lookMissingBlockInParent

  #header
  #footer

  grainSizeBytes
  grainTablesSizeBytes
  grainTableOffsetBytes
  grainOffsetBytes
  /**
   * @type {Buffer} a zero-filled buffer of grainSizeBytes length
   */
  zeroGrain
  /**
   *  object representing a zero-filled VHD block
   */
  zeroBlock

  /**
   * compressed grain table
   * @type {CompressedTable}
   */
  compressedTable
  /**
   * set of all the VHD blocks whose data is partially in the current VMDK file. 2To of data = 1M entries
   */
  blocksInFile = new Set()

  // stats counters
  grainDownloads = 0
  readCount = 0
  extraBytesDownloaded = 0

  constructor (esxi, datastore, path, parentVhd, {lookMissingBlockInParent = true} = {}) {
    super()
    this.#esxi = esxi
    this.#path = path
    this.#datastore = datastore
    this.#parentVhd = parentVhd
    this.#lookMissingBlockInParent = lookMissingBlockInParent
  }

  get header () {
    return this.#header
  }

  get footer () {
    return this.#footer
  }

  containsBlock (blockId) {
    notEqual(this.compressedTable, undefined, 'bat must be loaded to use contain blocks\'')
    if (this.blocksInFile.has(blockId)) {
      return true
    }
    return this.#lookMissingBlockInParent && this.#parentVhd.containsBlock(blockId)
  }

  // this is what we will use to read the file
  async #readGrain (start, length = 4 * 1024) {
    return (await this.#esxi.download(this.#datastore, this.#path, `${start}-${start + length - 1}`)).buffer()
  }

  /**
   * read an array of buffers from the file.
   * Doesn't concatenate them to avoid big buffers.
   * @param start
   * @param end exclusive
   * @param pageSize
   * @returns {Promise<[Buffer]>} an array of buffer of size pageSize
   */
  async #readPages (start, end, pageSize = end - start) {
    strictEqual((end - start) % pageSize, 0, `read size must be a multiple of pageSize ${pageSize}`)
    this.readCount++
    const buffers = []
    for(let i=start; i < end; i += pageSize){
      const buffer = await (await this.#esxi.download(this.#datastore, this.#path, `${i}-${i+pageSize - 1}`)).buffer()
      buffers.push(buffer)
    }
    return buffers
  }

  async readHeaderAndFooter () {
    const buffer = (await this.#readPages(0, 2048))[0]
    strictEqual(buffer.readBigInt64LE(0), 0xcafebaben)

    strictEqual(readInt64(buffer, 1), 0x200000001) // version 2.1

    this.grainDirOffsetBytes = readInt64(buffer, 16) * 512
    debug('grainDirOffsetBytes', this.grainDirOffsetBytes)
    this.grainDirSizeBytes = readInt64(buffer, 17) * 512
    debug('grainDirSizeBytes', this.grainDirSizeBytes)
    const grainDirBucketSize = 8 // each entry is 64bits
    this.grainDirCount = this.grainDirSizeBytes / grainDirBucketSize // count is the number of entries in the array

    this.grainSizeSectors = readInt64(buffer, 3)
    this.grainSizeBytes = this.grainSizeSectors * 512 // 8 sectors = 4KB default
    debug('grainSizeBytes', this.grainSizeBytes)
    debug('VHD_BLOCK_SIZE_BYTES', VHD_BLOCK_SIZE_BYTES)
    this.grainTableOffsetBytes = readInt64(buffer, 18) * 512
    debug('grainTableOffsetBytes', this.grainTableOffsetBytes)
    this.grainTablesSizeBytes = readInt64(buffer, 19) * 512 // file space allocated for *all* the tables
    debug('grainTableSizeBytes', this.grainTablesSizeBytes)

    this.grainTableBucketSize = 8 // each entry is 64bits
    this.grainTableCount = readInt64(buffer, 4) * 512 / this.grainTableBucketSize// count is the number of entries in each tables
    debug('grainTableCount', this.grainTableCount)
    this.grainDirLogicalSpanBytes = this.grainTableCount * this.grainSizeBytes
    debug('grainDirLogicalSpanBytes', this.grainDirLogicalSpanBytes)

    this.grainOffsetBytes = readInt64(buffer, 4) * 512

    const sizeBytes = readInt64(buffer, 2) * this.grainSizeBytes
    this.#header = unpackHeader(createHeader(Math.ceil(sizeBytes / VHD_BLOCK_SIZE_BYTES)))
    const geometry = _computeGeometryForSize(sizeBytes)
    const actualSize = geometry.actualSize
    this.#footer = unpackFooter(
      createFooter(actualSize, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC)
    )

    debug('graintable span/vhd block ratio', this.fgrainTableCount * this.grainSizeBytes / this.#header.blockSize)
    strictEqual(this.grainSizeBytes, 4096)
    strictEqual(this.#header.blockSize % this.grainSizeBytes, 0, 'grain size must be a multiple of vhd block')
    this.grainsPerBlock = this.#header.blockSize / this.grainSizeBytes
    debug('grainsPerBlock', this.grainsPerBlock)
    this.zeroGrain = Buffer.alloc(this.grainSizeBytes, 0)
    this.zeroBlock = VhdEsxiSeSparse.allocateZeroBlock(this.#header.blockSize)
  }

  #recordGrainTable (firstGrainIdInTable, grainTable, compressor) {
    for (let i = 0; i < this.grainTableCount; i++) {
      const grainId = firstGrainIdInTable + i
      const grainEntry = readSeSparseTable(grainTable, i)
      const blockId = Math.floor((firstGrainIdInTable + i) / this.grainsPerBlock)
      if (grainEntry.type === SE_SPARSE_GRAIN_ALLOCATED) {
        compressor.addGrain(grainId, grainEntry.grainIndex)
        this.blocksInFile.add(blockId)
      } else if (grainEntry.type === SE_SPARSE_GRAIN_ZERO || grainEntry.type === SE_SPARSE_GRAIN_UNMAPPED) {
        compressor.addZeroGrain(grainId)
        this.blocksInFile.add(blockId)
      }
    }
  }

  async readBlockAllocationTable () { 
    const MAX_TABLES_MEMORY = 2 * 1024 ** 2 // how much memory we can use to read the tables before compression
    const grainDirectory = (await this.#readPages(this.grainDirOffsetBytes, this.grainDirOffsetBytes + this.grainDirSizeBytes, this.grainDirSizeBytes))[0]
    const compressor = new TableCompressor()
    const tablesEntries = []
    const tableMemorySize = this.grainTableBucketSize * this.grainTableCount
    for (let i = 0; i < this.grainDirCount; i++) {
      const dirEntry = readSeSparseDir(grainDirectory, i)
      if (dirEntry.type === SE_SPARSE_DIR_ALLOCATED)
        tablesEntries.push({
          address: this.grainTableOffsetBytes + dirEntry.tableIndex * tableMemorySize,
          firstGrainIdInTable: i * this.grainTableCount
        })
    }
    const splitPredicate = (table, currentChunk) => (currentChunk.length + 1) * tableMemorySize > MAX_TABLES_MEMORY
    // avoid pulling entire tables in memory, compress them little by little
    for (const tables of partitionArray(tablesEntries, splitPredicate)) {
      await this.#bulkReadChunks(tables, tableMemorySize)
      for (const {firstGrainIdInTable, buffer} of tables)
        this.#recordGrainTable(firstGrainIdInTable, buffer, compressor)
    }
    const t = compressor.build()
    this.compressedTable = t
    const totalAllocatedGrains = t.allocatedGrains.length + t.allocatedGrainsFollowers.reduce((sum, v) => sum + v, 0)
    const storedGrains = t.allocatedGrains.length
    debug('total allocated grains in file', totalAllocatedGrains, 'compressed grains in storage:', storedGrains, 'zeros:', t.zeroGrainsSet.size)
  }

  /**
   * order and bunches an array of addresses and read them while minimizing read counts.
   * Input array is left untouched, a `buffer` field is added to each of its item.
   * @param {[{address}]} chunks array of objects with an `address` field. A `buffer` field will be added to each object
   * @param {number} chunkSize  size of each chunk
   */
  async #bulkReadChunks (chunks, chunkSize) {
    const MAX_DOWNLOAD_SIZE = 10 * 1024 ** 2
    const MIN_RATIO = 0.6 // we want to download at least 60% of useful data per bunch
    if (chunks.length === 0)
      return
    const sortedArray = [...chunks].sort((a, b) => a.address - b.address)
    // chunks are sorted by file offset position, we can download them in packs if they are contiguous enough
    const splitPredicate = (chunk, currentPack) => {
      const projectedDownloadSize = chunk.address + chunkSize - currentPack[0].address
      const projectedDownloadRatio = (currentPack.length + 1) * chunkSize / projectedDownloadSize
      return projectedDownloadSize > MAX_DOWNLOAD_SIZE || projectedDownloadRatio < MIN_RATIO
    }
    for (const pack of partitionArray(sortedArray, splitPredicate)) {
      const start = pack[0].address
      const buffers = await this.#readPages(start, pack[pack.length - 1].address + chunkSize, chunkSize)
      for (const chunk of pack)
        chunk.buffer = buffers[(chunk.address - start) / chunkSize]
      this.extraBytesDownloaded += buffers.length * chunkSize - pack.length * chunkSize
    }
  }

  /**
   *
   * @param blockSize size of the block ignoring the bitmap
   * @returns {{data: Buffer, bitmap: Buffer, buffer: Buffer}}
   */
  static allocateZeroBlock (blockSize) {
    const buffer = Buffer.alloc(blockSize + 512, 0)
    const data = buffer.subarray(512)

    // filling the bitmap with 1s because it's not really used
    const bitmap = buffer.subarray(0, 512)
    bitmap.fill(255)
    return {buffer, data, bitmap}
  }

  async readBlock (blockId) {
    notEqual(this.compressedTable, undefined, 'compressedTable is not loaded')
    const logicalStartGrainIndex = blockId * this.grainsPerBlock
    const grainsAddresses = []
    const grainEntries = []
    if (!this.blocksInFile.has(blockId))
      return this.#lookMissingBlockInParent ? await this.#parentVhd.readBlock(blockId) : this.zeroBlock

    for (let i = 0; i < this.grainsPerBlock; i++) {
      const grainId = logicalStartGrainIndex + i
      const res = this.compressedTable.findGrain(grainId)
      res.grainId = grainId
      grainEntries.push(res)
      if (res.type === SE_SPARSE_GRAIN_ALLOCATED) {
        res.readObject = {grainId, address: res.grainIndex * this.grainSizeBytes + this.grainOffsetBytes}
        grainsAddresses.push(res.readObject)
      }
    }
    await this.#bulkReadChunks(grainsAddresses, this.grainSizeBytes)
    this.grainDownloads += grainsAddresses.length

    const needParent = this.#lookMissingBlockInParent && grainEntries.some(e => e.type === SE_SPARSE_GRAIN_NON_ALLOCATED)
    // assemble grains in the block now with `grainEntries` and the parent buffer
    const block = needParent ? await this.#parentVhd.readBlock(blockId) : VhdEsxiSeSparse.allocateZeroBlock(this.#header.blockSize)
    const writeGrain = (grainData, grainId) => {
      const grainIndex = grainId % this.grainsPerBlock
      const grainOffset = grainIndex * this.grainSizeBytes
      grainData.copy(block.data, grainOffset)
    }
    for (const grainEntry of grainEntries) {
      switch (grainEntry.type) {
        case SE_SPARSE_GRAIN_ZERO:
          writeGrain(this.zeroGrain, grainEntry.grainId)
          break
        case SE_SPARSE_GRAIN_UNMAPPED:
          // I suspect weird stuff might happen if we don't write zeros here
          writeGrain(this.zeroGrain, grainEntry.grainId)
          break
        case SE_SPARSE_GRAIN_ALLOCATED:
          writeGrain(grainEntry.readObject.buffer, grainEntry.grainId)
          break
      }
    }
    return block
  }
}