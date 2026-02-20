'use strict'
/**
 * @typedef {(Object)} DiskGeometry
 * @property {(number)} cylinders
 * @property {(number)} heads
 * @property {(number)} sectorsPerTrackCylinder
 *
 * @typedef {(Object)} VhdFooter
 * @property {(string)} cookie
 * @property {(number)} features
 * @property {(number)} fileFormatVersion
 * @property {(number)} dataOffset
 * @property {(number)} timestamp
 * @property {(string)} creatorApplication
 * @property {(number)} creatorVersion
 * @property {(number)} creatorHostOs
 * @property {(number)} originalSize
 * @property {(number)} currentSize
 * @property {(DiskGeometry)} diskGeometry
 * @property {(number)} diskType
 * @property {(number)} checksum
 * @property {(Buffer)} uuid
 * @property {(string)} saved
 * @property {(string)} hidden
 * @property {(string)} reserved
 */
const { v4: generateUuid } = require('uuid')

const { checksumStruct, fuFooter, fuHeader } = require('./_structs')
const {
  CREATOR_APPLICATION,
  DEFAULT_BLOCK_SIZE: VHD_BLOCK_SIZE_BYTES,
  DISK_TYPES,
  FILE_FORMAT_VERSION,
  FOOTER_COOKIE,
  FOOTER_SIZE,
  HEADER_COOKIE,
  HEADER_SIZE,
  HEADER_VERSION,
  PLATFORMS,
} = require('./_constants')

exports.createFooter = function createFooter(size, timestamp, geometry, dataOffset, diskType = DISK_TYPES.FIXED) {
  const footer = fuFooter.pack({
    cookie: FOOTER_COOKIE,
    features: 2,
    fileFormatVersion: FILE_FORMAT_VERSION,
    dataOffset,
    timestamp,
    creatorApplication: CREATOR_APPLICATION,
    creatorHostOs: PLATFORMS.WI2K, // it looks like everybody is using Wi2k
    originalSize: size,
    currentSize: size,
    diskGeometry: geometry,
    diskType,
    uuid: generateUuid(null, Buffer.allocUnsafe(16)),
  })
  checksumStruct(footer, fuFooter)
  return footer
}

exports.createHeader = function createHeader(
  maxTableEntries,
  tableOffset = HEADER_SIZE + FOOTER_SIZE,
  blockSize = VHD_BLOCK_SIZE_BYTES
) {
  const header = fuHeader.pack({
    cookie: HEADER_COOKIE,
    tableOffset,
    headerVersion: HEADER_VERSION,
    maxTableEntries,
    blockSize,
  })
  checksumStruct(header, fuHeader)
  return header
}
