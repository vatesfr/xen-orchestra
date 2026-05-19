import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { getProxyDispatcher, resetProxyCache } from './proxy.mjs'

describe('getProxyDispatcher', () => {
  beforeEach(() => {
    resetProxyCache()
  })

  afterEach(() => {
    resetProxyCache()
  })

  it('returns the same instance across calls (singleton)', () => {
    assert.strictEqual(getProxyDispatcher(), getProxyDispatcher())
  })
})
