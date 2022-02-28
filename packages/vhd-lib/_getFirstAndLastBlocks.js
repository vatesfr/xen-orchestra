'use strict'

const assert = require('assert')

const { BLOCK_UNUSED } = require('./_constants')

// get the identifiers and first sectors of the first and last block
// in the file
module.exports = bat => {
  const n = bat.length
  if (n === 0) {
    return
  }
  assert.strictEqual(n % 4, 0)

  let i = 0
  let j = 0
  let first, firstSector, last, lastSector

  // get first allocated block for initialization
  while ((firstSector = bat.readUInt32BE(j)) === BLOCK_UNUSED) {
    i += 1
    j += 4

    if (j === n) {
      return
    }
  }
  lastSector = firstSector
  first = last = i

  while (j < n) {
    const sector = bat.readUInt32BE(j)
    if (sector !== BLOCK_UNUSED) {
      if (sector < firstSector) {
        first = i
        firstSector = sector
      } else if (sector > lastSector) {
        last = i
        lastSector = sector
      }
    }

    i += 1
    j += 4
  }

  return { first, firstSector, last, lastSector }
}
