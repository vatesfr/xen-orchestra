import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'
import { formatVdiList } from '../../formatters/storage.mjs'
import { formatGenericList } from '../../formatters/generic.mjs'

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
        const vdis = await client.listVdis({ filter, fields, limit })
        const text = fields ? formatGenericList(vdis as Record<string, unknown>[], 'VDIs') : formatVdiList(vdis)
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
