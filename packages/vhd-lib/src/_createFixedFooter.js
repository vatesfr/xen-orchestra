import { v4 as generateUuid } from 'uuid'

import { checksumStruct, fuFooter } from './_structs'
import { COOKIE, DISK_TYPE_FIXED, PLATFORM_WI2K } from './_constants'

export default function createFixedFooter (size, timestamp, geometry) {
  const footer = fuFooter.pack({
    cookie: COOKIE,
    features: 2,
    fileFormatVersion: 0x00010000,
    dataOffset: undefined,
    timestamp,
    creatorApplication: 'xo  ',
    creatorHostOs: PLATFORM_WI2K, // it looks like everybody is using Wi2k
    originalSize: size,
    currentSize: size,
    diskGeometry: geometry,
    diskType: DISK_TYPE_FIXED,
    uuid: generateUuid(null, []),
  })
  checksumStruct(footer, fuFooter)
  return footer
}
