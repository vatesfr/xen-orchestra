'use strict'

const UUID = require('uuid')
const cloneDeep = require('lodash/cloneDeep.js')
const { asyncMap } = require('@xen-orchestra/async-map')
const { VhdAbstract } = require('./VhdAbstract')
const { DISK_TYPES, FOOTER_SIZE, HEADER_SIZE } = require('../_constants')

const assert = require('assert')

exports.VhdSynthetic = class VhdSynthetic extends VhdAbstract {
  #vhds = []

  get header() {
    // this the VHD we want to synthetize
    const vhd = this.#vhds[0]

    // this is the root VHD
    const rootVhd = this.#vhds[this.#vhds.length - 1]

    // data of our synthetic VHD
    // TODO: set parentLocatorEntry-s in header
    return {
      ...vhd.header,
      parentLocatorEntry: cloneDeep(rootVhd.header.parentLocatorEntry),
      tableOffset: FOOTER_SIZE + HEADER_SIZE,
      parentTimestamp: rootVhd.header.parentTimestamp,
      parentUnicodeName: rootVhd.header.parentUnicodeName,
      parentUuid: rootVhd.header.parentUuid,
    }
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
   * only the last one can have any type. Other must have type DISK_TYPES.DIFFERENCING (delta)
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
    const vhds = this.#vhds

    await asyncMap(vhds, vhd => vhd.readHeaderAndFooter())

    for (let i = 0, n = vhds.length - 1; i < n; ++i) {
      const child = vhds[i]
      const parent = vhds[i + 1]
      assert.strictEqual(child.footer.diskType, DISK_TYPES.DIFFERENCING)
      assert.strictEqual(UUID.stringify(child.header.parentUuid), UUID.stringify(parent.footer.uuid))
    }
  }

  async readBlock(blockId, onlyBitmap = false) {
    const index = this.#vhds.findIndex(vhd => vhd.containsBlock(blockId))
    if (index === -1) {
      throw new Error(`no such block ${blockId}`)
    }
    // only read the content of the first vhd containing this block
    return await this.#vhds[index].readBlock(blockId, onlyBitmap)
  }

  _readParentLocatorData(id) {
    return this.#vhds[this.#vhds.length - 1]._readParentLocatorData(id)
  }
}
