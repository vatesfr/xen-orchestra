'use strict'

const {
  BLOCK_UNUSED,
  FOOTER_SIZE,
  HEADER_SIZE,
  PLATFORMS,
  SECTOR_SIZE,
  PARENT_LOCATOR_ENTRIES,
} = require('../_constants')
const { computeBatSize, sectorsToBytes, unpackHeader, unpackFooter, BUF_BLOCK_UNUSED } = require('./_utils')
const { createLogger } = require('@xen-orchestra/log')
const { fuFooter, fuHeader, checksumStruct } = require('../_structs')
const { set: mapSetBit } = require('../_bitmap')
const { VhdAbstract } = require('./VhdAbstract')
const assert = require('assert')
const getFirstAndLastBlocks = require('../_getFirstAndLastBlocks')

const { debug, info } = createLogger('vhd-lib:VhdFile')

// ===================================================================
//
// Spec:
// https://www.microsoft.com/en-us/download/details.aspx?id=23850
//
// C implementation:
// https://github.com/rubiojr/vhd-util-convert
//
// ===================================================================

// ===================================================================

// Format:
//
// 1. Footer (512)
// 2. Header (1024)
// 3. Unordered entries
//    - BAT (batSize @ header.tableOffset)
//    - Blocks (@ blockOffset(i))
//      - bitmap (blockBitmapSize)
//      - data (header.blockSize)
//    - Parent locators (parentLocatorSize(i) @ parentLocatorOffset(i))
// 4. Footer (512 @ vhdSize - 512)
//
// Variables:
//
// - batSize = min(1, ceil(header.maxTableEntries * 4 / sectorSize)) * sectorSize
// - blockBitmapSize = ceil(header.blockSize / sectorSize / 8 / sectorSize) * sectorSize
// - blockOffset(i) = bat[i] * sectorSize
// - nBlocks = ceil(footer.currentSize / header.blockSize)
// - parentLocatorOffset(i) = header.parentLocatorEntry[i].platformDataOffset
// - parentLocatorSize(i) = header.parentLocatorEntry[i].platformDataSpace * sectorSize
// - sectorSize = 512

exports.VhdFile = class VhdFile extends VhdAbstract {
  #uncheckedBlockTable
  #header
  footer

  #closed = false
  #closedBy
  get #blockTable() {
    assert.notStrictEqual(this.#uncheckedBlockTable, undefined, 'Block table must be initialized before access')
    return this.#uncheckedBlockTable
  }

  set #blockTable(blockTable) {
    this.#uncheckedBlockTable = blockTable
  }

  get batSize() {
    return computeBatSize(this.header.maxTableEntries)
  }

  set header(header) {
    this.#header = header
    const size = this.batSize
    this.#blockTable = Buffer.alloc(size)
    for (let i = 0; i < this.header.maxTableEntries; i++) {
      this.#blockTable.writeUInt32BE(BLOCK_UNUSED, i * 4)
    }
  }
  get header() {
    return this.#header
  }

  static async open(handler, path, { flags, checkSecondFooter = true } = {}) {
    const fd = await handler.openFile(path, flags ?? 'r+')
    const vhd = new VhdFile(handler, fd)
    // opening a file for reading does not trigger EISDIR as long as we don't really read from it :
    // https://man7.org/linux/man-pages/man2/open.2.html
    // EISDIR pathname refers to a directory and the access requested
    // involved writing (that is, O_WRONLY or O_RDWR is set).
    // reading the header ensure we have a well formed file immediatly
    try {
      // can throw if handler is encrypted or remote is broken
      await vhd.readHeaderAndFooter(checkSecondFooter)
    } catch (err) {
      await vhd.dispose()
      throw err
    }
    return {
      dispose: () => handler.closeFile(fd),
      value: vhd,
    }
  }

  static async create(handler, path, { flags } = {}) {
    const fd = await handler.openFile(path, flags ?? 'wx')
    const vhd = new VhdFile(handler, fd)
    return {
      dispose: () => handler.closeFile(fd),
      value: vhd,
    }
  }

  constructor(handler, path) {
    super()
    this._handler = handler
    this._path = path
  }

  async dispose() {
    if (this.#closed) {
      info('double close', {
        path: this._path,
        firstClosedBy: this.#closedBy,
        closedAgainBy: new Error().stack,
      })
      return
    }
    this.#closed = true
    this.#closedBy = new Error().stack
    await this._handler.closeFile()
  }
  // =================================================================
  // Read functions.
  // =================================================================

  async _read(start, n) {
    const { bytesRead, buffer } = await this._handler.read(this._path, Buffer.alloc(n), start)
    assert.strictEqual(bytesRead, n)
    return buffer
  }
  // Returns the first address after metadata. (In bytes)
  _getEndOfHeaders() {
    const { header } = this

    let end = FOOTER_SIZE + HEADER_SIZE

    // Max(end, block allocation table end)
    end = Math.max(end, header.tableOffset + this.batSize)

    for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
      const entry = header.parentLocatorEntry[i]

      if (entry.platformCode !== PLATFORMS.NONE) {
        end = Math.max(end, entry.platformDataOffset + sectorsToBytes(entry.platformDataSpace))
      }
    }

    debug(`End of headers: ${end}.`)

    return end
  }

  // return the first sector (bitmap) of a block
  _getBatEntry(blockId) {
    const i = blockId * 4
    const blockTable = this.#blockTable
    return i < blockTable.length ? blockTable.readUInt32BE(i) : BLOCK_UNUSED
  }

  // Returns the first sector after data.
  _getEndOfData() {
    let end = Math.ceil(this._getEndOfHeaders() / SECTOR_SIZE)

    const sectorsOfFullBlock = this.sectorsOfBitmap + this.sectorsPerBlock
    const { maxTableEntries } = this.header
    for (let i = 0; i < maxTableEntries; i++) {
      const blockAddr = this._getBatEntry(i)

      if (blockAddr !== BLOCK_UNUSED) {
        end = Math.max(end, blockAddr + sectorsOfFullBlock)
      }
    }

    debug(`End of data: ${end}.`)

    return sectorsToBytes(end)
  }

  containsBlock(id) {
    return this._getBatEntry(id) !== BLOCK_UNUSED
  }

  // TODO:
  // - better human reporting
  // - auto repair if possible
  async readHeaderAndFooter(checkSecondFooter = true) {
    const buf = await this._read(0, FOOTER_SIZE + HEADER_SIZE)
    const bufFooter = buf.slice(0, FOOTER_SIZE)
    const bufHeader = buf.slice(FOOTER_SIZE)

    const footer = unpackFooter(bufFooter)
    const header = unpackHeader(bufHeader, footer)

    if (checkSecondFooter) {
      const size = await this._handler.getSize(this._path)
      assert(bufFooter.equals(await this._read(size - FOOTER_SIZE, FOOTER_SIZE)), 'footer1 !== footer2')
    }

    this.footer = footer
    this.header = header
  }

  // Returns a buffer that contains the block allocation table of a vhd file.
  async readBlockAllocationTable() {
    const { header } = this
    this.#blockTable = await this._read(header.tableOffset, header.maxTableEntries * 4)
  }

  readBlock(blockId, onlyBitmap = false) {
    const blockAddr = this._getBatEntry(blockId)
    assert(blockAddr !== BLOCK_UNUSED, `no such block ${blockId}`)

    return this._read(sectorsToBytes(blockAddr), onlyBitmap ? this.bitmapSize : this.fullBlockSize).then(buf =>
      onlyBitmap
        ? { id: blockId, bitmap: buf }
        : {
            id: blockId,
            bitmap: buf.slice(0, this.bitmapSize),
            data: buf.slice(this.bitmapSize),
            buffer: buf,
          }
    )
  }

  // =================================================================
  // Write functions.
  // =================================================================

  // Write a buffer at a given position in a vhd file.
  async _write(data, offset) {
    assert(Buffer.isBuffer(data))
    debug(`_write offset=${offset} size=${data.length}`)
    return this._handler.write(this._path, data, offset)
  }

  async _freeFirstBlockSpace(spaceNeededBytes) {
    const firstAndLastBlocks = getFirstAndLastBlocks(this.#blockTable)
    if (firstAndLastBlocks === undefined) {
      return
    }

    const { first, firstSector, lastSector } = firstAndLastBlocks
    const tableOffset = this.header.tableOffset
    const { batSize } = this
    const newMinSector = Math.ceil((tableOffset + batSize + spaceNeededBytes) / SECTOR_SIZE)
    if (tableOffset + batSize + spaceNeededBytes >= sectorsToBytes(firstSector)) {
      const { fullBlockSize } = this
      const newFirstSector = Math.max(lastSector + fullBlockSize / SECTOR_SIZE, newMinSector)
      debug(`freeFirstBlockSpace: move first block ${firstSector} -> ${newFirstSector}`)
      // copy the first block at the end
      const block = await this._read(sectorsToBytes(firstSector), fullBlockSize)
      await this._write(block, sectorsToBytes(newFirstSector))
      await this._setBatEntry(first, newFirstSector)
      await this.writeFooter(true)
      spaceNeededBytes -= this.fullBlockSize
      if (spaceNeededBytes > 0) {
        return this._freeFirstBlockSpace(spaceNeededBytes)
      }
    }
  }

  async ensureBatSize(entries) {
    const { header } = this
    const prevMaxTableEntries = header.maxTableEntries
    if (prevMaxTableEntries >= entries) {
      return
    }

    const newBatSize = computeBatSize(entries)
    await this._freeFirstBlockSpace(newBatSize - this.batSize)
    const maxTableEntries = (header.maxTableEntries = entries)
    const prevBat = this.#blockTable
    const bat = (this.#blockTable = Buffer.allocUnsafe(newBatSize))
    prevBat.copy(bat)
    bat.fill(BUF_BLOCK_UNUSED, prevMaxTableEntries * 4)
    debug(`ensureBatSize: extend BAT ${prevMaxTableEntries} -> ${maxTableEntries}`)
    await this._write(
      Buffer.alloc(maxTableEntries - prevMaxTableEntries, BUF_BLOCK_UNUSED),
      header.tableOffset + prevBat.length
    )
    await this.writeHeader()
  }

  // set the first sector (bitmap) of a block
  _setBatEntry(block, blockSector) {
    const i = block * 4
    const blockTable = this.#blockTable

    blockTable.writeUInt32BE(blockSector, i)

    return this._write(blockTable.slice(i, i + 4), this.header.tableOffset + i)
  }

  // Allocate a new uninitialized block in the BAT
  async _createBlock(blockId) {
    assert.strictEqual(this._getBatEntry(blockId), BLOCK_UNUSED)

    const blockAddr = Math.ceil(this._getEndOfData() / SECTOR_SIZE)

    debug(`create block ${blockId} at ${blockAddr}`)

    await this._setBatEntry(blockId, blockAddr)

    return blockAddr
  }

  // Write a bitmap at a block address.
  async _writeBlockBitmap(blockAddr, bitmap) {
    const { bitmapSize } = this

    if (bitmap.length !== bitmapSize) {
      throw new Error(`Bitmap length is not correct ! ${bitmap.length}`)
    }

    const offset = sectorsToBytes(blockAddr)

    debug(`Write bitmap at: ${offset}. (size=${bitmapSize}, data=${bitmap.toString('hex')})`)
    await this._write(bitmap, sectorsToBytes(blockAddr))
  }

  async writeEntireBlock(block) {
    let blockAddr = this._getBatEntry(block.id)

    if (blockAddr === BLOCK_UNUSED) {
      blockAddr = await this._createBlock(block.id)
    }
    await this._write(block.buffer, sectorsToBytes(blockAddr))
  }

  async _writeBlockSectors(block, beginSectorId, endSectorId, parentBitmap) {
    let blockAddr = this._getBatEntry(block.id)

    if (blockAddr === BLOCK_UNUSED) {
      blockAddr = await this._createBlock(block.id)
      parentBitmap = Buffer.alloc(this.bitmapSize, 0)
    } else if (parentBitmap === undefined) {
      parentBitmap = (await this.readBlock(block.id, true)).bitmap
    }

    const offset = blockAddr + this.sectorsOfBitmap + beginSectorId

    debug(`_writeBlockSectors at ${offset} block=${block.id}, sectors=${beginSectorId}...${endSectorId}`)

    for (let i = beginSectorId; i < endSectorId; ++i) {
      mapSetBit(parentBitmap, i)
    }

    await this._writeBlockBitmap(blockAddr, parentBitmap)
    await this._write(
      block.data.slice(sectorsToBytes(beginSectorId), sectorsToBytes(endSectorId)),
      sectorsToBytes(offset)
    )
  }

  // Write a context footer. (At the end and beginning of a vhd file.)
  async writeFooter(onlyEndFooter = false) {
    const { footer } = this

    const rawFooter = fuFooter.pack(footer)
    const eof = await this._handler.getSize(this._path)
    // sometimes the file is longer than anticipated, we still need to put the footer at the end
    const offset = Math.max(this._getEndOfData(), eof - rawFooter.length)

    footer.checksum = checksumStruct(rawFooter, fuFooter)
    debug(`Write footer at: ${offset} (checksum=${footer.checksum}). (data=${rawFooter.toString('hex')})`)
    if (!onlyEndFooter) {
      await this._write(rawFooter, 0)
    }
    await this._write(rawFooter, offset)
  }

  writeHeader() {
    const { header } = this
    const rawHeader = fuHeader.pack(header)
    header.checksum = checksumStruct(rawHeader, fuHeader)
    const offset = FOOTER_SIZE
    debug(`Write header at: ${offset} (checksum=${header.checksum}). (data=${rawHeader.toString('hex')})`)
    return this._write(rawHeader, offset)
  }

  writeBlockAllocationTable() {
    const header = this.header
    const blockTable = this.#blockTable
    debug(`Write BlockAllocationTable at: ${header.tableOffset} ). (data=${blockTable.toString('hex')})`)
    return this._write(blockTable, header.tableOffset)
  }

  async writeData(offsetSectors, buffer) {
    const bufferSizeSectors = Math.ceil(buffer.length / SECTOR_SIZE)
    const startBlock = Math.floor(offsetSectors / this.sectorsPerBlock)
    const endBufferSectors = offsetSectors + bufferSizeSectors
    const lastBlock = Math.ceil(endBufferSectors / this.sectorsPerBlock) - 1
    await this.ensureBatSize(lastBlock)
    const blockSizeBytes = this.sectorsPerBlock * SECTOR_SIZE
    const coversWholeBlock = (offsetInBlockSectors, endInBlockSectors) =>
      offsetInBlockSectors === 0 && endInBlockSectors === this.sectorsPerBlock

    for (let currentBlock = startBlock; currentBlock <= lastBlock; currentBlock++) {
      const offsetInBlockSectors = Math.max(0, offsetSectors - currentBlock * this.sectorsPerBlock)
      const endInBlockSectors = Math.min(endBufferSectors - currentBlock * this.sectorsPerBlock, this.sectorsPerBlock)
      const startInBuffer = Math.max(0, (currentBlock * this.sectorsPerBlock - offsetSectors) * SECTOR_SIZE)
      const endInBuffer = Math.min(
        ((currentBlock + 1) * this.sectorsPerBlock - offsetSectors) * SECTOR_SIZE,
        buffer.length
      )
      let inputBuffer
      if (coversWholeBlock(offsetInBlockSectors, endInBlockSectors)) {
        inputBuffer = buffer.slice(startInBuffer, endInBuffer)
      } else {
        inputBuffer = Buffer.alloc(blockSizeBytes, 0)
        buffer.copy(inputBuffer, offsetInBlockSectors * SECTOR_SIZE, startInBuffer, endInBuffer)
      }
      await this._writeBlockSectors({ id: currentBlock, data: inputBuffer }, offsetInBlockSectors, endInBlockSectors)
    }
    await this.writeFooter()
  }

  async _ensureSpaceForParentLocators(neededSectors) {
    const firstLocatorOffset = FOOTER_SIZE + HEADER_SIZE
    const currentSpace = Math.floor(this.header.tableOffset / SECTOR_SIZE) - firstLocatorOffset / SECTOR_SIZE
    if (currentSpace < neededSectors) {
      const deltaSectors = neededSectors - currentSpace
      await this._freeFirstBlockSpace(sectorsToBytes(deltaSectors))
      this.header.tableOffset += sectorsToBytes(deltaSectors)
      await this._write(this.#blockTable, this.header.tableOffset)
    }
    return firstLocatorOffset
  }

  async _readParentLocatorData(parentLocatorId) {
    const { platformDataOffset, platformDataLength } = this.header.parentLocatorEntry[parentLocatorId]
    if (platformDataLength > 0) {
      return await this._read(platformDataOffset, platformDataLength)
    }
    return Buffer.alloc(0)
  }

  async _writeParentLocatorData(parentLocatorId, data) {
    let position
    const { header } = this
    if (data.length === 0) {
      // reset offset if data is empty
      header.parentLocatorEntry[parentLocatorId].platformDataOffset = 0
    } else {
      const space = header.parentLocatorEntry[parentLocatorId].platformDataSpace * SECTOR_SIZE
      if (data.length <= space) {
        // new parent locator length is smaller than available space : keep it in place
        position = header.parentLocatorEntry[parentLocatorId].platformDataOffset
      } else {
        const firstAndLastBlocks = getFirstAndLastBlocks(this.#blockTable)
        if (firstAndLastBlocks === undefined) {
          // no block in data : put the parent locator entry at the end
          position = this._getEndOfData()
        } else {
          // need more size

          // since there can be multiple parent locator entry, we can't extend the entry in place
          // move the first(s) block(s) at the end of the data
          // move the parent locator to the  precedent position of the first block
          const { firstSector } = firstAndLastBlocks
          await this._freeFirstBlockSpace(space)
          position = sectorsToBytes(firstSector)
        }
      }
      await this._write(data, position)
      header.parentLocatorEntry[parentLocatorId].platformDataOffset = position
    }
  }

  async getSize() {
    return await this._handler.getSize(this._path)
  }
}
