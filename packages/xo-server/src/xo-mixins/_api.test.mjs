import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { checkParams } from './api.mjs'

const isInvalidParameters = error => error.code === 10 && /forbidden key/.test(error.message)

describe('checkParams()', () => {
  it('renames ignorable (?-suffixed) params', () => {
    const params = JSON.parse('{"foo?": 1, "bar": 2}')
    checkParams({}, params)
    assert.deepEqual(params, { foo: 1, bar: 2 })
  })

  it('refuses `__proto__?` instead of replacing the prototype of params', () => {
    const params = JSON.parse('{"__proto__?": {"email": "admin@example.org"}}')
    assert.throws(() => checkParams({}, params), isInvalidParameters)
    assert.equal(Object.getPrototypeOf(params), Object.prototype)
    assert.equal(params.email, undefined)
  })

  it('refuses an own `__proto__` param', () => {
    const params = JSON.parse('{"__proto__": {"email": "admin@example.org"}}')
    assert.throws(() => checkParams({}, params), isInvalidParameters)
  })
})
