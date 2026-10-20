/**
 * Constants of the VMDK formats.
 *
 * The layouts are described in ../docs/vmdk.md
 */

export const SECTOR_SIZE = 512

// ----------------------------------------------------------------------------
// sparse extent header, shared by `monolithicSparse` and `streamOptimized`

export const SPARSE_MAGIC = 'KDMV'
export const SPARSE_HEADER_SIZE = SECTOR_SIZE

// flags of the sparse extent header
export const FLAG_NEW_LINE_TEST = 1 << 0
export const FLAG_REDUNDANT_GRAIN_DIRECTORY = 1 << 1
export const FLAG_ZEROED_GRAIN_TABLE_ENTRY = 1 << 2
export const FLAG_COMPRESSED_GRAINS = 1 << 16
export const FLAG_MARKERS = 1 << 17

export const COMPRESSION_NONE = 0
export const COMPRESSION_DEFLATE = 1

/**
 * a grain directory offset of -1 means the grain directory is not at the beginning of the file:
 * the real header is the second to last sector of the file
 */
export const GRAIN_DIRECTORY_AT_END = -1

// ----------------------------------------------------------------------------
// grain directory and grain tables

/** the default grain of a stream optimized disk is 64KiB, like a qcow2 cluster */
export const DEFAULT_GRAIN_SIZE_SECTORS = 128

/** `numGTEsPerGT`: a grain table addresses 512 grains, that is 32MiB with the default grain size */
export const DEFAULT_NB_GRAIN_TABLE_ENTRIES = 512

/** grain directory and grain table entries are sector offsets stored on 32 bits */
export const GRAIN_TABLE_ENTRY_SIZE = 4

/**
 * grain offsets are stored as 32 bits sector offsets: nothing can be addressed past this
 */
export const MAX_ADDRESSABLE_FILE_SIZE = 0xffffffff * SECTOR_SIZE

// ----------------------------------------------------------------------------
// markers, only present when FLAG_MARKERS is set

/** a grain marker is `uint64 lba in sectors`, `uint32 compressed length`, then the data */
export const GRAIN_MARKER_HEADER_SIZE = 12

export const MARKER_EOS = 0
export const MARKER_GT = 1
export const MARKER_GD = 2
export const MARKER_FOOTER = 3

// ----------------------------------------------------------------------------

export function roundToSector(value: number): number {
  return Math.ceil(value / SECTOR_SIZE) * SECTOR_SIZE
}
