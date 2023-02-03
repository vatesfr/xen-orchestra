import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import { FOOTER_SIZE } from 'vhd-lib/_constants.js'
import { notEqual, strictEqual } from 'node:assert'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { VhdAbstract } from 'vhd-lib'

// from https://github.com/qemu/qemu/commit/98eb9733f4cf2eeab6d12db7e758665d2fd5367b#

function readInt64(buffer, index) {
  const n = buffer.readBigInt64LE(index * 8 /* size of an int64 in bytes */)
  if (n > Number.MAX_SAFE_INTEGER) {
    throw new Error(`can't handle ${n} ${Number.MAX_SAFE_INTEGER} ${n & 0x00000000ffffffffn}`)
  }
  return +n
}

export default class VhdEsxiSeSparse extends VhdAbstract {
  #esxi
  #datastore
  #parentVhd
  #path
  #lookMissingBlockInParent

  #header
  #footer

  #grainDirectory
  // as we will read all grain with data with load everything in memory
  // in theory , that can be 512MB of data for a 2TB fully allocated
  // but our use case is to transfer a relatively small diff
  // and random access is expensive in HTTP, and migration is a one time cors
  // so let's go with naive approach, and future me will have to handle a more
  // clever approach if necessary
  // grain at zero won't be stored

  #grainMap = new Map()

  #grainSize
  #grainTableSize
  #grainTableOffset
  #grainOffset

  static async open(esxi, datastore, path, parentVhd, opts) {
    const vhd = new VhdEsxiSeSparse(esxi, datastore, path, parentVhd, opts)
    await vhd.readHeaderAndFooter()
    return vhd
  }
  constructor(esxi, datastore, path, parentVhd, { lookMissingBlockInParent = true } = {}) {
    super()
    this.#esxi = esxi
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

  async #readGrain(start, length = 4 * 1024) {
    return (await this.#esxi.download(this.#datastore, this.#path, `${start}-${start + length - 1}`)).buffer()
  }

  containsBlock(blockId) {
    notEqual(this.#grainDirectory, undefined, "bat must be loaded to use contain blocks'")

    // a grain table is 4096 entries of 4KB
    // a grain table cover 8 vhd blocks
    // grain table always exists in sespars

    // depending on the paramters we also look into the parent data
    return (
      this.#grainDirectory.readInt32LE(blockId * 4) !== 0 ||
      (this.#lookMissingBlockInParent && this.#parentVhd.containsBlock(blockId))
    )
  }

  async #read(start, end) {
    return (await this.#esxi.download(this.#datastore, this.#path, `${start}-${end}`)).buffer()
  }

  async readHeaderAndFooter() {
    const buffer = await this.#read(0, 2048)
    strictEqual(buffer.readBigInt64LE(0), 0xcafebaben)

    strictEqual(readInt64(buffer, 1), 0x200000001) // version 2.1

    const capacity = readInt64(buffer, 2)
    const grain_size = readInt64(buffer, 3)

    const grain_tables_offset = readInt64(buffer, 18)
    const grain_tables_size = readInt64(buffer, 19)
    this.#grainOffset = readInt64(buffer, 24)

    this.#grainSize = grain_size * 512 // 8 sectors / 4KB default
    this.#grainTableOffset = grain_tables_offset * 512
    this.#grainTableSize = grain_tables_size * 512

    const size = capacity * grain_size * 512
    this.#header = unpackHeader(createHeader(Math.ceil(size / (4096 * 512))))
    const geometry = _computeGeometryForSize(size)
    const actualSize = geometry.actualSize
    this.#footer = unpackFooter(
      createFooter(actualSize, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, this.#parentVhd.footer.diskType)
    )
  }

  async readBlockAllocationTable() {
    const CHUNK_SIZE = 64 * 512

    strictEqual(this.#grainTableSize % CHUNK_SIZE, 0)

    for (let chunkIndex = 0, grainIndex = 0; chunkIndex < this.#grainTableSize / CHUNK_SIZE; chunkIndex++) {
      process.stdin.write('.')
      const start = chunkIndex * CHUNK_SIZE + this.#grainTableOffset
      const end = start + 4096 * 8 - 1
      const buffer = await this.#read(start, end)
      for (let indexInChunk = 0; indexInChunk < 4096; indexInChunk++) {
        const entry = buffer.readBigInt64LE(indexInChunk * 8)
        switch (entry) {
          case 0n: // not allocated, go to parent
            break
          case 1n: // unmapped
            break
        }
        if (entry > 3n) {
          this.#grainMap.set(grainIndex)
          grainIndex++
        }
      }
    }

    // read grain directory and the grain tables
    const nbBlocks = this.header.maxTableEntries
    this.#grainDirectory = await this.#read(2048 /* header length */, 2048 + nbBlocks * 4 - 1)
  }

  // we're lucky : a grain address can address exacty a full block
  async readBlock(blockId) {
    notEqual(this.#grainDirectory, undefined, 'grainDirectory is not loaded')
    const sectorOffset = this.#grainDirectory.readInt32LE(blockId * 4)

    const buffer = (await this.#parentVhd.readBlock(blockId)).buffer

    if (sectorOffset === 0) {
      strictEqual(this.#lookMissingBlockInParent, true, "shouldn't have empty block in a delta alone")
      return {
        id: blockId,
        bitmap: buffer.slice(0, 512),
        data: buffer.slice(512),
        buffer,
      }
    }
    const offset = sectorOffset * 512

    const graintable = await this.#read(offset, offset + 4096 * 4 /* grain table length */ - 1)

    strictEqual(graintable.length, 4096 * 4)
    // we have no guaranty that data are order or contiguous
    // let's construct ranges to limit the number of queries
    let rangeStart, offsetStart, offsetEnd

    const changeRange = async (index, offset) => {
      if (offsetStart !== undefined) {
        // if there was a
        if (offset === offsetEnd) {
          offsetEnd++
          return
        }
        const grains = await this.#read(offsetStart * 512, offsetEnd * 512 - 1)
        grains.copy(buffer, (rangeStart + 1) /* block bitmap */ * 512)
      }
      if (offset) {
        // we're at the beginning of a range present in the file
        rangeStart = index
        offsetStart = offset
        offsetEnd = offset + 1
      } else {
        // we're at the beginning of a range from the parent or empty
        rangeStart = undefined
        offsetStart = undefined
        offsetEnd = undefined
      }
    }

    for (let i = 0; i < graintable.length / 4; i++) {
      const grainOffset = graintable.readInt32LE(i * 4)
      if (grainOffset === 0) {
        await changeRange()
        // from parent
        continue
      }
      if (grainOffset === 1) {
        await changeRange()
        // this is a emptied grain, no data, don't look into parent
        buffer.fill(0, (i + 1) /* block bitmap */ * 512)
      }

      if (grainOffset > 1) {
        // non empty grain
        await changeRange(i, grainOffset)
      }
    }
    await changeRange()
    return {
      id: blockId,
      bitmap: buffer.slice(0, 512),
      data: buffer.slice(512),
      buffer,
    }
  }
}
