import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'
import { formatPoolList } from '../../formatters/pool.mjs'
import { formatGenericList } from '../../formatters/generic.mjs'

export function registerListPools(server: McpServer, getClient: () => XoClient): void {
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
        const text = fields ? formatGenericList(pools as Record<string, unknown>[], 'Pools') : formatPoolList(pools)
        return {
          content: [{ type: 'text', text }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to list pools: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
