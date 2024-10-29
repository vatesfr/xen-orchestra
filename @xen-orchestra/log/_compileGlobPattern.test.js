'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict

const compileGlobPattern = require('./_compileGlobPattern.js')

describe('compileGlobPattern()', () => {
  it('works', () => {
    const re = compileGlobPattern('foo, ba*, -bar')
    assert.strictEqual(re.test('foo'), true)
    assert.strictEqual(re.test('bar'), false)
    assert.strictEqual(re.test('baz'), true)
    assert.strictEqual(re.test('qux'), false)
  })
})
