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
const { removeZeroPages, restoreZeroPages } = require('./_zeroFilter')
const { asyncEach } = require('@vates/async-each')

const { debug } = createLogger('vhd-lib:VhdDirectory')

const NULL_COMPRESSOR = {
  compress: buffer => buffer,
  decompress: buffer => buffer,
  baseOptions: {},
  // an array of buffers is returned as is, the handler writes it without concatenating it
  acceptsBufferArray: true,
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
  none: NULL_COMPRESSOR,
  // no compression, only the pages full of zeroes are removed: much cheaper than a real compression
  // TODO: once the handlers write arrays of buffers (feat_writev), return the parts as is (views on the data, no
  // copy): `compress: removeZeroPages, acceptsBufferArray: true`
  zeros: {
    compress: buffer => Buffer.concat(removeZeroPages(buffer)),
    decompress: restoreZeroPages,
  },
}

// negative levels are the fastest ones: they mostly remove the runs of zeroes, and decompress about 5 times faster
// than brotli
const ZSTD_LEVEL = -3

// zstd is only available since Node 22.15
if (zlib.zstdCompress !== undefined) {
  COMPRESSORS.zstd = {
    compress: (
      zstdCompress => buffer =>
        zstdCompress(buffer, {
          params: {
            [zlib.constants.ZSTD_c_compressionLevel]: ZSTD_LEVEL,
          },
        })
    )(promisify(zlib.zstdCompress)),
    decompress: promisify(zlib.zstdDecompress),
  }
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

const CHUNK_FILTERS = 'chunk-filters.json'

const SIZE_FILE = 'size.json'

// ===================================================================
// Directory format
// <path>
// ├─ chunk-filters.json
// │    Ordered array of filters that have been applied before writing chunks.
// │    These filters needs to be applied in reverse order to read them.
// ├─ size.json
// │    stored size of the other files of this directory,
// │    to know the space used without listing the blocks
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
  #chunkSizes = new Map()
  #blocksSizeOnDisk = 0 // A disk not read through readHeaderAndFooter() is being written from scratch
  #sizeFileSize = 0

  get compressionType() {
    return this.#compressor.id
  }

  get sizeOnDisk() {
    if (this.#blocksSizeOnDisk === undefined) {
      return undefined
    }

    return (
      this.#sizeFileSize +
      this.#blocksSizeOnDisk +
      [...this.#chunkSizes.values()].reduce((total, chunkSize) => total + chunkSize, 0)
    )
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

    // opening a file for reading does not trigger EISDIR as long as we don't really read from it :
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

  // buffer can be an array of buffers, the chunk is then their concatenation
  async _writeChunk(partName, buffer) {
    assert.notStrictEqual(
      this._opts?.flags,
      'r',
      `Can't write a chunk ${partName} in ${this._path} with read permission`
    )

    const compressed = await this.#compressor.compress(
      // the handler can write an array without concatenating it, most compressors can't
      Array.isArray(buffer) && !this.#compressor.acceptsBufferArray ? Buffer.concat(buffer) : buffer
    )
    return this.#outputChunk(partName, compressed)
  }

  async #outputChunk(partName, buffer) {
    // in case of VhdDirectory, we want to create the file if it does not exists
    const flags = this._opts?.flags === 'r+' ? 'w' : this._opts?.flags
    const size = await this._handler.outputFile(this.#getChunkPath(partName), buffer, { flags })

    if (!partName.startsWith('blocks/')) {
      this.#chunkSizes.set(partName, size)
    }

    return size
  }

  // put block in subdirectories to limit impact when doing directory listing
  #getBlockPath(blockId) {
    const blockPrefix = Math.floor(blockId / 1e3)
    const blockSuffix = blockId - blockPrefix * 1e3
    return `blocks/${blockPrefix}/${blockSuffix}`
  }

  getFullBlockPath(blockId) {
    return this.#getChunkPath(this.#getBlockPath(blockId))
  }

  async readHeaderAndFooter() {
    await this.#readChunkFilters()
    await this.#readSize()

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
    assert.strictEqual(
      buffer.length,
      this.fullBlockSize,
      `partial read of a block , expecting ${this.fullBlockSize}, got ${buffer.length}`
    )
    return {
      id: blockId,
      bitmap: buffer.slice(0, this.bitmapSize),
      data: buffer.slice(this.bitmapSize),
      buffer,
    }
  }

  /**
   * read a block as stored (bitmap and data compressed together), to be written as is with writeCompressedBlock in a
   * VhdDirectory using the same compression
   */
  async readCompressedBlock(blockId) {
    return this._handler.readFile(this.getFullBlockPath(blockId))
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

  writeBlockAllocationTable(blockTable) {
    if (!blockTable || blockTable.length === 0) {
      blockTable = this.#blockTable
    }

    assert.notStrictEqual(blockTable, undefined, 'Block allocation table has not been read')
    assert.notStrictEqual(blockTable.length, 0, 'Block allocation table is empty')

    return this._writeChunk('bat', blockTable)
  }

  // only works if data are in the same handler
  // and if the full block is modified in child (which is the case with xcp)
  // and if the compression type is same on both sides
  async mergeBlock(child, blockId, isResumingMerge = false) {
    const childBlockPath = child.getFullBlockPath?.(blockId)
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
      const delta = await this.moveBlockFrom(blockId, childBlockPath)

      if (!blockExists) {
        await this.writeBlockAllocationTable()
      }

      return delta
    } catch (error) {
      if (error.code === 'ENOENT' && isResumingMerge === true) {
        // when resuming, the blocks moved since the last merge state write are
        // not in the child anymore but it should be ok

        // it will throw an error if block is missing in parent
        // won't detect if the block was already in parent and is broken/missing in child

        // the size of the block it replaced is unknown: return 0,
        // the caller recomputes the size of a resumed merge
        const { data } = await this.readBlock(blockId)
        assert.strictEqual(data.length, this.header.blockSize)
        setBitmap(this.#blockTable, blockId)

        return 0
      } else {
        throw error
      }
    }
  }

  async writeEntireBlock(block) {
    assert.strictEqual(
      block.buffer.length,
      this.fullBlockSize,
      `partial block can't be written , expecting ${this.fullBlockSize}, got ${block.buffer.length}`
    )

    await this.#writeBlock(block.id, () => this._writeChunk(this.#getBlockPath(block.id), block.buffer))
  }

  // bitmap and data are not concatenated: the handler can write them with a single writev
  async writeBlockData(blockId, data) {
    assert.strictEqual(data.length, this.header.blockSize, `block ${blockId} must be ${this.header.blockSize} bytes`)

    await this.#writeBlock(blockId, () =>
      this._writeChunk(this.#getBlockPath(blockId), [Buffer.alloc(this.bitmapSize, 255), data])
    )
  }

  /**
   * write a block read with readCompressedBlock, the caller must ensure it is compressed with the same compression as
   * this VHD
   */
  async writeCompressedBlock(blockId, buffer) {
    assert.notStrictEqual(this._opts?.flags, 'r', `Can't write block ${blockId} in ${this._path} with read permission`)

    await this.#writeBlock(blockId, () => this.#outputChunk(this.#getBlockPath(blockId), buffer))
  }

  async #writeBlock(blockId, write) {
    const oldBlockSize = this.containsBlock(blockId)
      ? await this._handler.getSizeOnDisk(this.getFullBlockPath(blockId))
      : 0

    const newBlockSize = await write()
    setBitmap(this.#blockTable, blockId)

    if (this.#blocksSizeOnDisk !== undefined) {
      this.#blocksSizeOnDisk += newBlockSize - oldBlockSize
    }

    return newBlockSize - oldBlockSize
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
    const path = this.#getChunkPath(CHUNK_FILTERS)
    if (compressionType === undefined) {
      await this._handler.unlink(path)
      this.#chunkSizes.delete(CHUNK_FILTERS)
    } else {
      const size = await this._handler.writeFile(path, JSON.stringify([compressionType]), { flags: 'w' })
      this.#chunkSizes.set(CHUNK_FILTERS, size)
    }
  }

  async #readChunkFilters() {
    const chunkFilters = await this._handler.readFile(this.#getChunkPath(CHUNK_FILTERS)).then(JSON.parse, error => {
      if (error.code === 'ENOENT') {
        return []
      }
      throw error
    })
    this.#compressor = getCompressor(chunkFilters[0])
  }

  async writeSize() {
    assert.notStrictEqual(this.#blocksSizeOnDisk, undefined, `Disk size currently unknown`)

    this.#sizeFileSize = await this._handler.writeFile(
      this.#getChunkPath(SIZE_FILE),
      JSON.stringify({
        version: 1,
        chunks: Object.fromEntries(this.#chunkSizes),
        blocks: this.#blocksSizeOnDisk,
      }),
      { flags: 'w' }
    )
  }

  async #readSize() {
    this.#chunkSizes = new Map()
    this.#blocksSizeOnDisk = undefined
    this.#sizeFileSize = 0

    const sizeFile = await this._handler.readFile(this.#getChunkPath(SIZE_FILE)).then(JSON.parse, error => {
      if (error.code !== 'ENOENT') {
        throw error
      }
    })

    if (sizeFile !== undefined) {
      this.#chunkSizes = new Map(Object.entries(sizeFile.chunks))
      this.#blocksSizeOnDisk = sizeFile.blocks
      this.#sizeFileSize = await this._handler.getSizeOnDisk(this.#getChunkPath(SIZE_FILE))
    }
  }

  async computeSizeOnDisk() {
    const blockPaths = []
    const groups = await this._handler.list(this.#getChunkPath('blocks'), { prependDir: true, ignoreMissing: true })
    for (const group of groups) {
      const files = await this._handler.list(group, { prependDir: true })
      blockPaths.push(...files)
    }

    let sizeOnDisk = 0
    await asyncEach(
      blockPaths,
      async path => {
        const size = await this._handler.getSizeOnDisk(path)
        sizeOnDisk += size
      },
      { concurrency: 16 }
    )

    const metadataFilesSizes = new Map()
    const metadataFiles = await this._handler.list(this._path)
    for (const metadataFile of metadataFiles) {
      if (metadataFile !== 'blocks' && metadataFile !== SIZE_FILE) {
        metadataFilesSizes.set(metadataFile, await this._handler.getSizeOnDisk(this.#getChunkPath(metadataFile)))
      }
    }

    this.#chunkSizes = metadataFilesSizes
    this.#blocksSizeOnDisk = sizeOnDisk
    this.#sizeFileSize = metadataFiles.includes(SIZE_FILE)
      ? await this._handler.getSizeOnDisk(this.#getChunkPath(SIZE_FILE))
      : 0

    return this.sizeOnDisk
  }

  /**
   * moves a block file of another VhdDirectory in this one as is:
   * the caller must ensure it uses the same compression
   */
  async moveBlockFrom(blockId, sourcePath) {
    assert.notStrictEqual(this._opts?.flags, 'r', `Can't move block ${blockId} from ${sourcePath} with read permission`)

    return this.#writeBlock(blockId, async () => {
      await this._handler.rename(sourcePath, this.getFullBlockPath(blockId))
      return this._handler.getSizeOnDisk(this.getFullBlockPath(blockId))
    })
  }

  setAllocatedBlocks(blockIds) {
    for (const blockId of blockIds) {
      setBitmap(this.#blockTable, blockId)
    }
  }
}
