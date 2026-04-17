import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { XoClient } from './xo-client.mjs'

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
      await assert.rejects(
        () =>
          client.testConnection().then(r => {
            if (!r.ok) throw new Error(r.error)
          }),
        {
          message: /Cannot connect to XO server/,
        }
      )
    })

    it('throws descriptive error on 401 with basic auth', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'wrong' })
      globalThis.fetch = async () => new Response('Unauthorized', { status: 401 })
      await assert.rejects(() => client.getMarkdown('/vms', '*'), {
        message: /check XO_USERNAME and XO_PASSWORD/,
      })
    })

    it('throws descriptive error on 401 with token auth', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', token: 'expired' })
      globalThis.fetch = async () => new Response('Unauthorized', { status: 401 })
      await assert.rejects(() => client.getMarkdown('/vms', '*'), {
        message: /check XO_TOKEN/,
      })
    })

    it('throws error with status code on other HTTP errors', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async () => new Response('Not Found', { status: 404, statusText: 'Not Found' })
      await assert.rejects(() => client.getMarkdown('/vms', '*'), { message: /404/ })
    })

    it('throws timeout error', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async () => {
        throw new Error('TimeoutError: signal timed out')
      }
      await assert.rejects(() => client.getMarkdown('/vms', '*'), { message: /timed out/ })
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

  describe('getMarkdown', () => {
    it('sends fields and markdown=true params', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('fields=id%2Cname_label'))
        assert.ok(url.includes('markdown=true'))
        return new Response('| id | name_label |')
      }
      const result = await client.getMarkdown('/vms', 'id,name_label')
      assert.strictEqual(result, '| id | name_label |')
    })

    it('uses default fields when none provided', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('fields=id%2Cpower_state'))
        return new Response('table')
      }
      await client.getMarkdown('/vms', 'id,power_state')
    })

    it('overrides default fields with custom fields', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('fields=name_label'))
        return new Response('table')
      }
      await client.getMarkdown('/vms', 'id,power_state', { fields: 'name_label' })
    })

    it('passes filter and limit', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('filter=power_state'))
        assert.ok(url.includes('limit=5'))
        return new Response('table')
      }
      await client.getMarkdown('/vms', '*', { filter: 'power_state:Running', limit: 5 })
    })
  })
})
