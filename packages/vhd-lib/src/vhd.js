import assert from 'assert'
import { fromEvent } from 'promise-toolbox'

import constantStream from './_constant-stream'
import { fuFooter, fuHeader, checksumStruct, unpackField } from './_structs'
import { set as mapSetBit, test as mapTestBit } from './_bitmap'
import {
  BLOCK_UNUSED,
  DISK_TYPE_DIFFERENCING,
  DISK_TYPE_DYNAMIC,
  FILE_FORMAT_VERSION,
  FOOTER_COOKIE,
  FOOTER_SIZE,
  HEADER_COOKIE,
  HEADER_SIZE,
  HEADER_VERSION,
  PARENT_LOCATOR_ENTRIES,
  PLATFORM_NONE,
  PLATFORM_W2KU,
  SECTOR_SIZE,
} from './_constants'

const VHD_UTIL_DEBUG = 0
const debug = VHD_UTIL_DEBUG
  ? str => console.log(`[vhd-merge]${str}`)
  : () => null

// ===================================================================
//
// Spec:
// https://www.microsoft.com/en-us/download/details.aspx?id=23850
//
// C implementation:
// https://github.com/rubiojr/vhd-util-convert
//
// ===================================================================

const computeBatSize = entries =>
  sectorsToBytes(sectorsRoundUpNoZero(entries * 4))

// Sectors conversions.
const sectorsRoundUpNoZero = bytes => Math.ceil(bytes / SECTOR_SIZE) || 1
const sectorsToBytes = sectors => sectors * SECTOR_SIZE

const assertChecksum = (name, buf, struct) => {
  const actual = unpackField(struct.fields.checksum, buf)
  const expected = checksumStruct(buf, struct)
  if (actual !== expected) {
    throw new Error(`invalid ${name} checksum ${actual}, expected ${expected}`)
  }
}

// unused block as buffer containing a uint32BE
const BUF_BLOCK_UNUSED = Buffer.allocUnsafe(4)
BUF_BLOCK_UNUSED.writeUInt32BE(BLOCK_UNUSED, 0)

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

export default class Vhd {
  get batSize () {
    return computeBatSize(this.header.maxTableEntries)
  }

  constructor (handler, path) {
    this._handler = handler
    this._path = path
  }

  // =================================================================
  // Read functions.
  // =================================================================

  async _read (start, n) {
    const { bytesRead, buffer } = await this._handler.read(
      this._path,
      Buffer.alloc(n),
      start
    )
    assert.equal(bytesRead, n)
    return buffer
  }

  containsBlock (id) {
    return this._getBatEntry(id) !== BLOCK_UNUSED
  }

  // Returns the first address after metadata. (In bytes)
  getEndOfHeaders () {
    const { header } = this

    let end = FOOTER_SIZE + HEADER_SIZE

    // Max(end, block allocation table end)
    end = Math.max(end, header.tableOffset + this.batSize)

    for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
      const entry = header.parentLocatorEntry[i]

      if (entry.platformCode !== PLATFORM_NONE) {
        end = Math.max(
          end,
          entry.platformDataOffset + sectorsToBytes(entry.platformDataSpace)
        )
      }
    }

    debug(`End of headers: ${end}.`)

    return end
  }

  // Returns the first sector after data.
  getEndOfData () {
    let end = Math.ceil(this.getEndOfHeaders() / SECTOR_SIZE)

    const fullBlockSize = this.sectorsOfBitmap + this.sectorsPerBlock
    const { maxTableEntries } = this.header
    for (let i = 0; i < maxTableEntries; i++) {
      const blockAddr = this._getBatEntry(i)

      if (blockAddr !== BLOCK_UNUSED) {
        end = Math.max(end, blockAddr + fullBlockSize)
      }
    }

    debug(`End of data: ${end}.`)

    return sectorsToBytes(end)
  }

  // TODO: extract the checks into reusable functions:
  // - better human reporting
  // - auto repair if possible
  async readHeaderAndFooter (checkSecondFooter = true) {
    const buf = await this._read(0, FOOTER_SIZE + HEADER_SIZE)
    const bufFooter = buf.slice(0, FOOTER_SIZE)
    const bufHeader = buf.slice(FOOTER_SIZE)

    assertChecksum('footer', bufFooter, fuFooter)
    assertChecksum('header', bufHeader, fuHeader)

    if (checkSecondFooter) {
      const size = await this._handler.getSize(this._path)
      assert(
        bufFooter.equals(await this._read(size - FOOTER_SIZE, FOOTER_SIZE)),
        'footer1 !== footer2'
      )
    }

    const footer = (this.footer = fuFooter.unpack(bufFooter))
    assert.strictEqual(footer.cookie, FOOTER_COOKIE, 'footer cookie')
    assert.strictEqual(footer.dataOffset, FOOTER_SIZE)
    assert.strictEqual(footer.fileFormatVersion, FILE_FORMAT_VERSION)
    assert(footer.originalSize <= footer.currentSize)
    assert(
      footer.diskType === DISK_TYPE_DIFFERENCING ||
        footer.diskType === DISK_TYPE_DYNAMIC
    )

    const header = (this.header = fuHeader.unpack(bufHeader))
    assert.strictEqual(header.cookie, HEADER_COOKIE)
    assert.strictEqual(header.dataOffset, undefined)
    assert.strictEqual(header.headerVersion, HEADER_VERSION)
    assert(header.maxTableEntries >= footer.currentSize / header.blockSize)
    assert(Number.isInteger(Math.log2(header.blockSize / SECTOR_SIZE)))

    // Compute the number of sectors in one block.
    // Default: One block contains 4096 sectors of 512 bytes.
    const sectorsPerBlock = (this.sectorsPerBlock =
      header.blockSize / SECTOR_SIZE)

    // Compute bitmap size in sectors.
    // Default: 1.
    const sectorsOfBitmap = (this.sectorsOfBitmap = sectorsRoundUpNoZero(
      sectorsPerBlock >> 3
    ))

    // Full block size => data block size + bitmap size.
    this.fullBlockSize = sectorsToBytes(sectorsPerBlock + sectorsOfBitmap)

    // In bytes.
    // Default: 512.
    this.bitmapSize = sectorsToBytes(sectorsOfBitmap)
  }

  // Returns a buffer that contains the block allocation table of a vhd file.
  async readBlockAllocationTable () {
    const { header } = this
    this.blockTable = await this._read(
      header.tableOffset,
      header.maxTableEntries * 4
    )
  }

  // return the first sector (bitmap) of a block
  _getBatEntry (block) {
    return this.blockTable.readUInt32BE(block * 4)
  }

  _readBlock (blockId, onlyBitmap = false) {
    const blockAddr = this._getBatEntry(blockId)
    if (blockAddr === BLOCK_UNUSED) {
      throw new Error(`no such block ${blockId}`)
    }

    return this._read(
      sectorsToBytes(blockAddr),
      onlyBitmap ? this.bitmapSize : this.fullBlockSize
    ).then(
      buf =>
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

  // get the identifiers and first sectors of the first and last block
  // in the file
  //
  _getFirstAndLastBlocks () {
    const n = this.header.maxTableEntries
    const bat = this.blockTable
    let i = 0
    let j = 0
    let first, firstSector, last, lastSector

    // get first allocated block for initialization
    while ((firstSector = bat.readUInt32BE(j)) === BLOCK_UNUSED) {
      i += 1
      j += 4

      if (i === n) {
        const error = new Error('no allocated block found')
        error.noBlock = true
        throw error
      }
    }
    lastSector = firstSector
    first = last = i

    while (i < n) {
      const sector = bat.readUInt32BE(j)
      if (sector !== BLOCK_UNUSED) {
        if (sector < firstSector) {
          first = i
          firstSector = sector
        } else if (sector > lastSector) {
          last = i
          lastSector = sector
        }
      }

      i += 1
      j += 4
    }

    return { first, firstSector, last, lastSector }
  }

  // =================================================================
  // Write functions.
  // =================================================================

  // Write a buffer/stream at a given position in a vhd file.
  async _write (data, offset) {
    debug(
      `_write offset=${offset} size=${
        Buffer.isBuffer(data) ? data.length : '???'
      }`
    )
    // TODO: could probably be merged in remote handlers.
    const stream = await this._handler.createOutputStream(this._path, {
      flags: 'r+',
      start: offset,
    })
    return Buffer.isBuffer(data)
      ? new Promise((resolve, reject) => {
          stream.on('error', reject)
          stream.end(data, resolve)
        })
      : fromEvent(data.pipe(stream), 'finish')
  }

  async _freeFirstBlockSpace (spaceNeededBytes) {
    try {
      const { first, firstSector, lastSector } = this._getFirstAndLastBlocks()
      const tableOffset = this.header.tableOffset
      const { batSize } = this
      const newMinSector = Math.ceil(
        (tableOffset + batSize + spaceNeededBytes) / SECTOR_SIZE
      )
      if (
        tableOffset + batSize + spaceNeededBytes >=
        sectorsToBytes(firstSector)
      ) {
        const { fullBlockSize } = this
        const newFirstSector = Math.max(
          lastSector + fullBlockSize / SECTOR_SIZE,
          newMinSector
        )
        debug(
          `freeFirstBlockSpace: move first block ${firstSector} -> ${newFirstSector}`
        )
        // copy the first block at the end
        const block = await this._read(
          sectorsToBytes(firstSector),
          fullBlockSize
        )
        await this._write(block, sectorsToBytes(newFirstSector))
        await this._setBatEntry(first, newFirstSector)
        await this.writeFooter(true)
        spaceNeededBytes -= this.fullBlockSize
        if (spaceNeededBytes > 0) {
          return this._freeFirstBlockSpace(spaceNeededBytes)
        }
      }
    } catch (e) {
      if (!e.noBlock) {
        throw e
      }
    }
  }

  async ensureBatSize (entries) {
    const { header } = this
    const prevMaxTableEntries = header.maxTableEntries
    if (prevMaxTableEntries >= entries) {
      return
    }

    const newBatSize = computeBatSize(entries)
    await this._freeFirstBlockSpace(newBatSize - this.batSize)
    const maxTableEntries = (header.maxTableEntries = entries)
    const prevBat = this.blockTable
    const bat = (this.blockTable = Buffer.allocUnsafe(newBatSize))
    prevBat.copy(bat)
    bat.fill(BUF_BLOCK_UNUSED, prevMaxTableEntries * 4)
    debug(
      `ensureBatSize: extend BAT ${prevMaxTableEntries} -> ${maxTableEntries}`
    )
    await this._write(
      constantStream(BUF_BLOCK_UNUSED, maxTableEntries - prevMaxTableEntries),
      header.tableOffset + prevBat.length
    )
    await this.writeHeader()
  }

  // set the first sector (bitmap) of a block
  _setBatEntry (block, blockSector) {
    const i = block * 4
    const { blockTable } = this

    blockTable.writeUInt32BE(blockSector, i)

    return this._write(blockTable.slice(i, i + 4), this.header.tableOffset + i)
  }

  // Make a new empty block at vhd end.
  // Update block allocation table in context and in file.
  async createBlock (blockId) {
    const blockAddr = Math.ceil(this.getEndOfData() / SECTOR_SIZE)

    debug(`create block ${blockId} at ${blockAddr}`)

    await Promise.all([
      // Write an empty block and addr in vhd file.
      this._write(
        constantStream([0], this.fullBlockSize),
        sectorsToBytes(blockAddr)
      ),

      this._setBatEntry(blockId, blockAddr),
    ])

    return blockAddr
  }

  // Write a bitmap at a block address.
  async writeBlockBitmap (blockAddr, bitmap) {
    const { bitmapSize } = this

    if (bitmap.length !== bitmapSize) {
      throw new Error(`Bitmap length is not correct ! ${bitmap.length}`)
    }

    const offset = sectorsToBytes(blockAddr)

    debug(
      `Write bitmap at: ${offset}. (size=${bitmapSize}, data=${bitmap.toString(
        'hex'
      )})`
    )
    await this._write(bitmap, sectorsToBytes(blockAddr))
  }

  async writeEntireBlock (block) {
    let blockAddr = this._getBatEntry(block.id)

    if (blockAddr === BLOCK_UNUSED) {
      blockAddr = await this.createBlock(block.id)
    }
    await this._write(block.buffer, sectorsToBytes(blockAddr))
  }

  async writeBlockSectors (block, beginSectorId, endSectorId, parentBitmap) {
    let blockAddr = this._getBatEntry(block.id)

    if (blockAddr === BLOCK_UNUSED) {
      blockAddr = await this.createBlock(block.id)
      parentBitmap = Buffer.alloc(this.bitmapSize, 0)
    } else if (parentBitmap === undefined) {
      parentBitmap = (await this._readBlock(block.id, true)).bitmap
    }

    const offset = blockAddr + this.sectorsOfBitmap + beginSectorId

    debug(
      `writeBlockSectors at ${offset} block=${
        block.id
      }, sectors=${beginSectorId}...${endSectorId}`
    )

    for (let i = beginSectorId; i < endSectorId; ++i) {
      mapSetBit(parentBitmap, i)
    }

    await this.writeBlockBitmap(blockAddr, parentBitmap)
    await this._write(
      block.data.slice(
        sectorsToBytes(beginSectorId),
        sectorsToBytes(endSectorId)
      ),
      sectorsToBytes(offset)
    )
  }

  async coalesceBlock (child, blockId) {
    const block = await child._readBlock(blockId)
    const { bitmap, data } = block

    debug(`coalesceBlock block=${blockId}`)

    // For each sector of block data...
    const { sectorsPerBlock } = child
    let parentBitmap = null
    for (let i = 0; i < sectorsPerBlock; i++) {
      // If no changes on one sector, skip.
      if (!mapTestBit(bitmap, i)) {
        continue
      }
      let endSector = i + 1

      // Count changed sectors.
      while (endSector < sectorsPerBlock && mapTestBit(bitmap, endSector)) {
        ++endSector
      }

      // Write n sectors into parent.
      debug(`coalesceBlock: write sectors=${i}...${endSector}`)

      const isFullBlock = i === 0 && endSector === sectorsPerBlock
      if (isFullBlock) {
        await this.writeEntireBlock(block)
      } else {
        if (parentBitmap === null) {
          parentBitmap = (await this._readBlock(blockId, true)).bitmap
        }
        await this.writeBlockSectors(block, i, endSector, parentBitmap)
      }

      i = endSector
    }

    // Return the merged data size
    return data.length
  }

  // Write a context footer. (At the end and beginning of a vhd file.)
  async writeFooter (onlyEndFooter = false) {
    const { footer } = this

    const rawFooter = fuFooter.pack(footer)
    const eof = await this._handler.getSize(this._path)
    // sometimes the file is longer than anticipated, we still need to put the footer at the end
    const offset = Math.max(this.getEndOfData(), eof - rawFooter.length)

    footer.checksum = checksumStruct(rawFooter, fuFooter)
    debug(
      `Write footer at: ${offset} (checksum=${
        footer.checksum
      }). (data=${rawFooter.toString('hex')})`
    )
    if (!onlyEndFooter) {
      await this._write(rawFooter, 0)
    }
    await this._write(rawFooter, offset)
  }

  writeHeader () {
    const { header } = this
    const rawHeader = fuHeader.pack(header)
    header.checksum = checksumStruct(rawHeader, fuHeader)
    const offset = FOOTER_SIZE
    debug(
      `Write header at: ${offset} (checksum=${
        header.checksum
      }). (data=${rawHeader.toString('hex')})`
    )
    return this._write(rawHeader, offset)
  }

  async writeData (offsetSectors, buffer) {
    const bufferSizeSectors = Math.ceil(buffer.length / SECTOR_SIZE)
    const startBlock = Math.floor(offsetSectors / this.sectorsPerBlock)
    const endBufferSectors = offsetSectors + bufferSizeSectors
    const lastBlock = Math.ceil(endBufferSectors / this.sectorsPerBlock) - 1
    await this.ensureBatSize(lastBlock)
    const blockSizeBytes = this.sectorsPerBlock * SECTOR_SIZE
    const coversWholeBlock = (offsetInBlockSectors, endInBlockSectors) =>
      offsetInBlockSectors === 0 && endInBlockSectors === this.sectorsPerBlock

    for (
      let currentBlock = startBlock;
      currentBlock <= lastBlock;
      currentBlock++
    ) {
      const offsetInBlockSectors = Math.max(
        0,
        offsetSectors - currentBlock * this.sectorsPerBlock
      )
      const endInBlockSectors = Math.min(
        endBufferSectors - currentBlock * this.sectorsPerBlock,
        this.sectorsPerBlock
      )
      const startInBuffer = Math.max(
        0,
        (currentBlock * this.sectorsPerBlock - offsetSectors) * SECTOR_SIZE
      )
      const endInBuffer = Math.min(
        ((currentBlock + 1) * this.sectorsPerBlock - offsetSectors) *
          SECTOR_SIZE,
        buffer.length
      )
      let inputBuffer
      if (coversWholeBlock(offsetInBlockSectors, endInBlockSectors)) {
        inputBuffer = buffer.slice(startInBuffer, endInBuffer)
      } else {
        inputBuffer = Buffer.alloc(blockSizeBytes, 0)
        buffer.copy(
          inputBuffer,
          offsetInBlockSectors * SECTOR_SIZE,
          startInBuffer,
          endInBuffer
        )
      }
      await this.writeBlockSectors(
        { id: currentBlock, data: inputBuffer },
        offsetInBlockSectors,
        endInBlockSectors
      )
    }
    await this.writeFooter()
  }

  async ensureSpaceForParentLocators (neededSectors) {
    const firstLocatorOffset = FOOTER_SIZE + HEADER_SIZE
    const currentSpace =
      Math.floor(this.header.tableOffset / SECTOR_SIZE) -
      firstLocatorOffset / SECTOR_SIZE
    if (currentSpace < neededSectors) {
      const deltaSectors = neededSectors - currentSpace
      await this._freeFirstBlockSpace(sectorsToBytes(deltaSectors))
      this.header.tableOffset += sectorsToBytes(deltaSectors)
      await this._write(this.blockTable, this.header.tableOffset)
    }
    return firstLocatorOffset
  }

  async setUniqueParentLocator (fileNameString) {
    const { header } = this
    header.parentLocatorEntry[0].platformCode = PLATFORM_W2KU
    const encodedFilename = Buffer.from(fileNameString, 'utf16le')
    const dataSpaceSectors = Math.ceil(encodedFilename.length / SECTOR_SIZE)
    const position = await this.ensureSpaceForParentLocators(dataSpaceSectors)
    await this._write(encodedFilename, position)
    header.parentLocatorEntry[0].platformDataSpace =
      dataSpaceSectors * SECTOR_SIZE
    header.parentLocatorEntry[0].platformDataLength = encodedFilename.length
    header.parentLocatorEntry[0].platformDataOffset = position
    for (let i = 1; i < 8; i++) {
      header.parentLocatorEntry[i].platformCode = PLATFORM_NONE
      header.parentLocatorEntry[i].platformDataSpace = 0
      header.parentLocatorEntry[i].platformDataLength = 0
      header.parentLocatorEntry[i].platformDataOffset = 0
    }
  }
}
