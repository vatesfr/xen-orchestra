import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createServer, validateEnv, fetchDocumentation } from './index.mjs'
import { createServer as createServerDirect } from './server.mjs'
import { formatToolError } from './helpers/tool-error.mjs'
import type { XoClient } from './xo-client.mjs'

const MOCK_SWAGGER_SPEC = {
  openapi: '3.0.0',
  info: { title: 'XO API', version: '1.0.0' },
  paths: {
    '/pools': { get: { tags: ['pools'], operationId: 'GetPools', summary: 'List all pools' } },
    '/pools/{id}': { get: { tags: ['pools'], operationId: 'GetPool', summary: 'Get a pool' } },
    '/vms': { get: { tags: ['vms'], operationId: 'GetVms', summary: 'List all VMs' } },
    '/vms/{id}': { get: { tags: ['vms'], operationId: 'GetVm', summary: 'Get a VM' } },
    '/vms/{id}/actions/start': { post: { tags: ['vms'], operationId: 'StartVm', summary: 'Start a VM' } },
    '/hosts': { get: { tags: ['hosts'], operationId: 'GetHosts', summary: 'List all hosts' } },
  },
}

function createMockClient(overrides: Record<string, unknown> = {}): XoClient {
  return {
    testConnection: async () => ({ ok: true }),
    apiRequest: async () => '| id | name_label |\n| --- | --- |\n| mock1 | Mock 1 |',
    getAuthHeaders: () => ({ cookie: 'authenticationToken=test' }),
    getBaseUrl: () => 'http://xo.test',
    ...overrides,
  } as unknown as XoClient
}

let originalFetch: typeof globalThis.fetch

function mockSwaggerFetch() {
  originalFetch = globalThis.fetch
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.includes('/rest/v0/docs/swagger.json')) {
      return new Response(JSON.stringify(MOCK_SWAGGER_SPEC), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    return originalFetch(input, init)
  }
}

function restoreFetch() {
  globalThis.fetch = originalFetch
}

async function setupTestServer(mockClient?: XoClient) {
  const client = mockClient ?? createMockClient()
  const server = await createServerDirect(() => client)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const mcpClient = new Client({ name: 'test-client', version: '1.0.0' })

  await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)])

  return { mcpClient, server }
}

describe('createServer (dynamic bootstrap)', () => {
  beforeEach(mockSwaggerFetch)
  afterEach(restoreFetch)

  describe('tool listing', () => {
    it('registers dynamic query tools from swagger + utility tools', async () => {
      const { mcpClient } = await setupTestServer()
      const { tools } = await mcpClient.listTools()
      const toolNames = tools.map(t => t.name).sort()

      assert.ok(toolNames.includes('pools_query'), `missing pools_query: ${toolNames.join(', ')}`)
      assert.ok(toolNames.includes('vms_query'), `missing vms_query: ${toolNames.join(', ')}`)
      assert.ok(toolNames.includes('hosts_query'), `missing hosts_query: ${toolNames.join(', ')}`)
      assert.ok(!toolNames.includes('vms_action'), `action tools should be disabled by default`)
      assert.ok(toolNames.includes('check_connection'))
      assert.ok(toolNames.includes('search_documentation'))
      assert.ok(toolNames.includes('get_infrastructure_summary'))
    })
  })

  describe('check_connection tool', () => {
    it('returns success message on good connection', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'check_connection', arguments: {} })
      const text = (result.content as Array<{ text: string }>)[0].text
      assert.ok(text.includes('successful'))
    })

    it('returns error message on failed connection', async () => {
      const mockClient = createMockClient({
        testConnection: async () => ({ ok: false, error: 'Cannot connect to XO server' }),
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({ name: 'check_connection', arguments: {} })
      const text = (result.content as Array<{ text: string }>)[0].text
      assert.ok(text.includes('failed'))
      assert.ok(text.includes('Cannot connect'))
    })
  })

  describe('dynamic query tools', () => {
    it('returns the REST API markdown body verbatim for list ops', async () => {
      const mockClient = createMockClient({
        apiRequest: async () => '| id | name_label |\n| --- | --- |\n| pool1 | Pool 1 |',
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({ name: 'pools_query', arguments: { operation: 'GetPools' } })
      const text = (result.content as Array<{ text: string }>)[0].text
      assert.ok(text.includes('Pool 1'))
    })

    it('stringifies JSON when the endpoint returns an object', async () => {
      const mockClient = createMockClient({
        apiRequest: async () => ({ id: 'vm1', name_label: 'VM 1', power_state: 'Running' }),
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({ name: 'vms_query', arguments: { operation: 'GetVm', id: 'vm1' } })
      const text = (result.content as Array<{ text: string }>)[0].text
      assert.ok(text.includes('VM 1'))
      assert.ok(text.includes('Running'))
    })

    it('passes filter, fields, limit and markdown=true through to the API', async () => {
      let received: { method?: string; path?: string; query?: Record<string, string> } = {}
      const mockClient = createMockClient({
        apiRequest: async (method: string, path: string, options?: { query?: Record<string, string> }) => {
          received = { method, path, query: options?.query }
          return ''
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      await mcpClient.callTool({
        name: 'vms_query',
        arguments: {
          operation: 'GetVms',
          filter: 'power_state:Running',
          fields: 'id,name_label',
          limit: 5,
        },
      })
      assert.strictEqual(received.query?.filter, 'power_state:Running')
      assert.strictEqual(received.query?.fields, 'id,name_label')
      assert.strictEqual(received.query?.limit, '5')
      assert.strictEqual(received.query?.markdown, 'true')
    })

    it('returns error on API failure', async () => {
      const mockClient = createMockClient({
        apiRequest: async () => {
          throw new Error('Connection refused')
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({ name: 'pools_query', arguments: { operation: 'GetPools' } })
      const text = (result.content as Array<{ text: string }>)[0].text
      assert.ok(text.includes('Failed to query'))
      assert.ok(text.includes('Connection refused'))
    })
  })

  describe('env-driven configuration', () => {
    const originalDenyList = process.env.XO_MCP_DENY_LIST

    afterEach(() => {
      if (originalDenyList === undefined) delete process.env.XO_MCP_DENY_LIST
      else process.env.XO_MCP_DENY_LIST = originalDenyList
    })

    it('XO_MCP_DENY_LIST removes operationIds from the generated enum', async () => {
      process.env.XO_MCP_DENY_LIST = 'GetVm'
      const { mcpClient } = await setupTestServer()
      const { tools } = await mcpClient.listTools()
      const vmsTool = tools.find(t => t.name === 'vms_query')!
      const schema = vmsTool.inputSchema as { properties?: { operation?: { enum?: string[] } } }
      const opEnum = schema.properties?.operation?.enum ?? []
      assert.ok(!opEnum.includes('GetVm'), `GetVm should be deny-listed; got enum: ${opEnum.join(', ')}`)
      assert.ok(opEnum.includes('GetVms'), 'GetVms should still be present')
    })
  })

  describe('get_infrastructure_summary tool', () => {
    it('returns aggregated summary as markdown', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'get_infrastructure_summary', arguments: {} })
      const text = (result.content as Array<{ text: string }>)[0].text
      assert.ok(text.includes('## Pools'))
      assert.ok(text.includes('## Hosts'))
      assert.ok(text.includes('## VMs'))
      assert.ok(text.includes('mock1'))
    })
  })

  describe('search_documentation tool', () => {
    it('fetches and returns documentation', async () => {
      const prevFetch = globalThis.fetch
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/rest/v0/docs/swagger.json')) {
          return new Response(JSON.stringify(MOCK_SWAGGER_SPEC), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        }
        if (url.includes('docs.xen-orchestra.com')) {
          return new Response('<h1>Installation Guide</h1><p>Install XO here.</p>', {
            status: 200,
            headers: { 'content-type': 'text/html' },
          })
        }
        return prevFetch(input, init)
      }

      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'search_documentation', arguments: { topic: 'installation' } })
      const text = (result.content as Array<{ text: string }>)[0].text
      assert.ok(text.includes('Installation Guide'))
      assert.ok(text.includes('Install XO here'))
    })

    it('returns error when documentation fetch fails', async () => {
      const prevFetch = globalThis.fetch
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/rest/v0/docs/swagger.json')) {
          return new Response(JSON.stringify(MOCK_SWAGGER_SPEC), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        }
        if (url.includes('docs.xen-orchestra.com')) {
          return new Response('Not Found', { status: 404, statusText: 'Not Found' })
        }
        return prevFetch(input, init)
      }

      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'search_documentation', arguments: { topic: 'installation' } })
      const text = (result.content as Array<{ text: string }>)[0].text
      assert.ok(text.includes('Failed to fetch documentation'))
    })
  })
})

describe('module structure', () => {
  beforeEach(mockSwaggerFetch)
  afterEach(restoreFetch)

  it('createServer is accessible from both index and server module', () => {
    assert.strictEqual(typeof createServer, 'function')
    assert.strictEqual(typeof createServerDirect, 'function')
  })

  it('direct server module creates server with dynamic tools', async () => {
    const client = createMockClient()
    const server = await createServerDirect(() => client)
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const mcpClient = new Client({ name: 'test-client', version: '1.0.0' })
    await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)])
    const { tools } = await mcpClient.listTools()
    assert.ok(tools.length >= 5, `expected at least 5 tools, got ${tools.length}`)
  })
})

describe('formatToolError', () => {
  it('extracts message from Error instances', () => {
    assert.strictEqual(formatToolError(new Error('test error')), 'test error')
  })

  it('returns default message for non-Error values', () => {
    assert.strictEqual(formatToolError('string error'), 'Unknown error occurred')
    assert.strictEqual(formatToolError(42), 'Unknown error occurred')
    assert.strictEqual(formatToolError(null), 'Unknown error occurred')
    assert.strictEqual(formatToolError(undefined), 'Unknown error occurred')
  })
})

describe('validateEnv', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns config when all env vars are set', () => {
    process.env.XO_URL = 'http://xo.local:9000'
    process.env.XO_USERNAME = 'admin'
    process.env.XO_PASSWORD = 'pass'
    const config = validateEnv()
    assert.strictEqual(config.url, 'http://xo.local:9000')
    assert.ok('username' in config)
    assert.strictEqual(config.username, 'admin')
    assert.strictEqual(config.password, 'pass')
  })

  it('throws when XO_URL is missing', () => {
    delete process.env.XO_URL
    process.env.XO_USERNAME = 'admin'
    process.env.XO_PASSWORD = 'pass'
    assert.throws(() => validateEnv(), { message: /XO_URL/ })
  })

  it('throws when credentials are missing', () => {
    process.env.XO_URL = 'http://xo.local:9000'
    delete process.env.XO_TOKEN
    delete process.env.XO_USERNAME
    delete process.env.XO_PASSWORD
    assert.throws(
      () => validateEnv(),
      (error: Error) => {
        assert.ok(error.message.includes('XO_USERNAME'))
        assert.ok(error.message.includes('XO_PASSWORD'))
        assert.ok(error.message.includes('XO_TOKEN'))
        return true
      }
    )
  })

  it('returns token config when XO_TOKEN is set', () => {
    process.env.XO_URL = 'http://xo.local:9000'
    process.env.XO_TOKEN = 'my-token'
    delete process.env.XO_USERNAME
    delete process.env.XO_PASSWORD
    const config = validateEnv()
    assert.strictEqual(config.url, 'http://xo.local:9000')
    assert.strictEqual('token' in config && config.token, 'my-token')
  })

  it('prioritizes XO_TOKEN over XO_USERNAME/XO_PASSWORD', () => {
    process.env.XO_URL = 'http://xo.local:9000'
    process.env.XO_TOKEN = 'my-token'
    process.env.XO_USERNAME = 'admin'
    process.env.XO_PASSWORD = 'pass'
    const config = validateEnv()
    assert.strictEqual('token' in config && config.token, 'my-token')
    assert.strictEqual('username' in config, false)
  })

  it('throws when XO_URL is missing even with XO_TOKEN', () => {
    delete process.env.XO_URL
    process.env.XO_TOKEN = 'my-token'
    assert.throws(() => validateEnv(), { message: /XO_URL/ })
  })
})

describe('fetchDocumentation', () => {
  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('strips HTML and returns clean text', async () => {
    globalThis.fetch = async () =>
      new Response('<html><body><h1>Title</h1><p>Content here.</p><script>evil()</script></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    const text = await fetchDocumentation('/test')
    assert.ok(text.includes('## Title'))
    assert.ok(text.includes('Content here.'))
    assert.ok(!text.includes('evil()'))
    assert.ok(!text.includes('<script>'))
  })

  it('decodes HTML entities', async () => {
    globalThis.fetch = async () =>
      new Response('<p>&quot;quoted&quot; &amp; it&#39;s &mdash; a &ndash; test&hellip;</p>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    const text = await fetchDocumentation('/test')
    assert.ok(text.includes('"quoted"'))
    assert.ok(text.includes("it's"))
    assert.ok(text.includes('—'))
    assert.ok(text.includes('–'))
    assert.ok(text.includes('…'))
  })

  it('throws on HTTP error', async () => {
    globalThis.fetch = async () => new Response('Not Found', { status: 404, statusText: 'Not Found' })
    await assert.rejects(() => fetchDocumentation('/test'), { message: /404/ })
  })

  it('throws on network error', async () => {
    globalThis.fetch = async () => {
      throw new Error('Network failure')
    }
    await assert.rejects(() => fetchDocumentation('/test'), { message: /Cannot reach documentation server/ })
  })
})
