import assert from 'node:assert/strict'
import { describe, it, afterEach } from 'node:test'
import { Response } from 'undici'
import { setFetch, type FetchFn } from './utils/proxy.mjs'
import { XoClient } from './xo-client.mjs'

describe('XoClient', () => {
  let restoreFetch: () => void = () => {}

  // `XoClient` passes an undici dispatcher, so it calls undici's `fetch` rather
  // than the global one: substituting it goes through `setFetch`.
  function stubFetch(impl: FetchFn) {
    restoreFetch()
    restoreFetch = setFetch(impl)
  }

  afterEach(() => {
    restoreFetch()
    restoreFetch = () => {}
  })

  describe('constructor', () => {
    it('strips trailing slash from URL', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000/', username: 'admin', password: 'pass' })
      stubFetch(async input => {
        const url = input.toString()
        assert.ok(!url.includes('9000//'), 'URL should not have double slashes')
        return new Response('ok')
      })
      await client.testConnection()
    })

    it('creates correct Basic Auth header', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async (_input, init) => {
        const headers = init?.headers as Record<string, string>
        const expected = Buffer.from('admin:pass').toString('base64')
        assert.strictEqual(headers?.Authorization, `Basic ${expected}`)
        return new Response('ok')
      })
      await client.testConnection()
    })

    it('creates correct cookie header for token auth', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', token: 'my-token' })
      stubFetch(async (_input, init) => {
        const headers = init?.headers as Record<string, string>
        assert.strictEqual(headers?.cookie, 'authenticationToken=my-token')
        return new Response('ok')
      })
      await client.testConnection()
    })

    it('sends X-XO-Client: mcp on every request', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', token: 'my-token' })
      stubFetch(async (_input, init) => {
        const headers = init?.headers as Record<string, string>
        assert.strictEqual(headers?.['X-XO-Client'], 'mcp')
        return new Response('ok')
      })
      await client.testConnection()
    })
  })

  describe('fetch', () => {
    it('prepends /rest/v0 to endpoints', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async input => {
        assert.ok(input.toString().includes('/rest/v0/'))
        return new Response('ok')
      })
      await client.testConnection()
    })

    it('throws descriptive error on connection refused', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async () => {
        throw new TypeError('fetch failed: ECONNREFUSED')
      })
      const result = await client.testConnection()
      assert.strictEqual(result.ok, false)
      assert.ok(result.error?.includes('Cannot connect to XO server'))
    })

    it('throws descriptive error on 401 with basic auth', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'wrong' })
      stubFetch(async () => new Response('Unauthorized', { status: 401 }))
      await assert.rejects(() => client.apiRequest('GET', '/vms'), {
        message: /check XO_USERNAME and XO_PASSWORD/,
      })
    })

    it('throws descriptive error on 401 with token auth', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', token: 'expired' })
      stubFetch(async () => new Response('Unauthorized', { status: 401 }))
      await assert.rejects(() => client.apiRequest('GET', '/vms'), {
        message: /check XO_TOKEN/,
      })
    })

    it('throws error with status code on other HTTP errors', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async () => new Response('Not Found', { status: 404, statusText: 'Not Found' }))
      await assert.rejects(() => client.apiRequest('GET', '/vms'), { message: /404/ })
    })

    it('sets AbortSignal timeout on requests', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async (_input, init) => {
        assert.ok(init?.signal, 'Request should have an abort signal')
        return new Response('ok')
      })
      await client.testConnection()
    })
  })

  describe('testConnection', () => {
    it('returns { ok: true } on successful connection', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async () => new Response('ok'))
      const result = await client.testConnection()
      assert.deepStrictEqual(result, { ok: true })
    })

    it('returns { ok: false, error } on connection failure', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async () => {
        throw new Error('ECONNREFUSED')
      })
      const result = await client.testConnection()
      assert.strictEqual(result.ok, false)
      assert.ok(result.error)
    })
  })

  describe('apiRequest', () => {
    it('serializes query params and sends them on the URL', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async input => {
        const url = input.toString()
        assert.ok(url.includes('fields=id%2Cname_label'))
        assert.ok(url.includes('markdown=true'))
        assert.ok(url.includes('filter=power_state%3ARunning'))
        return new Response('| id | name_label |', { headers: { 'content-type': 'text/markdown' } })
      })
      const result = await client.apiRequest('GET', '/vms', {
        query: { fields: 'id,name_label', markdown: 'true', filter: 'power_state:Running' },
      })
      assert.strictEqual(result, '| id | name_label |')
    })

    it('parses JSON responses', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(
        async () => new Response(JSON.stringify({ id: 'vm1' }), { headers: { 'content-type': 'application/json' } })
      )
      const result = await client.apiRequest('GET', '/vms/vm1')
      assert.deepStrictEqual(result, { id: 'vm1' })
    })

    it('sends a JSON body when provided', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      stubFetch(async (_input, init) => {
        assert.strictEqual(init?.method, 'POST')
        assert.strictEqual((init?.headers as Record<string, string>)['Content-Type'], 'application/json')
        assert.strictEqual(init?.body, JSON.stringify({ name: 'new' }))
        return new Response('{}', { headers: { 'content-type': 'application/json' } })
      })
      await client.apiRequest('POST', '/vms', { body: { name: 'new' } })
    })
  })
})
