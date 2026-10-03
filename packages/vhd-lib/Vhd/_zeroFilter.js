'use strict'

const assert = require('assert')

// Chunk filter which only removes the pages full of zeroes, much cheaper than a compression
//
// format: original length (uint32 BE) + bitmap of the stored pages (bit i = page i) + the stored pages

const PAGE_SIZE = 4096
const ZERO_PAGE = Buffer.alloc(PAGE_SIZE)
const LENGTH_SIZE = 4

const isZeroPage = page => page.compare(ZERO_PAGE, 0, page.length) === 0

/**
 * @param {Buffer} buffer
 * @returns {Buffer[]} the filtered chunk, in parts: the consecutive stored pages are not copied
 */
exports.removeZeroPages = function removeZeroPages(buffer) {
  const { length } = buffer
  assert.ok(length <= 0xffffffff, `chunk of ${length} bytes is too large`)
  const nbPages = Math.ceil(length / PAGE_SIZE)
  const header = Buffer.alloc(LENGTH_SIZE + Math.ceil(nbPages / 8))
  header.writeUInt32BE(length, 0)
  const parts = [header]
  // start of the current run of stored pages
  let runStart = -1
  for (let i = 0; i < nbPages; i++) {
    const start = i * PAGE_SIZE
    if (isZeroPage(buffer.subarray(start, start + PAGE_SIZE))) {
      if (runStart !== -1) {
        parts.push(buffer.subarray(runStart, start))
        runStart = -1
      }
    } else {
      header[LENGTH_SIZE + (i >> 3)] |= 1 << (i & 7)
      if (runStart === -1) {
        runStart = start
      }
    }
  }
  if (runStart !== -1) {
    parts.push(buffer.subarray(runStart))
  }
  return parts
}

/**
 * @param {Buffer} filtered
 * @returns {Buffer} the original chunk
 */
exports.restoreZeroPages = function restoreZeroPages(filtered) {
  assert.ok(filtered.length >= LENGTH_SIZE, 'truncated chunk')
  const length = filtered.readUInt32BE(0)
  const nbPages = Math.ceil(length / PAGE_SIZE)
  const dataStart = LENGTH_SIZE + Math.ceil(nbPages / 8)
  assert.ok(filtered.length >= dataStart, 'truncated chunk')

  let nbStored = 0
  for (let i = 0; i < nbPages; i++) {
    if (filtered[LENGTH_SIZE + (i >> 3)] & (1 << (i & 7))) {
      nbStored++
    }
  }
  // the last page may be shorter
  const lastPageSize = length - (nbPages - 1) * PAGE_SIZE
  const lastStored = nbPages > 0 && filtered[LENGTH_SIZE + ((nbPages - 1) >> 3)] & (1 << ((nbPages - 1) & 7))
  const storedSize = nbStored * PAGE_SIZE - (lastStored ? PAGE_SIZE - lastPageSize : 0)
  assert.strictEqual(filtered.length - dataStart, storedSize, 'the chunk does not match its bitmap')

  // no page has been removed: the data are the original chunk
  if (nbStored === nbPages) {
    return filtered.subarray(dataStart)
  }

  const chunk = Buffer.alloc(length)
  let offset = dataStart
  for (let i = 0; i < nbPages; i++) {
    if (filtered[LENGTH_SIZE + (i >> 3)] & (1 << (i & 7))) {
      const size = Math.min(PAGE_SIZE, length - i * PAGE_SIZE)
      filtered.copy(chunk, i * PAGE_SIZE, offset, offset + size)
      offset += size
    }
  }
  return chunk
}
