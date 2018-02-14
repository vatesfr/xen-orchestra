// TODO: remove once completely merged in vhd.js

import assert from 'assert'
import eventToPromise from 'event-to-promise'
import fu from '@nraynaud/struct-fu'
import isEqual from 'lodash/isEqual'

import constantStream from './constant-stream'
import { noop, streamToBuffer } from './utils'

const VHD_UTIL_DEBUG = 0
const debug = VHD_UTIL_DEBUG ? str => console.log(`[vhd-util]${str}`) : noop

// ===================================================================
//
// Spec:
// https://www.microsoft.com/en-us/download/details.aspx?id=23850
//
// C implementation:
// https://github.com/rubiojr/vhd-util-convert
//
// ===================================================================

// Sizes in bytes.
const VHD_FOOTER_SIZE = 512
const VHD_HEADER_SIZE = 1024
const VHD_SECTOR_SIZE = 512

// Block allocation table entry size. (Block addr)
const VHD_ENTRY_SIZE = 4

const VHD_PARENT_LOCATOR_ENTRIES = 8
const VHD_PLATFORM_CODE_NONE = 0

// Types of backup treated. Others are not supported.
const HARD_DISK_TYPE_DYNAMIC = 3 // Full backup.
const HARD_DISK_TYPE_DIFFERENCING = 4 // Delta backup.

// Other.
const BLOCK_UNUSED = 0xffffffff
const BIT_MASK = 0x80

// unused block as buffer containing a uint32BE
const BUF_BLOCK_UNUSED = Buffer.allocUnsafe(VHD_ENTRY_SIZE)
BUF_BLOCK_UNUSED.writeUInt32BE(BLOCK_UNUSED, 0)

// ===================================================================

const fuFooter = fu.struct([
  fu.char('cookie', 8), // 0
  fu.uint32('features'), // 8
  fu.uint32('fileFormatVersion'), // 12
  fu.struct('dataOffset', [
    fu.uint32('high'), // 16
    fu.uint32('low'), // 20
  ]),
  fu.uint32('timestamp'), // 24
  fu.char('creatorApplication', 4), // 28
  fu.uint32('creatorVersion'), // 32
  fu.uint32('creatorHostOs'), // 36
  fu.struct('originalSize', [
    // At the creation, current size of the hard disk.
    fu.uint32('high'), // 40
    fu.uint32('low'), // 44
  ]),
  fu.struct('currentSize', [
    // Current size of the virtual disk. At the creation: currentSize = originalSize.
    fu.uint32('high'), // 48
    fu.uint32('low'), // 52
  ]),
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

const fuHeader = fu.struct([
  fu.char('cookie', 8),
  fu.struct('dataOffset', [fu.uint32('high'), fu.uint32('low')]),
  fu.struct('tableOffset', [
    // Absolute byte offset of the Block Allocation Table.
    fu.uint32('high'),
    fu.uint32('low'),
  ]),
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
      fu.struct('platformDataOffset', [
        // Absolute byte offset of the locator data.
        fu.uint32('high'),
        fu.uint32('low'),
      ]),
    ],
    VHD_PARENT_LOCATOR_ENTRIES
  ),
  fu.char('reserved2', 256),
])

// ===================================================================
// Helpers
// ===================================================================

const SIZE_OF_32_BITS = Math.pow(2, 32)
const uint32ToUint64 = fu => fu.high * SIZE_OF_32_BITS + fu.low

// Returns a 32 bits integer corresponding to a Vhd version.
const getVhdVersion = (major, minor) => (major << 16) | (minor & 0x0000ffff)

// Sectors conversions.
const sectorsRoundUp = bytes =>
  Math.floor((bytes + VHD_SECTOR_SIZE - 1) / VHD_SECTOR_SIZE)
const sectorsRoundUpNoZero = bytes => sectorsRoundUp(bytes) || 1
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
// ===================================================================

// Returns the checksum of a raw struct.
// The raw struct (footer or header) is altered with the new sum.
function checksumStruct (rawStruct, struct) {
  const checksumField = struct.fields.checksum

  let sum = 0

  // Reset current sum.
  packField(checksumField, 0, rawStruct)

  for (let i = 0, n = struct.size; i < n; i++) {
    sum = (sum + rawStruct[i]) & 0xffffffff
  }

  sum = 0xffffffff - sum

  // Write new sum.
  packField(checksumField, sum, rawStruct)

  return sum
}

// ===================================================================

class Vhd {
  constructor (handler, path) {
    this._handler = handler
    this._path = path
  }

  // =================================================================
  // Read functions.
  // =================================================================

  _readStream (start, n) {
    if (this._fd) {
      return this._handler.createReadStream(this._path, {
        fd: this._fd,
        autoClose: false,
        start,
        end: start + n - 1, // end is inclusive
      })
    }
    return this._handler.createReadStream(this._path, {
      start,
      end: start + n - 1, // end is inclusive
    })
  }

  _read (start, n) {
    return this._readStream(start, n).then(streamToBuffer)
  }

  // Returns the first address after metadata. (In bytes)
  getEndOfHeaders () {
    const { header } = this

    let end = uint32ToUint64(this.footer.dataOffset) + VHD_HEADER_SIZE

    const blockAllocationTableSize = sectorsToBytes(
      sectorsRoundUpNoZero(header.maxTableEntries * VHD_ENTRY_SIZE)
    )

    // Max(end, block allocation table end)
    end = Math.max(
      end,
      uint32ToUint64(header.tableOffset) + blockAllocationTableSize
    )

    for (let i = 0; i < VHD_PARENT_LOCATOR_ENTRIES; i++) {
      const entry = header.parentLocatorEntry[i]

      if (entry.platformCode !== VHD_PLATFORM_CODE_NONE) {
        end = Math.max(
          end,
          uint32ToUint64(entry.platformDataOffset) +
            sectorsToBytes(entry.platformDataSpace)
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

    const sum = unpackField(fuFooter.fields.checksum, buf)
    const sumToTest = checksumStruct(buf, fuFooter)

    // Checksum child & parent.
    if (sumToTest !== sum) {
      throw new Error(
        `Bad checksum in vhd. Expected: ${sum}. Given: ${sumToTest}. (data=${buf.toString(
          'hex'
        )})`
      )
    }

    const header = (this.header = fuHeader.unpack(buf.slice(VHD_FOOTER_SIZE)))
    this.footer = fuFooter.unpack(buf)

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

    const offset = uint32ToUint64(header.tableOffset)
    const size = sectorsToBytes(
      sectorsRoundUpNoZero(header.maxTableEntries * VHD_ENTRY_SIZE)
    )

    this.blockTable = await this._read(offset, size)
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
          ? { bitmap: buf }
          : {
            bitmap: buf.slice(0, this.bitmapSize),
            data: buf.slice(this.bitmapSize),
            buffer: buf,
          }
    )
  }

  // get the identifiers and first sectors of the first and last block
  // in the file
  //
  // return undefined if none
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
        throw new Error('no allocated block found')
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
      fd: this._fd,
      autoClose: false,
      flags: 'r+',
      start: offset,
    })
    return Buffer.isBuffer(data)
      ? new Promise((resolve, reject) => {
        stream.on('error', reject)
        stream.end(data, resolve)
      })
      : eventToPromise(data.pipe(stream), 'finish')
  }

  async ensureBatSize (size) {
    const { header } = this

    const prevMaxTableEntries = header.maxTableEntries
    if (prevMaxTableEntries >= size) {
      return
    }

    const tableOffset = uint32ToUint64(header.tableOffset)
    const { first, firstSector, lastSector } = this._getFirstAndLastBlocks()

    // extend BAT
    const maxTableEntries = (header.maxTableEntries = size)
    const batSize = maxTableEntries * VHD_ENTRY_SIZE
    const prevBat = this.blockTable
    const bat = (this.blockTable = Buffer.allocUnsafe(batSize))
    prevBat.copy(bat)
    bat.fill(BUF_BLOCK_UNUSED, prevBat.length)
    debug(
      `ensureBatSize: extend in memory BAT ${prevMaxTableEntries} -> ${maxTableEntries}`
    )

    const extendBat = () => {
      debug(
        `ensureBatSize: extend in file BAT ${prevMaxTableEntries} -> ${maxTableEntries}`
      )

      return this._write(
        constantStream(BUF_BLOCK_UNUSED, maxTableEntries - prevMaxTableEntries),
        tableOffset + prevBat.length
      )
    }

    if (tableOffset + batSize < sectorsToBytes(firstSector)) {
      return Promise.all([extendBat(), this.writeHeader()])
    }

    const { fullBlockSize } = this
    const newFirstSector = lastSector + fullBlockSize / VHD_SECTOR_SIZE
    debug(`ensureBatSize: move first block ${firstSector} -> ${newFirstSector}`)

    return Promise.all([
      // copy the first block at the end
      this._readStream(sectorsToBytes(firstSector), fullBlockSize)
        .then(stream => this._write(stream, sectorsToBytes(newFirstSector)))
        .then(extendBat),

      this._setBatEntry(first, newFirstSector),
      this.writeHeader(),
      this.writeFooter(),
    ])
  }

  // set the first sector (bitmap) of a block
  _setBatEntry (block, blockSector) {
    const i = block * VHD_ENTRY_SIZE
    const { blockTable } = this

    blockTable.writeUInt32BE(blockSector, i)

    return this._write(
      blockTable.slice(i, i + VHD_ENTRY_SIZE),
      uint32ToUint64(this.header.tableOffset) + i
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
        await this.writeBlockSectors(
          block,
          i,
          endSector,
          (await this._readBlock(blockId, true)).bitmap
        )
      }

      i = endSector
    }

    // Return the merged data size
    return data.length
  }

  // Write a context footer. (At the end and beginning of a vhd file.)
  async writeFooter () {
    const { footer } = this

    const offset = this.getEndOfData()
    const rawFooter = fuFooter.pack(footer)

    footer.checksum = checksumStruct(rawFooter, fuFooter)
    debug(
      `Write footer at: ${offset} (checksum=${
        footer.checksum
      }). (data=${rawFooter.toString('hex')})`
    )

    await this._write(rawFooter, 0)
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
}

// Merge vhd child into vhd parent.
//
// Child must be a delta backup !
// Parent must be a full backup !
//
// TODO: update the identifier of the parent VHD.
export default async function vhdMerge (
  parentHandler,
  parentPath,
  childHandler,
  childPath
) {
  const parentVhd = new Vhd(parentHandler, parentPath)
  parentVhd._fd = await parentHandler.openFile(parentPath, 'r+')
  try {
    const childVhd = new Vhd(childHandler, childPath)
    childVhd._fd = await childHandler.openFile(childPath, 'r')
    try {
      // Reading footer and header.
      await Promise.all([
        parentVhd.readHeaderAndFooter(),
        childVhd.readHeaderAndFooter(),
      ])

      assert(childVhd.header.blockSize === parentVhd.header.blockSize)

      // Child must be a delta.
      if (childVhd.footer.diskType !== HARD_DISK_TYPE_DIFFERENCING) {
        throw new Error('Unable to merge, child is not a delta backup.')
      }

      // Merging in differencing disk is prohibited in our case.
      if (parentVhd.footer.diskType !== HARD_DISK_TYPE_DYNAMIC) {
        throw new Error('Unable to merge, parent is not a full backup.')
      }

      // Allocation table map is not yet implemented.
      if (
        parentVhd.hasBlockAllocationTableMap() ||
        childVhd.hasBlockAllocationTableMap()
      ) {
        throw new Error('Unsupported allocation table map.')
      }

      // Read allocation table of child/parent.
      await Promise.all([parentVhd.readBlockTable(), childVhd.readBlockTable()])

      await parentVhd.ensureBatSize(childVhd.header.maxTableEntries)

      let mergedDataSize = 0
      for (
        let blockId = 0;
        blockId < childVhd.header.maxTableEntries;
        blockId++
      ) {
        if (childVhd._getBatEntry(blockId) !== BLOCK_UNUSED) {
          mergedDataSize += await parentVhd.coalesceBlock(childVhd, blockId)
        }
      }
      const cFooter = childVhd.footer
      const pFooter = parentVhd.footer

      pFooter.currentSize = { ...cFooter.currentSize }
      pFooter.diskGeometry = { ...cFooter.diskGeometry }
      pFooter.originalSize = { ...cFooter.originalSize }
      pFooter.timestamp = cFooter.timestamp

      // necessary to update values and to recreate the footer after block
      // creation
      await parentVhd.writeFooter()

      return mergedDataSize
    } finally {
      await childHandler.closeFile(childVhd._fd)
    }
  } finally {
    await parentHandler.closeFile(parentVhd._fd)
  }
}

// returns true if the child was actually modified
export async function chainVhd (
  parentHandler,
  parentPath,
  childHandler,
  childPath
) {
  const parentVhd = new Vhd(parentHandler, parentPath)
  const childVhd = new Vhd(childHandler, childPath)
  await Promise.all([
    parentVhd.readHeaderAndFooter(),
    childVhd.readHeaderAndFooter(),
  ])

  const { header } = childVhd

  const parentName = parentPath.split('/').pop()
  const parentUuid = parentVhd.footer.uuid
  if (
    header.parentUnicodeName !== parentName ||
    !isEqual(header.parentUuid, parentUuid)
  ) {
    header.parentUuid = parentUuid
    header.parentUnicodeName = parentName
    await childVhd.writeHeader()
    return true
  }

  // The checksum was broken between xo-server v5.2.4 and v5.2.5
  //
  // Replace by a correct checksum if necessary.
  //
  // TODO: remove when enough time as passed (6 months).
  {
    const rawHeader = fuHeader.pack(header)
    const checksum = checksumStruct(rawHeader, fuHeader)
    if (checksum !== header.checksum) {
      await childVhd._write(rawHeader, VHD_FOOTER_SIZE)
      return true
    }
  }

  return false
}
