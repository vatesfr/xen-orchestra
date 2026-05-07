import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { getProxyDispatcher, resetProxyCache, snapshotProxyEnv } from './proxy.mjs'

describe('getProxyDispatcher', () => {
  let restoreEnv: () => void

  beforeEach(() => {
    restoreEnv = snapshotProxyEnv()
    resetProxyCache()
  })

  afterEach(() => {
    restoreEnv()
    resetProxyCache()
  })

  it('returns undefined when no proxy env var is set', () => {
    assert.strictEqual(getProxyDispatcher(), undefined)
  })

  it('treats an empty HTTP_PROXY as unset', () => {
    process.env.HTTP_PROXY = ''
    assert.strictEqual(getProxyDispatcher(), undefined)
  })

  it('returns a dispatcher when HTTP_PROXY is set', () => {
    process.env.HTTP_PROXY = 'http://proxy.example.com:8080'
    assert.ok(getProxyDispatcher(), 'dispatcher should be defined')
  })

  it('returns a dispatcher when only HTTPS_PROXY is set', () => {
    process.env.HTTPS_PROXY = 'http://proxy.example.com:8080'
    assert.ok(getProxyDispatcher(), 'dispatcher should be defined')
  })

  it('honours lowercase http_proxy', () => {
    process.env.http_proxy = 'http://proxy.example.com:8080'
    assert.ok(getProxyDispatcher(), 'dispatcher should be defined')
  })

  it('returns the same instance across calls (singleton)', () => {
    process.env.HTTP_PROXY = 'http://proxy.example.com:8080'
    const a = getProxyDispatcher()
    const b = getProxyDispatcher()
    assert.strictEqual(a, b)
  })

  it('re-reads env vars after resetProxyCache()', () => {
    process.env.HTTP_PROXY = 'http://proxy.example.com:8080'
    assert.ok(getProxyDispatcher())

    delete process.env.HTTP_PROXY
    resetProxyCache()
    assert.strictEqual(getProxyDispatcher(), undefined)
  })

  it('logs a warning and returns undefined when HTTP_PROXY is malformed', () => {
    process.env.HTTP_PROXY = 'this is not a url'
    const captured: string[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => captured.push(args.map(String).join(' '))
    let result: unknown
    try {
      assert.doesNotThrow(() => {
        result = getProxyDispatcher()
      })
    } finally {
      console.error = orig
    }
    assert.strictEqual(result, undefined, 'dispatcher should be undefined when construction fails')
    assert.ok(
      captured.some(msg => msg.includes('Failed to initialise proxy dispatcher')),
      `expected warning to be logged; got: ${JSON.stringify(captured)}`
    )
  })

  it('NO_PROXY alone does not produce a dispatcher', () => {
    process.env.NO_PROXY = 'localhost,*.internal'
    assert.strictEqual(getProxyDispatcher(), undefined)
  })
})
