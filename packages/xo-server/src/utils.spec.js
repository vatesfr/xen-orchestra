/* eslint-env jest */

import {
  camelToSnakeCase,
  createRawObject,
  diffItems,
  ensureArray,
  extractProperty,
  formatXml,
  generateToken,
  parseSize,
  pSettle,
} from './utils'

// ===================================================================

describe('camelToSnakeCase()', function () {
  it('converts a string from camelCase to snake_case', function () {
    expect(camelToSnakeCase('fooBar')).toBe('foo_bar')
    expect(camelToSnakeCase('ipv4Allowed')).toBe('ipv4_allowed')
  })

  it('does not alter snake_case strings', function () {
    expect(camelToSnakeCase('foo_bar')).toBe('foo_bar')
    expect(camelToSnakeCase('ipv4_allowed')).toBe('ipv4_allowed')
  })

  it('does not alter upper case letters expect those from the camelCase', function () {
    expect(camelToSnakeCase('fooBar_BAZ')).toBe('foo_bar_BAZ')
  })
})

// -------------------------------------------------------------------

describe('createRawObject()', () => {
  it('returns an empty object', () => {
    expect(createRawObject()).toEqual({})
  })

  it('creates a new object each time', () => {
    expect(createRawObject()).not.toBe(createRawObject())
  })

  if (Object.getPrototypeOf) {
    it('creates an object without a prototype', () => {
      expect(Object.getPrototypeOf(createRawObject())).toBe(null)
    })
  }
})

// -------------------------------------------------------------------

describe('diffItems', () => {
  it('computes the added/removed items between 2 iterables', () => {
    expect(diffItems(['foo', 'bar'], ['baz', 'foo'])).toEqual([
      ['bar'],
      ['baz'],
    ])
  })
})

// -------------------------------------------------------------------

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

// -------------------------------------------------------------------

describe('extractProperty()', function () {
  it('returns the value of the property', function () {
    const value = {}
    const obj = { prop: value }

    expect(extractProperty(obj, 'prop')).toBe(value)
  })

  it('removes the property from the object', function () {
    const value = {}
    const obj = { prop: value }

    expect(extractProperty(obj, 'prop')).toBe(value)
    expect(obj.prop).not.toBeDefined()
  })
})

// -------------------------------------------------------------------

describe('formatXml()', function () {
  it('formats a JS object to an XML string', function () {
    expect(
      formatXml({
        foo: {
          bar: [{ $: { baz: 'plop' } }, { $: { baz: 'plip' } }],
        },
      })
    ).toBe(`<foo>
  <bar baz="plop"/>
  <bar baz="plip"/>
</foo>`)
  })
})

// -------------------------------------------------------------------

describe('generateToken()', () => {
  it('generates a string', async () => {
    expect(typeof await generateToken()).toBe('string')
  })
})

// -------------------------------------------------------------------

describe('parseSize()', function () {
  it('parses a human size', function () {
    expect(parseSize('1G')).toBe(1e9)
  })

  it('returns the parameter if already a number', function () {
    expect(parseSize(1e6)).toBe(1e6)
  })

  it('throws if the string cannot be parsed', function () {
    expect(function () {
      parseSize('foo')
    }).toThrow()
  })

  it('supports the B unit as suffix', function () {
    expect(parseSize('3MB')).toBe(3e6)
  })
})

// -------------------------------------------------------------------

describe('pSettle()', () => {
  it('works with arrays', async () => {
    const rejection = 'fatality'
    const [status1, status2, status3] = await pSettle([
      Promise.resolve(42),
      Math.PI,
      Promise.reject(rejection),
    ])

    expect(status1.isRejected()).toBe(false)
    expect(status2.isRejected()).toBe(false)
    expect(status3.isRejected()).toBe(true)

    expect(status1.isFulfilled()).toBe(true)
    expect(status2.isFulfilled()).toBe(true)
    expect(status3.isFulfilled()).toBe(false)

    expect(status1.value()).toBe(42)
    expect(status2.value()).toBe(Math.PI)
    expect(::status3.value).toThrow()

    expect(::status1.reason).toThrow()
    expect(::status2.reason).toThrow()
    expect(status3.reason()).toBe(rejection)
  })

  it('works with objects', async () => {
    const rejection = 'fatality'

    const { a: status1, b: status2, c: status3 } = await pSettle({
      a: Promise.resolve(42),
      b: Math.PI,
      c: Promise.reject(rejection),
    })

    expect(status1.isRejected()).toBe(false)
    expect(status2.isRejected()).toBe(false)
    expect(status3.isRejected()).toBe(true)

    expect(status1.isFulfilled()).toBe(true)
    expect(status2.isFulfilled()).toBe(true)
    expect(status3.isFulfilled()).toBe(false)

    expect(status1.value()).toBe(42)
    expect(status2.value()).toBe(Math.PI)
    expect(::status3.value).toThrow()

    expect(::status1.reason).toThrow()
    expect(::status2.reason).toThrow()
    expect(status3.reason()).toBe(rejection)
  })
})
