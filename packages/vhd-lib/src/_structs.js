import assert from 'assert'
import fu from 'struct-fu'

import { FOOTER_SIZE, HEADER_SIZE, PARENT_LOCATOR_ENTRIES } from './_constants'

const SIZE_OF_32_BITS = Math.pow(2, 32)

const uint64 = fu.derive(
  fu.uint32(2),
  number => [Math.floor(number / SIZE_OF_32_BITS), number % SIZE_OF_32_BITS],
  _ => _[0] * SIZE_OF_32_BITS + _[1]
)
const uint64Undefinable = fu.derive(
  fu.uint32(2),
  number =>
    number === undefined
      ? [0xffffffff, 0xffffffff]
      : [Math.floor(number / SIZE_OF_32_BITS), number % SIZE_OF_32_BITS],
  _ =>
    _[0] === 0xffffffff && _[1] === 0xffffffff
      ? undefined
      : _[0] * SIZE_OF_32_BITS + _[1]
)

export const fuFooter = fu.struct([
  fu.char('cookie', 8), // 0
  fu.uint32('features'), // 8
  fu.uint32('fileFormatVersion'), // 12
  uint64Undefinable('dataOffset'), // offset of the header
  fu.uint32('timestamp'), // 24
  fu.char('creatorApplication', 4), // 28
  fu.uint32('creatorVersion'), // 32
  fu.uint32('creatorHostOs'), // 36
  uint64('originalSize'),
  uint64('currentSize'),
  fu.struct('diskGeometry', [
    fu.uint16('cylinders'), // 56
    fu.uint8('heads'), // 58
    fu.uint8('sectorsPerTrackCylinder'), // 59
  ]),
  fu.uint32('diskType'), // 60 Disk type, must be equal to HARD_DISK_TYPE_DYNAMIC/HARD_DISK_TYPE_DIFFERENCING.
  fu.uint32('checksum'), // 64
  fu.byte('uuid', 16), // 68
  fu.char('saved'), // 84
  fu.char('hidden'), // 85 TODO: should probably be merged in reserved
  fu.char('reserved', 426), // 86
])
assert.strictEqual(fuFooter.size, FOOTER_SIZE)

export const fuHeader = fu.struct([
  fu.char('cookie', 8),
  uint64Undefinable('dataOffset'),
  uint64('tableOffset'),
  fu.uint32('headerVersion'),
  fu.uint32('maxTableEntries'), // Max entries in the Block Allocation Table.
  fu.uint32('blockSize'), // Block size in bytes. Default (2097152 => 2MB)
  fu.uint32('checksum'),
  fu.byte('parentUuid', 16),
  fu.uint32('parentTimestamp'),
  fu.uint32('reserved1'),
  fu.char16be('parentUnicodeName', 512),
  fu.struct(
    'parentLocatorEntry',
    [
      fu.uint32('platformCode'),
      fu.uint32('platformDataSpace'),
      fu.uint32('platformDataLength'),
      fu.uint32('reserved'),
      uint64('platformDataOffset'), // Absolute byte offset of the locator data.
    ],
    PARENT_LOCATOR_ENTRIES
  ),
  fu.char('reserved2', 256),
])
assert.strictEqual(fuHeader.size, HEADER_SIZE)

export const packField = (field, value, buf) => {
  const { offset } = field

  field.pack(
    value,
    buf,
    typeof offset !== 'object' ? { bytes: offset, bits: 0 } : offset
  )
}

export const unpackField = (field, buf) => {
  const { offset } = field

  return field.unpack(
    buf,
    typeof offset !== 'object' ? { bytes: offset, bits: 0 } : offset
  )
}

// Returns the checksum of a raw struct.
// The raw struct (footer or header) is altered with the new sum.
export function checksumStruct (buf, struct) {
  const checksumField = struct.fields.checksum
  let sum = 0

  // Do not use the stored checksum to compute the new checksum.
  const checksumOffset = checksumField.offset
  for (let i = 0, n = checksumOffset; i < n; ++i) {
    sum += buf[i]
  }
  for (
    let i = checksumOffset + checksumField.size, n = struct.size;
    i < n;
    ++i
  ) {
    sum += buf[i]
  }

  sum = ~sum >>> 0

  // Write new sum.
  packField(checksumField, sum, buf)

  return sum
}
