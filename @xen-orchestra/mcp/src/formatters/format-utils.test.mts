import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatBytes, markdownTable } from './format-utils.mjs'

describe('formatBytes', () => {
  it('formats zero and null-ish', () => {
    assert.strictEqual(formatBytes(0), '0 B')
    assert.strictEqual(formatBytes(null), '0 B')
    assert.strictEqual(formatBytes(undefined), '0 B')
  })

  it('uses binary scale (KiB/MiB/GiB)', () => {
    assert.strictEqual(formatBytes(512), '512.0 B')
    assert.strictEqual(formatBytes(1024), '1.0 KiB')
    assert.strictEqual(formatBytes(1048576), '1.0 MiB')
    assert.strictEqual(formatBytes(1073741824), '1.0 GiB')
    assert.strictEqual(formatBytes(17179869184), '16.0 GiB')
    assert.strictEqual(formatBytes(1099511627776), '1.0 TiB')
  })
})

describe('markdownTable', () => {
  it('creates a valid markdown table', () => {
    const result = markdownTable(
      ['Name', 'Value'],
      [
        ['a', '1'],
        ['b', '2'],
      ]
    )
    assert.ok(result.includes('| Name | Value |'))
    assert.ok(result.includes('| --- | --- |'))
    assert.ok(result.includes('| a | 1 |'))
    assert.ok(result.includes('| b | 2 |'))
  })

  it('handles empty rows', () => {
    const result = markdownTable(['Name'], [])
    const lines = result.split('\n')
    assert.strictEqual(lines.length, 2)
  })

  it('escapes pipes and newlines in cells', () => {
    const result = markdownTable(['A|B', 'C'], [['x|y', 'line1\nline2']])
    assert.ok(result.includes('A\\|B'))
    assert.ok(result.includes('x\\|y'))
    assert.ok(result.includes('line1 line2'))
    assert.ok(!/line1\nline2/.test(result))
  })
})
