/* eslint-env jest */

const { parseDateTime } = require('./')

describe('parseDateTime()', () => {
  it('parses legacy XAPI format', () => {
    expect(parseDateTime('20220106T21:25:15Z')).toBe(1641504315000)
  })

  it('parses ISO 8601 with millisconds format', () => {
    expect(parseDateTime('2022-01-06T17:32:35.000Z')).toBe(1641490355000)
  })

  it('throws when value cannot be parsed', () => {
    expect(() => parseDateTime('foo bar')).toThrow('unable to parse XAPI datetime "foo bar"')
  })
})
