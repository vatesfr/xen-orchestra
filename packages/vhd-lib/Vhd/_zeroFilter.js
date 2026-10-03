'use strict'

const assert = require('assert')

// Chunk filter which only removes the pages full of zeroes, much cheaper than a compression
//
// format: original length (uint32 BE) + bitmap of the stored pages (bit i = page i) + the stored pages

const PAGE_SIZE = 4096
const ZERO_PAGE = Buffer.alloc(PAGE_SIZE)
const LENGTH_SIZE = 4

/**
 * @param {Buffer|Buffer[]} data - the chunk, or its parts (the chunk is their concatenation)
 * @returns {Buffer[]} the filtered chunk, in parts: the stored pages are views on the data, never copied
 */
exports.removeZeroPages = function removeZeroPages(data) {
  const parts = Array.isArray(data) ? data : [data]
  const length = parts.reduce((sum, part) => sum + part.length, 0)
  assert.ok(length <= 0xffffffff, `chunk of ${length} bytes is too large`)
  const nbPages = Math.ceil(length / PAGE_SIZE)
  const header = Buffer.alloc(LENGTH_SIZE + Math.ceil(nbPages / 8))
  header.writeUInt32BE(length, 0)
  const result = [header]

  // the current run of stored bytes, in the current part
  let run
  const store = (part, start, end) => {
    if (run !== undefined && run.part === part && run.end === start) {
      run.end = end
    } else {
      if (run !== undefined) result.push(run.part.subarray(run.start, run.end))
      run = { part, start, end }
    }
  }

  let partIndex = 0
  let offset = 0 // in parts[partIndex]
  for (let i = 0; i < nbPages; i++) {
    // the page may span several parts
    const slices = []
    let remaining = Math.min(PAGE_SIZE, length - i * PAGE_SIZE)
    while (remaining > 0) {
      const part = parts[partIndex]
      const size = Math.min(remaining, part.length - offset)
      if (size > 0) slices.push([part, offset, offset + size])
      offset += size
      remaining -= size
      if (offset === part.length) {
        partIndex++
        offset = 0
      }
    }
    if (slices.every(([part, start, end]) => part.compare(ZERO_PAGE, 0, end - start, start, end) === 0)) {
      continue
    }
    header[LENGTH_SIZE + (i >> 3)] |= 1 << (i & 7)
    for (const [part, start, end] of slices) store(part, start, end)
  }
  if (run !== undefined) result.push(run.part.subarray(run.start, run.end))
  return result
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
