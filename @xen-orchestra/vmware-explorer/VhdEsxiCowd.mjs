import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import { FOOTER_SIZE } from 'vhd-lib/_constants.js'
import { notEqual, strictEqual } from 'node:assert'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { VhdAbstract } from 'vhd-lib'
import { openDatastore } from './_openDatastore.mjs'

export default class VhdEsxiCowd extends VhdAbstract {
  #datastore
  #parentVhd
  #path
  #lookMissingBlockInParent

  #header
  #footer

  #grainDirectory

  static async open(datastoreName, path, parentVhd, opts) {
    const datastore = openDatastore(datastoreName, opts)
    const vhd = new VhdEsxiCowd(datastore, path, parentVhd, opts)
    await vhd.readHeaderAndFooter()
    return { value: vhd, dispose: () => {} }
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
    notEqual(this.#grainDirectory, undefined, "bat must be loaded to use contain blocks'")
    // only check if a grain table exist for one of the sector of the block
    // the great news is that a grain size has 4096 entries of 512B = 2M
    // and a vhd block is also 2M
    // so we only need to check if a grain table exists (it's not created without data)

    // depending on the parameters we also look into the parent data
    return (
      this.#grainDirectory.readUInt32LE(blockId * 4) !== 0 ||
      (this.#lookMissingBlockInParent && this.#parentVhd.containsBlock(blockId))
    )
  }

  async #read(start, length) {
    return this.#datastore.getBuffer(this.#path, start, start + length)
  }

  async readHeaderAndFooter() {
    const buffer = await this.#read(0, 2048)

    strictEqual(buffer.slice(0, 4).toString('ascii'), 'COWD')
    strictEqual(buffer.readUInt32LE(4), 1) // version
    strictEqual(buffer.readUInt32LE(8), 3) // flags
    const numSectors = buffer.readUInt32LE(12)
    const grainSize = buffer.readUInt32LE(16)
    strictEqual(grainSize, 1) // 1 grain should be 1 sector long
    strictEqual(buffer.readUInt32LE(20), 4) // grain directory position in sectors

    const size = numSectors * 512

    this.#header = unpackHeader(createHeader(Math.ceil(size / (2 * 1024 * 1024) /* vhd block size */)))
    const geometry = _computeGeometryForSize(size)
    this.#footer = unpackFooter(
      createFooter(size, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, this.#parentVhd.footer.diskType)
    )
  }

  async readBlockAllocationTable() {
    // a grain directory entry contains the address of a grain table
    // a grain table can address at most 4096 grain of 512 Bytes of data
    const nbBlocks = this.header.maxTableEntries
    this.#grainDirectory = await this.#read(2048 /* header length */, nbBlocks * 4)
  }

  // we're lucky : a grain address can address exactly a full block
  async readBlock(blockId) {
    notEqual(this.#grainDirectory, undefined, 'grainDirectory is not loaded')
    const sectorOffset = this.#grainDirectory.readUInt32LE(blockId * 4)

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

    const graintable = await this.#read(offset, 4096 * 4 /* grain table length */)

    strictEqual(graintable.length, 4096 * 4)
    // we have no guaranty that data are ordered or contiguous
    // let's construct ranges to limit the number of queries
    let rangeStart, offsetStart, offsetEnd

    const changeRange = async (index, offset) => {
      if (offsetStart !== undefined) {
        // if there was already a branch
        if (offset === offsetEnd) {
          offsetEnd++
          return
        }
        const grains = await this.#read(offsetStart * 512, (offsetEnd - offsetStart) * 512)
        grains.copy(buffer, (rangeStart + 1) /* block bitmap */ * 512)
      }
      // start a new range
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
      const grainOffset = graintable.readUInt32LE(i * 4)
      if (grainOffset === 0) {
        // the content from parent : it is already in buffer
        await changeRange()
      } else if (grainOffset === 1) {
        await changeRange()
        // this is a emptied grain, no data, don't look into parent
        buffer.fill(0, (i + 1) /* block bitmap */ * 512)
      } else if (grainOffset > 1) {
        // non empty grain, read from file
        await changeRange(i, grainOffset)
      }
    }
    // close last range
    await changeRange()
    return {
      id: blockId,
      bitmap: buffer.slice(0, 512),
      data: buffer.slice(512),
      buffer,
    }
  }
}
