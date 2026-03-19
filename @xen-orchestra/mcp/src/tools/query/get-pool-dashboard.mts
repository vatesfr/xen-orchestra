import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'
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
        const text = await client.getText(`/pools/${encodeURIComponent(pool_id)}/dashboard`)
        return {
          content: [{ type: 'text', text }],
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
