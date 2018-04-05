export {
  default as vhdMerge,
  chainVhd,
  createReadStream,
  readVhdMetadata,
} from './vhd-merge'

export {
  Vhd,
  fuHeader,
  fuFooter,
  checksumStruct,
  VHD_SECTOR_SIZE,
  HARD_DISK_TYPE_FIXED,
  HARD_DISK_TYPE_DYNAMIC,
  computeGeometryForSize,
} from './vhd'
