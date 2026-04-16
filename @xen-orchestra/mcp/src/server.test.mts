import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createServer, validateEnv, fetchDocumentation } from './index.mjs'
import { createServer as createServerDirect } from './server.mjs'
import { formatToolError } from './helpers/tool-error.mjs'
import type { XoClient } from './xo-client.mjs'

const EXPECTED_TOOL_NAMES = [
  'check_connection',
  'get_infrastructure_summary',
  'get_network_details',
  'get_pool_dashboard',
  'get_sr_details',
  'get_vm_details',
  'list_hosts',
  'list_networks',
  'list_pools',
  'list_srs',
  'list_vdis',
  'list_vms',
  'search_documentation',
]

// Helper to create a mock XoClient
// Uses `as unknown as XoClient` because @vates/types uses branded string IDs
// that plain string literals don't satisfy at the type level.
function createMockClient(overrides: Record<string, unknown> = {}): XoClient {
  return {
    testConnection: async () => ({ ok: true }),
    getText: async () => '{"hosts":{"status":{"running":1,"total":1}},"vms":{"status":{"running":2}}}',
    getMarkdown: async () => '| id | name_label |\n| --- | --- |\n| mock1 | Mock 1 |',
    ...overrides,
  } as unknown as XoClient
}

// Helper to set up client + server connected via InMemoryTransport
async function setupTestServer(mockClient?: XoClient) {
  const client = mockClient ?? createMockClient()
  const server = createServer(() => client)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const mcpClient = new Client({ name: 'test-client', version: '1.0.0' })

  await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)])

  return { mcpClient, server }
}

describe('createServer', () => {
  describe('tool listing', () => {
    it(`registers all ${EXPECTED_TOOL_NAMES.length} tools`, async () => {
      const { mcpClient } = await setupTestServer()
      const { tools } = await mcpClient.listTools()
      const toolNames = tools.map(t => t.name).sort()

      assert.deepStrictEqual(toolNames, EXPECTED_TOOL_NAMES)
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

  describe('list_pools tool', () => {
    it('returns markdown from API', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'list_pools', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('mock1'))
    })

    it('passes fields parameter', async () => {
      let receivedOptions: { fields?: string } = {}
      const mockClient = createMockClient({
        getMarkdown: async (_path: string, _defaultFields: string, options?: { fields?: string }) => {
          receivedOptions = options ?? {}
          return '| id |\n| --- |\n| pool1 |'
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      await mcpClient.callTool({ name: 'list_pools', arguments: { fields: 'id,name_label' } })
      assert.strictEqual(receivedOptions.fields, 'id,name_label')
    })

    it('returns error on failure', async () => {
      const mockClient = createMockClient({
        getMarkdown: async () => {
          throw new Error('Connection refused')
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({ name: 'list_pools', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to list pools'))
    })
  })

  describe('list_vms tool', () => {
    it('returns markdown from API', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'list_vms', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('mock1'))
    })

    it('passes filter, fields, and limit', async () => {
      let receivedPath = ''
      let receivedOptions: { filter?: string; fields?: string; limit?: number } = {}
      const mockClient = createMockClient({
        getMarkdown: async (
          path: string,
          _defaultFields: string,
          options?: { filter?: string; fields?: string; limit?: number }
        ) => {
          receivedPath = path
          receivedOptions = options ?? {}
          return ''
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      await mcpClient.callTool({
        name: 'list_vms',
        arguments: { filter: 'power_state:Running', fields: 'id', limit: 5 },
      })
      assert.strictEqual(receivedPath, '/vms')
      assert.strictEqual(receivedOptions.filter, 'power_state:Running')
      assert.strictEqual(receivedOptions.fields, 'id')
      assert.strictEqual(receivedOptions.limit, 5)
    })
  })

  describe('list_vdis tool', () => {
    it('returns markdown from API', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'list_vdis', arguments: {} })
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
        name: 'list_vdis',
        arguments: { filter: 'VDI_type:User', fields: 'id,size', limit: 10 },
      })
      assert.strictEqual(receivedOptions.filter, 'VDI_type:User')
      assert.strictEqual(receivedOptions.fields, 'id,size')
      assert.strictEqual(receivedOptions.limit, 10)
    })

    it('returns error on failure', async () => {
      const mockClient = createMockClient({
        getMarkdown: async () => {
          throw new Error('Connection refused')
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({ name: 'list_vdis', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to list VDIs'))
    })
  })

  describe('get_vm_details tool', () => {
    it('returns VM details as markdown', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({
        name: 'get_vm_details',
        arguments: { vm_id: 'vm1' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('mock1'))
    })

    it('returns error when VM not found', async () => {
      const mockClient = createMockClient({
        getMarkdown: async () => {
          throw new Error('XO API error (404 Not Found): Not found')
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({
        name: 'get_vm_details',
        arguments: { vm_id: 'nonexistent' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to get VM details'))
    })
  })

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

  describe('get_pool_dashboard tool', () => {
    it('returns dashboard data', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({
        name: 'get_pool_dashboard',
        arguments: { pool_id: 'pool1' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('running'))
    })
  })

  describe('list_hosts tool', () => {
    it('returns markdown from API', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'list_hosts', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('mock1'))
    })
  })

  describe('list_networks tool', () => {
    it('returns markdown from API', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({ name: 'list_networks', arguments: {} })
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
        name: 'list_networks',
        arguments: { filter: 'bridge:xenbr0', fields: 'id,name_label', limit: 5 },
      })
      assert.strictEqual(receivedOptions.filter, 'bridge:xenbr0')
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
      const result = await mcpClient.callTool({ name: 'list_networks', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to list networks'))
    })
  })

  describe('get_network_details tool', () => {
    it('returns network details as markdown', async () => {
      const { mcpClient } = await setupTestServer()
      const result = await mcpClient.callTool({
        name: 'get_network_details',
        arguments: { network_id: 'network1' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('mock1'))
    })

    it('returns error when network not found', async () => {
      const mockClient = createMockClient({
        getMarkdown: async () => {
          throw new Error('XO API error (404 Not Found): Not found')
        },
      })
      const { mcpClient } = await setupTestServer(mockClient)
      const result = await mcpClient.callTool({
        name: 'get_network_details',
        arguments: { network_id: 'nonexistent' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0].text
      assert.ok(text.includes('Failed to get network details'))
    })
  })

  describe('search_documentation tool', () => {
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
      originalFetch = globalThis.fetch
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('fetches and returns documentation', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('docs.xen-orchestra.com')) {
          return new Response('<h1>Installation Guide</h1><p>Install XO here.</p>', {
            status: 200,
            headers: { 'content-type': 'text/html' },
          })
        }
        return originalFetch(input)
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
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('docs.xen-orchestra.com')) {
          return new Response('Not Found', { status: 404, statusText: 'Not Found' })
        }
        return originalFetch(input)
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
  it('createServer is accessible from both index and server module', () => {
    assert.strictEqual(typeof createServer, 'function')
    assert.strictEqual(typeof createServerDirect, 'function')
  })

  it('direct server module creates identical server', async () => {
    const client = createMockClient()
    const server = createServerDirect(() => client)
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const mcpClient = new Client({ name: 'test-client', version: '1.0.0' })

    await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)])

    const { tools } = await mcpClient.listTools()
    assert.strictEqual(tools.length, 13)
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
  let originalFetch: typeof globalThis.fetch

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
