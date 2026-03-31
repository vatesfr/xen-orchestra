import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

export function registerGetNetworkDetails(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'get_network_details',
    {
      title: 'Get Network Details',
      description: 'Get detailed information about a specific network',
      inputSchema: {
        network_id: z.string().describe('The network ID'),
      },
    },
    async ({ network_id }) => {
      try {
        const client = getClient()
        const text = await client.getMarkdown(`/networks/${encodeURIComponent(network_id)}`, '*')
        return {
          content: [{ type: 'text', text }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to get network details: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
