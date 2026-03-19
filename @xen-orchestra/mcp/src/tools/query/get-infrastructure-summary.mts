import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

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
          client.listPools('id,name_label'),
          client.listHosts({ fields: 'id,name_label,power_state' }),
          client.listVms({ fields: 'id,power_state' }),
        ])

        const runningVms = vms.filter(vm => vm.power_state === 'Running').length
        const haltedVms = vms.filter(vm => vm.power_state === 'Halted').length

        const poolNames = pools
          .map(p => p.name_label)
          .filter(Boolean)
          .join(', ')
        const otherVms = vms.length - runningVms - haltedVms

        const lines = [
          '## Infrastructure Summary',
          '',
          `- **Pools**: ${pools.length}${poolNames ? ` (${poolNames})` : ''}`,
          `- **Hosts**: ${hosts.length}`,
          `- **VMs**: ${vms.length} total — ${runningVms} running, ${haltedVms} halted${otherVms > 0 ? `, ${otherVms} other` : ''}`,
        ]

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get infrastructure summary: ${formatToolError(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )

  server.prompt(
    'infrastructure-overview',
    'Generate a natural language overview of the XO infrastructure',
    async () => {
      return {
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
      }
    }
  )
}
