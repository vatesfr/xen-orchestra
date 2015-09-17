/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import {
  camelToSnakeCase,
  ensureArray,
  extractProperty,
  formatXml,
  generateToken,
  parseSize
} from './utils'

// ===================================================================

describe('camelToSnakeCase()', function () {
  it('converts a string from camelCase to snake_case', function () {
    expect(camelToSnakeCase('fooBar')).to.equal('foo_bar')
  })

  it('does not alter snake_case strings', function () {
    expect(camelToSnakeCase('foo_bar')).to.equal('foo_bar')
  })

  it('does not alter upper case letters expect those from the camelCase', function () {
    expect(camelToSnakeCase('fooBar_BAZ')).to.equal('foo_bar_BAZ')
  })
})

// -------------------------------------------------------------------

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

// -------------------------------------------------------------------

describe('generateToken()', () => {
  it('generates a string', async () => {
    expect(await generateToken()).to.be.a.string()
  })
})

// -------------------------------------------------------------------

describe('parseSize()', function () {
  it('parses a human size', function () {
    expect(parseSize('1G')).to.equal(1e9)
  })

  it('returns the parameter if already a number', function () {
    expect(parseSize(1e6)).to.equal(1e6)
  })

  it('throws if the string cannot be parsed', function () {
    expect(function () {
      parseSize('foo')
    }).to.throw()
  })

  it('supports the B unit as suffix', function () {
    expect(parseSize('3MB')).to.equal(3e6)
  })
})
