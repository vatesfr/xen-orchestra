import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  COWD_GRAIN_TABLE_ENTRIES,
  COWD_HEADER_LENGTH,
  COWD_SECTOR_SIZE,
  grainDirectoryToDataMap,
  parseCowdHeader,
} from './cowd.mjs'

const BLOCK_LENGTH = COWD_GRAIN_TABLE_ENTRIES * COWD_SECTOR_SIZE // 2 MiB

const cowdHeader = ({
  magic = 'COWD',
  version = 1,
  capacity = 8 * BLOCK_LENGTH,
  grainSize = 1,
  numGdEntries = 8,
} = {}) => {
  const buffer = Buffer.alloc(COWD_HEADER_LENGTH)
  buffer.write(magic, 0, 'ascii')
  buffer.writeUInt32LE(version, 4)
  buffer.writeUInt32LE(3, 8) // flags
  buffer.writeUInt32LE(capacity / COWD_SECTOR_SIZE, 12)
  buffer.writeUInt32LE(grainSize, 16)
  buffer.writeUInt32LE(4, 20) // the grain directory follows the header
  buffer.writeUInt32LE(numGdEntries, 24)
  return buffer
}

describe('parseCowdHeader', function () {
  it('reads the geometry of the extent', function () {
    assert.deepEqual(parseCowdHeader(cowdHeader()), {
      blockLength: BLOCK_LENGTH,
      capacity: 8 * BLOCK_LENGTH,
      grainDirectoryOffset: COWD_HEADER_LENGTH,
      grainSize: 1,
      numGdEntries: 8,
    })
  })

  it('rejects an extent which is not COWD with a code, not an assertion', function () {
    // this is what a recent host writes, and this parser is the fallback of a failure: an
    // assertion error there hides the real problem
    assert.throws(() => parseCowdHeader(cowdHeader({ magic: 'SESp' })), {
      code: 'NO_DATA_MAP',
      message: 'not a COWD extent (magic: "SESp")',
    })
  })

  it('rejects a layout it cannot read', function () {
    assert.throws(() => parseCowdHeader(cowdHeader({ version: 2 })), { code: 'NO_DATA_MAP' })
    assert.throws(() => parseCowdHeader(cowdHeader({ grainSize: 8 })), { code: 'NO_DATA_MAP' })
    assert.throws(() => parseCowdHeader(Buffer.alloc(8)), { code: 'NO_DATA_MAP' })
  })

  it('bounds the number of grain directory entries', function () {
    // without a bound, this asks the host for a 16 GB range and builds a map of a billion entries
    assert.throws(() => parseCowdHeader(cowdHeader({ capacity: BLOCK_LENGTH, numGdEntries: 0xffffffff })), {
      code: 'NO_DATA_MAP',
      message: /at most 2 are possible$/,
    })
  })
})

describe('grainDirectoryToDataMap', function () {
  const geometry = { blockLength: BLOCK_LENGTH, numGdEntries: 4 }

  it('keeps the blocks whose grain table is allocated', function () {
    const grainDirectory = Buffer.alloc(4 * 4)
    grainDirectory.writeUInt32LE(4, 0) // sector of the grain table of the first block
    grainDirectory.writeUInt32LE(12, 2 * 4)

    assert.deepEqual(grainDirectoryToDataMap(grainDirectory, geometry), [
      { offset: 0, length: BLOCK_LENGTH, type: 0 },
      { offset: 2 * BLOCK_LENGTH, length: BLOCK_LENGTH, type: 0 },
    ])
  })

  it('returns an empty map for an extent without any data', function () {
    assert.deepEqual(grainDirectoryToDataMap(Buffer.alloc(4 * 4), geometry), [])
  })

  it('refuses a truncated grain directory', function () {
    assert.throws(() => grainDirectoryToDataMap(Buffer.alloc(4), geometry), { code: 'NO_DATA_MAP' })
  })
})
