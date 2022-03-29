import assert from 'assert'
import asyncIteratorToStream from 'async-iterator-to-stream'
import { parseVhdStream } from 'vhd-lib/parseVhdStream'
import { BLOCK_UNUSED, DEFAULT_BLOCK_SIZE, DISK_TYPES } from 'vhd-lib/_constants'

import { SECTOR_SIZE, GRAIN_SIZE_SECTORS, NUM_GTE_PER_GT } from './definitions'

function batToGrainTables(vhdHeader, bat, overheadSectors) {
  const nbGrainsPerBlock = vhdHeader.blockSize / (GRAIN_SIZE_SECTORS * SECTOR_SIZE)
  const grainTables = []

  const vhdBlocks = []
  for (let blockCounter = 0; blockCounter < vhdHeader.maxTableEntries; blockCounter++) {
    const batEntrySector = bat.readUInt32BE(blockCounter * 4)
    if (batEntrySector === BLOCK_UNUSED) {
      continue
    }
    vhdBlocks.push({ blockCounter, position: batEntrySector })
  }
  // ensure blocks are in the order they will comes from the vhd stream
  vhdBlocks.sort((b1, b2) => b1.position - b2.position)

  let grainOffsetSector = overheadSectors
  for (const { blockCounter } of vhdBlocks) {
    // consider that if a vhd block is not empty, all the grain
    // generated from this block are not empry
    // it's space inneficient but gives u a way to compute the grain
    // tables and the fie size before looking into the data

    for (let i = 0; i < nbGrainsPerBlock; i++) {
      const grainPosition = blockCounter * nbGrainsPerBlock + i
      const grainTableIndex = Math.floor(grainPosition / NUM_GTE_PER_GT)
      const positionInGrainTable = grainPosition % NUM_GTE_PER_GT
      grainTables[grainTableIndex] = grainTables[grainTableIndex] ?? []
      grainTables[grainTableIndex][positionInGrainTable] = grainOffsetSector
      grainOffsetSector += GRAIN_SIZE_SECTORS
    }
  }
  return grainTables
}

function createMonolithicSparseHeader(vhdFooter, vhdHeader, bat) {
  const descriptorOffsetSectors = 1

  const cid = Math.floor(Math.random() * Math.pow(2, 32))
  const capacitySectors = vhdFooter.currentSize / SECTOR_SIZE
  const geometry = vhdFooter.diskGeometry
  const descriptor = `# Disk DescriptorFile
version=1
CID=${cid}
parentCID=ffffffff
createType="monolithicSparse"

# Extent description
RW ${capacitySectors} SPARSE "out.vmdk"

# The disk Data Base
# DDB

ddb.virtualHWVersion = "4"
ddb.adapterType="ide"
ddb.geometry.cylinders="${geometry.cylinders}"
ddb.geometry.heads="${geometry.heads}"
ddb.geometry.sectors="${geometry.sectorsPerTrackCylinder}"
`
  // add one more sector since virtualbax add data like  'storing parent modification UUID in descriptor'
  const descriptorSizeSectors = Math.ceil(descriptor.length / SECTOR_SIZE) + 1

  const rgrainDirectoryOffsetSectors = descriptorOffsetSectors + descriptorSizeSectors
  const grainDirectoryEntries = Math.ceil(Math.ceil(capacitySectors / GRAIN_SIZE_SECTORS) / NUM_GTE_PER_GT)
  const grainTableEntries = grainDirectoryEntries * NUM_GTE_PER_GT
  const grainDirectorySizeSectors = Math.ceil((grainDirectoryEntries * 4) / SECTOR_SIZE)
  const grainTableSizeSectors = Math.ceil((grainTableEntries * 4) / SECTOR_SIZE)

  const grainDirectoryOffsetSectors = rgrainDirectoryOffsetSectors + grainDirectorySizeSectors + grainTableSizeSectors

  const overheadSectors = grainDirectoryOffsetSectors + grainDirectorySizeSectors + grainTableSizeSectors
  const headerBuffer = Buffer.alloc(overheadSectors * SECTOR_SIZE, 0)
  Buffer.from('KDMV', 'ascii').copy(headerBuffer, 0)
  headerBuffer.writeUInt32LE(1, 4)

  // new line test
  // redondant grain directory
  // no compression
  const flags = 0x00000001 | 0x00000002
  headerBuffer.writeUInt32LE(flags, 8)

  headerBuffer.writeBigUInt64LE(BigInt(capacitySectors), 12)
  headerBuffer.writeBigUInt64LE(BigInt(GRAIN_SIZE_SECTORS), 20)
  headerBuffer.writeBigUInt64LE(BigInt(descriptorOffsetSectors), 28)
  headerBuffer.writeBigUInt64LE(BigInt(descriptorSizeSectors), 36)
  headerBuffer.writeUInt32LE(NUM_GTE_PER_GT, 44)
  headerBuffer.writeBigInt64LE(BigInt(rgrainDirectoryOffsetSectors), 48)
  headerBuffer.writeBigInt64LE(BigInt(grainDirectoryOffsetSectors), 56)
  headerBuffer.writeBigInt64LE(BigInt(overheadSectors), 64)
  headerBuffer.write('\n \r\n', 73, 4, 'ascii')

  Buffer.from(descriptor, 'ascii').copy(headerBuffer, SECTOR_SIZE * descriptorOffsetSectors)

  const grainTables = batToGrainTables(vhdHeader, bat, overheadSectors)

  function writeGrainsMetadata(offsetStart) {
    const grainDirectoryStart = offsetStart * SECTOR_SIZE
    const grainTableStart = grainDirectoryStart + grainDirectorySizeSectors * SECTOR_SIZE
    for (let i = 0; i < grainDirectoryEntries; i++) {
      // set grain table entry
      const tableStart = grainTableStart + i * NUM_GTE_PER_GT * 4
      headerBuffer.writeUInt32LE(tableStart / SECTOR_SIZE, grainDirectoryStart + 4 * i)

      // set the grain address in the grain table
      for (let j = 0; j < NUM_GTE_PER_GT; j++) {
        // the grain tables offset are computed from 0 instead of from the end of the overhead
        headerBuffer.writeUInt32LE(grainTables[i]?.[j] ?? 0, tableStart + j * 4)
      }
    }
  }
  // redondant grain directory and tables (that seems to be mandatory for virtual box)
  writeGrainsMetadata(rgrainDirectoryOffsetSectors)

  // main grain directory and tables
  writeGrainsMetadata(grainDirectoryOffsetSectors)

  return headerBuffer
}

async function getNextOfType(iterator, type) {
  let next
  while ((next = await iterator.next())) {
    const value = next.value
    if (value?.type === type) {
      return value
    }
  }
}

export async function generateVmdkStream(vhdStream) {
  let length = 0

  const vhdIterator = parseVhdStream(vhdStream)

  const vhdFooter = (await getNextOfType(vhdIterator, 'footer')).footer
  assert(vhdFooter !== undefined)
  assert(vhdFooter.diskType === DISK_TYPES.DYNAMIC)

  const vhdHeader = (await getNextOfType(vhdIterator, 'header')).header
  assert(vhdHeader !== undefined)

  const item = await getNextOfType(vhdIterator, 'bat')
  const headerBuffer = createMonolithicSparseHeader(vhdFooter, vhdHeader, item.buffer)
  length = headerBuffer.length + DEFAULT_BLOCK_SIZE * item.blockCount

  async function* iterator() {
    yield headerBuffer

    for await (const item of vhdIterator) {
      if (item.type === 'block') {
        yield item.data
      }
    }
  }
  const stream = asyncIteratorToStream(iterator())
  stream.length = length
  return stream
}
