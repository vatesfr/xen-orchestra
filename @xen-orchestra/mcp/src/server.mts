import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { XoClient } from './xo-client.mjs'

import { fetchSwaggerSpec, parseSwagger, type ParseOptions } from './bootstrap/swagger.mjs'
import { registerDomainTools } from './bootstrap/tool-generator.mjs'
import { registerCheckConnection } from './tools/utility/check-connection.mjs'
import { registerSearchDocs } from './tools/utility/search-docs.mjs'
import { registerGetInfrastructureSummary } from './tools/utility/get-infrastructure-summary.mjs'

function parseEnvOverrides(): ParseOptions {
  const denyRaw = process.env.XO_MCP_DENY_LIST
  if (!denyRaw) return {}
  const denyList = denyRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return denyList.length > 0 ? { denyList } : {}
}

export async function createServer(getClient: () => XoClient): Promise<McpServer> {
  const server = new McpServer({ name: 'xo-mcp-server', version: '1.0.0' })

  const client = getClient()
  const spec = await fetchSwaggerSpec(client.getBaseUrl(), client.getAuthHeaders())
  const domains = parseSwagger(spec, parseEnvOverrides())

  for (const domain of domains.values()) {
    registerDomainTools(server, getClient, domain)
  }

  registerCheckConnection(server, getClient)
  registerSearchDocs(server)
  registerGetInfrastructureSummary(server, getClient)

  return server
}
