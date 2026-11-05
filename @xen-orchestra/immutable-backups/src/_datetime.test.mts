import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractDatetime, parseDatetime } from './_datetime.mjs'

describe('extractDatetime', () => {
  it('extracts datetime with Z suffix from a .json filename', () => {
    assert.strictEqual(extractDatetime('20231215T142030Z.json'), '20231215T142030Z')
  })

  it('extracts datetime without Z suffix', () => {
    assert.strictEqual(extractDatetime('20231215T142030.json'), '20231215T142030')
  })

  it('extracts datetime from a .alias.vhd filename', () => {
    assert.strictEqual(extractDatetime('20231215T142030Z.alias.vhd'), '20231215T142030Z')
  })

  it('returns undefined for cache.json.gz (no datetime prefix)', () => {
    assert.strictEqual(extractDatetime('cache.json.gz'), undefined)
  })

  it('returns undefined for plain metadata.json', () => {
    assert.strictEqual(extractDatetime('metadata.json'), undefined)
  })
})

describe('parseDatetime', () => {
  it('parses a UTC datetime (Z suffix) correctly', () => {
    const ts = parseDatetime('20231215T142030Z')
    assert.ok(ts !== undefined)
    const d = new Date(ts)
    assert.strictEqual(d.getUTCFullYear(), 2023)
    assert.strictEqual(d.getUTCMonth(), 11) // December = 11
    assert.strictEqual(d.getUTCDate(), 15)
    assert.strictEqual(d.getUTCHours(), 14)
    assert.strictEqual(d.getUTCMinutes(), 20)
    assert.strictEqual(d.getUTCSeconds(), 30)
  })

  it('treats a datetime without Z suffix as UTC', () => {
    const withZ = parseDatetime('20231215T142030Z')
    const withoutZ = parseDatetime('20231215T142030')
    assert.strictEqual(withZ, withoutZ)
  })

  it('returns undefined for an empty string', () => {
    assert.strictEqual(parseDatetime(''), undefined)
  })

  it('returns undefined for a plain date (no time part)', () => {
    assert.strictEqual(parseDatetime('20231215'), undefined)
  })

  it('returns undefined for a random string', () => {
    assert.strictEqual(parseDatetime('cache.json.gz'), undefined)
  })

  it('returns a timestamp in the past for an old date', () => {
    const ts = parseDatetime('20200101T000000Z')
    assert.ok(ts !== undefined)
    assert.ok(ts < Date.now(), 'Jan 2020 must be in the past')
  })
})
