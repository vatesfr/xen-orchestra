import * as assert from 'assert'
import zlib from 'zlib'

import {
  SECTOR_SIZE,
  createStreamOptimizedHeader,
  parseHeader,
  MARKER_GT,
  MARKER_GD,
  MARKER_FOOTER, MARKER_EOS
} from './definitions'

const roundToSector = value => Math.ceil(value / SECTOR_SIZE) * SECTOR_SIZE

/**
 * - block is an input bunch of bytes, VHD default size is 2MB
 * - grain is an output (VMDK) bunch of bytes, VMDK default is 64KB
 *  The expected ratio with default values is 16 VMDK grains for one VHD block.
 *  this function errors if blockSize < grainSize.
 *  If `compress` is true, the file will be `streamOptimized`, with markers and and tables at the bottom,
 *  otherwise the file will be `monolithicSparse`, no marker, and tables at the bottom.
 * @param diskName
 * @param diskCapacityBytes
 * @param blockSizeBytes the size of each block in the generator
 * @param blockCount number of blocks in the generator
 * @param blockGenerator async generator of {lba:Number, block:Buffer} objects.
 * @param geometry an object of shape {sectorsPerTrackCylinder,heads,cylinders}
 * @param compress if true the grains will be compressed and `length` will not be set on the returned generator
 * @returns an Async generator of Buffers representing the VMDK file fragments
 */
export async function generateVmdkData(diskName, diskCapacityBytes, blockSizeBytes, blockCount, blockGenerator, geometry = {
  sectorsPerTrackCylinder: 63,
  heads: 16,
  cylinders: 10402
}, compress = false) {
  const cid = Math.floor(Math.random() * Math.pow(2, 32))
  const diskCapacitySectors = Math.ceil(diskCapacityBytes / SECTOR_SIZE)
  const creationType = compress ? 'streamOptimized' : 'monolithicSparse'
  console.log('creationType', creationType)
  const descriptor = `# Disk DescriptorFile
        version=1
                       CID=${cid}
                       parentCID=ffffffff
                       createType="${creationType}"
        # Extent description
                       RW ${diskCapacitySectors} SPARSE "${diskName}"
        # The Disk Data Base
                       #DDB
                       ddb.adapterType = "ide"
                       ddb.geometry.sectors = "${geometry.sectorsPerTrackCylinder}"
                       ddb.geometry.heads = "${geometry.heads}"
                       ddb.geometry.cylinders = "${geometry.cylinders}"
`
  const utf8Descriptor = Buffer.from(descriptor, 'utf8')
  const descriptorSizeSectors = Math.ceil(utf8Descriptor.length / SECTOR_SIZE)
  const descriptorBuffer = Buffer.alloc(descriptorSizeSectors * SECTOR_SIZE)
  utf8Descriptor.copy(descriptorBuffer)
  const headerData = createStreamOptimizedHeader(diskCapacitySectors, descriptorSizeSectors, compress)
  const parsedHeader = parseHeader(headerData.buffer)
  const OFFSET_SIZE = 4
  const directorySizeBytes = roundToSector(headerData.grainDirectoryEntries * OFFSET_SIZE)
  const tableSizeBytes = roundToSector(headerData.grainTableEntries * OFFSET_SIZE)
  const grainSizeBytes = parsedHeader.grainSizeSectors * SECTOR_SIZE

  function computeFileSize(grainCount) {
    const headerSize = SECTOR_SIZE
    const descriptorSize = descriptorBuffer.length
    // +1 because the marker adds some space.
    const grainSize = grainSizeBytes + SECTOR_SIZE
    return headerSize + descriptorSize + grainSize * grainCount + directorySizeBytes + tableSizeBytes + headerSize
  }

  if (blockSizeBytes % grainSizeBytes !== 0 || blockSizeBytes === 0) {
    throw new Error(`createReadableVmdkStream can only accept block size multiple of ${grainSizeBytes}, got ${blockSizeBytes}`)
  }
  const grainsPerBlock = blockSizeBytes / grainSizeBytes
  const fileSize = compress ? null : computeFileSize(blockCount * grainsPerBlock)
  const tableBuffer = Buffer.alloc(tableSizeBytes)
  let streamPosition = 0
  let directoryOffset = 0
  let blocksSeen = 0

  function createEmptyMarkerIfNecessary(type) {
    if (parsedHeader.flags.hasMarkers) {
      const buff = Buffer.alloc(SECTOR_SIZE)
      buff.writeBigUInt64LE(BigInt(0), 0)
      buff.writeUInt32LE(0, 8)
      buff.writeUInt32LE(type, 12)
      return buff
    } else {
      return Buffer.alloc(0)
    }
  }

  function createDirectoryBuffer(grainDirectoryEntries, directorySizeBytes, tablePosition) {
    directoryOffset = streamPosition
    console.log('directoryOffset', { directoryOffset, tablePosition })
    const buff = Buffer.alloc(directorySizeBytes)
    for (let i = 0; i < grainDirectoryEntries; i++) {
      buff.writeUInt32LE((tablePosition + i * parsedHeader.numGTEsPerGT * OFFSET_SIZE) / SECTOR_SIZE, i * OFFSET_SIZE)
    }
    return buff
  }

  function bufferIsBlank(buffer) {
    for (const b of buffer) {
      if (b !== 0) {
        return false
      }
    }
    return true
  }

  function createMarkedGrain(lbaBytes, buffer) {
    assert.strictEqual(buffer.length, grainSizeBytes)
    assert.strictEqual(lbaBytes % grainSizeBytes, 0)
    const markerOverHead = 12
    const data = compress ? zlib.deflateSync(buffer, { level: 9 }) : buffer
    const outputBuffer = Buffer.alloc(roundToSector(markerOverHead + data.length))
    data.copy(outputBuffer, markerOverHead)
    outputBuffer.writeBigUInt64LE(BigInt(lbaBytes / SECTOR_SIZE), 0)
    outputBuffer.writeUInt32LE(data.length, 8)
    return outputBuffer
  }

  async function * emitBlock(blockLbaBytes, buffer, grainSizeBytes) {
    assert.strictEqual(buffer.length % grainSizeBytes, 0)
    const grainCount = buffer.length / grainSizeBytes
    for (let i = 0; i < grainCount; i++) {
      const grainLbaBytes = blockLbaBytes + i * grainSizeBytes
      const tableIndex = grainLbaBytes / grainSizeBytes
      const grainData = buffer.slice(i * grainSizeBytes, (i + 1) * grainSizeBytes)
      if (!bufferIsBlank(grainData)) {
        tableBuffer.writeUInt32LE(streamPosition / SECTOR_SIZE, tableIndex * 4)
        yield track(createMarkedGrain(grainLbaBytes, grainData))
      }
    }
  }

  async function * emitBlocks(grainSize, blockGenerator) {
    for await (const b of blockGenerator) {
      assert.strictEqual(blocksSeen <= blockCount, true)
      yield * emitBlock(b.lba, b.block, grainSize)
      blocksSeen++
    }
  }

  function track(buffer) {
    assert.strictEqual(streamPosition % SECTOR_SIZE, 0)
    assert.strictEqual(compress ? true : streamPosition < fileSize, true)
    if (buffer.length > 0) {
      streamPosition += buffer.length
    }
    return buffer
  }

  async function * iterator() {
    yield track(headerData.buffer)
    yield track(descriptorBuffer)
    // yield * emitBlocks(grainSizeBytes, blockGenerator)
    yield track(createEmptyMarkerIfNecessary(MARKER_GT))
    const tableOffset = streamPosition
    yield track(tableBuffer)
    yield track(createEmptyMarkerIfNecessary(MARKER_GD))
    yield track(createDirectoryBuffer(headerData.grainDirectoryEntries, directorySizeBytes, tableOffset))
    yield track(createEmptyMarkerIfNecessary(MARKER_FOOTER))
    // re-create the header so that the directory address is filled
    const footer = createStreamOptimizedHeader(diskCapacitySectors, descriptorSizeSectors, directoryOffset / SECTOR_SIZE, compress)
    yield track(footer.buffer)
    yield track(createEmptyMarkerIfNecessary(MARKER_EOS))
  }

  const itr = iterator()
  if (!compress) {
    //  itr.length = fileSize
  }
  return itr
}

