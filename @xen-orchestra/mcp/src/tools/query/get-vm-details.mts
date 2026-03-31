import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

export function registerGetVmDetails(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'get_vm_details',
    {
      title: 'Get VM Details',
      description: 'Get detailed information about a specific virtual machine',
      inputSchema: {
        vm_id: z.string().describe('The VM ID or UUID'),
      },
    },
    async ({ vm_id }) => {
      try {
        const client = getClient()
        const text = await client.getMarkdown(`/vms/${encodeURIComponent(vm_id)}`, '*')
        return {
          content: [{ type: 'text', text }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to get VM details: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}
