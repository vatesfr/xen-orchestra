import {
  COMPRESSION_DEFLATE,
  FLAG_COMPRESSED_GRAINS,
  FLAG_MARKERS,
  FLAG_NEW_LINE_TEST,
  FLAG_REDUNDANT_GRAIN_DIRECTORY,
  SPARSE_HEADER_SIZE,
  SPARSE_MAGIC,
} from './_constants.mjs'

export interface VmdkSparseHeader {
  version: number
  flags: number
  /** size of the virtual disk, in sectors */
  capacitySectors: number
  /** size of the data of a grain, uncompressed, in sectors */
  grainSizeSectors: number
  /** 0 when the extent has no embedded descriptor */
  descriptorOffsetSectors: number
  descriptorSizeSectors: number
  /** number of entries of a grain table */
  numGTEsPerGT: number
  /** GRAIN_DIRECTORY_AT_END (-1) when the grain directory is only described by the footer */
  grainDirectoryOffsetSectors: number
  rGrainDirectoryOffsetSectors: number
  /** first sector available for grain data */
  overheadSectors: number
  compressionMethod: number
}

/**
 * The 8 bytes fields of a VMDK header are signed 64 bits integers, but a `number` only holds 53
 * bits: rather than silently truncating like the previous implementations did, refuse the file.
 */
function readSafeInt64LE(buffer: Buffer, offset: number, name: string): number {
  const value = buffer.readBigInt64LE(offset)
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error(`unsupported VMDK, ${name} does not fit in a number: ${value}`)
  }
  return Number(value)
}

export function unpackSparseHeader(buffer: Buffer): VmdkSparseHeader {
  if (buffer.length < SPARSE_HEADER_SIZE) {
    throw new Error(`a VMDK header is ${SPARSE_HEADER_SIZE} bytes long, got ${buffer.length}`)
  }
  const magic = buffer.subarray(0, 4).toString('ascii')
  if (magic !== SPARSE_MAGIC) {
    throw new Error(`not a VMDK sparse extent, expected magic ${SPARSE_MAGIC}, got ${JSON.stringify(magic)}`)
  }
  const version = buffer.readUInt32LE(4)
  if (version !== 1 && version !== 2 && version !== 3) {
    throw new Error(`unsupported VMDK version ${version}, only 1, 2 and 3 are supported`)
  }
  return {
    version,
    flags: buffer.readUInt32LE(8),
    capacitySectors: readSafeInt64LE(buffer, 12, 'capacitySectors'),
    grainSizeSectors: readSafeInt64LE(buffer, 20, 'grainSizeSectors'),
    descriptorOffsetSectors: readSafeInt64LE(buffer, 28, 'descriptorOffsetSectors'),
    descriptorSizeSectors: readSafeInt64LE(buffer, 36, 'descriptorSizeSectors'),
    numGTEsPerGT: buffer.readUInt32LE(44),
    rGrainDirectoryOffsetSectors: readSafeInt64LE(buffer, 48, 'rGrainDirectoryOffsetSectors'),
    grainDirectoryOffsetSectors: readSafeInt64LE(buffer, 56, 'grainDirectoryOffsetSectors'),
    overheadSectors: readSafeInt64LE(buffer, 64, 'overheadSectors'),
    compressionMethod: buffer.readUInt16LE(77),
  }
}

/**
 * Header of a stream optimized extent: compressed grains, markers, and a redundant grain directory.
 *
 * @returns the 512 bytes of the header
 */
export function packStreamOptimizedHeader({
  capacitySectors,
  grainSizeSectors,
  descriptorSizeSectors,
  numGTEsPerGT,
  grainDirectoryOffsetSectors,
  rGrainDirectoryOffsetSectors,
  overheadSectors,
}: {
  readonly capacitySectors: number
  readonly grainSizeSectors: number
  readonly descriptorSizeSectors: number
  readonly numGTEsPerGT: number
  readonly grainDirectoryOffsetSectors: number
  readonly rGrainDirectoryOffsetSectors: number
  readonly overheadSectors: number
}): Buffer {
  const buffer = Buffer.alloc(SPARSE_HEADER_SIZE)
  buffer.write(SPARSE_MAGIC, 0, 4, 'ascii')
  buffer.writeUInt32LE(3, 4)
  buffer.writeUInt32LE(FLAG_NEW_LINE_TEST | FLAG_REDUNDANT_GRAIN_DIRECTORY | FLAG_COMPRESSED_GRAINS | FLAG_MARKERS, 8)
  buffer.writeBigInt64LE(BigInt(capacitySectors), 12)
  buffer.writeBigInt64LE(BigInt(grainSizeSectors), 20)
  // the descriptor is always written directly after the header, which is one sector long
  buffer.writeBigInt64LE(1n, 28)
  buffer.writeBigInt64LE(BigInt(descriptorSizeSectors), 36)
  buffer.writeUInt32LE(numGTEsPerGT, 44)
  buffer.writeBigInt64LE(BigInt(rGrainDirectoryOffsetSectors), 48)
  buffer.writeBigInt64LE(BigInt(grainDirectoryOffsetSectors), 56)
  buffer.writeBigInt64LE(BigInt(overheadSectors), 64)
  // detector of end of line mangling by a transfer in text mode
  buffer.write('\n \r\n', 73, 4, 'ascii')
  buffer.writeUInt16LE(COMPRESSION_DEFLATE, 77)
  return buffer
}
