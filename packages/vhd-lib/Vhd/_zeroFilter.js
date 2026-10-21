'use strict'

const assert = require('assert')

// Chunk filter which only removes the pages full of zeroes, much cheaper than a compression
//
// format: original length (uint32 BE) + bitmap of the stored pages (bit i = page i) + the stored pages
//
// the pages are aligned on the end of the chunk: only the first page can be shorter. A VHD block is its bitmap (512
// bytes) followed by its data, its first page is then the bitmap, and the other pages match the pages of the disk

const PAGE_SIZE = 4096
const LENGTH_SIZE = 4

// the empty parts of a disk are usually large: after a zero page, the next ones are skipped by regions, with a single
// comparison each
const REGION_SIZE = 64 * 1024
const PAGES_PER_REGION = REGION_SIZE / PAGE_SIZE
const ZERO_REGION = Buffer.alloc(REGION_SIZE)

const getFirstPageSize = length => length % PAGE_SIZE || PAGE_SIZE

// the cheap checks of the first and last bytes avoid most comparisons on data
const isZero = (buffer, start, end) =>
  buffer[start] === 0 && buffer[end - 1] === 0 && buffer.compare(ZERO_REGION, 0, end - start, start, end) === 0

const isStored = (filtered, pageIndex) => (filtered[LENGTH_SIZE + (pageIndex >> 3)] & (1 << (pageIndex & 7))) !== 0

/**
 * @param {Buffer|Buffer[]} data - the chunk, or its parts (the chunk is their concatenation)
 * @returns {Buffer[]} the filtered chunk, in parts: the stored pages are views on the data, never copied
 */
exports.removeZeroPages = function removeZeroPages(data) {
  const parts = Array.isArray(data) ? data : [data]
  let length = 0
  for (const part of parts) {
    length += part.length
  }
  assert.ok(length <= 0xffffffff, `chunk of ${length} bytes is too large`)
  const nbPages = Math.ceil(length / PAGE_SIZE)
  const header = Buffer.alloc(LENGTH_SIZE + Math.ceil(nbPages / 8))
  header.writeUInt32BE(length, 0)
  const result = [header]

  // the current run of stored bytes, in runPart
  let runPart
  let runStart = 0
  let runEnd = 0
  const store = (part, start, end) => {
    if (part === runPart && start === runEnd) {
      runEnd = end
    } else {
      if (runPart !== undefined) {
        result.push(runPart.subarray(runStart, runEnd))
      }
      runPart = part
      runStart = start
      runEnd = end
    }
  }

  let partIndex = 0
  let partStart = 0 // offset of parts[partIndex] in the chunk
  let pageStart = 0 // offsets in the chunk
  let pageEnd = getFirstPageSize(length)
  for (let pageIndex = 0; pageIndex < nbPages; ) {
    while (pageStart >= partStart + parts[partIndex].length) {
      partStart += parts[partIndex].length
      partIndex++
    }
    const part = parts[partIndex]
    const start = pageStart - partStart
    const end = pageEnd - partStart

    if (end <= part.length) {
      // the page is in a single part
      if (isZero(part, start, end)) {
        pageIndex++
        let next = end
        while (
          pageIndex + PAGES_PER_REGION <= nbPages &&
          next + REGION_SIZE <= part.length &&
          isZero(part, next, next + REGION_SIZE)
        ) {
          pageIndex += PAGES_PER_REGION
          next += REGION_SIZE
        }
        pageStart = partStart + next
        pageEnd = pageStart + PAGE_SIZE
        continue
      }
      store(part, start, end)
    } else {
      // the page spans several parts
      const slices = []
      let sliceStart = start
      for (let i = partIndex, remaining = pageEnd - pageStart; remaining > 0; i++) {
        const sliceEnd = Math.min(parts[i].length, sliceStart + remaining)
        if (sliceEnd > sliceStart) {
          slices.push([parts[i], sliceStart, sliceEnd])
          remaining -= sliceEnd - sliceStart
        }
        sliceStart = 0
      }
      if (slices.every(slice => isZero(...slice))) {
        pageIndex++
        pageStart = pageEnd
        pageEnd += PAGE_SIZE
        continue
      }
      for (const slice of slices) {
        store(...slice)
      }
    }
    header[LENGTH_SIZE + (pageIndex >> 3)] |= 1 << (pageIndex & 7)
    pageIndex++
    pageStart = pageEnd
    pageEnd += PAGE_SIZE
  }
  if (runPart !== undefined) {
    result.push(runPart.subarray(runStart, runEnd))
  }
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

  const firstPageSize = getFirstPageSize(length)
  let nbStored = 0
  for (let i = 0; i < nbPages; i++) {
    if (isStored(filtered, i)) {
      nbStored++
    }
  }
  const storedSize = nbStored * PAGE_SIZE - (nbPages > 0 && isStored(filtered, 0) ? PAGE_SIZE - firstPageSize : 0)
  assert.strictEqual(filtered.length - dataStart, storedSize, 'the chunk does not match its bitmap')

  // no page has been removed: the data are the original chunk
  if (storedSize === length) {
    return filtered.subarray(dataStart)
  }

  // each run of stored pages is copied at once, and each run of removed pages is filled at once
  const chunk = Buffer.allocUnsafe(length)
  let offset = dataStart
  let start = 0
  for (let i = 0; i < nbPages; ) {
    const stored = isStored(filtered, i)
    let end = i === 0 ? firstPageSize : start + PAGE_SIZE
    i++
    while (i < nbPages && isStored(filtered, i) === stored) {
      end += PAGE_SIZE
      i++
    }
    if (stored) {
      filtered.copy(chunk, start, offset, offset + end - start)
      offset += end - start
    } else {
      chunk.fill(0, start, end)
    }
    start = end
  }
  return chunk
}
