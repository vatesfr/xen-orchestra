import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import defined from '@xen-orchestra/defined/index.js'

describe('defined()', () => {
  it('returns the first non undefined argument', () => {
    const expected = 'foo'
    assert.deepEqual(defined(undefined, 'foo', 42), expected)
  })
  it('should return first non undefined value in array', () => {
    const expected = null
    assert.deepEqual(defined([undefined, null, 10]), expected)
  })
  it('should return first non undefined value in arrays', () => {
    const expected = [undefined, undefined, undefined]
    assert.deepEqual(defined([undefined, undefined, undefined], [undefined, undefined, 10]), expected)
  })
  it('should return first non undefined value in function', () => {
    const expected = 'bar'
    assert.deepEqual(
      defined(() => 'bar', 42),
      expected
    )
  })
  it('should return undefined if only undefined values', () => {
    const expected = undefined
    assert.equal(defined(undefined, undefined), expected)
  })
})
