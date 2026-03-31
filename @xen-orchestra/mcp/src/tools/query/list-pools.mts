import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

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
        const text = await client.getMarkdown('/pools', 'id,name_label,name_description,auto_poweron,HA_enabled', {
          fields,
        })
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
