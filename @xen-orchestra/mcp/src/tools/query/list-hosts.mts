import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'
import { formatHostList } from '../../formatters/host.mjs'
import { formatGenericList } from '../../formatters/generic.mjs'

export function registerListHosts(server: McpServer, getClient: () => XoClient): void {
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
        const text = fields ? formatGenericList(hosts as Record<string, unknown>[], 'Hosts') : formatHostList(hosts)
        return {
          content: [{ type: 'text', text }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list hosts: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
