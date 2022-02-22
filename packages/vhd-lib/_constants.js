'use strict'

exports.BLOCK_UNUSED = 0xffffffff

// This lib has been extracted from the Xen Orchestra project.
exports.CREATOR_APPLICATION = 'xo  '

// Sizes in bytes.
exports.FOOTER_SIZE = 512
exports.HEADER_SIZE = 1024
exports.SECTOR_SIZE = 512
exports.DEFAULT_BLOCK_SIZE = 0x00200000 // from the spec

exports.FOOTER_COOKIE = 'conectix'
exports.HEADER_COOKIE = 'cxsparse'

exports.DISK_TYPES = {
  __proto__: null,

  FIXED: 2,
  DYNAMIC: 3,
  DIFFERENCING: 4,
}

exports.PARENT_LOCATOR_ENTRIES = 8

exports.PLATFORMS = {
  __proto__: null,

  NONE: 0,
  WI2R: 0x57693272,
  WI2K: 0x5769326b,
  W2RU: 0x57327275,
  W2KU: 0x57326b75,
  MAC: 0x4d616320,
  MACX: 0x4d616358,
}

exports.FILE_FORMAT_VERSION = 1 << 16
exports.HEADER_VERSION = 1 << 16

exports.ALIAS_MAX_PATH_LENGTH = 1024
