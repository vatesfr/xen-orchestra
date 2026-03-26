import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { XoClient } from './xo-client.mjs'

import { fetchSwaggerSpec } from './bootstrap/swagger-fetcher.mjs'
import { parseSwagger } from './bootstrap/swagger-parser.mjs'
import { registerDomainTools } from './bootstrap/tool-generator.mjs'
import { initFormatters } from './formatters/index.mjs'
import { registerCheckConnection } from './tools/utility/check-connection.mjs'
import { registerSearchDocs } from './tools/utility/search-docs.mjs'
import { registerGetInfrastructureSummary } from './tools/utility/get-infrastructure-summary.mjs'

export async function createServer(getClient: () => XoClient): Promise<McpServer> {
  const server = new McpServer({
    name: 'xo-mcp-server',
    version: '1.0.0',
  })

  // Initialize the formatter registry
  initFormatters()

  // Fetch and parse the OpenAPI spec
  const client = getClient()
  const spec = await fetchSwaggerSpec(client.getBaseUrl(), client.getAuthHeaders())
  const domains = parseSwagger(spec)

  // Register dynamically generated tools from the spec
  for (const domain of domains.values()) {
    registerDomainTools(server, getClient, domain)
  }

  // Register utility tools (not in the swagger)
  registerCheckConnection(server, getClient)
  registerSearchDocs(server)
  registerGetInfrastructureSummary(server, getClient)

  return server
}
