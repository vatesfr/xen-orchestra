'use strict'

const { describe, it } = require('node:test')
const { strict: assert } = require('assert')
const { randomBytes } = require('crypto')

const { removeZeroPages, restoreZeroPages } = require('./_zeroFilter')

const PAGE = 4096
const roundTrip = buffer => restoreZeroPages(Buffer.concat(removeZeroPages(buffer)))

describe('zero filter', () => {
  it('restores chunks of any size', () => {
    // footer, header, odd sizes, a block with its bitmap
    for (const length of [0, 1, 512, 1024, PAGE - 1, PAGE, PAGE + 1, 2 * 1024 * 1024 + 512]) {
      for (const make of [n => Buffer.alloc(n), n => randomBytes(n)]) {
        const buffer = make(length)
        assert.ok(roundTrip(buffer).equals(buffer), `${length} bytes`)
      }
    }
  })

  it('only stores the pages which are not full of zeroes', () => {
    const buffer = Buffer.alloc(10 * PAGE)
    randomBytes(PAGE).copy(buffer, 2 * PAGE)
    randomBytes(PAGE).copy(buffer, 3 * PAGE)
    buffer[7 * PAGE + 100] = 1
    const parts = removeZeroPages(buffer)
    // header + one part per run of stored pages, which are views on the original memory
    assert.equal(parts.length, 3)
    assert.equal(parts[1].buffer, buffer.buffer)
    const filtered = Buffer.concat(parts)
    assert.equal(filtered.length, 4 + 2 + 3 * PAGE)
    assert.ok(restoreZeroPages(filtered).equals(buffer))
  })

  it('filters the parts of a chunk without concatenating them, pages spanning several parts included', () => {
    const bitmap = Buffer.alloc(512, 0xff)
    const data = Buffer.alloc(4 * PAGE)
    randomBytes(100).copy(data, 2 * PAGE + 50)
    const parts = removeZeroPages([bitmap, data])
    for (const part of parts.slice(1)) {
      assert.ok(part.buffer === bitmap.buffer || part.buffer === data.buffer, 'a view on the data, not a copy')
    }
    assert.ok(restoreZeroPages(Buffer.concat(parts)).equals(Buffer.concat([bitmap, data])))
    // same result as on the concatenation
    assert.ok(Buffer.concat(parts).equals(Buffer.concat(removeZeroPages(Buffer.concat([bitmap, data])))))
  })

  it('aligns the pages on the end of the chunk, only the first one can be shorter', () => {
    const buffer = Buffer.alloc(2 * PAGE + 10)
    buffer[5] = 42
    const filtered = Buffer.concat(removeZeroPages(buffer))
    assert.equal(filtered.length, 4 + 1 + 10)
    assert.ok(restoreZeroPages(filtered).equals(buffer))
  })

  it('removes the zero pages of the data of a VHD block, whose bitmap is not a multiple of a page', () => {
    const bitmap = Buffer.alloc(512, 0xff)
    const data = Buffer.alloc(64 * PAGE)
    // one page out of two, then a region of zeroes
    for (let i = 0; i < 16; i += 2) {
      randomBytes(PAGE).copy(data, i * PAGE)
    }
    randomBytes(PAGE).copy(data, 63 * PAGE)
    for (const input of [[bitmap, data], Buffer.concat([bitmap, data])]) {
      const filtered = Buffer.concat(removeZeroPages(input))
      assert.equal(filtered.length, 4 + 9 + 512 + 9 * PAGE)
      assert.ok(restoreZeroPages(filtered).equals(Buffer.concat([bitmap, data])))
    }
  })

  it('handles parts which are empty or smaller than a page', () => {
    const chunk = randomBytes(3 * PAGE + 512)
    chunk.fill(0, 512 + PAGE, 512 + 2 * PAGE)
    const parts = [chunk.subarray(0, 100), Buffer.alloc(0), chunk.subarray(100, 5000), chunk.subarray(5000)]
    const filtered = Buffer.concat(removeZeroPages(parts))
    assert.ok(filtered.equals(Buffer.concat(removeZeroPages(chunk))))
    assert.equal(filtered.length, 4 + 1 + 512 + 2 * PAGE)
    assert.ok(restoreZeroPages(filtered).equals(chunk))
  })

  it('detects a truncated or inconsistent chunk', () => {
    const filtered = Buffer.concat(removeZeroPages(randomBytes(3 * PAGE)))
    assert.throws(() => restoreZeroPages(filtered.subarray(0, filtered.length - 1)), /does not match/)
    assert.throws(() => restoreZeroPages(filtered.subarray(0, 2)), /truncated/)
  })
})
