import { asyncMap } from '@xen-orchestra/async-map'
import { VhdAbstract } from './VhdAbstract'
import { DISK_TYPE_DIFFERENCING, FOOTER_SIZE, HEADER_SIZE } from '../_constants'

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
  /**
   * @param {Array<VhdAbstract>} vhds the chain of Vhds used to compute this Vhd, from the deepest child (in position 0), to the root (in the last position)
   * only the last one can have any type. Other must have type DISK_TYPE_DIFFERENCING (delta)
   */
  constructor(vhds) {
    assert(vhds.length > 0)
    super()
    this.#vhds = vhds
  }

  async readBlockAllocationTable() {
    await asyncMap(this.#vhds, vhd => vhd.readBlockAllocationTable())
  }

  containsBlock(blockId) {
    return this.#vhds.some(vhd => vhd.containsBlock(blockId))
  }

  async readHeaderAndFooter() {
    await asyncMap(this.#vhds, vhd => vhd.readHeaderAndFooter())
    this.#vhds.forEach((vhd, index) => {
      if (index < this.#vhds.length) {
        assert.strictEqual(vhd.footer.diskType === DISK_TYPE_DIFFERENCING)
      }
    })
  }

  async readBlock(blockId, onlyBitmap = false) {
    const index = this.#vhds.findIndex(vhd => vhd.containsBlock(blockId))
    // only read the content of the first vhd containing this block
    return await this.#vhds[index].readBlock(blockId, onlyBitmap)
  }

  _readParentLocatorData(id) {
    return this.#vhds[this.#vhds.length - 1]._readParentLocatorData(id)
  }
}
