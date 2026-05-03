import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

async function fetchAsMarkdown(client: XoClient, path: string, fields: string): Promise<string> {
  const data = await client.apiRequest('GET', path, { query: { fields, markdown: 'true' } })
  return typeof data === 'string' ? data : JSON.stringify(data, null, 2)
}

export function registerGetInfrastructureSummary(server: McpServer, getClient: () => XoClient): void {
  server.registerTool(
    'get_infrastructure_summary',
    {
      title: 'Get Infrastructure Summary',
      description: 'Get a high-level summary of the entire XO infrastructure (pools, hosts, VMs counts)',
      inputSchema: {},
    },
    async () => {
      try {
        const client = getClient()
        const [pools, hosts, vms] = await Promise.all([
          fetchAsMarkdown(client, '/pools', 'id,name_label'),
          fetchAsMarkdown(client, '/hosts', 'id,name_label,power_state'),
          fetchAsMarkdown(client, '/vms', 'id,power_state'),
        ])
        return {
          content: [{ type: 'text', text: `## Pools\n${pools}\n\n## Hosts\n${hosts}\n\n## VMs\n${vms}` }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Failed to get infrastructure summary: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )

  server.prompt(
    'infrastructure-overview',
    'Generate a natural language overview of the XO infrastructure',
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please use the get_infrastructure_summary tool to fetch the current state of the Xen Orchestra infrastructure, then provide a clear, human-readable summary of:
1. How many pools are configured and their names
2. Total number of hosts
3. VM statistics (total, running, halted)

Present this information in a friendly, conversational way.`,
          },
        },
      ],
    })
  )
}
