'use strict'

const { VhdAbstract } = require('./VhdAbstract')

const _computeGeometryForSize = require('../_computeGeometryForSize')
const { createFooter, createHeader } = require('../_createFooterHeader.js')
const {
  DEFAULT_BLOCK_SIZE,
  DISK_TYPES,
  FOOTER_SIZE,
  HEADER_SIZE,
  SECTOR_SIZE,
  BLOCK_UNUSED,
  PARENT_LOCATOR_ENTRIES,
  PLATFORMS,
} = require('../_constants.js')
const { unpackFooter, unpackHeader } = require('./_utils.js')

const { readChunkStrict, skipStrict } = require('@vates/read-chunk')

const assert = require('node:assert')

const BITMAP = Buffer.alloc(SECTOR_SIZE, 255)

function packUuid(uuid) {
  const PARSE_UUID_RE = /-/g

  return Buffer.from(uuid.replace(PARSE_UUID_RE, ''), 'hex')
}

exports.VhdNbd = class VhdNbd extends VhdAbstract {
  #bat
  #changedBlocks
  #header
  #footer
  #nbdClient
  #vhdStream
  #vdiInfos

  constructor(nbdClient, { changedBlocks, vhdStream, vdiInfos }) {
    super()
    assert.notEqual(changedBlocks ?? vhdStream, undefined) // either a vhd stream or the changed block list
    if (changedBlocks) {
      assert.notEqual(vdiInfos, undefined) // either a vhd stream or the changed block list + vdi infos
    }
    this.#nbdClient = nbdClient
    if (vhdStream) {
      // @todo : this stream MUST NOT be used outside
      // if it is problematic we should extract forkStreamUnpipe to its packages and use it here
      this.#vhdStream = vhdStream
    }
    this.#vdiInfos = vdiInfos
    this.#changedBlocks = changedBlocks
  }

  get header() {
    return this.#header
  }

  get footer() {
    return this.#footer
  }

  containsBlock(blockId) {
    assert.notEqual(this.#changedBlocks ?? this.#vhdStream, undefined) // either a vhd stream or the changed block list
    if (this.#changedBlocks) {
      // block are aligned, we could probably compare the bytes to 255
      // each CBT block is 64KB
      // each VHD block is 2MB
      // => 32 CBT blocks per VHD block
      // each CBT block used flag is stored in 1 bit
      // => 4 bytes per VHD block => UINT32
      // if any sublock is used => download the full block
      const position = blockId * 4
      return this.#changedBlocks.readUInt32BE(position) !== 0
    }
    const entry = this.#bat.readUInt32BE(blockId * 4)
    return entry !== BLOCK_UNUSED
  }

  async readHeaderAndFooter() {
    assert.notEqual(this.#changedBlocks ?? this.#vhdStream, undefined) // either a vhd stream or the changed block list
    if (this.#changedBlocks) {
      const { size, uuid, parentUuid } = this.#vdiInfos

      this.#header = unpackHeader(createHeader(Math.ceil(size / DEFAULT_BLOCK_SIZE)))
      const geometry = _computeGeometryForSize(size)
      // changed block can only be used to compute a differencing disk
      const diskType = DISK_TYPES.DIFFERENCING
      this.#footer = unpackFooter(createFooter(size, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, diskType))
      this.#footer.uuid = packUuid(uuid)
      if (parentUuid) {
        // this may be undefined and is a nice to have
        // but backups and xapi don't trust nor use this value
        this.#header.parentUuid = packUuid(parentUuid)
        const parentName = `${parentUuid}.vhd`
        this.#header.parentUnicodeName = parentName
      }
    } else {
      assert.strictEqual(this.#footer, undefined)
      assert.strictEqual(this.#header, undefined)
      this.#footer = unpackFooter(await readChunkStrict(this.#vhdStream, FOOTER_SIZE))
      this.#header = unpackHeader(await readChunkStrict(this.#vhdStream, HEADER_SIZE))
      // parent locator aren't generated for Vhd from NBD+CBT
      // we clean the existing parent locator to ensure consistency
      for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
        this.#header.parentLocatorEntry[i] = {
          platformCode: PLATFORMS.NONE,
          platformDataSpace: 0,
          platformDataLength: 0,
          reserved: 0,
          platformDataOffset: 0,
        }
      }
    }
  }

  async readBlockAllocationTable() {
    assert.notEqual(this.#changedBlocks ?? this.#vhdStream, undefined) // either a vhd stream or the changed block list
    if (!this.#changedBlocks) {
      assert.notEqual(this.#footer, undefined)
      assert.notEqual(this.#header, undefined)
      assert.strictEqual(this.#bat, undefined)
      const batSize = Math.ceil((this.#header.maxTableEntries * 4) / SECTOR_SIZE) * SECTOR_SIZE
      // skip space between header and beginning of the table
      await skipStrict(this.#vhdStream, this.#header.tableOffset - (FOOTER_SIZE + HEADER_SIZE))
      this.#bat = await readChunkStrict(this.#vhdStream, batSize)
    }

    // changed can be used as a bat, not need to rebuild one
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

  async stream(opts) {
    const stream = await super.stream(opts)

    stream._nbd = true
    return stream
  }
}
