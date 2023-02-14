import assert from 'assert'
import zlib from 'zlib'

import { compressionDeflate, unpackHeader, parseU64b } from './definitions'
import { VirtualBuffer } from './virtual-buffer'

const SECTOR_SIZE = 512
const HEADER_SIZE = 512
const VERSION_OFFSET = 4

function parseDescriptor(descriptorSlice) {
  const descriptorText = descriptorSlice.toString('ascii').replace(/\x00+$/, '') // eslint-disable-line no-control-regex
  const descriptorDict = {}
  const extentList = []
  const lines = descriptorText.split(/\r?\n/).filter(line => {
    return line.trim().length > 0 && line[0] !== '#'
  })
  for (const line of lines) {
    const defLine = line.split('=')
    // the wonky quote test is to avoid having an equal sign in the name of an extent
    if (defLine.length === 2 && defLine[0].indexOf('"') === -1) {
      descriptorDict[defLine[0]] = defLine[1].replace(/['"]+/g, '')
    } else {
      const items = line.split(' ')
      extentList.push({
        access: items[0],
        sizeSectors: items[1],
        type: items[2],
        name: items[3],
        offset: items.length > 4 ? items[4] : 0,
      })
    }
  }
  return { descriptor: descriptorDict, extents: extentList }
}

function readGrain(offsetSectors, buffer, compressed) {
  const offset = offsetSectors * SECTOR_SIZE
  const size = buffer.readUInt32LE(offset + 8)
  const grainBuffer = buffer.slice(offset + 12, offset + 12 + size)
  const grainContent = compressed ? zlib.inflateSync(grainBuffer) : grainBuffer
  const lba = parseU64b(buffer, offset, 'l2Lba')
  return {
    offsetSectors,
    offset,
    lba,
    lbaBytes: lba * SECTOR_SIZE,
    size,
    buffer: grainBuffer,
    grain: grainContent,
    grainSize: grainContent.byteLength,
  }
}

function parseMarker(buffer) {
  const value = buffer.readUInt32LE(0)
  const size = buffer.readUInt32LE(8)
  const type = buffer.readUInt32LE(12)
  return { value, size, type }
}

function alignSectors(number) {
  return Math.ceil(number / SECTOR_SIZE) * SECTOR_SIZE
}

export default class VMDKDirectParser {
  constructor(readStream, grainLogicalAddressList, grainFileOffsetList, gzipped = false, length) {
    if (gzipped) {
      const unzipStream = zlib.createGunzip()
      readStream.pipe(unzipStream)
      readStream = unzipStream
    }
    this.grainLogicalAddressList = grainLogicalAddressList
    this.grainFileOffsetList = grainFileOffsetList
    this.virtualBuffer = new VirtualBuffer(readStream)
    this.header = null
    this._length = length
  }

  // I found a VMDK file whose L1 and L2 table did not have a marker, but they were at the top
  // I detect this case and eat those tables first then let the normal loop go over the grains.
  async _readL1() {
    const position = this.virtualBuffer.position
    const l1entries = Math.floor(
      (this.header.capacitySectors + this.header.l1EntrySectors - 1) / this.header.l1EntrySectors
    )
    const sectorAlignedL1Bytes = alignSectors(l1entries * 4)
    const l1Buffer = await this.virtualBuffer.readChunk(sectorAlignedL1Bytes, 'L1 table ' + position)
    let l2Start = 0
    let l2IsContiguous = true
    for (let i = 0; i < l1entries; i++) {
      const l1Entry = l1Buffer.readUInt32LE(i * 4)
      if (i > 0) {
        const previousL1Entry = l1Buffer.readUInt32LE((i - 1) * 4)
        l2IsContiguous = l2IsContiguous && l1Entry - previousL1Entry === 4
      } else {
        l2IsContiguous =
          l1Entry * SECTOR_SIZE === this.virtualBuffer.position ||
          l1Entry * SECTOR_SIZE === this.virtualBuffer.position + SECTOR_SIZE
        l2Start = l1Entry * SECTOR_SIZE
      }
    }
    if (!l2IsContiguous) {
      return null
    }
    const l1L2FreeSpace = l2Start - this.virtualBuffer.position
    if (l1L2FreeSpace > 0) {
      await this.virtualBuffer.readChunk(l1L2FreeSpace, 'freeSpace between L1 and L2')
    }
    const l2entries = Math.ceil(this.header.capacitySectors / this.header.grainSizeSectors)
    const l2ByteSize = alignSectors(l1entries * this.header.numGTEsPerGT * 4)
    const l2Buffer = await this.virtualBuffer.readChunk(l2ByteSize, 'L2 table ' + position)
    let firstGrain = null
    for (let i = 0; i < l2entries; i++) {
      const l2Entry = l2Buffer.readUInt32LE(i * 4)
      if (firstGrain === null) {
        firstGrain = l2Entry
      }
    }
    const freeSpace = firstGrain * SECTOR_SIZE - this.virtualBuffer.position
    if (freeSpace > 0) {
      await this.virtualBuffer.readChunk(freeSpace, 'freeSpace after L2')
    }
  }

  async readHeader() {
    const headerBuffer = await this.virtualBuffer.readChunk(HEADER_SIZE, 'readHeader')
    const magicString = headerBuffer.slice(0, 4).toString('ascii')
    if (magicString !== 'KDMV') {
      throw new Error('not a VMDK file')
    }
    const version = headerBuffer.readUInt32LE(VERSION_OFFSET)
    if (version !== 1 && version !== 3) {
      throw new Error('unsupported VMDK version ' + version + ', only version 1 and 3 are supported')
    }
    this.header = unpackHeader(headerBuffer)
    // I think the multiplications are OK, because the descriptor is always at the beginning of the file
    const descriptorLength = this.header.descriptorSizeSectors * SECTOR_SIZE
    const descriptorBuffer = await this.virtualBuffer.readChunk(descriptorLength, 'descriptor')
    this.descriptor = parseDescriptor(descriptorBuffer)
    let l1PositionBytes = null
    if (this.header.grainDirectoryOffsetSectors !== -1 && this.header.grainDirectoryOffsetSectors !== 0) {
      l1PositionBytes = this.header.grainDirectoryOffsetSectors * SECTOR_SIZE
    }
    const endOfDescriptor = this.virtualBuffer.position
    if (
      l1PositionBytes !== null &&
      (l1PositionBytes === endOfDescriptor || l1PositionBytes === endOfDescriptor + SECTOR_SIZE)
    ) {
      if (l1PositionBytes === endOfDescriptor + SECTOR_SIZE) {
        await this.virtualBuffer.readChunk(SECTOR_SIZE, 'skipping L1 marker')
      }
      await this._readL1()
    }
    return this.header
  }

  async parseMarkedGrain(expectedLogicalAddress) {
    const position = this.virtualBuffer.position
    const sector = await this.virtualBuffer.readChunk(SECTOR_SIZE, `marker starting at ${position}`)
    const marker = parseMarker(sector)
    if (marker.size === 0) {
      throw new Error(`expected grain marker, received ${marker}`)
    } else if (marker.size > 10) {
      const grainDiskSize = marker.size + 12
      const alignedGrainDiskSize = alignSectors(grainDiskSize)
      const remainOfBufferSize = alignedGrainDiskSize - SECTOR_SIZE
      const remainderOfGrainBuffer = await this.virtualBuffer.readChunk(
        remainOfBufferSize,
        `grain remainder ${this.virtualBuffer.position} -> ${this.virtualBuffer.position + remainOfBufferSize}`
      )
      const grainBuffer = Buffer.concat([sector, remainderOfGrainBuffer])
      const grainObject = readGrain(
        0,
        grainBuffer,
        this.header.compressionMethod === compressionDeflate && this.header.flags.compressedGrains
      )
      assert.strictEqual(grainObject.lba * SECTOR_SIZE, expectedLogicalAddress)
      return grainObject.grain
    }
  }

  async *blockIterator() {
    for (let tableIndex = 0; tableIndex < this.grainFileOffsetList.length; tableIndex++) {
      const position = this.virtualBuffer.position
      const grainPosition = this.grainFileOffsetList[tableIndex] * SECTOR_SIZE
      const grainSizeBytes = this.header.grainSizeSectors * SECTOR_SIZE
      const lba = this.grainLogicalAddressList[tableIndex] * grainSizeBytes
      assert.strictEqual(
        grainPosition >= position,
        true,
        `Grain position ${grainPosition} must be after current position ${position}`
      )
      await this.virtualBuffer.readChunk(grainPosition - position, `blank from ${position} to ${grainPosition}`)
      let grain
      if (this.header.flags.hasMarkers) {
        grain = await this.parseMarkedGrain(lba)
      } else {
        grain = await this.virtualBuffer.readChunk(grainSizeBytes, 'grain ' + this.virtualBuffer.position)
      }
      yield { logicalAddressBytes: lba, data: grain }
    }
    // drain remaining
    // stream.resume does not seems to be enough to consume completly the stream
    // especially when this stream is part of a tar ( ova) , potentially gzipped
    if (this._length !== undefined) {
      while (this.virtualBuffer.position < this._length) {
        await this.virtualBuffer.readChunk(
          Math.min(this._length - this.virtualBuffer.position, 1024 * 1024),
          'draining'
        )
      }
    }
  }
}
