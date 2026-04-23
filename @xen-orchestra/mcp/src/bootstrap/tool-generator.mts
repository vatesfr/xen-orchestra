import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../xo-client.mjs'
import type { Domain, Operation } from './swagger.mjs'
import { getRiskLevel, createConfirmation, consumeConfirmation } from './risk-config.mjs'
import { formatToolError } from '../helpers/tool-error.mjs'

function describeOps(ops: Operation[]): string {
  return ops.map(op => `  - "${op.name}": ${op.description}`).join('\n')
}

function resolvePath(pathTemplate: string, id?: string): string {
  return id ? pathTemplate.replace(/\{[^}]+\}/g, encodeURIComponent(id)) : pathTemplate
}

function toText(data: unknown): string {
  return typeof data === 'string' ? data : JSON.stringify(data, null, 2)
}

function toolPrefix(tag: string): string {
  return tag.replace(/-/g, '_')
}

export function registerQueryTool(server: McpServer, getClient: () => XoClient, domain: Domain): void {
  if (domain.queryOps.length === 0) return
  const opsLookup = new Map(domain.queryOps.map(op => [op.name, op]))
  const opNames = domain.queryOps.map(op => op.name) as [string, ...string[]]

  server.registerTool(
    `${toolPrefix(domain.tag)}_query`,
    {
      title: `Query ${domain.tag}`,
      description: `Query ${domain.tag} resources. Available operations:\n${describeOps(domain.queryOps)}`,
      annotations: { readOnlyHint: true, destructiveHint: false },
      inputSchema: {
        operation: z.enum(opNames).describe('The query operation to perform (OpenAPI operationId)'),
        id: z.string().optional().describe('Resource ID (required for operations on a specific item)'),
        filter: z.string().optional().describe('XO filter expression (e.g. "power_state:Running")'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return (e.g. "id,name_label"). Defaults come from the OpenAPI examples. Use "*" for every field.'
          ),
        limit: z.number().optional().describe('Maximum number of results'),
      },
    },
    async ({ operation, id, filter, fields, limit }) => {
      try {
        const op = opsLookup.get(operation)
        if (!op) {
          return { content: [{ type: 'text' as const, text: `Unknown operation: ${operation}` }], isError: true }
        }
        const effectiveFields = fields ?? op.defaultFields
        const query: Record<string, string> = { markdown: 'true' }
        if (filter) query.filter = filter
        if (effectiveFields) query.fields = effectiveFields
        if (limit !== undefined) query.limit = String(limit)
        const data = await getClient().apiRequest(op.method, resolvePath(op.path, id), { query })
        return { content: [{ type: 'text' as const, text: toText(data) }] }
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Failed to query ${domain.tag}: ${formatToolError(error)}` }],
          isError: true,
        }
      }
    }
  )
}

export function registerActionTool(server: McpServer, getClient: () => XoClient, domain: Domain): void {
  if (domain.actionOps.length === 0) return
  const opsLookup = new Map(domain.actionOps.map(op => [op.name, op]))
  const opNames = domain.actionOps.map(op => op.name) as [string, ...string[]]

  server.registerTool(
    `${toolPrefix(domain.tag)}_action`,
    {
      title: `${domain.tag} actions`,
      description: `Perform actions on ${domain.tag} resources. Available operations:\n${describeOps(domain.actionOps)}`,
      annotations: { readOnlyHint: false, destructiveHint: true },
      inputSchema: {
        operation: z.enum(opNames).describe('The action to perform (OpenAPI operationId)'),
        id: z.string().optional().describe('Resource ID (required for most actions)'),
        body: z.record(z.string(), z.unknown()).optional().describe('Request body (for create/update operations)'),
        confirm_token: z
          .string()
          .optional()
          .describe('Confirmation token returned by a prior call for destructive operations'),
      },
    },
    async ({ operation, id, body, confirm_token }) => {
      try {
        const op = opsLookup.get(operation)
        if (!op) {
          return { content: [{ type: 'text' as const, text: `Unknown operation: ${operation}` }], isError: true }
        }
        const client = getClient()

        if (confirm_token) {
          const confirmed = consumeConfirmation(confirm_token)
          if (!confirmed) {
            return {
              content: [
                { type: 'text' as const, text: 'Invalid or expired confirmation token. Please retry the operation.' },
              ],
              isError: true,
            }
          }
          const data = await client.apiRequest(confirmed.method, confirmed.path, { body: confirmed.body })
          return { content: [{ type: 'text' as const, text: toText(data) }] }
        }

        const path = resolvePath(op.path, id)
        if (getRiskLevel(op.method, operation) === 'confirm') {
          const token = createConfirmation(op.method, path, body)
          const preview = [
            '## Confirmation Required',
            '',
            `**Operation**: ${operation}`,
            `**Method**: ${op.method}`,
            `**Path**: ${path}`,
            body ? `**Body**: ${JSON.stringify(body)}` : '',
            '',
            `This operation is classified as **dangerous**. To proceed, call this tool again with \`confirm_token: "${token}"\`.`,
            '',
            '_Token expires in 5 minutes._',
          ]
            .filter(Boolean)
            .join('\n')
          return { content: [{ type: 'text' as const, text: preview }] }
        }

        const data = await client.apiRequest(op.method, path, { body })
        return { content: [{ type: 'text' as const, text: toText(data) }] }
      } catch (error) {
        return {
          content: [
            { type: 'text' as const, text: `Failed to execute ${domain.tag} action: ${formatToolError(error)}` },
          ],
          isError: true,
        }
      }
    }
  )
}

/**
 * Action tools (write ops, with per-operation confirmation for destructive ones)
 * are gated behind XO_MCP_ENABLE_ACTIONS so the default MCP surface stays
 * read-only. Set XO_MCP_ENABLE_ACTIONS=1 to opt in.
 */
const actionsEnabled = process.env.XO_MCP_ENABLE_ACTIONS === '1'

export function registerDomainTools(server: McpServer, getClient: () => XoClient, domain: Domain): void {
  registerQueryTool(server, getClient, domain)
  if (actionsEnabled) registerActionTool(server, getClient, domain)
}
