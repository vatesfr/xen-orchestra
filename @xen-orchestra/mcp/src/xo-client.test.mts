import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { XoClient } from './xo-client.mjs'

// Helper to create a mock Response
function mockResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

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
        assert.ok(url.startsWith('http://xo.local:9000/rest/v0/'), 'URL should start with base URL + /rest/v0/')
        return mockResponse([])
      }
      await client.listPools()
    })

    it('creates correct Basic Auth header', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'secret' })
      const expected = `Basic ${Buffer.from('admin:secret').toString('base64')}`

      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>
        assert.strictEqual(headers?.Authorization, expected)
        return mockResponse([])
      }
      await client.listPools()
    })
  })

  describe('request', () => {
    it('prepends /rest/v0 to endpoints', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('/rest/v0/pools'), `URL should contain /rest/v0/pools, got: ${url}`)
        return mockResponse([])
      }
      await client.listPools()
    })

    it('sends Accept: application/json header', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = init?.headers as Record<string, string>
        assert.strictEqual(headers?.Accept, 'application/json')
        return mockResponse([])
      }
      await client.listPools()
    })

    it('throws descriptive error on connection refused', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async () => {
        throw new TypeError('fetch failed: ECONNREFUSED')
      }
      await assert.rejects(() => client.listPools(), {
        message: /Cannot connect to XO server/,
      })
    })

    it('preserves original error as cause', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })
      const originalError = new TypeError('fetch failed: ECONNREFUSED')

      globalThis.fetch = async () => {
        throw originalError
      }
      try {
        await client.listPools()
        assert.fail('Should have thrown')
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.strictEqual(error.cause, originalError)
      }
    })

    it('throws descriptive error on 401', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'wrong' })

      globalThis.fetch = async () => {
        return new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' })
      }
      await assert.rejects(() => client.listPools(), {
        message: /Authentication failed/,
      })
    })

    it('throws error with status code on other HTTP errors', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async () => {
        return new Response('Not Found', { status: 404, statusText: 'Not Found' })
      }
      await assert.rejects(() => client.listPools(), {
        message: /404/,
      })
    })

    it('throws network error with message', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async () => {
        throw new Error('DNS resolution failed')
      }
      await assert.rejects(() => client.listPools(), {
        message: /Network error.*DNS resolution failed/,
      })
    })

    it('throws on invalid JSON response with cause', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async () => {
        return new Response('not-json', { status: 200, headers: { 'content-type': 'text/plain' } })
      }
      try {
        await client.listPools()
        assert.fail('Should have thrown')
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.ok(error.message.includes('invalid JSON'))
        assert.ok(error.cause !== undefined, 'Should preserve JSON parse error as cause')
      }
    })

    it('sets AbortSignal timeout on requests', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
        assert.ok(init?.signal, 'Request should have an abort signal')
        return mockResponse([])
      }
      await client.listPools()
    })
  })

  describe('testConnection', () => {
    it('returns { ok: true } on successful connection', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async () => mockResponse([{ id: 'pool1' }])
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
      assert.ok(result.error!.includes('Cannot connect'))
    })
  })

  describe('listPools', () => {
    it('returns pools with default fields', async () => {
      const pools = [{ id: 'pool1', name_label: 'Pool 1' }]
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('fields=id%2Cname_label%2Cname_description%2Cauto_poweron%2CHA_enabled'))
        return mockResponse(pools)
      }
      const result = await client.listPools()
      assert.deepStrictEqual(result, pools)
    })

    it('passes custom fields', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('fields=id%2Cname_label'))
        return mockResponse([])
      }
      await client.listPools('id,name_label')
    })
  })

  describe('listHosts', () => {
    it('returns hosts with default fields', async () => {
      const hosts = [{ id: 'host1', name_label: 'Host 1' }]
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async () => mockResponse(hosts)
      const result = await client.listHosts()
      assert.deepStrictEqual(result, hosts)
    })

    it('passes filter parameter via object', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('filter=productBrand'))
        return mockResponse([])
      }
      await client.listHosts({ filter: 'productBrand:XCP-ng' })
    })
  })

  describe('listVms', () => {
    it('returns VMs with default fields', async () => {
      const vms = [{ id: 'vm1', name_label: 'VM 1', power_state: 'Running' }]
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async () => mockResponse(vms)
      const result = await client.listVms()
      assert.deepStrictEqual(result, vms)
    })

    it('passes filter, fields, and limit via object', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('filter=power_state'))
        assert.ok(url.includes('limit=10'))
        return mockResponse([])
      }
      await client.listVms({ filter: 'power_state:Running', fields: 'id,name_label', limit: 10 })
    })

    it('passes limit=0 correctly', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('limit=0'), 'limit=0 should be included in URL')
        return mockResponse([])
      }
      await client.listVms({ limit: 0 })
    })
  })

  describe('getVm', () => {
    it('returns VM details', async () => {
      const vm = { id: 'vm1', name_label: 'VM 1', power_state: 'Running' }
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('/vms/vm1'))
        return mockResponse(vm)
      }
      const result = await client.getVm('vm1')
      assert.deepStrictEqual(result, vm)
    })

    it('encodes special characters in VM ID', async () => {
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('/vms/vm%2Fspecial'), `URL should encode slash: ${url}`)
        return mockResponse({ id: 'vm/special', name_label: 'Special', power_state: 'Running' })
      }
      await client.getVm('vm/special')
    })
  })

  describe('getPoolDashboard', () => {
    it('returns dashboard data', async () => {
      const dashboard = { hostsByStatus: { running: 2 }, vmsByStatus: { running: 10 } }
      const client = new XoClient({ url: 'http://xo.local:9000', username: 'admin', password: 'pass' })

      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        assert.ok(url.includes('/pools/pool1/dashboard'))
        assert.ok(url.includes('ndjson=false'))
        return mockResponse(dashboard)
      }
      const result = await client.getPoolDashboard('pool1')
      assert.deepStrictEqual(result, dashboard)
    })
  })
})
