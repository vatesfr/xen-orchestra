import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatBytes, markdownTable } from './format-utils.mjs'

describe('formatBytes', () => {
  it('formats zero', () => {
    assert.strictEqual(formatBytes(0), '0 B')
  })

  it('formats null and undefined', () => {
    assert.strictEqual(formatBytes(null), '0 B')
    assert.strictEqual(formatBytes(undefined), '0 B')
  })

  it('formats bytes', () => {
    assert.strictEqual(formatBytes(512), '512 B')
  })

  it('formats kilobytes', () => {
    assert.strictEqual(formatBytes(1024), '1.0 KB')
  })

  it('formats megabytes', () => {
    assert.strictEqual(formatBytes(1048576), '1.0 MB')
  })

  it('formats gigabytes', () => {
    assert.strictEqual(formatBytes(1073741824), '1.0 GB')
    assert.strictEqual(formatBytes(17179869184), '16.0 GB')
  })

  it('formats terabytes', () => {
    assert.strictEqual(formatBytes(1099511627776), '1.0 TB')
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
    assert.ok(result.includes('| Name |'))
    assert.ok(result.includes('| --- |'))
    const lines = result.split('\n')
    assert.strictEqual(lines.length, 2)
  })
})
