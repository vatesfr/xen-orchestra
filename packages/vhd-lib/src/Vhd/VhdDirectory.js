import { BLOCK_UNUSED } from '../../dist/_constants'
import { createLogger } from '@xen-orchestra/log'
import { fuFooter, fuHeader, checksumStruct } from '../_structs'
import { SECTOR_SIZE } from '../_constants'
import { buildHeader, buildFooter, computeBatSize } from './_utils'
import { test, set as setBitmap } from '../_bitmap'
import { VhdAbstract } from './VhdAbstract'
import assert from 'assert'

const { debug } = createLogger('vhd-lib:VhdDirectory')

// ===================================================================
// Directory format
// <path>
// ├─ header // raw content of the header
// ├─ footer // raw content of the footer
// ├─ bat // bit array. A zero bit indicates at a position that this block is not present
// ├─ parentLocator{0-7} // data of a parent locator
// ├─ 1..n // block content. The filename is the position in the BAT

export class VhdDirectory extends VhdAbstract {
  static async open(handler, path) {
    const vhd = new VhdDirectory(handler, path)

    // openning a file for reading does not trigger EISDIR as long as we don't really read from it :
    // https://man7.org/linux/man-pages/man2/open.2.html
    // EISDIR pathname refers to a directory and the access requested
    // involved writing (that is, O_WRONLY or O_RDWR is set).
    // reading the header ensure we have a well formed directory immediatly
    await vhd.readHeaderAndFooter()
    return {
      dispose: () => {},
      value: vhd,
    }
  }

  static async create(handler, path) {
    await handler.mkdir(path)
    const vhd = new VhdDirectory(handler, path)
    return {
      dispose: () => {},
      value: vhd,
    }
  }

  constructor(handler, path) {
    super()
    this._handler = handler
    this._path = path
  }

  async readBlockAllocationTable() {
    const { buffer } = await this._readChunk('bat')
    const { header, fullBlockSize } = this
    /**
     * In directory mode, the bat is a sequence of bits
     * A zero bit indicates that the block is not present
     */
    const batSize = header.maxTableEntries
    const blockTable = Buffer.alloc(batSize * 4)
    let start = header.tableOffset + computeBatSize(header.maxTableEntries)
    start /= SECTOR_SIZE // in sector
    const blockSectorSize = fullBlockSize / SECTOR_SIZE
    let nbNonEmptyblock = 0
    let parentLocatorSectorOffset = 0

    const getNextAvailableSectorForBlock = () => {
      const currentSector = start + parentLocatorSectorOffset + nbNonEmptyblock * blockSectorSize
      for (let i = 0; i < 8; i++) {
        const p = header.parentLocatorEntry[i]
        const pSectorSize = p.platformDataSpace / SECTOR_SIZE
        const pSectorOffset = p.platformDataSpaceOffset / SECTOR_SIZE
        // check if the block will overwrite a parent locator
        if (pSectorOffset <= currentSector + blockSectorSize && pSectorOffset + pSectorSize >= currentSector) {
          parentLocatorSectorOffset += pSectorSize
          // moving the block can overwrite another parent locator , should check
          return getNextAvailableSectorForBlock()
        }
      }
      return currentSector
    }

    for (let blockId = 0; blockId < header.maxTableEntries; blockId++) {
      if (test(buffer, blockId)) {
        blockTable.writeUInt32BE(getNextAvailableSectorForBlock(), blockId * 4)
        nbNonEmptyblock++
      } else {
        blockTable.writeUInt32BE(BLOCK_UNUSED, blockId * 4)
      }
    }
    this.blockTable = blockTable
  }

  containsBlock(blockId) {
    assert.notStrictEqual(this.blockTable, undefined, 'Block table must not be empty to access a block address')

    return this.blockTable.readUInt32BE(blockId * 4) !== BLOCK_UNUSED
  }

  getChunkPath(partName) {
    return this._path + '/' + partName
  }

  async _readChunk(partName) {
    // here we can implement compression and / or crypto
    const buffer = await this._handler.readFile(this.getChunkPath(partName))

    return {
      buffer: Buffer.from(buffer),
    }
  }

  async _writeChunk(partName, buffer, opts = { allowOverwrite: false }) {
    assert(Buffer.isBuffer(buffer))
    const flags = opts.allowOverwrite ? 'w' : 'wx'
    // here we can implement compression and / or crypto
    return this._handler.writeFile(this.getChunkPath(partName), buffer, { flags })
  }

  async readHeaderAndFooter() {
    const { buffer: bufHeader } = await this._readChunk('header')
    const { buffer: bufFooter } = await this._readChunk('footer')
    const footer = buildFooter(bufFooter)
    const header = buildHeader(bufHeader, footer)

    this.footer = footer
    this.header = header
  }

  async readBlock(blockId, onlyBitmap = false) {
    if (onlyBitmap) {
      throw new Error(`reading 'bitmap of block' ${blockId} in a VhdDirectory is not implemented`)
    }
    const { buffer } = await this._readChunk(blockId)
    return {
      id: blockId,
      bitmap: buffer.slice(0, this.bitmapSize),
      data: buffer.slice(this.bitmapSize),
      buffer,
    }
  }
  ensureBatSize() {
    // nothing to do in directory mode
  }

  async writeFooter() {
    const { footer } = this

    const rawFooter = fuFooter.pack(footer)

    footer.checksum = checksumStruct(rawFooter, fuFooter)
    debug(`Write footer  (checksum=${footer.checksum}). (data=${rawFooter.toString('hex')})`)

    await this._writeChunk('footer', rawFooter)
  }

  writeHeader(opts) {
    const { header } = this
    const rawHeader = fuHeader.pack(header)
    header.checksum = checksumStruct(rawHeader, fuHeader)
    debug(`Write header  (checksum=${header.checksum}). (data=${rawHeader.toString('hex')})`)
    return this._writeChunk('header', rawHeader, opts)
  }

  writeBlockAllocationTable() {
    const { blockTable, header } = this
    assert.notStrictEqual(blockTable, undefined, 'Block allocation table has not been read')
    assert.notStrictEqual(blockTable.length, 0, 'Block allocation table is empty')
    assert(
      blockTable.length % 4 === 0,
      `Block allocation table size is incorrect, not a multiple of 4  ${blockTable.length}`
    )

    /**
     * In directory mode, the bat is a sequence of bits
     * A zero bit indicates that the block is not present
     */
    const buffer = Buffer.alloc(header.maxTableEntries, 0)
    for (let blockId = 0; blockId < blockTable.length / 4; blockId++) {
      if (blockTable.readUInt32BE(blockId * 4) !== BLOCK_UNUSED) {
        setBitmap(buffer, blockId)
      }
    }
    return this._writeChunk('bat', buffer)
  }

  // only works if data are in the same bucket
  // and if the full block is modified in child ( which is the case whit xcp)

  coalesceBlock(child, blockId) {
    this._handler.copy(child.getChunkPath(blockId), this.getChunkPath(blockId))
  }

  async writeEntireBlock(block) {
    // @todo should check if bat should be updated
    await this._writeChunk(block.id, block.buffer)
  }

  _readParentLocatorData(parentLocatorId) {
    return this._readChunk('parentLocator' + parentLocatorId)
  }

  async _writeParentLocatorData(parentLocatorId, data) {
    await this._writeChunk('parentLocator' + parentLocatorId, data)
  }
}
