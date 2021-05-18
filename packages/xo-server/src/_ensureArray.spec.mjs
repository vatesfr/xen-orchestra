/* eslint-env jest */

import ensureArray from './_ensureArray.mjs'

describe('ensureArray()', function () {
  it('wrap the value in an array', function () {
    const value = 'foo'

    expect(ensureArray(value)).toEqual([value])
  })

  it('returns an empty array for undefined', function () {
    expect(ensureArray(undefined)).toEqual([])
  })

  it('returns the object itself if is already an array', function () {
    const array = ['foo', 'bar', 'baz']

    expect(ensureArray(array)).toBe(array)
  })
})
