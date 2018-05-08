import { v4 as generateUuid } from 'uuid'

import { checksumStruct, fuFooter, fuHeader } from './_structs'
import {
  FOOTER_COOKIE,
  DISK_TYPE_FIXED,
  PLATFORM_WI2K,
  FOOTER_SIZE,
  HEADER_SIZE,
  DEFAULT_BLOCK_SIZE as VHD_BLOCK_SIZE_BYTES,
  HEADER_COOKIE,
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
    fileFormatVersion: 0x00010000,
    dataOffset,
    timestamp,
    creatorApplication: 'xo  ',
    creatorHostOs: PLATFORM_WI2K, // it looks like everybody is using Wi2k
    originalSize: size,
    currentSize: size,
    diskGeometry: geometry,
    diskType,
    uuid: generateUuid(null, []),
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
    headerVersion: 0x00010000,
    maxTableEntries,
    blockSize,
  })
  checksumStruct(header, fuHeader)
  return header
}
