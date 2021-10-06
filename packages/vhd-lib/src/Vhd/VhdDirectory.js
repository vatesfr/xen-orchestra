import { createLogger } from '@xen-orchestra/log'
import { fuFooter, fuHeader, checksumStruct } from '../_structs'
import { buildHeader, buildFooter } from './_utils'
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
  #blockTable

  set header(header) {
    super.header = header
    this.#blockTable = Buffer.alloc(header.maxTableEntries)
  }

  get header() {
    return super.header()
  }

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
    this.#blockTable = buffer
  }

  containsBlock(blockId) {
    assert.notStrictEqual(this.#blockTable, undefined, 'Block table must not be empty to access a block address')

    return test(this.#blockTable, blockId)
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

  writeHeader() {
    const { header } = this
    const rawHeader = fuHeader.pack(header)
    header.checksum = checksumStruct(rawHeader, fuHeader)
    debug(`Write header  (checksum=${header.checksum}). (data=${rawHeader.toString('hex')})`)
    return this._writeChunk('header', rawHeader)
  }

  writeBlockAllocationTable() {
    assert.notStrictEqual(this.#blockTable, undefined, 'Block allocation table has not been read')
    assert.notStrictEqual(this.#blockTable.length, 0, 'Block allocation table is empty')

    return this._writeChunk('bat', this.#blockTable)
  }

  // only works if data are in the same bucket
  // and if the full block is modified in child ( which is the case whit xcp)

  coalesceBlock(child, blockId) {
    this._handler.copy(child.getChunkPath(blockId), this.getChunkPath(blockId))
  }

  async writeEntireBlock(block) {
    await this._writeChunk(block.id, block.buffer)
    setBitmap(this.#blockTable, block.id)
  }

  _readParentLocatorData(parentLocatorId) {
    return this._readChunk('parentLocator' + parentLocatorId)
  }

  async _writeParentLocatorData(parentLocatorId, data) {
    await this._writeChunk('parentLocator' + parentLocatorId, data)
    this.header.parentLocatorEntry[parentLocatorId].platformDataOffset = 0
  }
}
