import assert from 'assert'
import asyncIteratorToStream from 'async-iterator-to-stream'
import fu from 'struct-fu'
import getStream from 'get-stream'
import { fromEvent } from 'promise-toolbox'

import constantStream from './constant-stream'
import { dirname, resolve } from 'path'

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

// Block allocation table entry size. (Block addr)
const VHD_ENTRY_SIZE = 4

export const VHD_PLATFORM_CODE_NONE = 0

// Other.
const BLOCK_UNUSED = 0xffffffff
const BIT_MASK = 0x80

// unused block as buffer containing a uint32BE
const BUF_BLOCK_UNUSED = Buffer.allocUnsafe(VHD_ENTRY_SIZE)
BUF_BLOCK_UNUSED.writeUInt32BE(BLOCK_UNUSED, 0)

// Sizes in bytes.
export const VHD_FOOTER_SIZE = 512
export const VHD_HEADER_SIZE = 1024

export const VHD_SECTOR_SIZE = 512

// Types of backup treated. Others are not supported.
export const HARD_DISK_TYPE_DYNAMIC = 3 // Full backup.
export const HARD_DISK_TYPE_DIFFERENCING = 4 // Delta backup.

export const PLATFORM_NONE = 0
export const PLATFORM_W2RU = 0x57327275
export const PLATFORM_W2KU = 0x57326b75
export const PLATFORM_MAC = 0x4d616320
export const PLATFORM_MACX = 0x4d616358

export const VHD_PARENT_LOCATOR_ENTRIES = 8

const SIZE_OF_32_BITS = Math.pow(2, 32)

export const uint64 = fu.derive(
  fu.uint32(2),
  number => [Math.floor(number / SIZE_OF_32_BITS), number % SIZE_OF_32_BITS],
  _ => _[0] * SIZE_OF_32_BITS + _[1]
)
export const uint64Undefinable = fu.derive(
  fu.uint32(2),
  number =>
    number === undefined
      ? [0xffffffff, 0xffffffff]
      : [Math.floor(number / SIZE_OF_32_BITS), number % SIZE_OF_32_BITS],
  _ =>
    _[0] === 0xffffffff && _[1] === 0xffffffff
      ? undefined
      : _[0] * SIZE_OF_32_BITS + _[1]
)

export const fuFooter = fu.struct([
  fu.char('cookie', 8), // 0
  fu.uint32('features'), // 8
  fu.uint32('fileFormatVersion'), // 12
  uint64Undefinable('dataOffset'), // offset of the header
  fu.uint32('timestamp'), // 24
  fu.char('creatorApplication', 4), // 28
  fu.uint32('creatorVersion'), // 32
  fu.uint32('creatorHostOs'), // 36
  uint64('originalSize'),
  uint64('currentSize'),
  fu.struct('diskGeometry', [
    fu.uint16('cylinders'), // 56
    fu.uint8('heads'), // 58
    fu.uint8('sectorsPerTrackCylinder'), // 59
  ]),
  fu.uint32('diskType'), // 60 Disk type, must be equal to HARD_DISK_TYPE_DYNAMIC/HARD_DISK_TYPE_DIFFERENCING.
  fu.uint32('checksum'), // 64
  fu.uint8('uuid', 16), // 68
  fu.char('saved'), // 84
  fu.char('hidden'), // 85
  fu.char('reserved', 426), // 86
])

export const fuHeader = fu.struct([
  fu.char('cookie', 8),
  fu.uint8('dataOffsetUnused', 8),
  uint64('tableOffset'),
  fu.uint32('headerVersion'),
  fu.uint32('maxTableEntries'), // Max entries in the Block Allocation Table.
  fu.uint32('blockSize'), // Block size in bytes. Default (2097152 => 2MB)
  fu.uint32('checksum'),
  fu.uint8('parentUuid', 16),
  fu.uint32('parentTimestamp'),
  fu.uint32('reserved1'),
  fu.char16be('parentUnicodeName', 512),
  fu.struct(
    'parentLocatorEntry',
    [
      fu.uint32('platformCode'),
      fu.uint32('platformDataSpace'),
      fu.uint32('platformDataLength'),
      fu.uint32('reserved'),
      uint64('platformDataOffset'), // Absolute byte offset of the locator data.
    ],
    VHD_PARENT_LOCATOR_ENTRIES
  ),
  fu.char('reserved2', 256),
])

const resolveRelativeFromFile = (file, path) =>
  resolve('/', dirname(file), path).slice(1)

const computeBatSize = entries =>
  sectorsToBytes(sectorsRoundUpNoZero(entries * VHD_ENTRY_SIZE))

// Returns a 32 bits integer corresponding to a Vhd version.
const getVhdVersion = (major, minor) => (major << 16) | (minor & 0x0000ffff)

// Sectors conversions.
const sectorsRoundUpNoZero = bytes => Math.ceil(bytes / VHD_SECTOR_SIZE) || 1
const sectorsToBytes = sectors => sectors * VHD_SECTOR_SIZE

// Check/Set a bit on a vhd map.
const mapTestBit = (map, bit) => ((map[bit >> 3] << (bit & 7)) & BIT_MASK) !== 0
const mapSetBit = (map, bit) => {
  map[bit >> 3] |= BIT_MASK >> (bit & 7)
}

const packField = (field, value, buf) => {
  const { offset } = field

  field.pack(
    value,
    buf,
    typeof offset !== 'object' ? { bytes: offset, bits: 0 } : offset
  )
}

const unpackField = (field, buf) => {
  const { offset } = field

  return field.unpack(
    buf,
    typeof offset !== 'object' ? { bytes: offset, bits: 0 } : offset
  )
}

// Returns the checksum of a raw struct.
// The raw struct (footer or header) is altered with the new sum.
export function checksumStruct (buf, struct) {
  const checksumField = struct.fields.checksum
  let sum = 0

  // Do not use the stored checksum to compute the new checksum.
  const checksumOffset = checksumField.offset
  for (let i = 0, n = checksumOffset; i < n; ++i) {
    sum += buf[i]
  }
  for (
    let i = checksumOffset + checksumField.size, n = struct.size;
    i < n;
    ++i
  ) {
    sum += buf[i]
  }

  sum = ~sum >>> 0

  // Write new sum.
  packField(checksumField, sum, buf)

  return sum
}

const assertChecksum = (name, buf, struct) => {
  const actual = unpackField(struct.fields.checksum, buf)
  const expected = checksumStruct(buf, struct)
  if (actual !== expected) {
    throw new Error(`invalid ${name} checksum ${actual}, expected ${expected}`)
  }
}

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

export class Vhd {
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

  _readStream (start, n) {
    return this._handler.createReadStream(this._path, {
      start,
      end: start + n - 1, // end is inclusive
    })
  }

  _read (start, n) {
    return this._readStream(start, n).then(getStream.buffer)
  }

  containsBlock (id) {
    return this._getBatEntry(id) !== BLOCK_UNUSED
  }

  // Returns the first address after metadata. (In bytes)
  getEndOfHeaders () {
    const { header } = this

    let end = VHD_FOOTER_SIZE + VHD_HEADER_SIZE

    // Max(end, block allocation table end)
    end = Math.max(end, header.tableOffset + this.batSize)

    for (let i = 0; i < VHD_PARENT_LOCATOR_ENTRIES; i++) {
      const entry = header.parentLocatorEntry[i]

      if (entry.platformCode !== VHD_PLATFORM_CODE_NONE) {
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
    let end = Math.ceil(this.getEndOfHeaders() / VHD_SECTOR_SIZE)

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

  // Get the beginning (footer + header) of a vhd file.
  async readHeaderAndFooter () {
    const buf = await this._read(0, VHD_FOOTER_SIZE + VHD_HEADER_SIZE)
    const bufFooter = buf.slice(0, VHD_FOOTER_SIZE)
    const bufHeader = buf.slice(VHD_FOOTER_SIZE)

    assertChecksum('footer', bufFooter, fuFooter)
    assertChecksum('header', bufHeader, fuHeader)

    const footer = (this.footer = fuFooter.unpack(bufFooter))
    assert.strictEqual(footer.dataOffset, VHD_FOOTER_SIZE)

    const header = (this.header = fuHeader.unpack(bufHeader))

    // Compute the number of sectors in one block.
    // Default: One block contains 4096 sectors of 512 bytes.
    const sectorsPerBlock = (this.sectorsPerBlock = Math.floor(
      header.blockSize / VHD_SECTOR_SIZE
    ))

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

  // Check if a vhd object has a block allocation table.
  hasBlockAllocationTableMap () {
    return this.footer.fileFormatVersion > getVhdVersion(1, 0)
  }

  // Returns a buffer that contains the block allocation table of a vhd file.
  async readBlockTable () {
    const { header } = this
    this.blockTable = await this._read(
      header.tableOffset,
      header.maxTableEntries * VHD_ENTRY_SIZE
    )
  }

  // return the first sector (bitmap) of a block
  _getBatEntry (block) {
    return this.blockTable.readUInt32BE(block * VHD_ENTRY_SIZE)
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
      j += VHD_ENTRY_SIZE

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
      j += VHD_ENTRY_SIZE
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
        (tableOffset + batSize + spaceNeededBytes) / VHD_SECTOR_SIZE
      )
      if (
        tableOffset + batSize + spaceNeededBytes >=
        sectorsToBytes(firstSector)
      ) {
        const { fullBlockSize } = this
        const newFirstSector = Math.max(
          lastSector + fullBlockSize / VHD_SECTOR_SIZE,
          newMinSector
        )
        debug(
          `freeFirstBlockSpace: move first block ${firstSector} -> ${newFirstSector}`
        )
        // copy the first block at the end
        const stream = await this._readStream(
          sectorsToBytes(firstSector),
          fullBlockSize
        )
        await this._write(stream, sectorsToBytes(newFirstSector))
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
    bat.fill(BUF_BLOCK_UNUSED, prevMaxTableEntries * VHD_ENTRY_SIZE)
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
    const i = block * VHD_ENTRY_SIZE
    const { blockTable } = this

    blockTable.writeUInt32BE(blockSector, i)

    return this._write(
      blockTable.slice(i, i + VHD_ENTRY_SIZE),
      this.header.tableOffset + i
    )
  }

  // Make a new empty block at vhd end.
  // Update block allocation table in context and in file.
  async createBlock (blockId) {
    const blockAddr = Math.ceil(this.getEndOfData() / VHD_SECTOR_SIZE)

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
    for (let i = 0; i < sectorsPerBlock; i++) {
      // If no changes on one sector, skip.
      if (!mapTestBit(bitmap, i)) {
        continue
      }
      let parentBitmap = null
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
    const offset = VHD_FOOTER_SIZE
    debug(
      `Write header at: ${offset} (checksum=${
        header.checksum
      }). (data=${rawHeader.toString('hex')})`
    )
    return this._write(rawHeader, offset)
  }

  async writeData (offsetSectors, buffer) {
    const bufferSizeSectors = Math.ceil(buffer.length / VHD_SECTOR_SIZE)
    const startBlock = Math.floor(offsetSectors / this.sectorsPerBlock)
    const endBufferSectors = offsetSectors + bufferSizeSectors
    const lastBlock = Math.ceil(endBufferSectors / this.sectorsPerBlock) - 1
    await this.ensureBatSize(lastBlock)
    const blockSizeBytes = this.sectorsPerBlock * VHD_SECTOR_SIZE
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
        (currentBlock * this.sectorsPerBlock - offsetSectors) * VHD_SECTOR_SIZE
      )
      const endInBuffer = Math.min(
        ((currentBlock + 1) * this.sectorsPerBlock - offsetSectors) *
          VHD_SECTOR_SIZE,
        buffer.length
      )
      let inputBuffer
      if (coversWholeBlock(offsetInBlockSectors, endInBlockSectors)) {
        inputBuffer = buffer.slice(startInBuffer, endInBuffer)
      } else {
        inputBuffer = Buffer.alloc(blockSizeBytes, 0)
        buffer.copy(
          inputBuffer,
          offsetInBlockSectors * VHD_SECTOR_SIZE,
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
    const firstLocatorOffset = VHD_FOOTER_SIZE + VHD_HEADER_SIZE
    const currentSpace =
      Math.floor(this.header.tableOffset / VHD_SECTOR_SIZE) -
      firstLocatorOffset / VHD_SECTOR_SIZE
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
    const dataSpaceSectors = Math.ceil(encodedFilename.length / VHD_SECTOR_SIZE)
    const position = await this.ensureSpaceForParentLocators(dataSpaceSectors)
    await this._write(encodedFilename, position)
    header.parentLocatorEntry[0].platformDataSpace =
      dataSpaceSectors * VHD_SECTOR_SIZE
    header.parentLocatorEntry[0].platformDataLength = encodedFilename.length
    header.parentLocatorEntry[0].platformDataOffset = position
    for (let i = 1; i < 8; i++) {
      header.parentLocatorEntry[i].platformCode = VHD_PLATFORM_CODE_NONE
      header.parentLocatorEntry[i].platformDataSpace = 0
      header.parentLocatorEntry[i].platformDataLength = 0
      header.parentLocatorEntry[i].platformDataOffset = 0
    }
  }
}

export const createReadStream = asyncIteratorToStream(function * (handler, path) {
  const fds = []

  try {
    const vhds = []
    while (true) {
      const fd = yield handler.openFile(path, 'r')
      fds.push(fd)
      const vhd = new Vhd(handler, fd)
      vhds.push(vhd)
      yield vhd.readHeaderAndFooter()
      yield vhd.readBlockTable()

      if (vhd.footer.diskType === HARD_DISK_TYPE_DYNAMIC) {
        break
      }

      path = resolveRelativeFromFile(path, vhd.header.parentUnicodeName)
    }
    const nVhds = vhds.length

    // this the VHD we want to synthetize
    const vhd = vhds[0]

    // data of our synthetic VHD
    // TODO: empty parentUuid and parentLocatorEntry-s in header
    let header = {
      ...vhd.header,
      tableOffset: 512 + 1024,
      parentUnicodeName: '',
    }

    const bat = Buffer.allocUnsafe(
      Math.ceil(4 * header.maxTableEntries / VHD_SECTOR_SIZE) * VHD_SECTOR_SIZE
    )
    let footer = {
      ...vhd.footer,
      diskType: HARD_DISK_TYPE_DYNAMIC,
    }
    const sectorsPerBlockData = vhd.sectorsPerBlock
    const sectorsPerBlock =
      sectorsPerBlockData + vhd.bitmapSize / VHD_SECTOR_SIZE

    const nBlocks = Math.ceil(footer.currentSize / header.blockSize)

    const blocksOwner = new Array(nBlocks)
    for (
      let iBlock = 0,
        blockOffset = Math.ceil((512 + 1024 + bat.length) / VHD_SECTOR_SIZE);
      iBlock < nBlocks;
      ++iBlock
    ) {
      let blockSector = BLOCK_UNUSED
      for (let i = 0; i < nVhds; ++i) {
        if (vhds[i].containsBlock(iBlock)) {
          blocksOwner[iBlock] = i
          blockSector = blockOffset
          blockOffset += sectorsPerBlock
          break
        }
      }
      bat.writeUInt32BE(blockSector, iBlock * 4)
    }

    footer = fuFooter.pack(footer)
    checksumStruct(footer, fuFooter)
    yield footer

    header = fuHeader.pack(header)
    checksumStruct(header, fuHeader)
    yield header

    yield bat

    const bitmap = Buffer.alloc(vhd.bitmapSize, 0xff)
    for (let iBlock = 0; iBlock < nBlocks; ++iBlock) {
      const owner = blocksOwner[iBlock]
      if (owner === undefined) {
        continue
      }

      yield bitmap

      const blocksByVhd = new Map()
      const emitBlockSectors = function * (iVhd, i, n) {
        const vhd = vhds[iVhd]
        if (!vhd.containsBlock(iBlock)) {
          yield * emitBlockSectors(iVhd + 1, i, n)
          return
        }
        let block = blocksByVhd.get(vhd)
        if (block === undefined) {
          block = yield vhd._readBlock(iBlock)
          blocksByVhd.set(vhd, block)
        }
        const { bitmap, data } = block
        if (vhd.footer.diskType === HARD_DISK_TYPE_DYNAMIC) {
          yield data.slice(i * VHD_SECTOR_SIZE, n * VHD_SECTOR_SIZE)
          return
        }
        while (i < n) {
          const hasData = mapTestBit(bitmap, i)
          const start = i
          do {
            ++i
          } while (i < n && mapTestBit(bitmap, i) === hasData)
          if (hasData) {
            yield data.slice(start * VHD_SECTOR_SIZE, i * VHD_SECTOR_SIZE)
          } else {
            yield * emitBlockSectors(iVhd + 1, start, i)
          }
        }
      }
      yield * emitBlockSectors(owner, 0, sectorsPerBlock)
    }

    yield footer
  } finally {
    for (let i = 0, n = fds.length; i < n; ++i) {
      handler.closeFile(fds[i]).catch(error => {
        console.warn('createReadStream, closeFd', i, error)
      })
    }
  }
})
