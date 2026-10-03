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

  it('stores a shorter last page', () => {
    const buffer = Buffer.alloc(2 * PAGE + 10)
    buffer[2 * PAGE + 5] = 42
    const filtered = Buffer.concat(removeZeroPages(buffer))
    assert.equal(filtered.length, 4 + 1 + 10)
    assert.ok(restoreZeroPages(filtered).equals(buffer))
  })

  it('detects a truncated or inconsistent chunk', () => {
    const filtered = Buffer.concat(removeZeroPages(randomBytes(3 * PAGE)))
    assert.throws(() => restoreZeroPages(filtered.subarray(0, filtered.length - 1)), /does not match/)
    assert.throws(() => restoreZeroPages(filtered.subarray(0, 2)), /truncated/)
  })
})
