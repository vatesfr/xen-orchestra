'use strict'

const { unpackHeader, unpackFooter } = require('./_utils')
const { createLogger } = require('@xen-orchestra/log')
const { fuFooter, fuHeader, checksumStruct } = require('../_structs')
const { test, set: setBitmap } = require('../_bitmap')
const { VhdAbstract } = require('./VhdAbstract')
const assert = require('assert')
const { synchronized } = require('decorator-synchronized')
const promisify = require('promise-toolbox/promisify')
const zlib = require('zlib')

const { debug } = createLogger('vhd-lib:VhdDirectory')

const NULL_COMPRESSOR = {
  compress: buffer => buffer,
  decompress: buffer => buffer,
  baseOptions: {},
}

const COMPRESSORS = {
  gzip: {
    compress: (
      gzip => buffer =>
        gzip(buffer, { level: zlib.constants.Z_BEST_SPEED })
    )(promisify(zlib.gzip)),
    decompress: promisify(zlib.gunzip),
  },
  brotli: {
    compress: (
      brotliCompress => buffer =>
        brotliCompress(buffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MIN_QUALITY,
          },
        })
    )(promisify(zlib.brotliCompress)),
    decompress: promisify(zlib.brotliDecompress),
  },
}

// inject identifiers
for (const id of Object.keys(COMPRESSORS)) {
  COMPRESSORS[id].id = id
}

function getCompressor(compressorType) {
  if (compressorType === undefined) {
    return NULL_COMPRESSOR
  }

  const compressor = COMPRESSORS[compressorType]

  if (compressor === undefined) {
    throw new Error(`Compression type ${compressorType} is not supported`)
  }

  return compressor
}

// ===================================================================
// Directory format
// <path>
// ├─ chunk-filters.json
// │    Ordered array of filters that have been applied before writing chunks.
// │    These filters needs to be applied in reverse order to read them.
// │
// ├─ header // raw content of the header
// ├─ footer // raw content of the footer
// ├─ bat // bit array. A zero bit indicates at a position that this block is not present
// ├─ parentLocatorEntry{0-7} // data of a parent locator
// ├─ blocks // blockId is the position in the BAT
//    └─ <the first to  {blockId.length -3} numbers of blockId >
//         └─ <the three last numbers  of blockID >  // block content.

exports.VhdDirectory = class VhdDirectory extends VhdAbstract {
  #uncheckedBlockTable
  #header
  footer
  #compressor

  get compressionType() {
    return this.#compressor.id
  }

  set header(header) {
    this.#header = header
    this.#blockTable = Buffer.alloc(header.maxTableEntries)
  }

  get header() {
    assert.notStrictEqual(this.#header, undefined, `header must be read before it's used`)
    return this.#header
  }

  get #blockTable() {
    assert.notStrictEqual(this.#uncheckedBlockTable, undefined, 'Block table must be initialized before access')
    return this.#uncheckedBlockTable
  }

  set #blockTable(blockTable) {
    this.#uncheckedBlockTable = blockTable
  }

  static async open(handler, path, { flags = 'r+' } = {}) {
    const vhd = new VhdDirectory(handler, path, { flags })

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

  static async create(handler, path, { flags = 'wx+', compression } = {}) {
    await handler.mktree(path)
    const vhd = new VhdDirectory(handler, path, { flags, compression })
    return {
      dispose: () => {},
      value: vhd,
    }
  }

  constructor(handler, path, opts) {
    super()
    this._handler = handler
    this._path = path
    this._opts = opts
    this.#compressor = getCompressor(opts?.compression)
    this.writeBlockAllocationTable = synchronized()(this.writeBlockAllocationTable)
  }

  async readBlockAllocationTable() {
    const { buffer } = await this._readChunk('bat')
    this.#blockTable = buffer
  }

  containsBlock(blockId) {
    return test(this.#blockTable, blockId)
  }

  #getChunkPath(partName) {
    return this._path + '/' + partName
  }

  async _readChunk(partName) {
    // here we can implement compression and / or crypto
    const buffer = await this._handler.readFile(this.#getChunkPath(partName))

    const uncompressed = await this.#compressor.decompress(buffer)
    return {
      buffer: uncompressed,
    }
  }

  async _writeChunk(partName, buffer) {
    assert.notStrictEqual(
      this._opts?.flags,
      'r',
      `Can't write a chunk ${partName} in ${this._path} with read permission`
    )

    // in case of VhdDirectory, we want to create the file if it does not exists
    const flags = this._opts?.flags === 'r+' ? 'w' : this._opts?.flags
    const compressed = await this.#compressor.compress(buffer)
    return this._handler.outputFile(this.#getChunkPath(partName), compressed, { flags })
  }

  // put block in subdirectories to limit impact when doing directory listing
  #getBlockPath(blockId) {
    const blockPrefix = Math.floor(blockId / 1e3)
    const blockSuffix = blockId - blockPrefix * 1e3
    return `blocks/${blockPrefix}/${blockSuffix}`
  }

  _getFullBlockPath(blockId) {
    return this.#getChunkPath(this.#getBlockPath(blockId))
  }

  async readHeaderAndFooter() {
    await this.#readChunkFilters()

    let bufHeader, bufFooter
    try {
      bufHeader = (await this._readChunk('header')).buffer
      bufFooter = (await this._readChunk('footer')).buffer
    } catch (error) {
      // emit an AssertionError if the VHD is broken to stay as close as possible to the VhdFile API
      if (error.code === 'ENOENT') {
        assert(false, 'Header And Footer should exists')
      } else {
        throw error
      }
    }
    const footer = unpackFooter(bufFooter)
    const header = unpackHeader(bufHeader, footer)

    this.footer = footer
    this.header = header
  }

  async readBlock(blockId, onlyBitmap = false) {
    if (onlyBitmap) {
      throw new Error(`reading 'bitmap of block' ${blockId} in a VhdDirectory is not implemented`)
    }
    const { buffer } = await this._readChunk(this.#getBlockPath(blockId))
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

  async writeHeader() {
    const { header } = this
    const rawHeader = fuHeader.pack(header)
    header.checksum = checksumStruct(rawHeader, fuHeader)
    debug(`Write header  (checksum=${header.checksum}). (data=${rawHeader.toString('hex')})`)
    await this._writeChunk('header', rawHeader)
    await this.#writeChunkFilters()
  }

  writeBlockAllocationTable() {
    assert.notStrictEqual(this.#blockTable, undefined, 'Block allocation table has not been read')
    assert.notStrictEqual(this.#blockTable.length, 0, 'Block allocation table is empty')

    return this._writeChunk('bat', this.#blockTable)
  }

  // only works if data are in the same handler
  // and if the full block is modified in child (which is the case with xcp)
  // and if the compression type is same on both sides
  async mergeBlock(child, blockId, isResumingMerge = false) {
    const childBlockPath = child._getFullBlockPath?.(blockId)
    if (
      childBlockPath === undefined ||
      this._handler !== child._handler ||
      child.compressionType !== this.compressionType ||
      child.compressionType === 'MIXED'
    ) {
      return super.mergeBlock(child, blockId)
    }
    try {
      const blockExists = this.containsBlock(blockId)
      await this._handler.rename(childBlockPath, this._getFullBlockPath(blockId))
      if (!blockExists) {
        setBitmap(this.#blockTable, blockId)
        await this.writeBlockAllocationTable()
      }
    } catch (error) {
      if (error.code === 'ENOENT' && isResumingMerge === true) {
        // when resuming, the blocks moved since the last merge state write are
        // not in the child anymore but it should be ok

        // it will throw an error if block is missing in parent
        // won't detect if the block was already in parent and is broken/missing in child
        const { data } = await this.readBlock(blockId)
        assert.strictEqual(data.length, this.header.blockSize)
      } else {
        throw error
      }
    }
    setBitmap(this.#blockTable, blockId)
    return this._handler.getSizeOnDisk(this._getFullBlockPath(blockId))
  }

  async writeEntireBlock(block) {
    await this._writeChunk(this.#getBlockPath(block.id), block.buffer)
    setBitmap(this.#blockTable, block.id)
  }

  async _readParentLocatorData(id) {
    return (await this._readChunk('parentLocatorEntry' + id)).buffer
  }

  async _writeParentLocatorData(id, data) {
    await this._writeChunk('parentLocatorEntry' + id, data)
    this.header.parentLocatorEntry[id].platformDataOffset = 0
  }

  async #writeChunkFilters() {
    const compressionType = this.compressionType
    const path = this._path + '/chunk-filters.json'
    if (compressionType === undefined) {
      await this._handler.unlink(path)
    } else {
      await this._handler.writeFile(path, JSON.stringify([compressionType]), { flags: 'w' })
    }
  }

  async #readChunkFilters() {
    const chunkFilters = await this._handler.readFile(this._path + '/chunk-filters.json').then(JSON.parse, error => {
      if (error.code === 'ENOENT') {
        return []
      }
      throw error
    })
    this.#compressor = getCompressor(chunkFilters[0])
  }
}
