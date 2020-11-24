export const compressionDeflate = 'COMPRESSION_DEFLATE'
export const compressionNone = 'COMPRESSION_NONE'
const compressionMap = [compressionNone, compressionDeflate]

export function parseFlags(flagBuffer) {
  const number = flagBuffer.readUInt32LE(0)
  return {
    newLineTest: !!(number & (1 << 0)),
    useSecondaryGrain: !!(number & (1 << 1)),
    useZeroedGrainTable: !!(number & (1 << 2)),
    compressedGrains: !!(number & (1 << 16)),
    hasMarkers: !!(number & (1 << 17)),
  }
}

// actually reads 47 bits
function parseS64b(buffer, offset, valueName) {
  const extraBits = buffer.readIntLE(offset + 6, 2)
  const value = buffer.readIntLE(offset, 6)
  const hadValueInHighBytes = !(extraBits === 0 || extraBits === -1)
  const readWrongSign = Math.sign(value) * Math.sign(extraBits) < 0
  if (hadValueInHighBytes || readWrongSign) {
    throw new Error('Unsupported VMDK, ' + valueName + ' is too big')
  }
  return value
}

// reads 48bits
export function parseU64b(buffer, offset, valueName) {
  const extraBits = buffer.readUIntLE(offset + 6, 2)
  const value = buffer.readUIntLE(offset, 6)
  if (extraBits > 0) {
    throw new Error('Unsupported VMDK, ' + valueName + ' is too big')
  }
  return value
}

export function parseHeader(buffer) {
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
    magicString,
    version,
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
    numGTEsPerGT,
  }
}
