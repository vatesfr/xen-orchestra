'use strict'

const { VhdAbstract } = require('./VhdAbstract')

const { DEFAULT_BLOCK_SIZE, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE, BLOCK_UNUSED } = require('../_constants.js')
const { unpackFooter, unpackHeader } = require('./_utils.js')

const assert = require('node:assert')
const { readChunkStrict, skipStrict } = require('@vates/read-chunk')

const BITMAP = Buffer.alloc(SECTOR_SIZE, 255)

exports.VhdNbd = class VhdNbd extends VhdAbstract {
  #bat
  #header
  #footer
  #nbdClient
  #vhdStream

  constructor(nbdClient, { vhdStream }) {
    super()
    assert.notEqual(vhdStream, undefined) // either a vhd stream or the changed block list

    this.#nbdClient = nbdClient
    if (vhdStream) {
      // @todo : this stream MUST NOT be used outside
      // if it is problematic we should extract forkStreamUnpipe to its packages and use it here
      this.#vhdStream = vhdStream
    }
  }

  get header() {
    return this.#header
  }

  get footer() {
    return this.#footer
  }

  containsBlock(blockId) {
    assert.notEqual(this.#vhdStream, undefined) // either a vhd stream or the changed block list

    const entry = this.#bat.readUInt32BE(blockId * 4)
    return entry !== BLOCK_UNUSED
  }

  async readHeaderAndFooter() {
    assert.notEqual(this.#vhdStream, undefined) // either a vhd stream or the changed block list

    assert.strictEqual(this.#footer, undefined)
    assert.strictEqual(this.#header, undefined)
    this.#footer = unpackFooter(await readChunkStrict(this.#vhdStream, FOOTER_SIZE))
    this.#header = unpackHeader(await readChunkStrict(this.#vhdStream, HEADER_SIZE))
  }

  async readBlockAllocationTable() {
    assert.notEqual(this.#vhdStream, undefined) // either a vhd stream or the changed block list
    assert.notEqual(this.#footer, undefined)
    assert.notEqual(this.#header, undefined)
    assert.strictEqual(this.#bat, undefined)
    const batSize = Math.ceil((this.#header.maxTableEntries * 4) / SECTOR_SIZE) * SECTOR_SIZE
    // skip space between header and beginning of the table
    await skipStrict(this.#vhdStream, this.#header.tableOffset - (FOOTER_SIZE + HEADER_SIZE))
    this.#bat = await readChunkStrict(this.#vhdStream, batSize)
    this.#vhdStream.destroy() // we w'ont need it anymore
  }

  async readBlock(blockId) {
    return this.#nbdClient.readBlock(blockId, DEFAULT_BLOCK_SIZE).then(data => {
      return {
        id: blockId,
        bitmap: BITMAP,
        data,
        buffer: Buffer.concat([BITMAP, data]),
      }
    })
  }
}
