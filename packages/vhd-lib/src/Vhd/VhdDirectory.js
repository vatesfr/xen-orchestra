import { BLOCK_UNUSED } from '../../dist/_constants'
import { createLogger } from '@xen-orchestra/log'
import { fuFooter, fuHeader, checksumStruct } from '../_structs'
import { SECTOR_SIZE } from '../_constants'
import { buildHeader, buildFooter, computeBatSize } from './_utils'
import { test, set as setBitmap } from '../_bitmap'
import { VhdAbstract } from './VhdAbstract'
import assert from 'assert'

const { debug } = createLogger('vhd-lib:VhdDirectory')

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

  constructor(handler, path, flags) {
    super()
    this._handler = handler
    this._path = path
    this._flags = flags
  }

  async readBlockAllocationTable() {

    const { buffer } = await this._readChunk('bat')
    /**
     * In directory mode, the bat is a sequence of bits
     * A zero bit indicates that the block is not present
     */
    const batSize = this.header.maxTableEntries
    this.blockTable = Buffer.alloc(batSize * 4)
    let start = this.header.tableOffset + computeBatSize(this.header.maxTableEntries)
    start /= SECTOR_SIZE // in sector
    const blockSectorSize = this.fullBlockSize / SECTOR_SIZE
    let nbNonEmptyblock = 0
    for (let blockId = 0; blockId < this.header.maxTableEntries; blockId++) {
      if (test(buffer, blockId)) {
        this.blockTable.writeUInt32BE(start + nbNonEmptyblock * blockSectorSize, blockId * 4)
        nbNonEmptyblock++
      } else {
        this.blockTable.writeUInt32BE(BLOCK_UNUSED, blockId * 4)
      }
    }
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

  async _writeChunk(partName, buffer) {
    assert(Buffer.isBuffer(buffer))
    // here we can implement compression and / or crypto
    return this._handler.writeFile(this.getChunkPath(partName), buffer, { flags: this._flags })
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
      throw new Error(`reading 'bitmap of block' ${blockId} in a VhdDIrecotry is not implemented`)
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

  writeHeader() {
    const { header } = this
    const rawHeader = fuHeader.pack(header)
    header.checksum = checksumStruct(rawHeader, fuHeader)
    debug(`Write header  (checksum=${header.checksum}). (data=${rawHeader.toString('hex')})`)
    return this._writeChunk('header', rawHeader)
  }

  writeBlockAllocationTable() {
    assert.notStrictEqual(this.blockTable, undefined, 'Block allocation table has not been read')
    assert(this.blockTable.length, 'Block allocation table is empty')
    assert(this.blockTable.length % 4 === 0, 'Block allocation table size is incorrect')

    const { blockTable } = this

    /**
     * In directory mode, the bat is a sequence of bits
     * A zero bit indicates that the block is not present
     */
    const buffer = Buffer.alloc(this.header.maxTableEntries, 0)
    for (let blockId = 0; blockId < blockTable.length / 4; blockId++) {
      if (this.blockTable.readUInt32BE(blockId * 4) !== BLOCK_UNUSED) {
        setBitmap(buffer, blockId)
      }
    }
    return this._writeChunk('bat', buffer)
  }

  setUniqueParentLocator(fileNameString) {
    const encodedFilename = Buffer.from(fileNameString, 'utf16le')
    return this._write('parentLocator0', encodedFilename)
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

  readParentLocatorData(parentLocatorId) {
    assert(parentLocatorId >= 0, 'parent Locator id must be a positive number')
    assert(parentLocatorId < 8, 'parent Locator id  must be less than 8')
    const { platformDataSpace } = this.header.parentLocatorEntry[parentLocatorId]
    if (!platformDataSpace) {
      return
    }
    return this._readChunk('parentLocator' + parentLocatorId)
  }

  _writeParentLocator(parentLocatorId, data) {
    return this._writeChunk('parentLocator' + parentLocatorId, data)
  }
}
