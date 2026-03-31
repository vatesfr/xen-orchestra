import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

export function registerGetSrDetails(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'get_sr_details',
    {
      title: 'Get SR Details',
      description: 'Get detailed information about a specific storage repository',
      inputSchema: {
        sr_id: z.string().describe('The SR ID or UUID'),
      },
    },
    async ({ sr_id }) => {
      try {
        const client = getClient()
        const text = await client.getMarkdown(`/srs/${encodeURIComponent(sr_id)}`, '*')
        return {
          content: [{ type: 'text', text }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to get SR details: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
