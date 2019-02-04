const SECTOR_SIZE = 512
const HEADER_SIZE = 512
const FOOTER_POSITION = -1024
const DISK_CAPACITY_OFFSET = 12
const GRAIN_SIZE_OFFSET = 20
const NUM_GTE_PER_GT_OFFSET = 44
const GRAIN_ADDRESS_OFFSET = 56
/**
 *
 * the grain table is the array of LBAs (in byte, not in sector) ordered by their position in the VDMK file
 * THIS CODE RUNS ON THE BROWSER
 */
export default async function readVmdkGrainTable(fileAccessor) {
  const getLongLong = (buffer, offset, name) => {
    if (buffer.length < offset + 8) {
      throw new Error(
        `buffer ${name} is too short, expecting ${offset + 8} minimum, got ${
          buffer.length
        }`
      )
    }
    const dataView = new DataView(buffer)
    const res = dataView.getUint32(offset, true)
    const highBits = dataView.getUint32(offset + 4, true)
    const MANTISSA_BITS_IN_DOUBLE = 53
    if (highBits >= Math.pow(2, MANTISSA_BITS_IN_DOUBLE - 32)) {
      throw new Error(
        'Unsupported file, high order bits are to high in field ' + name
      )
    }
    return res + highBits * Math.pow(2, 32)
  }
  let headerBuffer = await fileAccessor(0, HEADER_SIZE)
  let grainAddrBuffer = headerBuffer.slice(
    GRAIN_ADDRESS_OFFSET,
    GRAIN_ADDRESS_OFFSET + 8
  )
  if (
    new Int8Array(grainAddrBuffer).reduce((acc, val) => acc && val === -1, true)
  ) {
    headerBuffer = await fileAccessor(
      FOOTER_POSITION,
      FOOTER_POSITION + HEADER_SIZE
    )
    grainAddrBuffer = headerBuffer.slice(
      GRAIN_ADDRESS_OFFSET,
      GRAIN_ADDRESS_OFFSET + 8
    )
  }
  const grainDirPosBytes =
    getLongLong(grainAddrBuffer, 0, 'grain directory address') * SECTOR_SIZE
  const capacity =
    getLongLong(headerBuffer, DISK_CAPACITY_OFFSET, 'capacity') * SECTOR_SIZE
  const grainSize =
    getLongLong(headerBuffer, GRAIN_SIZE_OFFSET, 'grain size') * SECTOR_SIZE
  const grainCount = Math.ceil(capacity / grainSize)
  const numGTEsPerGT = new DataView(headerBuffer).getUint32(
    NUM_GTE_PER_GT_OFFSET,
    true
  )
  const grainTablePhysicalSize = numGTEsPerGT * 4
  const grainDirectoryEntries = Math.ceil(grainCount / numGTEsPerGT)
  const grainDirectoryPhysicalSize = grainDirectoryEntries * 4
  const grainDirBuffer = await fileAccessor(
    grainDirPosBytes,
    grainDirPosBytes + grainDirectoryPhysicalSize
  )
  const grainDir = new Uint32Array(grainDirBuffer)
  const cachedGrainTables = []
  for (let i = 0; i < grainDirectoryEntries; i++) {
    const grainTableAddr = grainDir[i] * SECTOR_SIZE
    if (grainTableAddr !== 0) {
      cachedGrainTables[i] = new Uint32Array(
        await fileAccessor(
          grainTableAddr,
          grainTableAddr + grainTablePhysicalSize
        )
      )
    }
  }
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
  extractedGrainTable.sort(
    ([i1, grainAddress1], [i2, grainAddress2]) => grainAddress1 - grainAddress2
  )
  return extractedGrainTable.map(([index, grainAddress]) => index * grainSize)
}
