import assert from 'assert'
import { BLOCK_UNUSED, SECTOR_SIZE } from '../_constants'
import { fuFooter, fuHeader, checksumStruct, unpackField } from '../_structs'
import checkFooter from '../checkFooter'
import checkHeader from '../_checkHeader'

// Sectors conversions.
export const sectorsRoundUpNoZero = bytes => Math.ceil(bytes / SECTOR_SIZE) || 1
export const sectorsToBytes = sectors => sectors * SECTOR_SIZE

export const computeBatSize = entries => sectorsToBytes(sectorsRoundUpNoZero(entries * 4))

export const computeSectorsPerBlock = blockSize => blockSize / SECTOR_SIZE
// one bit per sector
export const computeBlockBitmapSize = blockSize => computeSectorsPerBlock(blockSize) >>> 3
export const computeFullBlockSize = blockSize => blockSize + SECTOR_SIZE * computeSectorOfBitmap(blockSize)
export const computeSectorOfBitmap = blockSize => sectorsRoundUpNoZero(computeBlockBitmapSize(blockSize))
export const computeBlockSize = blockSize => sectorsToBytes(computeSectorOfBitmap(blockSize))

export const assertChecksum = (name, buf, struct) => {
  const actual = unpackField(struct.fields.checksum, buf)
  const expected = checksumStruct(buf, struct)
  assert.strictEqual(actual, expected, `invalid ${name} checksum ${actual}, expected ${expected}`)
}

// unused block as buffer containing a uint32BE
export const BUF_BLOCK_UNUSED = Buffer.allocUnsafe(4)
BUF_BLOCK_UNUSED.writeUInt32BE(BLOCK_UNUSED, 0)

/**
 * Check and parse the header buffer to build an header object
 *
 * @param {Buffer} bufHeader
 * @param {Object} footer
 * @returns {Object} the parsed header
 */
export const unpackHeader = (bufHeader, footer) => {
  assertChecksum('header', bufHeader, fuHeader)

  const header = fuHeader.unpack(bufHeader)
  checkHeader(header, footer)
  return header
}

/**
 * Check and parse the footer buffer to build a footer object
 *
 * @param {Buffer} bufHeader
 * @param {Object} footer
 * @returns {Object} the parsed footer
 */

export const unpackFooter = bufFooter => {
  assertChecksum('footer', bufFooter, fuFooter)

  const footer = fuFooter.unpack(bufFooter)
  checkFooter(footer)
  return footer
}
