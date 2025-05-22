import { readChunkStrict, skipStrict } from '@vates/read-chunk'
import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import { DISK_TYPES, FOOTER_SIZE } from 'vhd-lib/_constants.js'
import { notEqual, strictEqual } from 'node:assert'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { VhdAbstract } from 'vhd-lib'
import { openDatastore } from './_openDatastore.mjs'

// one big difference with the other versions of VMDK is that the grain tables are actually sparse, they are pre-allocated but not used in grain order,
// so we have to read the grain directory to know where to find the grain tables

const SE_SPARSE_DIR_NON_ALLOCATED = 0
const SE_SPARSE_DIR_ALLOCATED = 1

const SE_SPARSE_GRAIN_NON_ALLOCATED = 0 // check in parent
const SE_SPARSE_GRAIN_UNMAPPED = 1 // grain has been unmapped, but index of previous grain still readable for reclamation
const SE_SPARSE_GRAIN_ZERO = 2
const SE_SPARSE_GRAIN_ALLOCATED = 3

const VHD_BLOCK_SIZE_BYTES = 2 * 1024 * 1024
const GRAIN_SIZE_BYTES = 4 * 1024
const GRAIN_TABLE_COUNT = 4 * 1024

const ones = n => (1n << BigInt(n)) - 1n

function asNumber(n) {
  if (n > Number.MAX_SAFE_INTEGER)
    throw new Error(`can't handle ${n} ${Number.MAX_SAFE_INTEGER} ${n & 0x00000000ffffffffn}`)
  return Number(n)
}

const readInt64 = (buffer, index) => asNumber(buffer.readBigInt64LE(index * 8))

/**
 * @returns {{topNibble: number, low60: bigint}} topNibble is the first 4 bits of the 64 bits entry, indexPart is the remaining 60 bits
 */
function readTaggedEntry(buffer, index) {
  const entry = buffer.readBigInt64LE(index * 8)
  return { topNibble: Number(entry >> 60n), low60: entry & ones(60) }
}

function readSeSparseDir(buffer, index) {
  const { topNibble, low60 } = readTaggedEntry(buffer, index)
  return { type: topNibble, tableIndex: asNumber(low60) }
}

function readSeSparseTable(buffer, index) {
  const { topNibble, low60 } = readTaggedEntry(buffer, index)
  // https://lists.gnu.org/archive/html/qemu-block/2019-06/msg00934.html
  const topIndexPart = low60 >> 48n // bring the top 12 bits down
  const bottomIndexPart = (low60 & ones(48)) << 12n // bring the bottom 48 bits up
  return { type: topNibble, grainIndex: asNumber(bottomIndexPart | topIndexPart) }
}

export default class VhdEsxiSeSparse extends VhdAbstract {
  #datastore
  #parentVhd
  #path
  #lookMissingBlockInParent

  #header
  #footer

  #grainIndex // Map blockId => []

  #grainDirOffsetBytes
  #grainDirSizeBytes
  #grainTableOffsetBytes
  #grainOffsetBytes

  #reading = false
  #stream
  #streamOffset = 0

  static async open(datastoreName, path, parentVhd, opts) {
    const datastore = openDatastore(datastoreName, opts)
    const vhd = new VhdEsxiSeSparse(datastore, path, parentVhd, opts)
    await vhd.readHeaderAndFooter()
    return {
      value: vhd,
      dispose: () => vhd.dispose(),
    }
  }

  get path() {
    return this.#path
  }
  constructor(datastore, path, parentVhd, { lookMissingBlockInParent = true } = {}) {
    super()
    this.#path = path
    this.#datastore = datastore
    this.#parentVhd = parentVhd
    this.#lookMissingBlockInParent = lookMissingBlockInParent
  }

  get header() {
    return this.#header
  }

  get footer() {
    return this.#footer
  }

  containsBlock(blockId) {
    notEqual(this.#grainIndex, undefined, "bat must be loaded to use contain blocks'")
    return (
      this.#grainIndex.get(blockId) !== undefined ||
      (this.#lookMissingBlockInParent && this.#parentVhd.containsBlock(blockId))
    )
  }

  // since most of the data are written sequentially we always open a stream from start to the end of the file
  // If we have to rewind it, we destroy the stream and recreate with the right "start"
  // We also recreate the stream if there is too much distance between current position and the wanted position

  async #read(start, length) {
    if (!this.#footer) {
      // we need to be able before the footer is loaded, to read the header and footer
      return this.#datastore.getBuffer(this.#path, start, start + length)
    }
    if (this.#reading) {
      throw new Error('reading must be done sequentially')
    }
    try {
      const MAX_SKIPPABLE_LENGTH = 2 * 1024 * 1024
      this.#reading = true
      if (this.#stream !== undefined) {
        // stream is already ahead or to far behind
        if (this.#streamOffset > start || this.#streamOffset + MAX_SKIPPABLE_LENGTH < start) {
          this.#stream.destroy()
          this.#stream = undefined
          this.#streamOffset = 0
        }
      }
      // no stream
      if (this.#stream === undefined) {
        const end = this.footer.currentSize
        this.#stream = await this.#datastore.getStream(this.#path, start, end)
        this.#streamOffset = start
      }

      // stream a little behind
      if (this.#streamOffset < start) {
        await skipStrict(this.#stream, start - this.#streamOffset)
        this.#streamOffset = start
      }

      // really read data
      this.#streamOffset += length
      const data = await readChunkStrict(this.#stream, length)
      return data
    } catch (error) {
      error.start = start
      error.length = length
      error.streamLength = this.footer.currentSize
      this.#stream?.destroy()
      this.#stream = undefined
      this.#streamOffset = 0
      throw error
    } finally {
      this.#reading = false
    }
  }

  async readHeaderAndFooter() {
    const vmdkHeaderBuffer = await this.#read(0, 2048)

    strictEqual(vmdkHeaderBuffer.readBigInt64LE(0), 0xcafebaben)
    strictEqual(readInt64(vmdkHeaderBuffer, 1), 0x200000001) // version 2.1

    this.#grainDirOffsetBytes = readInt64(vmdkHeaderBuffer, 16) * 512
    // console.log('grainDirOffsetBytes', this.#grainDirOffsetBytes)
    this.#grainDirSizeBytes = readInt64(vmdkHeaderBuffer, 17) * 512
    // console.log('grainDirSizeBytes', this.#grainDirSizeBytes)

    const grainSizeSectors = readInt64(vmdkHeaderBuffer, 3)
    const grainSizeBytes = grainSizeSectors * 512 // 8 sectors = 4KB default
    strictEqual(grainSizeBytes, GRAIN_SIZE_BYTES) // we only support default grain size

    this.#grainTableOffsetBytes = readInt64(vmdkHeaderBuffer, 18) * 512
    // console.log('grainTableOffsetBytes', this.#grainTableOffsetBytes)

    const grainTableCount = (readInt64(vmdkHeaderBuffer, 4) * 512) / 8 // count is the number of 64b entries in each tables
    // console.log('grainTableCount', grainTableCount)
    strictEqual(grainTableCount, GRAIN_TABLE_COUNT) // we only support tables of 4096 entries (default)

    this.#grainOffsetBytes = readInt64(vmdkHeaderBuffer, 24) * 512
    // console.log('grainOffsetBytes', this.#grainOffsetBytes)

    const sizeBytes = readInt64(vmdkHeaderBuffer, 2) * 512
    // console.log('sizeBytes', sizeBytes)

    const nbBlocks = Math.ceil(sizeBytes / VHD_BLOCK_SIZE_BYTES)
    this.#header = unpackHeader(createHeader(nbBlocks))
    const geometry = _computeGeometryForSize(sizeBytes)
    this.#footer = unpackFooter(
      createFooter(sizeBytes, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC)
    )
  }

  async readBlockAllocationTable() {
    this.#grainIndex = new Map()

    const tableSizeBytes = GRAIN_TABLE_COUNT * 8
    const grainDirBuffer = await this.#read(this.#grainDirOffsetBytes, this.#grainDirSizeBytes)
    // read the grain dir ( first level )
    for (let grainDirIndex = 0; grainDirIndex < grainDirBuffer.length / 8; grainDirIndex++) {
      const { type: grainDirType, tableIndex } = readSeSparseDir(grainDirBuffer, grainDirIndex)
      if (grainDirType === SE_SPARSE_DIR_NON_ALLOCATED) {
        // no grain table allocated at all in this grain dir
        continue
      }
      strictEqual(grainDirType, SE_SPARSE_DIR_ALLOCATED)
      // read the corresponding grain table ( second level )
      const grainTableBuffer = await this.#read(
        this.#grainTableOffsetBytes + tableIndex * tableSizeBytes,
        tableSizeBytes
      )
      // offset in bytes if >0, grainType if <=0
      let grainOffsets = []
      let blockId = grainDirIndex * 8

      const addGrain = val => {
        grainOffsets.push(val)
        // 4096 block of 4Kb per dir entry =>16MB/grain dir
        // 1 block = 2MB
        // 512 grain => 1 block
        // 8 block per dir entry
        if (grainOffsets.length === 512) {
          this.#grainIndex.set(blockId, grainOffsets)
          grainOffsets = []
          blockId++
        }
      }

      for (let grainTableIndex = 0; grainTableIndex < grainTableBuffer.length / 8; grainTableIndex++) {
        const { type: grainType, grainIndex } = readSeSparseTable(grainTableBuffer, grainTableIndex)
        if (grainType === SE_SPARSE_GRAIN_ALLOCATED) {
          // this is ok in 32 bits int with VMDK smaller than 2TB
          const offsetByte = grainIndex * GRAIN_SIZE_BYTES + this.#grainOffsetBytes
          addGrain(offsetByte)
        } else {
          // multiply by -1 to differentiate type and offset
          // no offset can be zero
          addGrain(-grainType)
        }
      }
      strictEqual(grainOffsets.length, 0)
    }
  }

  async readBlock(blockId) {
    let changed = false
    const grainOffsets = this.#grainIndex.get(blockId) // may be undefined if the child contains block and lookMissingBlockInParent=true
    // negative value indicate that it's not an offset
    // SE_SPARSE_GRAIN_NON_ALLOCATED means we have to look into the parent data
    const isLocallyFull =
      grainOffsets !== undefined && !grainOffsets.some(value => value === -SE_SPARSE_GRAIN_NON_ALLOCATED)

    let parentBuffer, parentBlock
    // don't read from parent is current block is already completely described
    if (isLocallyFull) {
      parentBuffer = Buffer.alloc(512 /* bitmap */ + 2 * 1024 * 1024 /* data */, 0)
      parentBuffer.fill(255, 0, 512) // bitmap is full  of bit 1
    } else {
      parentBlock = await this.#parentVhd.readBlock(blockId)
      parentBuffer = parentBlock.buffer
    }
    const EMPTY_GRAIN = Buffer.alloc(GRAIN_SIZE_BYTES, 0)
    for (const index in grainOffsets) {
      const value = grainOffsets[index]
      let data
      if (value > 0) {
        // it's the offset in byte of a grain type SE_SPARSE_GRAIN_ALLOCATED
        // @todo this part can be quite slow when grain are not sorted
        data = await this.#read(value, GRAIN_SIZE_BYTES)
      } else {
        // back to the real grain type
        const type = value * -1
        switch (type) {
          case SE_SPARSE_GRAIN_ZERO:
          case SE_SPARSE_GRAIN_UNMAPPED:
            data = EMPTY_GRAIN
            break
          case SE_SPARSE_GRAIN_NON_ALLOCATED:
            /* from parent */
            break
          default:
            throw new Error(`can't handle grain type ${type}`)
        }
      }
      if (data) {
        changed = true
        data.copy(parentBuffer, index * GRAIN_SIZE_BYTES + 512 /* block bitmap */)
      }
    }
    // no need to copy if data all come from parent
    return changed || !parentBlock
      ? {
          id: blockId,
          bitmap: parentBuffer.slice(0, 512),
          data: parentBuffer.slice(512),
          buffer: parentBuffer,
        }
      : parentBlock
  }

  async dispose() {
    await this.#stream?.destroy()
  }
}
