import assert from 'assert/strict'
import test from 'node:test'

import { getProxyTargetUrl } from './_getProxyTargetUrl.mjs'

const { describe, it } = test

describe('getProxyTargetUrl()', () => {
  it('keeps localhost untouched when no hostname is configured', () => {
    const { targetUrl, isLocal } = getProxyTargetUrl('http://localhost:9004', 'http:', { port: 80 })
    assert.equal(targetUrl.href, 'http://localhost:9004/')
    assert.equal(isLocal, true)
  })

  // regression test: with the shipped XOA config (hostname = '0.0.0.0'), the
  // target must not be rewritten to an unroutable address nor become eligible
  // for the HTTP proxy agent
  it('keeps localhost untouched when the listen hostname is a wildcard', () => {
    for (const hostname of ['0.0.0.0', '::']) {
      const { targetUrl, isLocal } = getProxyTargetUrl('http://localhost:9004', 'http:', { hostname, port: 443 })
      assert.equal(targetUrl.href, 'http://localhost:9004/')
      assert.equal(isLocal, true)
    }
  })

  it('rewrites localhost to a specific listen hostname, still marked local', () => {
    const { targetUrl, isLocal } = getProxyTargetUrl('http://localhost:9004', 'http:', {
      hostname: '192.168.1.5',
      port: 443,
    })
    assert.equal(targetUrl.href, 'http://192.168.1.5:9004/')
    assert.equal(isLocal, true)
  })

  it('leaves non-localhost targets alone and marks them non-local', () => {
    const { targetUrl, isLocal } = getProxyTargetUrl('http://metrics.lan:1234/foo', 'http:', {
      hostname: '192.168.1.5',
      port: 443,
    })
    assert.equal(targetUrl.href, 'http://metrics.lan:1234/foo')
    assert.equal(isLocal, false)
  })

  it('substitutes [port] and [protocol], upgrading the protocol on secure configs', () => {
    const { targetUrl } = getProxyTargetUrl('[protocol]//localhost:[port]/api', 'http:', {
      hostname: '0.0.0.0',
      port: 8443,
      key: 'dummy',
    })
    assert.equal(targetUrl.href, 'https://localhost:8443/api')
  })

  it('upgrades ws to wss on secure configs', () => {
    const { targetUrl } = getProxyTargetUrl('[protocol]//localhost:[port]/api', 'ws:', {
      hostname: '10.0.0.1',
      port: 8443,
      key: 'dummy',
    })
    assert.equal(targetUrl.href, 'wss://10.0.0.1:8443/api')
  })

  it('does not upgrade the protocol when it is not dynamic', () => {
    const { targetUrl } = getProxyTargetUrl('ws://localhost:9001', 'ws:', { hostname: '0.0.0.0', port: 443, key: 'k' })
    assert.equal(targetUrl.href, 'ws://localhost:9001/')
  })
})
