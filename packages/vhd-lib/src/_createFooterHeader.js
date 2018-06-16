import { v4 as generateUuid } from 'uuid'

import { checksumStruct, fuFooter, fuHeader } from './_structs'
import {
  CREATOR_APPLICATION,
  DEFAULT_BLOCK_SIZE as VHD_BLOCK_SIZE_BYTES,
  DISK_TYPE_FIXED,
  FILE_FORMAT_VERSION,
  FOOTER_COOKIE,
  FOOTER_SIZE,
  HEADER_COOKIE,
  HEADER_SIZE,
  HEADER_VERSION,
  PLATFORM_WI2K,
} from './_constants'

export function createFooter (
  size,
  timestamp,
  geometry,
  dataOffset,
  diskType = DISK_TYPE_FIXED
) {
  const footer = fuFooter.pack({
    cookie: FOOTER_COOKIE,
    features: 2,
    fileFormatVersion: FILE_FORMAT_VERSION,
    dataOffset,
    timestamp,
    creatorApplication: CREATOR_APPLICATION,
    creatorHostOs: PLATFORM_WI2K, // it looks like everybody is using Wi2k
    originalSize: size,
    currentSize: size,
    diskGeometry: geometry,
    diskType,
    uuid: generateUuid(null, Buffer.allocUnsafe(16)),
  })
  checksumStruct(footer, fuFooter)
  return footer
}

export function createHeader (
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
