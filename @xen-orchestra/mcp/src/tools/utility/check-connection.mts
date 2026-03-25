import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { XoClient } from '../../xo-client.mjs'

export function registerCheckConnection(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'check_connection',
    {
      title: 'Check Connection',
      description: 'Test the connection to the Xen Orchestra server. Use this to validate your setup.',
      inputSchema: {},
    },
    async () => {
      const client = getClient()
      const result = await client.testConnection()
      if (result.ok) {
        return {
          content: [{ type: 'text', text: 'Connection to XO server successful.' }],
        }
      }
      return {
        content: [
          {
            type: 'text',
            text: `Connection test failed: ${result.error ?? 'Unknown error'}`,
          },
        ],
        isError: true,
      }
    }
  )
}
