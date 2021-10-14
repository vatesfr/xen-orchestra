import { buildHeader, buildFooter } from './_utils'
import { createLogger } from '@xen-orchestra/log'
import { fuFooter, fuHeader, checksumStruct } from '../_structs'
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
// ├─ parentLocatorEntry{0-7} // data of a parent locator
// ├─ blocks // blockId is the position in the BAT
//    └─ <the first to  {blockId.length -3} numbers of blockId >
//         └─ <the three last numbers  of blockID >  // block content.

export class VhdDirectory extends VhdAbstract {
  #uncheckedBlockTable

  set header(header) {
    super.header = header
    this.#blockTable = Buffer.alloc(header.maxTableEntries)
  }

  get header() {
    return super.header
  }

  get #blockTable() {
    assert.notStrictEqual(this.#uncheckedBlockTable, undefined, 'Block table must be initialized before access')
    return this.#uncheckedBlockTable
  }

  set #blockTable(blockTable) {
    this.#uncheckedBlockTable = blockTable
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

  async _writeChunk(partName, buffer) {
    assert(Buffer.isBuffer(buffer))
    // here we can implement compression and / or crypto

    // chunks can be in sub directories :  create direcotries if necessary
    const pathParts = partName.split('/')
    let currentPath = this._path

    // the last one is the file name
    for (let i = 0; i < pathParts.length - 1; i++) {
      currentPath += '/' + pathParts[i]
      await this._handler.mkdir(currentPath)
    }

    return this._handler.writeFile(this.getChunkPath(partName), buffer)
  }

  // put block in subdirectories to limit impact when doing directory listing
  _getBlockPath(blockId) {
    const blockPrefix = Math.floor(blockId / 1e3)
    const blockSuffix = blockId - blockPrefix * 1e3
    return `blocks/${blockPrefix}/${blockSuffix}`
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
    const { buffer } = await this._readChunk(this._getBlockPath(blockId))
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

  // only works if data are in the same handler
  // and if the full block is modified in child ( which is the case whit xcp)

  async coalesceBlock(child, blockId) {
    assert.strictEqual(this._handler, child._handler)
    this._handler.copy(child._getBlockPath(blockId), this.getChunkPath(blockId))
    return await this._handler.getSize(this.getChunkPath(blockId))
  }

  async writeEntireBlock(block) {
    await this._writeChunk(this._getBlockPath(block.id), block.buffer)
    setBitmap(this.#blockTable, block.id)
  }

  async _readParentLocatorData(id) {
    return (await this._readChunk('parentLocatorEntry' + id)).buffer
  }

  async _writeParentLocatorData(id, data) {
    await this._writeChunk('parentLocatorEntry' + id, data)
    this.header.parentLocatorEntry[id].platformDataOffset = 0
  }
}
