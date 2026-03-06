#!/usr/bin/env node
/**
 * XO MCP Server
 *
 * Model Context Protocol server for Xen Orchestra.
 * Allows AI assistants to query XO infrastructure and documentation.
 *
 * Usage:
 *   XO_URL=http://xo.local XO_USERNAME=admin XO_PASSWORD=*** node dist/index.mjs
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { realpathSync } from 'node:fs'
import { XoClient } from './xo-client.mjs'

const DOC_FETCH_TIMEOUT_MS = 30_000

const XO_DOCS_BASE_URL = 'https://docs.xen-orchestra.com'

const DOC_TOPICS = [
  'installation',
  'configuration',
  'backups',
  'restapi',
  'manage',
  'users',
  'architecture',
  'troubleshooting',
  'releases',
] as const

export interface EnvConfig {
  url: string
  username: string
  password: string
}

export function validateEnv(): EnvConfig {
  const url = process.env.XO_URL
  const username = process.env.XO_USERNAME
  const password = process.env.XO_PASSWORD

  const missing: string[] = []
  if (!url) missing.push('XO_URL')
  if (!username) missing.push('XO_USERNAME')
  if (!password) missing.push('XO_PASSWORD')

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\n` +
        'Please set:\n' +
        '  XO_URL      - Xen Orchestra server URL (e.g., http://xo.local:9000)\n' +
        '  XO_USERNAME - Admin username\n' +
        '  XO_PASSWORD - Password\n\n' +
        'Note: XO currently requires username/password authentication.\n' +
        'Token authentication is also supported via xo-cli create-token.'
    )
  }

  return { url: url!, username: username!, password: password! }
}

export async function fetchDocumentation(path: string): Promise<string> {
  const url = `${XO_DOCS_BASE_URL}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(DOC_FETCH_TIMEOUT_MS),
    })
  } catch (cause) {
    throw new Error(`Cannot reach documentation server: ${cause instanceof Error ? cause.message : 'Unknown error'}`, {
      cause,
    })
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch documentation: HTTP ${response.status} ${response.statusText}`)
  }

  const html = await response.text()

  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')

  text = text
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n## $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()

  return text
}

function formatToolError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error occurred'
}

export function createServer(getClient: () => XoClient): McpServer {
  const server = new McpServer({
    name: 'xo-mcp-server',
    version: '1.0.0',
  })

  // =============================================================================
  // TOOL: check_connection
  // =============================================================================
  server.registerTool(
    'check_connection',
    {
      title: 'Check Connection',
      description: 'Test the connection to the Xen Orchestra server. Use this to validate your setup.',
      inputSchema: {},
    },
    async () => {
      const client = getClient()
      const result = await client.testConnection()
      if (result.ok) {
        return {
          content: [{ type: 'text', text: 'Connection to XO server successful.' }],
        }
      }
      return {
        content: [
          {
            type: 'text',
            text: `Connection test failed: ${result.error ?? 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  )

  // =============================================================================
  // TOOL: list_pools
  // =============================================================================
  server.registerTool(
    'list_pools',
    {
      title: 'List Pools',
      description: 'List all pools in Xen Orchestra with their basic information',
      inputSchema: {
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (default: id,name_label,name_description,auto_poweron,HA_enabled)'
          ),
      },
    },
    async ({ fields }) => {
      try {
        const client = getClient()
        const pools = await client.listPools(fields)
        return {
          content: [{ type: 'text', text: JSON.stringify(pools, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list pools: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )

  // =============================================================================
  // TOOL: get_pool_dashboard
  // =============================================================================
  server.registerTool(
    'get_pool_dashboard',
    {
      title: 'Get Pool Dashboard',
      description: 'Get aggregated dashboard for a pool including hosts status, top consumers, and alarms',
      inputSchema: {
        pool_id: z.string().describe('The pool ID'),
      },
    },
    async ({ pool_id }) => {
      try {
        const client = getClient()
        const dashboard = await client.getPoolDashboard(pool_id)
        return {
          content: [{ type: 'text', text: JSON.stringify(dashboard, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to get pool dashboard: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )

  // =============================================================================
  // TOOL: list_hosts
  // =============================================================================
  server.registerTool(
    'list_hosts',
    {
      title: 'List Hosts',
      description: 'List all hosts (hypervisors) in Xen Orchestra',
      inputSchema: {
        filter: z.string().optional().describe('Filter expression (e.g., productBrand:XCP-ng)'),
        fields: z.string().optional().describe('Comma-separated fields to return'),
      },
    },
    async ({ filter, fields }) => {
      try {
        const client = getClient()
        const hosts = await client.listHosts({ filter, fields })
        return {
          content: [{ type: 'text', text: JSON.stringify(hosts, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list hosts: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )

  // =============================================================================
  // TOOL: list_vms
  // =============================================================================
  server.registerTool(
    'list_vms',
    {
      title: 'List Virtual Machines',
      description: 'List virtual machines in Xen Orchestra with optional filtering',
      inputSchema: {
        filter: z.string().optional().describe('Filter expression (e.g., power_state:Running, name_label:web*)'),
        fields: z.string().optional().describe('Comma-separated fields to return'),
        limit: z.number().optional().describe('Maximum number of VMs to return'),
      },
    },
    async ({ filter, fields, limit }) => {
      try {
        const client = getClient()
        const vms = await client.listVms({ filter, fields, limit })
        return {
          content: [{ type: 'text', text: JSON.stringify(vms, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list VMs: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )

  // =============================================================================
  // TOOL: get_vm_details
  // =============================================================================
  server.registerTool(
    'get_vm_details',
    {
      title: 'Get VM Details',
      description: 'Get detailed information about a specific virtual machine',
      inputSchema: {
        vm_id: z.string().describe('The VM ID or UUID'),
      },
    },
    async ({ vm_id }) => {
      try {
        const client = getClient()
        const vm = await client.getVm(vm_id)
        return {
          content: [{ type: 'text', text: JSON.stringify(vm, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to get VM details: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )

  // =============================================================================
  // TOOL: search_documentation
  // =============================================================================
  server.registerTool(
    'search_documentation',
    {
      title: 'Search XO Documentation',
      description:
        'Search and retrieve Xen Orchestra documentation. Use this to help users understand XO features, configuration, and best practices.',
      inputSchema: {
        topic: z.enum(DOC_TOPICS).describe('Documentation topic to retrieve'),
      },
    },
    async ({ topic }) => {
      const path = `/${topic}`

      try {
        const content = await fetchDocumentation(path)
        return {
          content: [
            {
              type: 'text',
              text: `# XO Documentation: ${topic}\n\nSource: ${XO_DOCS_BASE_URL}${path}\n\n${content}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch documentation for "${topic}": ${formatToolError(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // =============================================================================
  // TOOL: get_infrastructure_summary
  // =============================================================================
  server.registerTool(
    'get_infrastructure_summary',
    {
      title: 'Get Infrastructure Summary',
      description: 'Get a high-level summary of the entire XO infrastructure (pools, hosts, VMs counts)',
      inputSchema: {},
    },
    async () => {
      try {
        const client = getClient()

        const [pools, hosts, vms] = await Promise.all([
          client.listPools('id,name_label'),
          client.listHosts({ fields: 'id,name_label,power_state' }),
          client.listVms({ fields: 'id,power_state' }),
        ])

        const runningVms = vms.filter(vm => vm.power_state === 'Running').length
        const haltedVms = vms.filter(vm => vm.power_state === 'Halted').length

        const summary = {
          pools: {
            total: pools.length,
            names: pools.map(p => p.name_label),
          },
          hosts: {
            total: hosts.length,
          },
          vms: {
            total: vms.length,
            running: runningVms,
            halted: haltedVms,
            other: vms.length - runningVms - haltedVms,
          },
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get infrastructure summary: ${formatToolError(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  // =============================================================================
  // PROMPT: infrastructure-overview
  // =============================================================================
  server.prompt(
    'infrastructure-overview',
    'Generate a natural language overview of the XO infrastructure',
    async () => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please use the get_infrastructure_summary tool to fetch the current state of the Xen Orchestra infrastructure, then provide a clear, human-readable summary of:
1. How many pools are configured and their names
2. Total number of hosts
3. VM statistics (total, running, halted)

Present this information in a friendly, conversational way.`,
            },
          },
        ],
      }
    }
  )

  return server
}

// =============================================================================
// Start server
// =============================================================================
export async function main() {
  const env = validateEnv()

  let xoClient: XoClient | null = null
  function getClient(): XoClient {
    if (!xoClient) {
      xoClient = new XoClient({ url: env.url, username: env.username, password: env.password })
    }
    return xoClient
  }

  const server = createServer(getClient)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

// Only run main when executed directly (not when imported for testing)
// realpathSync handles the case where the binary is invoked via a symlink (e.g., npx bin)
import { fileURLToPath } from 'node:url'
if (realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  // console.error is used intentionally instead of @xen-orchestra/log because
  // MCP servers communicate via stdout (JSON-RPC) — only stderr is safe for logging.
  main().catch(error => {
    console.error('Fatal error:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
