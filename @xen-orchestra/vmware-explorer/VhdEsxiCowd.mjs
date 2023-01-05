import { notEqual, strictEqual } from 'node:assert'
import { VhdAbstract } from 'vhd-lib'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { DISK_TYPES, FOOTER_SIZE } from 'vhd-lib/_constants.js'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'

export default class VhdCowd extends VhdAbstract {
  #esxi
  #datastore
  #parentVhd
  #path
  #chain

  #header
  #footer

  #grainDirectory

  static async open(esxi, datastore, path, parentVhd, opts) {
    const vhd = new VhdCowd(esxi, datastore, path,parentVhd, opts)
    await vhd.readHeaderAndFooter()
    return vhd
  }
  constructor(esxi, datastore, path, parentVhd,{chain=true} = {}) {
    super()
    this.#esxi = esxi
    this.#path = path
    this.#datastore = datastore
    this.#parentVhd = parentVhd
    this.#chain = chain
  }

  get header() {
    return this.#header
  }

  get footer() {
    return this.#footer
  }

  containsBlock(blockId) {
    notEqual(this.#grainDirectory, undefined, "bat must be loaded to use contain blocks'")
    // only check if a grain table exist for on of the sector of the block
    // the great news is that a grain size has 4096 entries of 512B = 2M
    // and a vhd block is also 2M
    // so we only need to check if a grain table exists (it's not created without data)

    // if this is a chain, we also check if the bloc is present in parent
    return this.#grainDirectory.readInt32LE(blockId * 4) !== 0 || 
     (this.#chain && this.#parentVhd.containsBlock(blockId))
  }

  async #read(start, end) {
    return (await this.#esxi.download(this.#datastore, this.#path, `${start}-${end}`)).buffer()
  }

  async readHeaderAndFooter(checkSecondFooter = true) {
    const buffer = await this.#read(0, 2048)

    strictEqual(buffer.slice(0, 4).toString('ascii'), 'COWD')
    strictEqual(buffer.readInt32LE(4), 1) // version
    strictEqual(buffer.readInt32LE(8), 3) // flags
    const sectorCapacity = buffer.readInt32LE(12)
    // const sectorGrainNumber = buffer.readInt32LE(16)
    strictEqual(buffer.readInt32LE(20), 4) // grain directory position in sectors

    // const nbGrainDirectoryEntries = buffer.readInt32LE(24)
    // const nextFreeSector = buffer.readInt32LE(28)
    const size = sectorCapacity * 512
    // a grain directory entry contains the address of a grain table
    // a grain table can adresses at most 4096 grain of 512 Bytes of data
    this.#header = unpackHeader(createHeader(Math.ceil(size / (4096 * 512))))
   // this.#header.parentUnicodeName = this.#parentFileName
    const geometry = _computeGeometryForSize(size)
    const actualSize = geometry.actualSize
    this.#footer = unpackFooter(
      createFooter(
        actualSize,
        Math.floor(Date.now() / 1000),
        geometry,
        FOOTER_SIZE,
        this.#parentVhd ? DISK_TYPES.DIFFERENCING : DISK_TYPES.DYNAMIC
      )
    )
  }

  async readBlockAllocationTable() {
    const nbBlocks = this.header.maxTableEntries
    this.#grainDirectory = await this.#read(2048 /* header length */, 2048 + nbBlocks * 4 - 1)
  }

  // we're lucky : a grain address can address exacty a full block
  async readBlock(blockId) {
    notEqual(this.#grainDirectory, undefined, "grainDirectory is not loaded")
    const sectorOffset = this.#grainDirectory.readInt32LE(blockId * 4)

    const buffer =  (await this.#parentVhd.readBlock(blockId)).buffer

    if(sectorOffset === 0){
      strictEqual(this.#chain, true, "shouldn't have empty block in a delta alone")
      return {
        id: blockId,
        bitmap: buffer.slice(0, 512),
        data: buffer.slice(512),
        buffer,
      }
    }
    const offset = sectorOffset * 512

    const graintable = await this.#read(offset, offset + 2048 /* grain table length */- 1)
    // we have no guaranty that data are order or contiguous
    // let's construct ranges to limit the number of queries
    let rangeStart, offsetStart, offsetEnd
    for (let i = 0; i < graintable.length / 4; i++) {
      const grainOffset = graintable.readInt32LE(i * 4)
      if(grainOffset ===0){
        // from parent
        continue
      }
      if(grainOffset === 1){
        // this is a emptied grain, no data, don't look into parent
        Buffer.alloc(512,0).copy(buffer, (i+1 /* block bitmap */)*512)
      }

      if (grainOffset > 1 ) {
        if(offsetEnd === grainOffset){
          offsetEnd ++ 
        } else {
          if(rangeStart !== undefined ){
            // non empty grain
            const grains = await this.#read(offsetStart * 512, offsetEnd  * 512 - 1)
            grains.copy(buffer, (rangeStart+1 /* block bitmap */)*512)
          }
          rangeStart = i
          offsetStart = grainOffset
          offsetEnd = grainOffset + 1
        }
      }
    }
    if(rangeStart !== undefined ){
      // non empty grain
      const grains = await this.#read(offsetStart * 512, offsetEnd  * 512 - 1)
      grains.copy(buffer, (rangeStart+1)*512)
    }
    return {
      id: blockId,
      bitmap: buffer.slice(0, 512),
      data: buffer.slice(512),
      buffer,
    }
  }
}
