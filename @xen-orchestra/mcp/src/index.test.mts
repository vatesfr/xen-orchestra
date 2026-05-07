import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { validateProxyEnv } from './index.mjs'
import { snapshotProxyEnv } from './utils/proxy.mjs'

describe('validateProxyEnv', () => {
  let restoreEnv: () => void
  let messages: string[]
  const emit = (msg: string) => messages.push(msg)

  beforeEach(() => {
    restoreEnv = snapshotProxyEnv()
    messages = []
  })

  afterEach(() => {
    restoreEnv()
  })

  it('emits nothing when no proxy env var is set', () => {
    validateProxyEnv(emit)
    assert.deepStrictEqual(messages, [])
  })

  it('emits nothing for a valid HTTP_PROXY URL', () => {
    process.env.HTTP_PROXY = 'http://proxy.example.com:8080'
    validateProxyEnv(emit)
    assert.deepStrictEqual(messages, [])
  })

  it('emits nothing for a valid HTTPS_PROXY URL with credentials', () => {
    process.env.HTTPS_PROXY = 'http://user:pass@proxy.example.com:8080'
    validateProxyEnv(emit)
    assert.deepStrictEqual(messages, [])
  })

  it('warns when HTTP_PROXY is not parseable as a URL', () => {
    process.env.HTTP_PROXY = 'this is not a url'
    validateProxyEnv(emit)
    assert.strictEqual(messages.length, 1)
    assert.match(messages[0], /HTTP_PROXY does not look like a valid URL/)
  })

  it('warns on unsupported scheme (proxy: pseudo-scheme)', () => {
    process.env.HTTP_PROXY = 'proxy:8080'
    validateProxyEnv(emit)
    assert.strictEqual(messages.length, 1)
    assert.match(messages[0], /unsupported scheme/)
  })

  it('warns on unsupported scheme (file://)', () => {
    process.env.HTTPS_PROXY = 'file:///etc/passwd'
    validateProxyEnv(emit)
    assert.strictEqual(messages.length, 1)
    assert.match(messages[0], /HTTPS_PROXY uses unsupported scheme/)
  })

  it('warns when NO_PROXY is set without any proxy variable', () => {
    process.env.NO_PROXY = 'xoa.internal,*.local'
    validateProxyEnv(emit)
    assert.strictEqual(messages.length, 1)
    assert.match(messages[0], /NO_PROXY is set but neither HTTP_PROXY nor HTTPS_PROXY is/)
  })

  it('does not warn when NO_PROXY accompanies a proxy variable', () => {
    process.env.HTTP_PROXY = 'http://proxy.example.com:8080'
    process.env.NO_PROXY = 'xoa.internal'
    validateProxyEnv(emit)
    assert.deepStrictEqual(messages, [])
  })

  it('honours lowercase env vars', () => {
    process.env.http_proxy = 'this is not a url'
    validateProxyEnv(emit)
    assert.strictEqual(messages.length, 1)
    assert.match(messages[0], /HTTP_PROXY does not look like a valid URL/)
  })

  it('prefers lowercase over UPPERCASE when both set (matches undici precedence)', () => {
    process.env.http_proxy = 'http://valid.example.com:8080'
    process.env.HTTP_PROXY = 'this is not a url'
    validateProxyEnv(emit)
    // We validated the lowercase value (the one undici will use), so no warning.
    assert.deepStrictEqual(messages, [])
  })

  it('treats empty string as unset', () => {
    process.env.HTTP_PROXY = ''
    process.env.NO_PROXY = ''
    validateProxyEnv(emit)
    assert.deepStrictEqual(messages, [])
  })

  it('defaults to console.error when no emit function is given', () => {
    process.env.HTTP_PROXY = 'this is not a url'
    const captured: string[] = []
    const orig = console.error
    console.error = (msg: string) => captured.push(msg)
    try {
      validateProxyEnv()
    } finally {
      console.error = orig
    }
    assert.strictEqual(captured.length, 1)
    assert.match(captured[0], /HTTP_PROXY does not look like a valid URL/)
  })
})
