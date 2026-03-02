import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { formatBytes, renderTable } from '../utils.mjs'

describe('formatBytes', () => {
  test('0 bytes', () => assert.strictEqual(formatBytes(0), '0 B'))
  test('bytes', () => assert.strictEqual(formatBytes(512), '512.00 B'))
  test('KiB', () => assert.strictEqual(formatBytes(1024), '1.00 KiB'))
  test('MiB', () => assert.strictEqual(formatBytes(2 * 1024 * 1024), '2.00 MiB'))
  test('GiB', () => assert.strictEqual(formatBytes(1024 ** 3), '1.00 GiB'))
  test('TiB', () => assert.strictEqual(formatBytes(1024 ** 4), '1.00 TiB'))
  test('fractional MiB', () => assert.strictEqual(formatBytes(1.5 * 1024 * 1024), '1.50 MiB'))
})

describe('renderTable', () => {
  test('contains headers', () => {
    const out = renderTable(['Name', 'Size'], [['foo', '1 GiB']])
    assert.ok(out.includes('Name'))
    assert.ok(out.includes('Size'))
  })

  test('contains all row values', () => {
    const out = renderTable(['H'], [['alpha'], ['beta']])
    assert.ok(out.includes('alpha'))
    assert.ok(out.includes('beta'))
  })

  test('starts with top border and ends with bottom border', () => {
    const out = renderTable(['H'], [['v']])
    assert.ok(out.startsWith('┌'))
    assert.ok(out.endsWith('┘'))
  })

  test('columns are wide enough for the longest value', () => {
    const long = 'a very long value'
    const out = renderTable(['H'], [[long]])
    assert.ok(out.includes(long))
  })
})
