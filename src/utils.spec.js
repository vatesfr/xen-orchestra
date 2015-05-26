/* eslint-env mocha */

import {expect} from 'chai'

// ===================================================================

import {
  ensureArray,
  extractProperty
} from './utils'

// ===================================================================

describe('ensureArray', function () {
  it('returns an empty array for undefined', function () {
    expect(ensureArray(undefined)).to.eql([])
  })

  it('returns the object itself if is already an array', function () {
    const array = ['foo', 'bar', 'baz']

    expect(ensureArray(array)).to.equal(array)
  })

  it('wrap the value in an object', function () {
    const value = {}

    expect(ensureArray(value)).to.includes(value)
  })
})

// -------------------------------------------------------------------

describe('extractProperty', function () {
  it('returns the value of the property', function () {
    const value = {}
    const obj = { prop: value }

    expect(extractProperty(obj, 'prop')).to.equal(value)
  })

  it('removes the property from the object', function () {
    const value = {}
    const obj = { prop: value }

    expect(extractProperty(obj, 'prop')).to.equal(value)
    expect(obj).to.not.have.property('prop')
  })
})
