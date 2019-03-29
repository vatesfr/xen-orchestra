import assert from 'assert'

import { HEADER_COOKIE, HEADER_VERSION, SECTOR_SIZE } from './_constants'

export default (header, footer) => {
  assert.strictEqual(header.cookie, HEADER_COOKIE)
  assert.strictEqual(header.dataOffset, undefined)
  assert.strictEqual(header.headerVersion, HEADER_VERSION)
  assert(Number.isInteger(Math.log2(header.blockSize / SECTOR_SIZE)))

  if (footer !== undefined) {
    assert(header.maxTableEntries >= footer.currentSize / header.blockSize)
  }
}
