import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createServer, validateEnv, fetchDocumentation } from './index.mjs'
import { createServer as createServerDirect } from './server.mjs'
import { formatToolError } from './helpers/tool-error.mjs'
import type { XoClient } from './xo-client.mjs'

// Minimal OpenAPI spec for testing
const MOCK_SWAGGER_SPEC = {
  openapi: '3.0.0',
  info: { title: 'XO API', version: '1.0.0' },
  paths: {
    '/pools': {
      get: {
        tags: ['pools'],
        summary: 'List all pools',
        parameters: [],
      },
    },
    '/pools/{id}': {
      get: {
        tags: ['pools'],
        summary: 'Get a pool',
        parameters: [{ name: 'id', in: 'path', required: true }],
      },
    },
    '/vms': {
      get: {
        tags: ['vms'],
        summary: 'List all VMs',
        parameters: [],
      },
    },
    '/vms/{id}': {
      get: {
        tags: ['vms'],
        summary: 'Get a VM',
        parameters: [{ name: 'id', in: 'path', required: true }],
      },
    },
    '/vms/{id}/actions/start': {
      post: {
        tags: ['vms'],
        summary: 'Start a VM',
        parameters: [{ name: 'id', in: 'path', required: true }],
      },
    },
    '/hosts': {
      get: {
        tags: ['hosts'],
        summary: 'List all hosts',
        parameters: [],
      },
    },
  },
  tags: [{ name: 'pools' }, { name: 'vms' }, { name: 'hosts' }],
}

// Helper to create a mock XoClient
function createMockClient(overrides: Record<string, unknown> = {}): XoClient {
  return {
    testConnection: async () => ({ ok: true }),
    listPools: async () => [{ id: 'pool1', name_label: 'Pool 1' }],
    listHosts: async () => [{ id: 'host1', name_label: 'Host 1' }],
    listVms: async () => [
      { id: 'vm1', name_label: 'VM 1', power_state: 'Running' },
      { id: 'vm2', name_label: 'VM 2', power_state: 'Halted' },
    ],
    listVdis: async () => [
      { id: 'vdi1', name_label: 'VDI 1', size: 10737418240 },
      { id: 'vdi2', name_label: 'VDI 2', size: 21474836480 },
    ],
    getVm: async () => ({ id: 'vm1', name_label: 'VM 1', power_state: 'Running' }),
    getPool: async () => ({ id: 'pool1', name_label: 'Pool 1' }),
    getPoolDashboard: async () => ({ hosts: { status: { running: 1, total: 1 } }, vms: { status: { running: 2 } } }),
    getHost: async () => ({ id: 'host1', name_label: 'Host 1' }),
    getVmStats: async () => ({ endTimestamp: 0, interval: 0, stats: {} }),
    apiRequest: async () => [{ id: 'item1', name_label: 'Item 1' }],
    getAuthHeaders: () => ({ cookie: 'authenticationToken=test' }),
    getBaseUrl: () => 'http://xo.test',
    ...overrides,
  } as unknown as XoClient
}

let originalFetch: typeof globalThis.fetch

// Set up fetch mock that returns the swagger spec
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

// Helper to set up client + server connected via InMemoryTransport
async function setupTestServer(mockClient?: XoClient) {
  const client = mockClient ?? createMockClient()
  const server = await createServerDirect(() => client)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const mcpClient = new Client({ name: 'test-client', version: '1.0.0' })

  await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)])

  return { mcpClient, server }
}

describe('createServer (dynamic bootstrap)', () => {
  beforeEach(() => {
    mockSwaggerFetch()
  })

  afterEach(() => {
    restoreFetch()
  })

  describe('tool listing', () => {
    it('registers dynamic tools from swagger + utility tools', async () => {
      const { mcpClient } = await setupTestServer()
      const { tools } = await mcpClient.listTools()
      const toolNames = tools.map(t => t.name).sort()

      // Should have dynamic query tools (action tools are disabled for now)
      // Plus utility: check_connection, search_documentation, get_infrastructure_summary
      assert.ok(toolNames.includes('pools_query'), `Expected pools_query, got: ${toolNames.join(', ')}`)
      assert.ok(toolNames.includes('vms_query'), `Expected vms_query, got: ${toolNames.join(', ')}`)
      assert.ok(toolNames.includes('hosts_query'), `Expected hosts_query, got: ${toolNames.join(', ')}`)
      assert.ok(!toolNames.includes('vms_action'), `Action tools should be disabled, got: ${toolNames.join(', ')}`)
      assert.ok(toolNames.includes('check_connection'), `Expected check_connection`)
      assert.ok(toolNames.includes('search_documentation'), `Expected search_documentation`)
      assert.ok(toolNames.includes('get_infrastructure_summary'), `Expected get_infrastructure_summary`)
    })
  })

  describe('check_connection tool', () => {
    it('returns success message on good connection', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'check_connection', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('successful'))
    })

    it('returns error message on failed connection', async () => {
      const mockClient = createMockClient({
        testConnection: async () => ({ ok: false, error: 'Cannot connect to XO server' }),
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({ name: 'check_connection', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('failed'))
      assert.ok(text.includes('Cannot connect'))
    })
  })

  describe('dynamic query tools', () => {
    it('pools_query list returns data', async () => {
      const mockClient = createMockClient({
        apiRequest: async () => [{ id: 'pool1', name_label: 'Pool 1', HA_enabled: true }],
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({
        name: 'pools_query',
        arguments: { operation: 'list' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Pool 1'))
    })

    it('vms_query list returns data', async () => {
      const mockClient = createMockClient({
        apiRequest: async () => [{ id: 'vm1', name_label: 'VM 1', power_state: 'Running' }],
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({
        name: 'vms_query',
        arguments: { operation: 'list' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('VM 1'))
    })

    it('passes filter and fields as query params', async () => {
      let receivedArgs: { method?: string; path?: string; query?: Record<string, string> } = {}
      const mockClient = createMockClient({
        apiRequest: async (method: string, path: string, options?: { query?: Record<string, string> }) => {
          receivedArgs = { method, path, query: options?.query }
          return []
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      await mcpClient.callTool({
        name: 'vms_query',
        arguments: { operation: 'list', filter: 'power_state:Running', fields: 'id,name_label', limit: 5 },
      })
      assert.strictEqual(receivedArgs.query?.filter, 'power_state:Running')
      // Fields are merged with collection defaults, so user fields are included
      const fields = receivedArgs.query?.fields ?? ''
      assert.ok(fields.includes('id'), `Expected fields to include 'id', got: ${fields}`)
      assert.ok(fields.includes('name_label'), `Expected fields to include 'name_label', got: ${fields}`)
      assert.strictEqual(receivedArgs.query?.limit, '5')
    })

    it('returns error on API failure', async () => {
      const mockClient = createMockClient({
        apiRequest: async () => {
          throw new Error('Connection refused')
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({
        name: 'pools_query',
        arguments: { operation: 'list' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to query'))
      assert.ok(text.includes('Connection refused'))
    })
  })

  // Action tools are disabled for now — tests will be re-enabled when actions are activated
  // describe('dynamic action tools', () => { ... })

  describe('list_srs tool', () => {
    it('returns markdown from API', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'list_srs', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('mock1'))
    })

    it('passes filter, fields, and limit', async () => {
      let receivedOptions: { filter?: string; fields?: string; limit?: number } = {}
      const mockClient = createMockClient({
        getMarkdown: async (
          _path: string,
          _defaultFields: string,
          options?: { filter?: string; fields?: string; limit?: number }
        ) => {
          receivedOptions = options ?? {}
          return ''
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      await mcpClient.callTool({
        name: 'list_srs',
        arguments: { filter: 'SR_type:lvm', fields: 'id,name_label', limit: 5 },
      })
      assert.strictEqual(receivedOptions.filter, 'SR_type:lvm')
      assert.strictEqual(receivedOptions.fields, 'id,name_label')
      assert.strictEqual(receivedOptions.limit, 5)
    })

    it('returns error on failure', async () => {
      const mockClient = createMockClient({
        getMarkdown: async () => {
          throw new Error('Connection refused')
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({ name: 'list_srs', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to list SRs'))
    })
  })

  describe('get_sr_details tool', () => {
    it('returns SR details as markdown', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({
        name: 'get_sr_details',
        arguments: { sr_id: 'sr1' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('mock1'))
    })

    it('returns error when SR not found', async () => {
      const mockClient = createMockClient({
        getMarkdown: async () => {
          throw new Error('XO API error (404 Not Found): Not found')
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({
        name: 'get_sr_details',
        arguments: { sr_id: 'nonexistent' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to get SR details'))
    })
  })

  describe('get_infrastructure_summary tool', () => {
    it('returns aggregated summary as markdown', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({
        name: 'get_infrastructure_summary',
        arguments: {},
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
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
      const result = await mcpClient.callTool({
        name: 'search_documentation',
        arguments: { topic: 'installation' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
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
      const result = await mcpClient.callTool({
        name: 'search_documentation',
        arguments: { topic: 'installation' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to fetch documentation'))
    })
  })
})

describe('module structure', () => {
  beforeEach(() => {
    mockSwaggerFetch()
  })

  afterEach(() => {
    restoreFetch()
  })

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
    // Should have at least the utility tools + dynamic tools
    assert.ok(tools.length >= 5, `Expected at least 5 tools, got ${tools.length}`)
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

  it('throws when XO_USERNAME is missing', () => {
    process.env.XO_URL = 'http://xo.local:9000'
    delete process.env.XO_USERNAME
    process.env.XO_PASSWORD = 'pass'

    assert.throws(() => validateEnv(), { message: /XO_USERNAME/ })
  })

  it('throws when XO_PASSWORD is missing', () => {
    process.env.XO_URL = 'http://xo.local:9000'
    process.env.XO_USERNAME = 'admin'
    delete process.env.XO_PASSWORD

    assert.throws(() => validateEnv(), { message: /XO_PASSWORD/ })
  })

  it('throws XO_URL error first when all vars are missing', () => {
    delete process.env.XO_URL
    delete process.env.XO_TOKEN
    delete process.env.XO_USERNAME
    delete process.env.XO_PASSWORD

    assert.throws(() => validateEnv(), { message: /XO_URL/ })
  })

  it('lists missing credential vars when only XO_URL is set', () => {
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

  it('includes help text in error message', () => {
    delete process.env.XO_URL
    process.env.XO_USERNAME = 'admin'
    process.env.XO_PASSWORD = 'pass'

    assert.throws(
      () => validateEnv(),
      (error: Error) => {
        assert.ok(error.message.includes('XO_URL'))
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
    assert.strictEqual('username' in config, false)
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

  it('throws when neither XO_TOKEN nor XO_USERNAME/XO_PASSWORD are set', () => {
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
    globalThis.fetch = async () => {
      return new Response('<html><body><h1>Title</h1><p>Content here.</p><script>evil()</script></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    }

    const text = await fetchDocumentation('/test')
    assert.ok(text.includes('## Title'))
    assert.ok(text.includes('Content here.'))
    assert.ok(!text.includes('evil()'))
    assert.ok(!text.includes('<script>'))
  })

  it('decodes HTML entities', async () => {
    globalThis.fetch = async () => {
      return new Response('<p>A &amp; B &lt; C &gt; D</p>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    }

    const text = await fetchDocumentation('/test')
    assert.ok(text.includes('A & B < C > D'))
  })

  it('decodes additional HTML entities', async () => {
    globalThis.fetch = async () => {
      return new Response('<p>&quot;quoted&quot; &amp; it&#39;s &mdash; a &ndash; test&hellip;</p>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    }

    const text = await fetchDocumentation('/test')
    assert.ok(text.includes('"quoted"'))
    assert.ok(text.includes("it's"))
    assert.ok(text.includes('\u2014'))
    assert.ok(text.includes('\u2013'))
    assert.ok(text.includes('\u2026'))
  })

  it('handles multiline HTML tags', async () => {
    globalThis.fetch = async () => {
      return new Response('<h1>Title\nwith newline</h1><p>Para\nwith newline</p>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    }

    const text = await fetchDocumentation('/test')
    assert.ok(text.includes('Title'))
    assert.ok(text.includes('with newline'))
  })

  it('throws on HTTP error', async () => {
    globalThis.fetch = async () => {
      return new Response('Not Found', { status: 404, statusText: 'Not Found' })
    }

    await assert.rejects(() => fetchDocumentation('/test'), {
      message: /404/,
    })
  })

  it('throws on network error', async () => {
    globalThis.fetch = async () => {
      throw new Error('Network failure')
    }

    await assert.rejects(() => fetchDocumentation('/test'), {
      message: /Cannot reach documentation server/,
    })
  })
})
