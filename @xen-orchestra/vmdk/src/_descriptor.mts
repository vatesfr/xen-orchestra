import { randomInt } from 'node:crypto'

import { SECTOR_SIZE } from './_constants.mjs'

export interface VmdkGeometry {
  readonly cylinders: number
  readonly heads: number
  readonly sectorsPerTrack: number
}

/**
 * The geometry is only informative for a sparse disk, but tools do read it back: give them
 * something consistent with the disk size instead of a constant.
 *
 * 63 sectors per track is universal, and VMware switches from 16 to 255 heads for disks bigger
 * than 8GiB.
 */
export function computeGeometry(sizeBytes: number): VmdkGeometry {
  const sectorsPerTrack = 63
  const heads = sizeBytes > 8 * 1024 * 1024 * 1024 ? 255 : 16
  const cylinders = Math.max(1, Math.ceil(sizeBytes / (sectorsPerTrack * heads * SECTOR_SIZE)))
  return { cylinders, heads, sectorsPerTrack }
}

/**
 * The text descriptor of a stream optimized disk, embedded in the extent, right after the header.
 *
 * @param nbPaddingSectors VirtualBox appends its own `ddb.uuid.*` properties to the descriptor
 * without checking there is room for them, overwriting whatever follows - a few spare sectors
 * work around it.
 */
export function createStreamOptimizedDescriptor({
  capacitySectors,
  diskName,
  geometry,
  nbPaddingSectors = 10,
}: {
  readonly capacitySectors: number
  readonly diskName: string
  readonly geometry: VmdkGeometry
  readonly nbPaddingSectors?: number
}): Buffer {
  if (diskName.includes('"')) {
    throw new Error(`a disk name can't contain a double quote, got ${JSON.stringify(diskName)}`)
  }
  // VirtualBox can't parse an indented descriptor
  const descriptor = `# Disk DescriptorFile
version=1
CID=${randomInt(0, 0xffffffff).toString(16).padStart(8, '0')}
parentCID=ffffffff
createType="streamOptimized"
# Extent description
RW ${capacitySectors} SPARSE "${diskName}"
# The Disk Data Base
#DDB
ddb.adapterType = "ide"
ddb.geometry.sectors = "${geometry.sectorsPerTrack}"
ddb.geometry.heads = "${geometry.heads}"
ddb.geometry.cylinders = "${geometry.cylinders}"
`
  const text = Buffer.from(descriptor, 'utf8')
  const buffer = Buffer.alloc((Math.ceil(text.length / SECTOR_SIZE) + nbPaddingSectors) * SECTOR_SIZE)
  text.copy(buffer)
  return buffer
}
