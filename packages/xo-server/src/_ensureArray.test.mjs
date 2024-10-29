import assert from 'assert/strict'
import test from 'node:test'

import ensureArray from './_ensureArray.mjs'

const { describe, it } = test

describe('ensureArray()', function () {
  it('wrap the value in an array', function () {
    const value = 'foo'

    assert.deepEqual(ensureArray(value), [value])
  })

  it('returns an empty array for undefined', function () {
    assert.deepEqual(ensureArray(undefined), [])
  })

  it('returns the object itself if is already an array', function () {
    const array = ['foo', 'bar', 'baz']

    assert.equal(ensureArray(array), array)
  })
})
