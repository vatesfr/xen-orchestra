'use strict'

const assert = require('assert')

const { HEADER_COOKIE, HEADER_VERSION, SECTOR_SIZE } = require('./_constants')

module.exports = (header, footer) => {
  assert.strictEqual(header.cookie, HEADER_COOKIE)
  assert.strictEqual(header.dataOffset, undefined)
  assert.strictEqual(header.headerVersion, HEADER_VERSION)
  assert(Number.isInteger(Math.log2(header.blockSize / SECTOR_SIZE)))

  if (footer !== undefined) {
    assert(header.maxTableEntries >= footer.currentSize / header.blockSize)
  }
}
