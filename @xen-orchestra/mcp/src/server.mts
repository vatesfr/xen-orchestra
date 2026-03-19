import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { XoClient } from './xo-client.mjs'

import { registerCheckConnection } from './tools/utility/check-connection.mjs'
import { registerSearchDocs } from './tools/utility/search-docs.mjs'
import { registerListPools } from './tools/query/list-pools.mjs'
import { registerGetPoolDashboard } from './tools/query/get-pool-dashboard.mjs'
import { registerListHosts } from './tools/query/list-hosts.mjs'
import { registerListVms } from './tools/query/list-vms.mjs'
import { registerListVdis } from './tools/query/list-vdis.mjs'
import { registerGetVmDetails } from './tools/query/get-vm-details.mjs'
import { registerGetInfrastructureSummary } from './tools/query/get-infrastructure-summary.mjs'

export function createServer(getClient: () => XoClient): McpServer {
  const server = new McpServer({
    name: 'xo-mcp-server',
    version: '1.0.0',
  })

  // Utility tools
  registerCheckConnection(server, getClient)
  registerSearchDocs(server)

  // Query tools
  registerListPools(server, getClient)
  registerGetPoolDashboard(server, getClient)
  registerListHosts(server, getClient)
  registerListVms(server, getClient)
  registerListVdis(server, getClient)
  registerGetVmDetails(server, getClient)
  registerGetInfrastructureSummary(server, getClient)

  return server
}
