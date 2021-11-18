export const BLOCK_UNUSED = 0xffffffff

// This lib has been extracted from the Xen Orchestra project.
export const CREATOR_APPLICATION = 'xo  '

// Sizes in bytes.
export const FOOTER_SIZE = 512
export const HEADER_SIZE = 1024
export const SECTOR_SIZE = 512
export const DEFAULT_BLOCK_SIZE = 0x00200000 // from the spec

export const FOOTER_COOKIE = 'conectix'
export const HEADER_COOKIE = 'cxsparse'

export const DISK_TYPES = {
  __proto__: null,

  FIXED: 2,
  DYNAMIC: 3,
  DIFFERENCING: 4,
}

export const PARENT_LOCATOR_ENTRIES = 8

export const PLATFORMS = {
  __proto__: null,

  NONE: 0,
  WI2R: 0x57693272,
  WI2K: 0x5769326b,
  W2RU: 0x57327275,
  W2KU: 0x57326b75,
  MAC: 0x4d616320,
  MACX: 0x4d616358,
}

export const FILE_FORMAT_VERSION = 1 << 16
export const HEADER_VERSION = 1 << 16

export const ALIAS_MAX_PATH_LENGTH = 1024
