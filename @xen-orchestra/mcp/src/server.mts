import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { XoClient } from './xo-client.mjs'

import { fetchSwaggerSpec, parseSwagger, type ParseOptions } from './bootstrap/swagger.mjs'
import { registerDomainTools } from './bootstrap/tool-generator.mjs'
import { registerCheckConnection } from './tools/utility/check-connection.mjs'
import { registerSearchDocs } from './tools/utility/search-docs.mjs'
import { registerGetInfrastructureSummary } from './tools/utility/get-infrastructure-summary.mjs'

function parseEnvOverrides(): ParseOptions {
  const opts: ParseOptions = {}
  if (process.env.XO_MCP_ENABLE_ACTIONS === '1') opts.includeConfirm = true

  const denyList = process.env.XO_MCP_DENY_LIST?.split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (denyList?.length) opts.denyList = denyList

  return opts
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
