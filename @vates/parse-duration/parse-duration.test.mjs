import { describe, it } from 'node:test'
import { parseDuration } from '@vates/parse-duration'
import assert from 'node:assert/strict'

describe('parseDuration()', () => {
  it('should parse string', () => {
    const input = '2 days'
    const expected = 172800000
    assert.strictEqual(parseDuration(input), expected)
  })

  it('should return its input if already a number', () => {
    const input = 172800000
    assert.strictEqual(parseDuration(input), input)
  })

  for (const input of [undefined, '', 'invalid duration']) {
    it('should throw an error for ' + input, () => {
      assert.throws(() => parseDuration(input), { message: `not a valid duration: ${input}` })
    })
  }
})
