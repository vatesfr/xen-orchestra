import assert from 'assert'

import { BLOCK_UNUSED } from './_constants'

// get the identifiers and first sectors of the first and last block
// in the file
export default bat => {
  const n = bat.length
  assert.notStrictEqual(n, 0)
  assert.strictEqual(n % 4, 0)

  let i = 0
  let j = 0
  let first, firstSector, last, lastSector

  // get first allocated block for initialization
  while ((firstSector = bat.readUInt32BE(j)) === BLOCK_UNUSED) {
    i += 1
    j += 4

    if (j === n) {
      const error = new Error('no allocated block found')
      error.noBlock = true
      throw error
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
