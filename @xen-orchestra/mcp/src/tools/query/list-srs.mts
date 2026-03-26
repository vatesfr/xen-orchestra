import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

export function registerListSrs(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'list_srs',
    {
      title: 'List Storage Repositories',
      description: 'List storage repositories (SRs) in Xen Orchestra with optional filtering',
      inputSchema: {
        filter: z.string().optional().describe('Filter expression (e.g., SR_type:lvm, shared:true)'),
        fields: z.string().optional().describe('Comma-separated fields to return'),
        limit: z.number().optional().describe('Maximum number of SRs to return'),
      },
    },
    async ({ filter, fields, limit }) => {
      try {
        const client = getClient()
        const srs = await client.listSrs({ filter, fields, limit })
        return {
          content: [{ type: 'text', text: JSON.stringify(srs, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list SRs: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
