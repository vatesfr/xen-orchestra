'use strict'

const UUID = require('uuid')
const { DISK_TYPES } = require('../_constants')
const { VhdAbstract } = require('./VhdAbstract')
const { computeBlockBitmapSize } = require('./_utils')
const assert = require('node:assert')
/**
 * Build an incremental VHD which can be applied to a child to revert to the state of its parent.
 * @param {*} parent
 * @param {*} descendant
 */

class VhdNegative extends VhdAbstract {
  #parent
  #child

  get header() {
    // we want to have parent => child => negative
    // where => means " is the parent of "
    return {
      ...this.#parent.header,
      parentUuid: this.#child.footer.uuid,
    }
  }

  get footer() {
    // by construct a negative vhd is differencing disk
    return {
      ...this.#parent.footer,
      diskType: DISK_TYPES.DIFFERENCING,
    }
  }

  constructor(parent, child) {
    super()
    this.#parent = parent
    this.#child = child

    assert.strictEqual(
      UUID.stringify(child.header.parentUuid),
      UUID.stringify(parent.footer.uuid),
      new Error('NOT_CHAINED')
    )
    assert.strictEqual(child.footer.diskType, DISK_TYPES.DIFFERENCING, new Error('CHILD_NOT_DIFFERENCING'))
    // we don't want to handle alignment and missing block for now
    // last block may contains partly empty data when changing size
    assert.strictEqual(child.footer.currentSize, parent.footer.currentSize, new Error('GEOMETRY_CHANGED'))
  }

  async readBlockAllocationTable() {
    return Promise.all([this.#parent.readBlockAllocationTable(), this.#child.readBlockAllocationTable()])
  }

  containsBlock(blockId) {
    return this.#child.containsBlock(blockId)
  }

  async readHeaderAndFooter() {
    return Promise.all([this.#parent.readHeaderAndFooter(), this.#child.readHeaderAndFooter()])
  }

  async readBlock(blockId, onlyBitmap = false) {
    // only read the content of the first vhd containing this block
    if (this.#parent.containsBlock(blockId)) {
      return this.#parent.readBlock(blockId, onlyBitmap)
    }

    const bitmap = Buffer.alloc(computeBlockBitmapSize(this.header.blockSize), 255) // bitmap are full of bit 1
    const data = Buffer.alloc(this.header.blockSize, 0) // empty are full of bit 0
    return {
      id: blockId,
      bitmap,
      data,
      buffer: Buffer.concat([bitmap, data]),
    }
  }

  mergeBlock(child, blockId) {
    throw new Error(`can't coalesce block into a vhd negative`)
  }

  _readParentLocatorData(id) {
    return this.#parent._readParentLocatorData(id)
  }
}

exports.VhdNegative = VhdNegative
