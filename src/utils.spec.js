/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import {
  ensureArray,
  extractProperty,
  formatXml
} from './utils'

// ===================================================================

describe('ensureArray()', function () {
  it('wrap the value in an array', function () {
    const value = 'foo'

    expect(ensureArray(value)).to.eql([value])
  })

  it('returns an empty array for undefined', function () {
    expect(ensureArray(undefined)).to.eql([])
  })

  it('returns the object itself if is already an array', function () {
    const array = ['foo', 'bar', 'baz']

    expect(ensureArray(array)).to.equal(array)
  })
})

// -------------------------------------------------------------------

describe('extractProperty()', function () {
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

// -------------------------------------------------------------------

describe('formatXml()', function () {
  it('formats a JS object to an XML string', function () {
    expect(formatXml({
      foo: {
        bar: [
          {$: {baz: 'plop'}},
          {$: {baz: 'plip'}}
        ]
      }
    })).to.equal(`<foo>
  <bar baz="plop"/>
  <bar baz="plip"/>
</foo>`)
  })
})
