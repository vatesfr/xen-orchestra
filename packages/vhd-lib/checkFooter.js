'use strict'

const assert = require('assert')

const { DISK_TYPES, FILE_FORMAT_VERSION, FOOTER_COOKIE, FOOTER_SIZE } = require('./_constants')

module.exports = footer => {
  assert.strictEqual(footer.cookie, FOOTER_COOKIE)
  assert.strictEqual(footer.dataOffset, FOOTER_SIZE)
  assert.strictEqual(footer.fileFormatVersion, FILE_FORMAT_VERSION)
  assert(footer.originalSize <= footer.currentSize)
  assert(footer.diskType === DISK_TYPES.DIFFERENCING || footer.diskType === DISK_TYPES.DYNAMIC)
}
