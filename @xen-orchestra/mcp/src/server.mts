import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { XoClient } from './xo-client.mjs'

import { registerCheckConnection } from './tools/utility/check-connection.mjs'
import { registerSearchDocs } from './tools/utility/search-docs.mjs'
import { registerQueryTools } from './tools/query/registry.mjs'
import { registerGetPoolDashboard } from './tools/query/get-pool-dashboard.mjs'
import { registerGetInfrastructureSummary } from './tools/query/get-infrastructure-summary.mjs'

export function createServer(getClient: () => XoClient): McpServer {
  const server = new McpServer({
    name: 'xo-mcp-server',
    version: '1.0.0',
  })

  // Utility tools
  registerCheckConnection(server, getClient)
  registerSearchDocs(server)

  // Query tools (declarative registry)
  registerQueryTools(server, getClient)
  registerGetPoolDashboard(server, getClient)
  registerGetInfrastructureSummary(server, getClient)

  return server
}
