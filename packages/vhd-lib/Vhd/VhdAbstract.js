'use strict'

const {
  computeBatSize,
  computeFullBlockSize,
  computeSectorOfBitmap,
  computeSectorsPerBlock,
  sectorsToBytes,
} = require('./_utils')
const {
  ALIAS_MAX_PATH_LENGTH,
  PLATFORMS,
  SECTOR_SIZE,
  PARENT_LOCATOR_ENTRIES,
  FOOTER_SIZE,
  HEADER_SIZE,
  BLOCK_UNUSED,
} = require('../_constants')
const assert = require('assert')
const path = require('path')
const asyncIteratorToStream = require('async-iterator-to-stream')
const { createLogger } = require('@xen-orchestra/log')
const { checksumStruct, fuFooter, fuHeader } = require('../_structs')
const { isVhdAlias, resolveVhdAlias } = require('../aliases')

const { warn } = createLogger('vhd-lib:VhdAbstract')
exports.VhdAbstract = class VhdAbstract {
  get bitmapSize() {
    return sectorsToBytes(this.sectorsOfBitmap)
  }

  get fullBlockSize() {
    return computeFullBlockSize(this.header.blockSize)
  }

  get sectorsOfBitmap() {
    return computeSectorOfBitmap(this.header.blockSize)
  }

  get sectorsPerBlock() {
    return computeSectorsPerBlock(this.header.blockSize)
  }

  get header() {
    throw new Error('get header is not implemented')
  }

  get footer() {
    throw new Error('get footer not implemented')
  }

  /**
   * instantiate a Vhd
   *
   * @returns {AbstractVhd}
   */
  static async open() {
    throw new Error('open not implemented')
  }

  /**
   * Check if this vhd contains a block with id blockId
   * Must be called after readBlockAllocationTable
   *
   * @param {number} blockId
   * @returns {boolean}
   *
   */
  containsBlock(blockId) {
    throw new Error(`checking if this vhd contains the block ${blockId} is not implemented`)
  }

  /**
   * Read the header and the footer
   * check their integrity
   * if checkSecondFooter also checks that the footer at the end is equal to the one at the beginning
   *
   * @param {boolean} checkSecondFooter
   */
  readHeaderAndFooter(checkSecondFooter = true) {
    throw new Error(
      `reading and checking footer, ${checkSecondFooter ? 'second footer,' : ''} and header is not implemented`
    )
  }

  readBlockAllocationTable() {
    throw new Error(`reading block allocation table is not implemented`)
  }

  /**
   * @typedef {Object} BitmapBlock
   * @property {number} id
   * @property {Buffer} bitmap
   *
   * @typedef {Object} FullBlock
   * @property {number} id
   * @property {Buffer} bitmap
   * @property {Buffer} data
   * @property {Buffer} buffer - bitmap + data
   *
   * @param {number} blockId
   * @param {boolean} onlyBitmap
   * @returns {Promise<BitmapBlock | FullBlock>}
   */
  readBlock(blockId, onlyBitmap = false) {
    throw new Error(`reading  ${onlyBitmap ? 'bitmap of block' : 'block'} ${blockId} is not implemented`)
  }

  /**
   * coalesce the block with id blockId from the child vhd into
   * this vhd
   *
   * @param {AbstractVhd} child
   * @param {number} blockId
   *
   * @returns {number} the merged data size
   */
  async mergeBlock(child, blockId) {
    const isBlockPresent = this.containsBlock(blockId)
    const block = await child.readBlock(blockId)
    await this.writeEntireBlock(block)
    return isBlockPresent ? 0 : this.fullBlockSize
  }

  /**
   * ensure the bat size can store at least entries block
   * move blocks if needed
   * @param {number} entries
   */
  ensureBatSize(entries) {
    throw new Error(`ensuring batSize can store at least  ${entries} is not implemented`)
  }

  // Write a context footer. (At the end and beginning of a vhd file.)
  writeFooter(onlyEndFooter = false) {
    throw new Error(`writing footer   ${onlyEndFooter ? 'only at end' : 'on both side'} is not implemented`)
  }

  writeHeader() {
    throw new Error(`writing header is not implemented`)
  }

  _writeParentLocatorData(parentLocatorId, platformDataOffset, data) {
    throw new Error(`write Parent locator ${parentLocatorId} is not implemented`)
  }

  _readParentLocatorData(parentLocatorId, platformDataOffset, platformDataSpace) {
    throw new Error(`read Parent locator ${parentLocatorId} is not implemented`)
  }
  // common
  get batSize() {
    return computeBatSize(this.header.maxTableEntries)
  }

  async writeParentLocator({ id, platformCode = PLATFORMS.NONE, data = Buffer.alloc(0) }) {
    assert(id >= 0, 'parent Locator id must be a positive number')
    assert(id < PARENT_LOCATOR_ENTRIES, `parent Locator id  must be less than ${PARENT_LOCATOR_ENTRIES}`)

    await this._writeParentLocatorData(id, data)

    const entry = this.header.parentLocatorEntry[id]
    const dataSpaceSectors = Math.ceil(data.length / SECTOR_SIZE)
    entry.platformCode = platformCode
    entry.platformDataSpace = dataSpaceSectors
    entry.platformDataLength = data.length
  }

  async readParentLocator(id) {
    assert(id >= 0, 'parent Locator id must be a positive number')
    assert(id < PARENT_LOCATOR_ENTRIES, `parent Locator id  must be less than ${PARENT_LOCATOR_ENTRIES}`)
    const data = await this._readParentLocatorData(id)
    // offset is storage specific, don't expose it
    const { platformCode } = this.header.parentLocatorEntry[id]
    return {
      platformCode,
      id,
      data,
    }
  }

  async setUniqueParentLocator(fileNameString) {
    await this.writeParentLocator({
      id: 0,
      platformCode: PLATFORMS.W2KU,
      data: Buffer.from(fileNameString, 'utf16le'),
    })

    for (let i = 1; i < PARENT_LOCATOR_ENTRIES; i++) {
      await this.writeParentLocator({
        id: i,
        platformCode: PLATFORMS.NONE,
        data: Buffer.alloc(0),
      })
    }
  }

  async *blocks() {
    const nBlocks = this.header.maxTableEntries
    for (let blockId = 0; blockId < nBlocks; ++blockId) {
      if (await this.containsBlock(blockId)) {
        yield await this.readBlock(blockId)
      }
    }
  }

  static async unlink(handler, path) {
    let resolved = path
    try {
      resolved = await resolveVhdAlias(handler, path)
    } catch (err) {
      // broken vhd directory must be unlinkable
      if (err.code !== 'EISDIR') {
        throw err
      }
      warn('Deleting directly a VhdDirectory', { path, err })
    }
    try {
      await handler.unlink(resolved)
    } catch (err) {
      if (err.code === 'EISDIR') {
        await handler.rmtree(resolved)
      } else {
        throw err
      }
    }

    // also delete the alias file
    if (path !== resolved) {
      await handler.unlink(path)
    }
  }

  static async createAlias(handler, aliasPath, targetPath) {
    if (!isVhdAlias(aliasPath)) {
      throw new Error(`Alias must be named *.alias.vhd,  ${aliasPath} given`)
    }
    if (isVhdAlias(targetPath)) {
      throw new Error(`Chaining alias is forbidden ${aliasPath} to ${targetPath}`)
    }
    // aliasPath and targetPath are absolute path from the root of the handler
    // normalize them so they can't  escape this dir
    const aliasDir = path.dirname(path.resolve('/', aliasPath))
    // only store the relative path from alias to target
    const relativePathToTarget = path.relative(aliasDir, path.resolve('/', targetPath))

    if (relativePathToTarget.length > ALIAS_MAX_PATH_LENGTH) {
      throw new Error(
        `Alias relative path ${relativePathToTarget} is too long : ${relativePathToTarget.length} chars, max is ${ALIAS_MAX_PATH_LENGTH}`
      )
    }
    await handler.writeFile(aliasPath, relativePathToTarget)
  }

  streamSize() {
    const { header, batSize } = this
    let fileSize = FOOTER_SIZE + HEADER_SIZE + batSize + FOOTER_SIZE /* the footer at the end */

    // add parentlocator size
    for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
      fileSize += header.parentLocatorEntry[i].platformDataSpace * SECTOR_SIZE
    }

    // add block size
    for (let i = 0; i < header.maxTableEntries; i++) {
      if (this.containsBlock(i)) {
        fileSize += this.fullBlockSize
      }
    }

    assert.strictEqual(fileSize % SECTOR_SIZE, 0)
    return fileSize
  }
  // progress is called with currentBlock, numberOfBlocs
  // it's an approximation, ignoring the footer/header/bat size
  stream({ onProgress } = {}) {
    const { footer, batSize } = this
    const { ...header } = this.header // copy since we don't ant to modifiy the current header
    const rawFooter = fuFooter.pack(footer)
    checksumStruct(rawFooter, fuFooter)

    // update them in header
    // update checksum in header
    header.tableOffset = FOOTER_SIZE + HEADER_SIZE
    let offset = FOOTER_SIZE + HEADER_SIZE + batSize

    // add parentlocator size
    for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
      header.parentLocatorEntry[i] = {
        ...header.parentLocatorEntry[i],
        platformDataOffset: offset,
      }
      offset += header.parentLocatorEntry[i].platformDataSpace * SECTOR_SIZE
    }

    const rawHeader = fuHeader.pack(header)
    checksumStruct(rawHeader, fuHeader)

    assert.strictEqual(offset % SECTOR_SIZE, 0, `offset should be aligned to SECTOR_SIZE: ${offset}`)

    const bat = Buffer.allocUnsafe(batSize)
    let offsetSector = offset / SECTOR_SIZE
    let nbBlocks = 0
    const blockSizeInSectors = this.fullBlockSize / SECTOR_SIZE
    let fileSize = offsetSector * SECTOR_SIZE + FOOTER_SIZE /* the footer at the end */
    // compute BAT , blocks starts after parent locator entries
    for (let i = 0; i < header.maxTableEntries; i++) {
      if (this.containsBlock(i)) {
        bat.writeUInt32BE(offsetSector, i * 4)
        offsetSector += blockSizeInSectors
        fileSize += this.fullBlockSize
        nbBlocks++
      } else {
        bat.writeUInt32BE(BLOCK_UNUSED, i * 4)
      }
    }

    assert.strictEqual(offset % SECTOR_SIZE, 0)
    const self = this
    let yielded = 0
    function trackTransmittedLength(buffer) {
      yielded += buffer.length
      assert.ok(yielded <= fileSize, `Max stream length is ${fileSize}, try to send ${yielded}`)
      return buffer
    }
    async function* iterator() {
      yield trackTransmittedLength(rawFooter)
      yield trackTransmittedLength(rawHeader)
      yield trackTransmittedLength(bat)

      // yield parent locator

      for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
        const space = header.parentLocatorEntry[i].platformDataSpace * SECTOR_SIZE
        if (space > 0) {
          const data = (await self.readParentLocator(i)).data
          // align data to a sector
          const buffer = Buffer.alloc(space, 0)
          data.copy(buffer)
          yield trackTransmittedLength(buffer)
        }
      }

      // yield all blocks
      // since contains() can be costly for synthetic vhd, use the computed bat
      let nbYielded = 0
      for (let i = 0; i < header.maxTableEntries; i++) {
        if (bat.readUInt32BE(i * 4) !== BLOCK_UNUSED) {
          nbYielded++
          const block = await self.readBlock(i)
          yield trackTransmittedLength(block.buffer)
          onProgress?.(nbYielded, nbBlocks)
        }
      }
      // yield footer again
      yield trackTransmittedLength(rawFooter)
      assert.strictEqual(yielded, fileSize, `computed stream length is ${fileSize} but sent ${yielded} bytes`)
    }

    const stream = asyncIteratorToStream(iterator())
    stream.length = fileSize
    return stream
  }

  rawContent() {
    const { header, footer } = this
    const { blockSize } = header
    const self = this
    async function* iterator() {
      const nBlocks = header.maxTableEntries
      let remainingSize = footer.currentSize
      const EMPTY = Buffer.alloc(blockSize, 0)
      for (let blockId = 0; blockId < nBlocks; ++blockId) {
        let buffer = self.containsBlock(blockId) ? (await self.readBlock(blockId)).data : EMPTY
        // the last block can be truncated since raw size is not a multiple of blockSize
        buffer = remainingSize < blockSize ? buffer.slice(0, remainingSize) : buffer
        remainingSize -= blockSize
        yield buffer
      }
    }
    const stream = asyncIteratorToStream(iterator())
    stream.length = footer.currentSize
    return stream
  }

  async containsAllDataOf(child) {
    await this.readBlockAllocationTable()
    await child.readBlockAllocationTable()
    for await (const block of child.blocks()) {
      const { id, data: childData } = block
      // block is in child not in parent
      if (!this.containsBlock(id)) {
        return false
      }
      const { data: parentData } = await this.readBlock(id)
      if (!childData.equals(parentData)) {
        return false
      }
    }
    return true
  }

  async readRawData(start, length, cache, buf) {
    const header = this.header
    const blockSize = header.blockSize
    const startBlockId = Math.floor(start / blockSize)
    const endBlockId = Math.floor((start + length) / blockSize)

    const startOffset = start % blockSize
    let copied = 0
    for (let blockId = startBlockId; blockId <= endBlockId; blockId++) {
      let data
      if (this.containsBlock(blockId)) {
        if (!cache.has(blockId)) {
          cache.set(
            blockId,
            // promise is awaited later, so it won't generate unbounded error
            this.readBlock(blockId).then(block => {
              return block.data
            })
          )
        }
        // the cache contains a promise
        data = await cache.get(blockId)
      } else {
        data = Buffer.alloc(blockSize, 0)
      }
      const offsetStart = blockId === startBlockId ? startOffset : 0
      const offsetEnd = blockId === endBlockId ? (start + length) % blockSize : blockSize
      data.copy(buf, copied, offsetStart, offsetEnd)
      copied += offsetEnd - offsetStart
    }
    assert.strictEqual(copied, length, 'invalid length')
    return copied
  }
}
