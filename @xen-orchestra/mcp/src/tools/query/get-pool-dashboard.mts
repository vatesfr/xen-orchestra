import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'
import { formatPoolDashboard } from '../../formatters/pool.mjs'

export function registerGetPoolDashboard(server: McpServer, getClient: () => XoClient): void {
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
          content: [{ type: 'text', text: formatPoolDashboard(dashboard) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to get pool dashboard: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
