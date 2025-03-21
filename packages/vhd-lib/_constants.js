'use strict'

/**
 * @typedef {Object} Constants
 * @property {number} BLOCK_UNUSED - Represents an unused block.
 * @property {string} CREATOR_APPLICATION - The creator application identifier.
 * @property {number} FOOTER_SIZE - Size of the VHD footer in bytes.
 * @property {number} HEADER_SIZE - Size of the VHD header in bytes.
 * @property {number} SECTOR_SIZE - Size of a sector in bytes.
 * @property {number} DEFAULT_BLOCK_SIZE - Default block size in bytes.
 * @property {string} FOOTER_COOKIE - The footer cookie identifier.
 * @property {string} HEADER_COOKIE - The header cookie identifier.
 * @property {Object.<string, number>} DISK_TYPES - Types of VHD disks.
 * @property {number} PARENT_LOCATOR_ENTRIES - Number of parent locator entries.
 * @property {Object.<string, number>} PLATFORMS - Platform identifiers.
 * @property {number} FILE_FORMAT_VERSION - File format version.
 * @property {number} HEADER_VERSION - Header version.
 * @property {number} ALIAS_MAX_PATH_LENGTH - Maximum length of an alias path.
 */

/**
 * Represents an unused block.
 * @type {number}
 */
exports.BLOCK_UNUSED = 0xffffffff

/**
 * The creator application identifier.
 * @type {string}
 */
exports.CREATOR_APPLICATION = 'xo  '

/**
 * Size of the VHD footer in bytes.
 * @type {number}
 */
exports.FOOTER_SIZE = 512

/**
 * Size of the VHD header in bytes.
 * @type {number}
 */
exports.HEADER_SIZE = 1024

/**
 * Size of a sector in bytes.
 * @type {number}
 */
exports.SECTOR_SIZE = 512

/**
 * Default block size in bytes.
 * @type {number}
 */
exports.DEFAULT_BLOCK_SIZE = 0x00200000 // from the spec

/**
 * The footer cookie identifier.
 * @type {string}
 */
exports.FOOTER_COOKIE = 'conectix'

/**
 * The header cookie identifier.
 * @type {string}
 */
exports.HEADER_COOKIE = 'cxsparse'

/**
 * Types of VHD disks.
 * @type {Object.<string, number>}
 */
exports.DISK_TYPES = {
  __proto__: null,

  FIXED: 2,
  DYNAMIC: 3,
  DIFFERENCING: 4,
}

/**
 * Number of parent locator entries.
 * @type {number}
 */
exports.PARENT_LOCATOR_ENTRIES = 8

/**
 * Platform identifiers.
 * @type {Object.<string, number>}
 */
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

/**
 * File format version.
 * @type {number}
 */
exports.FILE_FORMAT_VERSION = 1 << 16

/**
 * Header version.
 * @type {number}
 */
exports.HEADER_VERSION = 1 << 16

/**
 * Maximum length of an alias path.
 * @type {number}
 */
exports.ALIAS_MAX_PATH_LENGTH = 1024
