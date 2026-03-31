import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

export function registerListVms(server: McpServer, getClient: () => XoClient): void {
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
        const text = await client.getMarkdown('/vms', 'id,name_label,power_state,CPUs,memory', {
          filter,
          fields,
          limit,
        })
        return {
          content: [{ type: 'text', text }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list VMs: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
