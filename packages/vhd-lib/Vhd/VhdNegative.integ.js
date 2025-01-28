'use strict'

const { VhdAbstract, VhdNegative } = require('..')

const { describe, it } = require('node:test')
const assert = require('assert/strict')
const { unpackHeader, unpackFooter } = require('./_utils')
const { createHeader, createFooter } = require('../_createFooterHeader')
const _computeGeometryForSize = require('../_computeGeometryForSize')
const { FOOTER_SIZE, DISK_TYPES } = require('../_constants')

const VHD_BLOCK_LENGTH = 2 * 1024 * 1024
class VhdMock extends VhdAbstract {
  #blockUsed
  #header
  #footer
  get header() {
    return this.#header
  }
  get footer() {
    return this.#footer
  }

  constructor(header, footer, blockUsed = new Set()) {
    super()
    this.#header = header
    this.#footer = footer
    this.#blockUsed = blockUsed
  }
  containsBlock(blockId) {
    return this.#blockUsed.has(blockId)
  }
  readBlock(blockId, onlyBitmap = false) {
    const bitmap = Buffer.alloc(512, 255) // bitmap are full of bit 1

    const data = Buffer.alloc(2 * 1024 * 1024, 0) // empty are full of bit 0
    data.writeUint8(blockId)
    return {
      id: blockId,
      bitmap,
      data,
      buffer: Buffer.concat([bitmap, data]),
    }
  }

  readBlockAllocationTable() {}
  readHeaderAndFooter() {}
  _readParentLocatorData(id) {}
}

describe('vhd negative', async () => {
  it(`throws when uid aren't chained `, () => {
    const length = 10e8

    let header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    const geometry = _computeGeometryForSize(length)
    let footer = unpackFooter(
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DIFFERENCING)
    )
    const parent = new VhdMock(header, footer)

    header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    footer = unpackFooter(
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DIFFERENCING)
    )

    const child = new VhdMock(header, footer)
    assert.throws(() => new VhdNegative(parent, child), { message: /^NOT_CHAINED\b/ })
  })

  it('throws when size changed', () => {
    const childLength = 10e8
    const parentLength = 10e8 + 1

    let header = unpackHeader(createHeader(parentLength / VHD_BLOCK_LENGTH))
    let geometry = _computeGeometryForSize(parentLength)
    let footer = unpackFooter(
      createFooter(parentLength, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DIFFERENCING)
    )
    const parent = new VhdMock(header, footer)

    header = unpackHeader(createHeader(childLength / VHD_BLOCK_LENGTH))
    geometry = _computeGeometryForSize(childLength)
    header.parentUuid = footer.uuid
    footer = unpackFooter(
      createFooter(childLength, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DIFFERENCING)
    )
    const child = new VhdMock(header, footer)
    assert.throws(() => new VhdNegative(parent, child), { message: /^GEOMETRY_CHANGED\b/ })
  })
  it('throws when child is not differencing', () => {
    const length = 10e8

    let header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    const geometry = _computeGeometryForSize(length)
    let footer = unpackFooter(
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DIFFERENCING)
    )
    const parent = new VhdMock(header, footer)

    header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    header.parentUuid = footer.uuid
    footer = unpackFooter(
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC)
    )

    const child = new VhdMock(header, footer)
    assert.throws(() => new VhdNegative(parent, child), { message: /^CHILD_NOT_DIFFERENCING\b/ })
  })

  it(`throws when writing into vhd negative `, async () => {
    const length = 10e8

    let header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    const geometry = _computeGeometryForSize(length)
    let footer = unpackFooter(
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DIFFERENCING)
    )
    const parent = new VhdMock(header, footer)
    const parentUuid = footer.uuid
    header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    header.parentUuid = parentUuid
    footer = unpackFooter(
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DIFFERENCING)
    )

    const child = new VhdMock(header, footer)

    const vhd = new VhdNegative(parent, child)

    // await assert.rejects( ()=> vhd.writeFooter())
    assert.throws(() => vhd.writeHeader())
    assert.throws(() => vhd.writeBlockAllocationTable())
    assert.throws(() => vhd.writeEntireBlock())
    assert.throws(() => vhd.mergeBlock(), { message: `can't coalesce block into a vhd negative` })
  })

  it('normal case', async () => {
    const length = 10e8

    let header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    let geometry = _computeGeometryForSize(length)
    let footer = unpackFooter(
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC)
    )
    const parent = new VhdMock(header, footer, new Set([1, 3]))
    const parentUuid = footer.uuid
    header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    header.parentUuid = parentUuid
    geometry = _computeGeometryForSize(length)
    footer = unpackFooter(
      createFooter(length, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DIFFERENCING)
    )

    const childUuid = footer.uuid
    const child = new VhdMock(header, footer, new Set([2, 3]))

    const vhd = new VhdNegative(parent, child)
    assert.equal(vhd.header.parentUuid.equals(childUuid), true)
    assert.equal(vhd.footer.diskType, DISK_TYPES.DIFFERENCING)
    await vhd.readBlockAllocationTable()
    await vhd.readHeaderAndFooter()
    await vhd.readParentLocator(0)
    assert.equal(vhd.header.parentUuid, childUuid)
    assert.equal(vhd.footer.diskType, DISK_TYPES.DIFFERENCING)
    assert.equal(vhd.containsBlock(1), false)
    assert.equal(vhd.containsBlock(2), true)
    assert.equal(vhd.containsBlock(3), true)
    assert.equal(vhd.containsBlock(4), false)

    const expected = [0, 1, 0, 3, 0]
    const expectedBitmap = Buffer.alloc(512, 255) // bitmap must always be full of bit 1
    for (let index = 0; index < 5; index++) {
      if (vhd.containsBlock(index)) {
        const { id, data, bitmap } = await vhd.readBlock(index)
        assert.equal(index, id)
        assert.equal(expectedBitmap.equals(bitmap), true)
        assert.equal(data.readUInt8(0), expected[index])
      } else {
        assert.equal([2, 3].includes(index), false)
      }
    }
  })
})
