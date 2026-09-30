// https://github.com/libyal/libvmdk/blob/main/documentation/VMWare%20Virtual%20Disk%20Format%20(VMDK).asciidoc#5-the-cowd-sparse-extent-data-file
export const COWD_SECTOR_SIZE = 512
export const COWD_HEADER_LENGTH = 2048
// a grain directory entry addresses a grain table, which addresses at most 4096 grains
export const COWD_GRAIN_TABLE_ENTRIES = 4096
// the `type` of a range of the data map, as the NBD block status of an allocated range
export const BLOCK_TYPE_DATA = 0

const unsupported = message => {
  const error = new Error(message)
  // the caller has no data map to work with, and has to transfer the disk in full
  error.code = 'NO_DATA_MAP'
  return error
}

/**
 * Header of a COWD sparse extent, the delta format of ESXi 5 and older.
 *
 * @param {Buffer} buffer - the first {@link COWD_HEADER_LENGTH} bytes of the extent
 * @returns {{ blockLength: number, capacity: number, grainDirectoryOffset: number, grainSize: number, numGdEntries: number }}
 */
export function parseCowdHeader(buffer) {
  // every field read below fits in the first 28 bytes
  if (buffer.length < 28) {
    throw unsupported(`a COWD header is at least 28 bytes, got ${buffer.length}`)
  }

  const magic = buffer.subarray(0, 4).toString('ascii')
  if (magic !== 'COWD') {
    // a recent host writes SeSparse deltas: this used to be an assertion error, in the fallback
    // path of a failure, which made the real problem unreadable
    throw unsupported(`not a COWD extent (magic: ${JSON.stringify(magic)})`)
  }

  const version = buffer.readUInt32LE(4)
  const capacity = buffer.readUInt32LE(12) * COWD_SECTOR_SIZE
  const grainSize = buffer.readUInt32LE(16)
  const grainDirectoryOffset = buffer.readUInt32LE(20) * COWD_SECTOR_SIZE
  const numGdEntries = buffer.readUInt32LE(24)

  if (version !== 1 || grainSize !== 1) {
    // the layout of the grain tables below assumes a grain of one sector
    throw unsupported(`unsupported COWD extent, version ${version} with grains of ${grainSize} sector(s)`)
  }

  const blockLength = COWD_GRAIN_TABLE_ENTRIES * grainSize * COWD_SECTOR_SIZE
  // the value is read from the file: without a bound, a corrupt header asks for a range of several
  // gigabytes and builds a map of millions of entries
  const maxGdEntries = Math.ceil(capacity / blockLength) + 1
  if (numGdEntries > maxGdEntries) {
    throw unsupported(
      `COWD extent announces ${numGdEntries} grain directory entries for ${capacity} bytes, at most ${maxGdEntries} are possible`
    )
  }

  return { blockLength, capacity, grainDirectoryOffset, grainSize, numGdEntries }
}

/**
 * Blocks of a COWD extent which hold data.
 *
 * A grain table is only allocated when its block has been written to, so a non zero entry in the
 * grain directory is what marks a block as allocated.
 *
 * @param {Buffer} grainDirectory
 * @param {object} params
 * @param {number} params.blockLength
 * @param {number} params.numGdEntries
 * @returns {Array<{ length: number, offset: number, type: number }>}
 */
export function grainDirectoryToDataMap(grainDirectory, { blockLength, numGdEntries }) {
  if (grainDirectory.length < numGdEntries * 4) {
    throw unsupported(`a grain directory of ${numGdEntries} entries is ${numGdEntries * 4} bytes`)
  }

  const dataMap = []
  for (let i = 0; i < numGdEntries; i++) {
    if (grainDirectory.readUInt32LE(i * 4) !== 0) {
      dataMap.push({ offset: i * blockLength, length: blockLength, type: BLOCK_TYPE_DATA })
    }
  }
  return dataMap
}
