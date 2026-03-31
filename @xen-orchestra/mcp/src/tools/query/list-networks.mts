import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

export function registerListNetworks(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'list_networks',
    {
      title: 'List Networks',
      description: 'List all networks in Xen Orchestra with optional filtering',
      inputSchema: {
        filter: z.string().optional().describe('Filter expression (e.g., bridge:xenbr0)'),
        fields: z.string().optional().describe('Comma-separated fields to return'),
        limit: z.number().optional().describe('Maximum number of networks to return'),
      },
    },
    async ({ filter, fields, limit }) => {
      try {
        const client = getClient()
        const text = await client.getMarkdown('/networks', 'id,name_label,name_description,bridge,MTU,nbd', {
          filter,
          fields,
          limit,
        })
        return {
          content: [{ type: 'text', text }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list networks: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
