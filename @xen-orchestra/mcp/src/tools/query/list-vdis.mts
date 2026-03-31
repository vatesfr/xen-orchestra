import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

export function registerListVdis(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'list_vdis',
    {
      title: 'List Virtual Disks',
      description: 'List virtual disks (VDIs) in Xen Orchestra with optional filtering',
      inputSchema: {
        filter: z.string().optional().describe('Filter expression (e.g., VDI_type:User, name_label:data*)'),
        fields: z.string().optional().describe('Comma-separated fields to return'),
        limit: z.number().optional().describe('Maximum number of VDIs to return'),
      },
    },
    async ({ filter, fields, limit }) => {
      try {
        const client = getClient()
        const text = await client.getMarkdown('/vdis', 'id,name_label,name_description,$SR,size,usage,VDI_type', {
          filter,
          fields,
          limit,
        })
        return {
          content: [{ type: 'text', text }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list VDIs: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
