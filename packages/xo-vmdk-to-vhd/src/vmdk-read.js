'use strict'

import zlib from 'zlib'
import {VirtualBuffer} from './virtual-buffer'

const sectorSize = 512
const compressionDeflate = 'COMPRESSION_DEFLATE'
const compressionNone = 'COMPRESSION_NONE'
const compressionMap = [compressionNone, compressionDeflate]

function parseS64b (buffer, offset, valueName) {
  const low = buffer.readInt32LE(offset)
  const high = buffer.readInt32LE(offset + 4)
  // here there might be a surprise because we are reading 64 integers into double floats (53 bits mantissa)
  const value = low | high << 32
  if ((value & (Math.pow(2, 32) - 1)) !== low) {
    throw new Error('Unsupported VMDK, ' + valueName + ' is too big')
  }
  return value
}

function parseU64b (buffer, offset, valueName) {
  const low = buffer.readUInt32LE(offset)
  const high = buffer.readUInt32LE(offset + 4)
  // here there might be a surprise because we are reading 64 integers into double floats (53 bits mantissa)
  const value = low | high << 32
  if ((value & (Math.pow(2, 32) - 1)) !== low) {
    throw new Error('Unsupported VMDK, ' + valueName + ' is too big')
  }
  return value
}

function parseDescriptor (descriptorSlice) {
  const descriptorText = descriptorSlice.toString('ascii').replace(/\x00+$/, '')
  const descriptorDict = {}
  const extentList = []
  const lines = descriptorText.split(/\r?\n/).filter((line) => {
    return line.trim().length > 0 && line[0] !== '#'
  })
  for (let line of lines) {
    let defLine = line.split('=')
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
        offset: items.length > 4 ? items[4] : 0
      })
    }
  }
  return {descriptor: descriptorDict, extents: extentList}
}

function parseFlags (flagBuffer) {
  const number = flagBuffer.readUInt32LE(0)
  return {
    newLineTest: !!(number & (1 << 0)),
    useSecondaryGrain: !!(number & (1 << 1)),
    useZeroedGrainTable: !!(number & (1 << 2)),
    compressedGrains: !!(number & (1 << 16)),
    hasMarkers: !!(number & (1 << 17))
  }
}

function parseHeader (buffer) {
  const magicString = buffer.slice(0, 4).toString('ascii')
  if (magicString !== 'KDMV') {
    throw new Error('not a VMDK file')
  }
  const version = buffer.readUInt32LE(4)
  if (version !== 1 && version !== 3) {
    throw new Error('unsupported VMDK version ' + version + ', only version 1 and 3 are supported')
  }
  const flags = parseFlags(buffer.slice(8, 12))
  const capacitySectors = parseU64b(buffer, 12, 'capacitySectors')
  const grainSizeSectors = parseU64b(buffer, 20, 'grainSizeSectors')
  const descriptorOffsetSectors = parseU64b(buffer, 28, 'descriptorOffsetSectors')
  const descriptorSizeSectors = parseU64b(buffer, 36, 'descriptorSizeSectors')
  const numGTEsPerGT = buffer.readUInt32LE(44)
  const rGrainDirectoryOffsetSectors = parseS64b(buffer, 48, 'rGrainDirectoryOffsetSectors')
  const grainDirectoryOffsetSectors = parseS64b(buffer, 56, 'grainDirectoryOffsetSectors')
  const overheadSectors = parseS64b(buffer, 64, 'overheadSectors')
  const compressionMethod = compressionMap[buffer.readUInt16LE(77)]
  const l1EntrySectors = numGTEsPerGT * grainSizeSectors
  return {
    flags,
    compressionMethod,
    grainSizeSectors,
    overheadSectors,
    capacitySectors,
    descriptorOffsetSectors,
    descriptorSizeSectors,
    grainDirectoryOffsetSectors,
    rGrainDirectoryOffsetSectors,
    l1EntrySectors,
    numGTEsPerGT
  }
}
async function readGrain (offsetSectors, buffer, compressed) {
  const offset = offsetSectors * sectorSize
  const size = buffer.readUInt32LE(offset + 8)
  const grainBuffer = buffer.slice(offset + 12, offset + 12 + size)
  const grainContent = compressed ? await zlib.inflateSync(grainBuffer) : grainBuffer
  const lba = parseU64b(buffer, offset, 'l2Lba')
  return {
    offsetSectors: offsetSectors,
    offset,
    lba,
    lbaBytes: lba * sectorSize,
    size,
    buffer: grainBuffer,
    grain: grainContent,
    grainSize: grainContent.byteLength
  }
}

function tryToParseMarker (buffer) {
  const value = buffer.readUInt32LE(0)
  const size = buffer.readUInt32LE(8)
  const type = buffer.readUInt32LE(12)
  return {value, size, type}
}

function alignSectors (number) {
  return Math.ceil(number / sectorSize) * sectorSize
}

export class VMDKDirectParser {
  constructor (readStream) {
    this.virtualBuffer = new VirtualBuffer(readStream)
    this.header = null
  }

  // I found a VMDK file whose L1 and L2 table did not have a marker, but they were at the top
  // I detect this case and eat those tables first then let the normal loop go over the grains.
  async _readL1 () {
    const position = this.virtualBuffer.position
    const l1entries = Math.floor((this.header.capacitySectors + this.header.l1EntrySectors - 1) / this.header.l1EntrySectors)
    const sectorAlignedL1Bytes = alignSectors(l1entries * 4)
    const l1Buffer = await this.virtualBuffer.readChunk(sectorAlignedL1Bytes, 'L1 table ' + position)
    let l2Start = 0
    let l2IsContiguous = true
    for (let i = 0; i < l1entries; i++) {
      const l1Entry = l1Buffer.readUInt32LE(i * 4)
      if (i > 0) {
        const previousL1Entry = l1Buffer.readUInt32LE((i - 1) * 4)
        l2IsContiguous = l2IsContiguous && ((l1Entry - previousL1Entry) === 4)
      } else {
        l2IsContiguous = (l1Entry * sectorSize === this.virtualBuffer.position) || (l1Entry * sectorSize === this.virtualBuffer.position + 512)
        l2Start = l1Entry * sectorSize
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
    let grainsAreInAscendingOrder = true
    let previousL2Entry = 0
    let firstGrain = null
    for (let i = 0; i < l2entries; i++) {
      const l2Entry = l2Buffer.readUInt32LE(i * 4)
      if (i > 0 && previousL2Entry !== 0 && l2Entry !== 0) {
        grainsAreInAscendingOrder = grainsAreInAscendingOrder && (previousL2Entry < l2Entry)
      }
      previousL2Entry = l2Entry
      if (firstGrain === null) {
        firstGrain = l2Entry
      }
    }
    if (!grainsAreInAscendingOrder) {
      // TODO: here we could transform the file to a sparse VHD on the fly because we have the complete table
      throw new Error('Unsupported file format')
    }
    const freeSpace = firstGrain * sectorSize - this.virtualBuffer.position
    if (freeSpace > 0) {
      await this.virtualBuffer.readChunk(freeSpace, 'freeSpace after L2')
    }
  }

  async readHeader () {
    const headerBuffer = await this.virtualBuffer.readChunk(512, 'readHeader')
    const magicString = headerBuffer.slice(0, 4).toString('ascii')
    if (magicString !== 'KDMV') {
      throw new Error('not a VMDK file')
    }
    const version = headerBuffer.readUInt32LE(4)
    if (version !== 1 && version !== 3) {
      throw new Error('unsupported VMDK version ' + version + ', only version 1 and 3 are supported')
    }
    this.header = parseHeader(headerBuffer)
    // I think the multiplications are OK, because the descriptor is always at the beginning of the file
    const descriptorLength = this.header.descriptorSizeSectors * sectorSize
    const descriptorBuffer = await this.virtualBuffer.readChunk(descriptorLength, 'descriptor')
    this.descriptor = parseDescriptor(descriptorBuffer)
    let l1PositionBytes = null
    if (this.header.grainDirectoryOffsetSectors !== -1 && this.header.grainDirectoryOffsetSectors !== 0) {
      l1PositionBytes = this.header.grainDirectoryOffsetSectors * sectorSize
    }
    const endOfDescriptor = this.virtualBuffer.position
    if (l1PositionBytes !== null && (l1PositionBytes === endOfDescriptor || l1PositionBytes === endOfDescriptor + sectorSize)) {
      if (l1PositionBytes === endOfDescriptor + sectorSize) {
        await this.virtualBuffer.readChunk(sectorSize, 'skipping L1 marker')
      }
      await this._readL1()
    }
    return this.header
  }

  async next () {
    while (!this.virtualBuffer.isDepleted) {
      const position = this.virtualBuffer.position
      const sector = await this.virtualBuffer.readChunk(512, 'marker start ' + position)
      if (sector.length === 0) {
        break
      }
      const marker = tryToParseMarker(sector)
      if (marker.size === 0) {
        if (marker.value !== 0) {
          await this.virtualBuffer.readChunk(marker.value * sectorSize, 'other marker value ' + this.virtualBuffer.position)
        }
      } else if (marker.size > 10) {
        const grainDiskSize = marker.size + 12
        const alignedGrainDiskSize = alignSectors(grainDiskSize)
        const remainOfBufferSize = alignedGrainDiskSize - sectorSize
        const remainderOfGrainBuffer = await this.virtualBuffer.readChunk(remainOfBufferSize, 'grain remainder ' + this.virtualBuffer.position)
        const grainBuffer = Buffer.concat([sector, remainderOfGrainBuffer])
        return readGrain(0, grainBuffer, this.header.compressionMethod === compressionDeflate && this.header.flags.compressedGrains)
      }
    }
    return new Promise((resolve) => resolve(null))
  }
}

export async function readRawContent (readStream) {
  const virtualBuffer = new VirtualBuffer(readStream)
  const headerBuffer = await virtualBuffer.readChunk(512, 'header')
  let header = parseHeader(headerBuffer)

  // I think the multiplications are OK, because the descriptor is always at the beginning of the file
  const descriptorLength = header.descriptorSizeSectors * sectorSize
  const descriptorBuffer = await virtualBuffer.readChunk(descriptorLength, 'descriptor')
  const descriptor = parseDescriptor(descriptorBuffer)

  // TODO: we concat them back for now so that the indices match, we'll have to introduce a bias later
  const remainingBuffer = await virtualBuffer.readChunk(-1, 'remainder')
  const buffer = Buffer.concat([headerBuffer, descriptorBuffer, remainingBuffer])
  if (header.grainDirectoryOffsetSectors === -1) {
    header = parseHeader(buffer.slice(-1024, -1024 + sectorSize))
  }
  const rawOutputBuffer = new Buffer(header.capacitySectors * sectorSize)
  rawOutputBuffer.fill(0)
  const l1Size = Math.floor((header.capacitySectors + header.l1EntrySectors - 1) / header.l1EntrySectors)
  const l2Size = header.numGTEsPerGT
  const l1 = []
  for (let i = 0; i < l1Size; i++) {
    const l1Entry = buffer.readUInt32LE(header.grainDirectoryOffsetSectors * sectorSize + 4 * i)
    if (l1Entry !== 0) {
      l1.push(l1Entry)
      const l2 = []
      for (let j = 0; j < l2Size; j++) {
        const l2Entry = buffer.readUInt32LE(l1Entry * sectorSize + 4 * j)
        if (l2Entry !== 0 && l2Entry !== 1) {
          const grain = await readGrain(l2Entry, buffer, header['flags']['compressedGrains'])
          grain.grain.copy(rawOutputBuffer, grain.lba * sectorSize)
          l2[j] = grain
        }
      }
    }
  }
  const vmdkType = descriptor['descriptor']['createType']
  if (!vmdkType || vmdkType.toLowerCase() !== 'streamOptimized'.toLowerCase()) {
    throw new Error('unsupported VMDK type "' + vmdkType + '", only streamOptimized is supported')
  }
  return {descriptor: descriptor.descriptor, extents: descriptor.extents, rawFile: rawOutputBuffer}
}
