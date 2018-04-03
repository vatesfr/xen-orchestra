'use strict'
import { checksumStruct, fuFooter, fuHeader } from '@xen-orchestra/vhd-lib'
import { open, write } from 'fs-promise'
import stream from 'stream'
import { VMDKDirectParser } from './vmdk-read'

const footerCookie = 'conectix'
const creatorApp = 'xo  '
// it looks like everybody is using Wi2k
const WIN2K_OS = 0x5769326b
const headerCookie = 'cxsparse'
const fixedHardDiskType = 2
const dynamicHardDiskType = 3

const sectorSize = 512

export function computeChecksum (buffer) {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i]
  }
  // http://stackoverflow.com/a/1908655/72637 the >>> prevents the number from going negative
  return ~sum >>> 0
}

class Block {
  constructor (blockSize) {
    const bitmapSize = blockSize / sectorSize / 8
    const bufferSize =
      Math.ceil((blockSize + bitmapSize) / sectorSize) * sectorSize
    this.buffer = Buffer.alloc(bufferSize)
    this.bitmapBuffer = this.buffer.slice(0, bitmapSize)
    this.dataBuffer = this.buffer.slice(bitmapSize)
    this.bitmapBuffer.fill(0xff)
  }

  writeData (buffer, offset = 0) {
    buffer.copy(this.dataBuffer, offset)
  }

  async writeOnFile (file) {
    await write(file, this.buffer, 0, this.buffer.length)
  }
}

class SparseExtent {
  constructor (dataSize, blockSize, startOffset) {
    this.table = createEmptyTable(dataSize, blockSize)
    this.blockSize = blockSize
    this.startOffset = (startOffset + this.table.buffer.length) / sectorSize
  }

  get entryCount () {
    return this.table.entryCount
  }

  _writeBlock (blockBuffer, tableIndex, offset) {
    if (blockBuffer.length + offset > this.blockSize) {
      throw new Error('invalid block geometry')
    }
    let entry = this.table.entries[tableIndex]
    if (entry === undefined) {
      entry = new Block(this.blockSize)
      this.table.entries[tableIndex] = entry
    }
    entry.writeData(blockBuffer, offset)
  }

  writeBuffer (buffer, offset = 0) {
    const startBlock = Math.floor(offset / this.blockSize)
    const endBlock = Math.ceil((offset + buffer.length) / this.blockSize)
    for (let i = startBlock; i < endBlock; i++) {
      const blockDelta = offset - i * this.blockSize
      let blockBuffer, blockOffset
      if (blockDelta > 0) {
        blockBuffer = buffer.slice(0, (i + 1) * this.blockSize - offset)
        blockOffset = blockDelta
      } else {
        blockBuffer = buffer.slice(
          -blockDelta,
          (i + 1) * this.blockSize - offset
        )
        blockOffset = 0
      }
      this._writeBlock(blockBuffer, i, blockOffset)
    }
  }

  async writeOnFile (file) {
    let currentOffset = this.startOffset
    for (let i = 0; i < this.table.entryCount; i++) {
      const block = this.table.entries[i]
      if (block !== undefined) {
        this.table.buffer.writeUInt32BE(currentOffset, i * 4)
        currentOffset += block.buffer.length / sectorSize
      }
    }
    await write(file, this.table.buffer, 0, this.table.buffer.length)
    for (let i = 0; i < this.table.entryCount; i++) {
      const block = this.table.entries[i]
      if (block !== undefined) {
        await block.writeOnFile(file)
      }
    }
  }
}

export class VHDFile {
  constructor (virtualSize, timestamp) {
    this.geomtry = computeGeometryForSize(virtualSize)
    this.timestamp = timestamp
    this.blockSize = 0x00200000
    this.sparseFile = new SparseExtent(
      this.geomtry.actualSize,
      this.blockSize,
      sectorSize * 3
    )
  }

  writeBuffer (buffer, offset = 0) {
    this.sparseFile.writeBuffer(buffer, offset)
  }

  async writeFile (fileName) {
    const fileFooter = createFooter(
      this.geomtry.actualSize,
      this.timestamp,
      this.geomtry,
      dynamicHardDiskType,
      fuFooter.size
    )
    const diskHeader = createDynamicDiskHeader(
      this.sparseFile.entryCount,
      this.blockSize
    )
    const file = await open(fileName, 'w')
    await write(file, fileFooter, 0, fileFooter.length)
    await write(file, diskHeader, 0, diskHeader.length)
    await this.sparseFile.writeOnFile(file)
    await write(file, fileFooter, 0, fileFooter.length)
  }
}

export function computeGeometryForSize (size) {
  const totalSectors = Math.ceil(size / 512)
  let sectorsPerTrackCylinder
  let heads
  let cylinderTimesHeads
  if (totalSectors > 65535 * 16 * 255) {
    throw Error('disk is too big')
  }
  // straight copypasta from the file spec appendix on CHS Calculation
  if (totalSectors >= 65535 * 16 * 63) {
    sectorsPerTrackCylinder = 255
    heads = 16
    cylinderTimesHeads = totalSectors / sectorsPerTrackCylinder
  } else {
    sectorsPerTrackCylinder = 17
    cylinderTimesHeads = totalSectors / sectorsPerTrackCylinder
    heads = Math.floor((cylinderTimesHeads + 1023) / 1024)
    if (heads < 4) {
      heads = 4
    }
    if (cylinderTimesHeads >= heads * 1024 || heads > 16) {
      sectorsPerTrackCylinder = 31
      heads = 16
      cylinderTimesHeads = totalSectors / sectorsPerTrackCylinder
    }
    if (cylinderTimesHeads >= heads * 1024) {
      sectorsPerTrackCylinder = 63
      heads = 16
      cylinderTimesHeads = totalSectors / sectorsPerTrackCylinder
    }
  }
  const cylinders = Math.floor(cylinderTimesHeads / heads)
  const actualSize = cylinders * heads * sectorsPerTrackCylinder * sectorSize
  return { cylinders, heads, sectorsPerTrackCylinder, actualSize }
}

export function createFooter (size, timestamp, geometry, diskType, dataOffset) {
  const footer = fuFooter.pack({
    cookie: footerCookie,
    features: 2,
    fileFormatVersion: 0x00010000,
    dataOffset,
    timestamp,
    creatorApplication: creatorApp,
    creatorHostOs: WIN2K_OS,
    originalSize: size,
    currentSize: size,
    diskGeometry: geometry,
    diskType,
  })
  checksumStruct(footer, fuFooter)
  return footer
}

export function createDynamicDiskHeader (tableEntries, blockSize) {
  const header = fuHeader.pack({
    cookie: headerCookie,
    dataOffsetUnused: Buffer.alloc(8, 0xff),
    tableOffset: sectorSize * 3,
    headerVersion: 0x00010000,
    maxTableEntries: tableEntries,
    blockSize: blockSize,
    checksum: 0,
  })
  checksumStruct(header, fuHeader)
  return header
}

export function createEmptyTable (dataSize, blockSize) {
  const blockCount = Math.ceil(dataSize / blockSize)
  const tableSizeSectors = Math.ceil(blockCount * 4 / sectorSize)
  const buffer = Buffer.alloc(tableSizeSectors * sectorSize, 0xff)
  return { entryCount: blockCount, buffer: buffer, entries: [] }
}

export class ReadableRawVHDStream extends stream.Readable {
  constructor (size, vmdkParser) {
    super()
    this.size = size
    const geometry = computeGeometryForSize(size)
    this.footer = createFooter(
      size,
      Math.floor(Date.now() / 1000),
      geometry,
      fixedHardDiskType
    )
    this.position = 0
    this.vmdkParser = vmdkParser
    this.done = false
    this.busy = false
    this.currentFile = []
  }

  filePadding (paddingLength) {
    if (paddingLength !== 0) {
      const chunkSize = 1024 * 1024 // 1Mo
      const chunkCount = Math.floor(paddingLength / chunkSize)
      for (let i = 0; i < chunkCount; i++) {
        this.currentFile.push(() => {
          const paddingBuffer = Buffer.alloc(chunkSize)
          return paddingBuffer
        })
      }
      this.currentFile.push(() => {
        const paddingBuffer = Buffer.alloc(paddingLength % chunkSize)
        return paddingBuffer
      })
    }
  }

  async pushNextBlock () {
    const next = await this.vmdkParser.next()
    if (next === null) {
      const paddingLength = this.size - this.position
      this.filePadding(paddingLength)
      this.currentFile.push(() => this.footer)
      this.currentFile.push(() => {
        this.done = true
        return null
      })
    } else {
      const offset = next.lbaBytes
      const buffer = next.grain
      const paddingLength = offset - this.position
      if (paddingLength < 0) {
        process.nextTick(() =>
          this.emit(
            'error',
            'This VMDK file does not have its blocks in the correct order'
          )
        )
      }
      this.filePadding(paddingLength)
      this.currentFile.push(() => buffer)
      this.position = offset + buffer.length
    }
    return this.pushFileUntilFull()
  }

  // returns true if the file is empty
  pushFileUntilFull () {
    while (true) {
      if (this.currentFile.length === 0) {
        break
      }
      const result = this.push(this.currentFile.shift()())
      if (!result) {
        break
      }
    }
    return this.currentFile.length === 0
  }

  async pushNextUntilFull () {
    while (!this.done && (await this.pushNextBlock())) {}
  }

  _read () {
    if (this.busy || this.done) {
      return
    }
    if (this.pushFileUntilFull()) {
      this.busy = true
      this.pushNextUntilFull()
        .then(() => {
          this.busy = false
        })
        .catch(error => {
          process.nextTick(() => this.emit('error', error))
        })
    }
  }
}

export async function convertFromVMDK (vmdkReadStream) {
  const parser = new VMDKDirectParser(vmdkReadStream)
  const header = await parser.readHeader()
  return new ReadableRawVHDStream(header.capacitySectors * sectorSize, parser)
}
