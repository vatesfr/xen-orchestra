'use strict'

const assert = require('assert')
const { BLOCK_UNUSED, SECTOR_SIZE } = require('../_constants')
const { fuFooter, fuHeader, checksumStruct, unpackField } = require('../_structs')
const checkFooter = require('../checkFooter')
const checkHeader = require('../_checkHeader')

const computeBatSize = entries => sectorsToBytes(sectorsRoundUpNoZero(entries * 4))
exports.computeBatSize = computeBatSize

const computeSectorsPerBlock = blockSize => blockSize / SECTOR_SIZE
exports.computeSectorsPerBlock = computeSectorsPerBlock
// one bit per sector
const computeBlockBitmapSize = blockSize => computeSectorsPerBlock(blockSize) >>> 3
exports.computeBlockBitmapSize = computeBlockBitmapSize
const computeFullBlockSize = blockSize => blockSize + SECTOR_SIZE * computeSectorOfBitmap(blockSize)
exports.computeFullBlockSize = computeFullBlockSize
const computeSectorOfBitmap = blockSize => sectorsRoundUpNoZero(computeBlockBitmapSize(blockSize))
exports.computeSectorOfBitmap = computeSectorOfBitmap

// Sectors conversions.
const sectorsRoundUpNoZero = bytes => Math.ceil(bytes / SECTOR_SIZE) || 1
exports.sectorsRoundUpNoZero = sectorsRoundUpNoZero
const sectorsToBytes = sectors => sectors * SECTOR_SIZE
exports.sectorsToBytes = sectorsToBytes

const assertChecksum = (name, buf, struct) => {
  const actual = unpackField(struct.fields.checksum, buf)
  const expected = checksumStruct(buf, struct)
  assert.strictEqual(actual, expected, `invalid ${name} checksum ${actual}, expected ${expected}`)
}
exports.assertChecksum = assertChecksum

// unused block as buffer containing a uint32BE
const BUF_BLOCK_UNUSED = Buffer.allocUnsafe(4)
BUF_BLOCK_UNUSED.writeUInt32BE(BLOCK_UNUSED, 0)
exports.BUF_BLOCK_UNUSED = BUF_BLOCK_UNUSED

/**
 * @typedef {Object} Header
 * @property {string} cookie
 * @property {number} dataOffset
 * @property {number} tableOffset
 * @property {number} headerVersion
 * @property {number} maxTableEntries
 * @property {number} blockSize
 * @property {number} checksum
 * @property {number} parentTimestamp
 * @property {string} parentUnicodeName
 */

/**
 * Check and parse the header buffer to build an header object
 *
 * @param {Buffer} bufHeader
 * @param {Object} footer
 * @returns {Header} the parsed header
 */
exports.unpackHeader = (bufHeader, footer = undefined) => {
  assertChecksum('header', bufHeader, fuHeader)

  const header = fuHeader.unpack(bufHeader)
  checkHeader(header, footer)
  return header
}

/**
 * @typedef {Object} Footer
 * @property {string} cookie
 * @property {number} features
 * @property {number} fileFormatVersion
 * @property {number} dataOffset
 * @property {number} timestamp
 * @property {string} creatorApplication
 * @property {number} creatorVersion
 * @property {creatorHostOs} creatorHostOs
 * @property {number} originalSize
 * @property {number} currentSize
 * @property {object} diskGeometry
 * @property {number} diskGeometry.heads
 * @property {number} diskGeometry.cylinders
 * @property {number} diskGeometry.sectorsPerTrackCylinder
 * @property {number} diskType
 * @property {number} checksum
 * @property {Buffer} uuid
 */

/**
 * Check and parse the footer buffer to build a footer object
 *
 * @param {Buffer} bufHeader
 * @returns {Footer} the parsed footer
 */

exports.unpackFooter = bufFooter => {
  assertChecksum('footer', bufFooter, fuFooter)

  const footer = fuFooter.unpack(bufFooter)
  checkFooter(footer)
  return footer
}
