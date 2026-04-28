import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { makeMarkdownTable } from './markdown.helper.mjs'

describe('makeMarkdownTable', () => {
  it('returns "No results." for empty array', () => {
    assert.strictEqual(makeMarkdownTable([]), 'No results.')
  })

  it('returns URLs as plain lines when given strings', () => {
    const result = makeMarkdownTable(['/rest/v0/vms/abc', '/rest/v0/vms/def'])
    assert.strictEqual(result, '/rest/v0/vms/abc\n/rest/v0/vms/def')
  })

  it('builds a markdown table from objects', () => {
    const result = makeMarkdownTable([
      { id: 'vm1', name: 'Web' },
      { id: 'vm2', name: 'DB' },
    ])
    assert.strictEqual(result, '| id | name |\n| --- | --- |\n| vm1 | Web |\n| vm2 | DB |')
  })

  it('excludes href column', () => {
    const result = makeMarkdownTable([{ id: 'vm1', name: 'Web', href: '/rest/v0/vms/vm1' }])
    assert.ok(!result.includes('href'))
    assert.ok(result.includes('id'))
    assert.ok(result.includes('vm1'))
  })

  it('escapes pipe characters in cell values', () => {
    const result = makeMarkdownTable([{ value: 'a|b' }])
    assert.ok(result.includes('a\\|b'))
  })

  it('replaces newlines in cell values with spaces', () => {
    const result = makeMarkdownTable([{ value: 'line1\nline2' }])
    assert.ok(result.includes('line1 line2'))
  })

  it('handles null and undefined values', () => {
    const result = makeMarkdownTable([{ a: null, b: undefined }])
    assert.strictEqual(result, '| a | b |\n| --- | --- |\n|  |  |')
  })

  it('handles single-item input', () => {
    const result = makeMarkdownTable([{ id: 'x' }])
    assert.strictEqual(result, '| id |\n| --- |\n| x |')
  })
})
