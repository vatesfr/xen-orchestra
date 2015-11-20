/* eslint-env mocha */

import expect from 'must'
import sinon from 'sinon'

// ===================================================================

import {
  camelToSnakeCase,
  createRawObject,
  ensureArray,
  extractProperty,
  formatXml,
  generateToken,
  parseSize,
  pFinally,
  pSettle
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

describe('createRawObject()', () => {
  it('returns an object', () => {
    expect(createRawObject()).to.be.an.object()
  })

  it('returns an empty object', () => {
    expect(createRawObject()).to.be.empty()
  })

  it('creates a new object each time', () => {
    expect(createRawObject()).to.not.equal(createRawObject())
  })

  if (Object.getPrototypeOf) {
    it('creates an object without a prototype', () => {
      expect(Object.getPrototypeOf(createRawObject())).to.be.null()
    })
  }
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

// -------------------------------------------------------------------

describe('pFinally()', () => {
  it('calls a callback on resolution', async () => {
    const value = {}
    const spy = sinon.spy()

    await expect(
      Promise.resolve(value)::pFinally(spy)
    ).to.resolve.to.equal(
      value
    )

    expect(spy.callCount).to.equal(1)
  })

  it('calls a callback on rejection', async () => {
    const reason = {}
    const spy = sinon.spy()

    await expect(
      Promise.reject(reason)::pFinally(spy)
    ).to.reject.to.equal(
      reason
    )

    expect(spy.callCount).to.equal(1)
  })
})

// -------------------------------------------------------------------

describe('pSettle()', () => {
  it('works with arrays', async () => {
    const [
      status1,
      status2,
      status3
    ] = await pSettle([
      Promise.resolve(42),
      Math.PI,
      Promise.reject('fatality')
    ])

    expect(status1.isRejected()).to.equal(false)
    expect(status2.isRejected()).to.equal(false)
    expect(status3.isRejected()).to.equal(true)

    expect(status1.isFulfilled()).to.equal(true)
    expect(status2.isFulfilled()).to.equal(true)
    expect(status3.isFulfilled()).to.equal(false)

    expect(status1.value()).to.equal(42)
    expect(status2.value()).to.equal(Math.PI)
    expect(::status3.value).to.throw()

    expect(::status1.reason).to.throw()
    expect(::status2.reason).to.throw()
    expect(status3.reason()).to.equal('fatality')
  })

  it('works with objects', async () => {
    const {
      a: status1,
      b: status2,
      c: status3
    } = await pSettle({
      a: Promise.resolve(42),
      b: Math.PI,
      c: Promise.reject('fatality')
    })

    expect(status1.isRejected()).to.equal(false)
    expect(status2.isRejected()).to.equal(false)
    expect(status3.isRejected()).to.equal(true)

    expect(status1.isFulfilled()).to.equal(true)
    expect(status2.isFulfilled()).to.equal(true)
    expect(status3.isFulfilled()).to.equal(false)

    expect(status1.value()).to.equal(42)
    expect(status2.value()).to.equal(Math.PI)
    expect(::status3.value).to.throw()

    expect(::status1.reason).to.throw()
    expect(::status2.reason).to.throw()
    expect(status3.reason()).to.equal('fatality')
  })
})
