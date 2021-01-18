import { suppressUnhandledRejection } from './util'

const SECTOR_SIZE = 512
const HEADER_SIZE = 512
const FOOTER_POSITION = -1024
const DISK_CAPACITY_OFFSET = 12
const GRAIN_SIZE_OFFSET = 20
const NUM_GTE_PER_GT_OFFSET = 44
const GRAIN_ADDRESS_OFFSET = 56

const MANTISSA_BITS_IN_DOUBLE = 53
const getLongLong = (buffer, offset, name) => {
  if (buffer.byteLength < offset + 8) {
    throw new Error(`buffer ${name} is too short, expecting ${offset + 8} minimum, got ${buffer.byteLength}`)
  }

  const dataView = new DataView(buffer)

  const highBits = dataView.getUint32(offset + 4, true)
  if (highBits >= Math.pow(2, MANTISSA_BITS_IN_DOUBLE - 32)) {
    throw new Error('Unsupported file, high order bits are too high in field ' + name)
  }

  const res = dataView.getUint32(offset, true)
  return res + highBits * Math.pow(2, 32)
}

/**
 * the grain table is an object { grainLogicalAddressList: [number], grainFileOffsetList: [number] }
 * grainLogicalAddressList contains the logical addresses of the grains in the file, in the order they are stored in the VMDK
 * grainFileOffsetList contains the offsets of the grains in the VMDK file, in the order they are stored in the VMDK (so this array should be ascending)
 *
 * THIS CODE RUNS ON THE BROWSER
 */
export default async function readVmdkGrainTable(fileAccessor) {
  return (await readCapacityAndGrainTable(fileAccessor)).tablePromise
}

/**
 * reading a big chunk of the file to memory before parsing is useful when the vmdk is gzipped and random access is costly
 */
async function grabTables(grainDirectoryEntries, grainDir, grainTablePhysicalSize, fileAccessor) {
  const cachedGrainTables = []
  for (let i = 0; i < grainDirectoryEntries; i++) {
    const grainTableAddr = grainDir[i] * SECTOR_SIZE
    if (grainTableAddr !== 0) {
      cachedGrainTables[i] = new Uint32Array(
        await fileAccessor(grainTableAddr, grainTableAddr + grainTablePhysicalSize)
      )
    }
  }
  return cachedGrainTables
}

/***
 * the tables are encoded in uint32 LE
 * @param fileAccessor: (start, end) => ArrayBuffer
 * @returns {Promise<{capacityBytes: number, tablePromise: Promise<{ grainLogicalAddressList: ArrayBuffer, grainFileOffsetList: ArrayBuffer }>}>}
 */
export async function readCapacityAndGrainTable(fileAccessor) {
  let headerBuffer = await fileAccessor(0, HEADER_SIZE)
  let grainAddrBuffer = headerBuffer.slice(GRAIN_ADDRESS_OFFSET, GRAIN_ADDRESS_OFFSET + 8)
  if (new Int8Array(grainAddrBuffer).every(val => val === -1)) {
    headerBuffer = await fileAccessor(FOOTER_POSITION, FOOTER_POSITION + HEADER_SIZE)
    grainAddrBuffer = headerBuffer.slice(GRAIN_ADDRESS_OFFSET, GRAIN_ADDRESS_OFFSET + 8)
  }

  const grainDirPosBytes = getLongLong(grainAddrBuffer, 0, 'grain directory address') * SECTOR_SIZE
  const capacity = getLongLong(headerBuffer, DISK_CAPACITY_OFFSET, 'capacity') * SECTOR_SIZE

  async function readTable() {
    const grainSizeByte = getLongLong(headerBuffer, GRAIN_SIZE_OFFSET, 'grain size') * SECTOR_SIZE
    const grainCount = Math.ceil(capacity / grainSizeByte)
    const numGTEsPerGT = new DataView(headerBuffer).getUint32(NUM_GTE_PER_GT_OFFSET, true)
    const grainTablePhysicalSize = numGTEsPerGT * 4
    const grainDirectoryEntries = Math.ceil(grainCount / numGTEsPerGT)
    const grainDirectoryPhysicalSize = grainDirectoryEntries * 4
    const grainDir = new Uint32Array(
      await fileAccessor(grainDirPosBytes, grainDirPosBytes + grainDirectoryPhysicalSize)
    )
    const cachedGrainTables = await grabTables(grainDirectoryEntries, grainDir, grainTablePhysicalSize, fileAccessor)
    const extractedGrainTable = []
    for (let i = 0; i < grainCount; i++) {
      const directoryEntry = Math.floor(i / numGTEsPerGT)
      const grainTable = cachedGrainTables[directoryEntry]
      if (grainTable !== undefined) {
        const grainAddr = grainTable[i % numGTEsPerGT]
        if (grainAddr !== 0) {
          extractedGrainTable.push([i, grainAddr])
        }
      }
    }
    extractedGrainTable.sort(([_i1, grainAddress1], [_i2, grainAddress2]) => grainAddress1 - grainAddress2)

    const byteLength = 4 * extractedGrainTable.length
    const grainLogicalAddressList = new DataView(new ArrayBuffer(byteLength))
    const grainFileOffsetList = new DataView(new ArrayBuffer(byteLength))
    extractedGrainTable.forEach(([index, grainAddress], i) => {
      grainLogicalAddressList.setUint32(i * 4, index, true)
      grainFileOffsetList.setUint32(i * 4, grainAddress, true)
    })
    return {
      grainLogicalAddressList: grainLogicalAddressList.buffer,
      grainFileOffsetList: grainFileOffsetList.buffer,
    }
  }

  return {
    tablePromise: suppressUnhandledRejection(readTable()),
    capacityBytes: capacity,
  }
}
