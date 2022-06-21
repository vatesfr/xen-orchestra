'use strict'

const UUID = require('uuid')
const cloneDeep = require('lodash/cloneDeep.js')
const Disposable = require('promise-toolbox/Disposable')
const { asyncMap } = require('@xen-orchestra/async-map')

const assert = require('assert')
const { DISK_TYPES, FOOTER_SIZE, HEADER_SIZE } = require('../_constants')
const { openVhd } = require('../openVhd')
const resolveRelativeFromFile = require('../_resolveRelativeFromFile')
const { VhdAbstract } = require('./VhdAbstract')

const VhdSynthetic = class VhdSynthetic extends VhdAbstract {
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

  get compressionType() {
    const compressionType = this.vhds[0].compressionType
    for (let i = 0; i < this.vhds.length; i++) {
      if (compressionType !== this.vhds[i].compressionType) {
        return 'MIXED'
      }
    }
    return compressionType
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

  #getVhdWithBlock(blockId) {
    const index = this.#vhds.findIndex(vhd => vhd.containsBlock(blockId))
    assert(index !== -1, `no such block ${blockId}`)
    return this.#vhds[index]
  }

  async readBlock(blockId, onlyBitmap = false) {
    // only read the content of the first vhd containing this block
    return await this.#getVhdWithBlock(blockId).readBlock(blockId, onlyBitmap)
  }

  async mergeBlock(child, blockId) {
    throw new Error(`can't coalesce block into a vhd synthetic`)
  }

  _readParentLocatorData(id) {
    return this.#vhds[this.#vhds.length - 1]._readParentLocatorData(id)
  }
  _getFullBlockPath(blockId) {
    const vhd = this.#getVhdWithBlock(blockId)
    return vhd?._getFullBlockPath(blockId)
  }
}

// add decorated  static method
VhdSynthetic.fromVhdChain = Disposable.factory(async function* fromVhdChain(handler, childPath) {
  let vhdPath = childPath
  let vhd
  const vhds = []
  do {
    vhd = yield openVhd(handler, vhdPath)
    vhds.push(vhd)
    vhdPath = resolveRelativeFromFile(vhdPath, vhd.header.parentUnicodeName)
  } while (vhd.footer.diskType !== DISK_TYPES.DYNAMIC)

  const synthetic = new VhdSynthetic(vhds)
  await synthetic.readHeaderAndFooter()
  yield synthetic
})

VhdSynthetic.open = Disposable.factory(async function* open(handler, paths, opts) {
  const synthetic = new VhdSynthetic(yield Disposable.all(paths.map(path => openVhd(handler, path, opts))))
  await synthetic.readHeaderAndFooter()
  yield synthetic
})

exports.VhdSynthetic = VhdSynthetic
