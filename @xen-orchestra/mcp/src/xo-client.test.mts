import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { XoClient } from './xo-client.mjs'
import { resetProxyCache, snapshotProxyEnv } from './utils/proxy.mjs'

describe('XoClient', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('constructor', () => {
    it('strips trailing slash from URL', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000/', username: 'admin', password: 'pass' })
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(!url.includes('9000//'), 'URL should not have double slashes')
        return new Response('ok')
      }
      await client.testConnection()
    })

    it('creates correct Basic Auth header', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>
        const expected = Buffer.from('admin:pass').toString('base64')
        assert.strictEqual(headers?.Authorization, `Basic ${expected}`)
        return new Response('ok')
      }
      await client.testConnection()
    })

    it('creates correct cookie header for token auth', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', token: 'my-token' })
      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>
        assert.strictEqual(headers?.cookie, 'authenticationToken=my-token')
        return new Response('ok')
      }
      await client.testConnection()
    })
  })

  describe('fetch', () => {
    it('prepends /rest/v0 to endpoints', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('/rest/v0/'))
        return new Response('ok')
      }
      await client.testConnection()
    })

    it('throws descriptive error on connection refused', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async () => {
        throw new TypeError('fetch failed: ECONNREFUSED')
      }
      const result = await client.testConnection()
      assert.strictEqual(result.ok, false)
      assert.ok(result.error?.includes('Cannot connect to XO server'))
    })

    it('throws descriptive error on 401 with basic auth', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'wrong' })
      globalThis.fetch = async () => new Response('Unauthorized', { status: 401 })
      await assert.rejects(() => client.apiRequest('GET', '/vms'), {
        message: /check XO_USERNAME and XO_PASSWORD/,
      })
    })

    it('throws descriptive error on 401 with token auth', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', token: 'expired' })
      globalThis.fetch = async () => new Response('Unauthorized', { status: 401 })
      await assert.rejects(() => client.apiRequest('GET', '/vms'), {
        message: /check XO_TOKEN/,
      })
    })

    it('throws error with status code on other HTTP errors', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async () => new Response('Not Found', { status: 404, statusText: 'Not Found' })
      await assert.rejects(() => client.apiRequest('GET', '/vms'), { message: /404/ })
    })

    it('sets AbortSignal timeout on requests', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        assert.ok(init?.signal, 'Request should have an abort signal')
        return new Response('ok')
      }
      await client.testConnection()
    })
  })

  describe('testConnection', () => {
    it('returns { ok: true } on successful connection', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async () => new Response('ok')
      const result = await client.testConnection()
      assert.deepStrictEqual(result, { ok: true })
    })

    it('returns { ok: false, error } on connection failure', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async () => {
        throw new Error('ECONNREFUSED')
      }
      const result = await client.testConnection()
      assert.strictEqual(result.ok, false)
      assert.ok(result.error)
    })
  })

  describe('proxy handling', () => {
    let restoreProxyEnv: () => void

    beforeEach(() => {
      restoreProxyEnv = snapshotProxyEnv()
      resetProxyCache()
    })

    afterEach(() => {
      restoreProxyEnv()
      resetProxyCache()
    })

    const captureInit = () => {
      let captured: RequestInit | undefined
      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        captured = init
        return new Response('ok')
      }
      return () => captured
    }

    it('passes no dispatcher when no proxy env var is set', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      const getInit = captureInit()
      await client.testConnection()
      const init = getInit() as (RequestInit & { dispatcher?: unknown }) | undefined
      assert.strictEqual(init?.dispatcher, undefined)
    })

    it('passes a dispatcher when HTTP_PROXY is set', async () => {
      process.env.HTTP_PROXY = 'http://proxy.example.com:8080'
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      const getInit = captureInit()
      await client.testConnection()
      const init = getInit() as (RequestInit & { dispatcher?: unknown }) | undefined
      assert.ok(init?.dispatcher, 'dispatcher should be defined when HTTP_PROXY is set')
    })

    it('passes a dispatcher when only HTTPS_PROXY is set', async () => {
      process.env.HTTPS_PROXY = 'http://proxy.example.com:8080'
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      const getInit = captureInit()
      await client.testConnection()
      const init = getInit() as (RequestInit & { dispatcher?: unknown }) | undefined
      assert.ok(init?.dispatcher, 'dispatcher should be defined when HTTPS_PROXY is set')
    })
  })

  describe('apiRequest', () => {
    it('serializes query params and sends them on the URL', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('fields=id%2Cname_label'))
        assert.ok(url.includes('markdown=true'))
        assert.ok(url.includes('filter=power_state%3ARunning'))
        return new Response('| id | name_label |', { headers: { 'content-type': 'text/markdown' } })
      }
      const result = await client.apiRequest('GET', '/vms', {
        query: { fields: 'id,name_label', markdown: 'true', filter: 'power_state:Running' },
      })
      assert.strictEqual(result, '| id | name_label |')
    })

    it('parses JSON responses', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ id: 'vm1' }), { headers: { 'content-type': 'application/json' } })
      const result = await client.apiRequest('GET', '/vms/vm1')
      assert.deepStrictEqual(result, { id: 'vm1' })
    })

    it('sends a JSON body when provided', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        assert.strictEqual(init?.method, 'POST')
        assert.strictEqual((init?.headers as Record<string, string>)['Content-Type'], 'application/json')
        assert.strictEqual(init?.body, JSON.stringify({ name: 'new' }))
        return new Response('{}', { headers: { 'content-type': 'application/json' } })
      }
      await client.apiRequest('POST', '/vms', { body: { name: 'new' } })
    })
  })
})
