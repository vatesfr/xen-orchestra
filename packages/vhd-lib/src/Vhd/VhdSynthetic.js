import { asyncMap } from '@xen-orchestra/async-map'
import { VhdAbstract } from './VhdAbstract'
import { FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } from '../_constants'
import { sectorsRoundUpNoZero, sectorsToBytes } from './_utils'

import assert from 'assert'

export class VhdSynthetic extends VhdAbstract {
  #vhds = []
  set header(_) {
    throw new Error('Header is read only for VhdSynthetic')
  }

  get header() {
    // this the VHD we want to synthetize
    const vhd = this.#vhds[0]

    // this is the root VHD
    const rootVhd = this.#vhds[this.#vhds.length - 1]

    // data of our synthetic VHD
    // TODO: set parentLocatorEntry-s in header
    return {
      ...vhd.header,
      tableOffset: FOOTER_SIZE + HEADER_SIZE,
      parentTimestamp: rootVhd.header.parentTimestamp,
      parentUnicodeName: rootVhd.header.parentUnicodeName,
      parentUuid: rootVhd.header.parentUuid,
    }
  }

  set footer(_) {
    throw new Error('Footer is read only for VhdSynthetic')
  }

  get footer() {
    // this is the root VHD
    const rootVhd = this.#vhds[this.#vhds.length - 1]
    return {
      ...this.#vhds[0].footer,
      dataOffset: FOOTER_SIZE,
      diskType: rootVhd.footer.diskType,
    }
  }

  static async open(vhds) {
    const vhd = new VhdSynthetic(vhds)
    return {
      dispose: () => {},
      value: vhd,
    }
  }

  constructor(vhds) {
    assert(vhds.length > 0)
    super()
    this.#vhds = vhds
    this.sectorsPerBlock = vhds[0].header.blockSize / SECTOR_SIZE
    this.sectorsOfBitmap = sectorsRoundUpNoZero(this.sectorsPerBlock >> 3)
    this.fullBlockSize = sectorsToBytes(this.sectorsOfBitmap + this.sectorsPerBlock)
    this.bitmapSize = sectorsToBytes(this.sectorsOfBitmap)
  }

  async readBlockAllocationTable() {
    await asyncMap(this.#vhds, vhd => vhd.readBlockAllocationTable())
  }

  containsBlock(blockId) {
    const contains = this.#vhds.map(vhd => vhd.containsBlock(blockId))
    return contains.includes(true)
  }

  async readHeaderAndFooter() {
    await asyncMap(this.#vhds, vhd => vhd.readHeaderAndFooter())
  }

  async readBlock(blockId, onlyBitmap = false) {
    const contains = this.#vhds.map(vhd => vhd.containsBlock(blockId))
    // only read the content of the last vhd containing this block
    return await this.#vhds[contains.indexOf(true)].readBlock(blockId, onlyBitmap)
  }

  _readParentLocatorData(id) {
    return this.#vhds[0]._readParentLocatorData(id)
  }
}
