/**
 * Tool Generator
 *
 * Generates and registers MCP tools from parsed Domain definitions.
 * Each domain produces up to 2 tools: {tag}_query and {tag}_action.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../xo-client.mjs'
import type { Domain, Operation } from './swagger-parser.mjs'
import { getRiskLevel, createConfirmation, consumeConfirmation } from './risk-config.mjs'
import { formatResponse } from '../formatters/index.mjs'
import { formatToolError } from '../helpers/tool-error.mjs'

/** Build a description string listing available operations. */
function buildOpsDescription(ops: Operation[]): string {
  return ops.map(op => `  - "${op.name}": ${op.description}`).join('\n')
}

/** Resolve path template: replace {id} with the actual id value. */
function resolvePath(pathTemplate: string, id?: string): string {
  if (!id) return pathTemplate
  // Replace any {param} in the path with the id value
  return pathTemplate.replace(/\{[^}]+\}/g, encodeURIComponent(id))
}

/**
 * Default fields per collection — matches what the formatters expect.
 * XO REST API returns hrefs (not objects) when no fields are specified,
 * so we always request at least these fields for list operations.
 */
const COLLECTION_DEFAULT_FIELDS: Record<string, string> = {
  pools: 'id,name_label,name_description,HA_enabled,auto_poweron,master,default_SR,cpus',
  hosts: 'id,name_label,power_state,productBrand,version,memory,address,CPUs,$pool',
  vms: 'id,name_label,power_state,CPUs,memory,os_version,mainIpAddress,tags,$container,name_description',
  'vm-templates': 'id,name_label,power_state,CPUs,memory',
  'vm-snapshots': 'id,name_label,snapshot_time,$snapshot_of',
  'vm-controllers': 'id,name_label,power_state',
  vdis: 'id,name_label,name_description,size,usage,VDI_type,$SR',
  'vdi-snapshots': 'id,name_label,size,$SR',
  srs: 'id,name_label,SR_type,physical_size,physical_utilisation',
  vbds: 'id,VDI,VM,type,attached',
  pbds: 'id,host,SR,currently_attached',
  networks: 'id,name_label,name_description,MTU,bridge',
  vifs: 'id,network,VM,MAC,attached',
  pifs: 'id,network,host,IP,device,attached',
  tasks: 'id,name_label,status,progress,created,finished',
  alarms: 'id,name_label,body',
  messages: 'id,name,body,time',
  'backup-jobs': 'id,name,type,mode',
  'backup-logs': 'id,jobId,status,start,end',
  'restore-logs': 'id,jobId,status,start,end',
  'backup-repositories': 'id,name,url,enabled',
  'backup-archives': 'id,name,size',
  schedules: 'id,name,cron,enabled,jobId',
  users: 'id,email,permission',
  groups: 'id,name',
  servers: 'id,host,status,enabled',
  events: 'id,type,timestamp',
}
const FALLBACK_FIELDS = 'id,name_label,name_description'

/** Get default fields for a path — for sub-resources, prefer the last segment's fields. */
function getDefaultFields(path: string): string {
  const parts = path
    .replace(/^\//, '')
    .split('/')
    .filter(p => !p.startsWith('{'))
  // For sub-resource paths like /pools/{id}/messages, use the last non-param segment first
  if (parts.length > 1) {
    const lastSub = parts[parts.length - 1]
    if (COLLECTION_DEFAULT_FIELDS[lastSub]) {
      return COLLECTION_DEFAULT_FIELDS[lastSub]
    }
  }
  // Fall back to the collection (first segment)
  const collection = parts[0]
  return COLLECTION_DEFAULT_FIELDS[collection] ?? FALLBACK_FIELDS
}

/** Merge user-provided fields with defaults so formatters always get required data. */
function mergeFields(userFields: string | undefined, defaultFields: string): string {
  if (!userFields) return defaultFields
  const defaults = new Set(defaultFields.split(','))
  const user = userFields.split(',')
  // Add user-requested fields that aren't already in defaults
  for (const f of user) {
    defaults.add(f.trim())
  }
  return [...defaults].join(',')
}

/** Build query parameters from the tool input. */
function buildQuery(
  filter?: string,
  fields?: string,
  limit?: number,
  isListOp?: boolean,
  path?: string
): Record<string, string> | undefined {
  const query: Record<string, string> = {}
  if (filter) query.filter = filter
  if (isListOp && path) {
    // Always include default fields for list ops, merge with user fields
    query.fields = mergeFields(fields, getDefaultFields(path))
  } else if (fields) {
    query.fields = fields
  }
  if (limit !== undefined) query.limit = String(limit)
  return Object.keys(query).length > 0 ? query : undefined
}

export function registerQueryTool(server: McpServer, getClient: () => XoClient, domain: Domain): void {
  if (domain.queryOps.length === 0) return

  const toolName = `${domain.tag}_query`
  const opNames = domain.queryOps.map(op => op.name) as [string, ...string[]]
  const opsLookup = new Map(domain.queryOps.map(op => [op.name, op]))

  const description = [
    `Query ${domain.tag} resources. Available operations:`,
    buildOpsDescription(domain.queryOps),
  ].join('\n')

  server.registerTool(
    toolName,
    {
      title: `Query ${domain.tag}`,
      description,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
      inputSchema: {
        operation: z.enum(opNames).describe('The query operation to perform'),
        id: z.string().optional().describe('Resource ID (required for get, stats, and sub-resource operations)'),
        filter: z.string().optional().describe('Filter expression (for list operations)'),
        fields: z
          .string()
          .optional()
          .describe(
            'Comma-separated fields to return. Leave empty to use optimized defaults. Only set this to narrow results (e.g. "id,name_label")'
          ),
        limit: z.number().optional().describe('Maximum number of results (for list operations)'),
      },
    },
    async ({ operation, id, filter, fields, limit }) => {
      try {
        const op = opsLookup.get(operation)
        if (!op) {
          return {
            content: [{ type: 'text' as const, text: `Unknown operation: ${operation}` }],
            isError: true,
          }
        }

        const client = getClient()
        const path = resolvePath(op.path, id)
        const isListOp = operation.startsWith('list') || (!id && op.method === 'GET')
        // Don't add default fields for file endpoints (.txt, .tgz, .{format})
        const isFileEndpoint = /\.\w+$/.test(
          op.path
            .split('/')
            .pop()
            ?.replace(/\{[^}]+\}/g, '') ?? ''
        )
        // Also apply default fields for single-item GET when no fields specified
        const needsDefaults = !isFileEndpoint && (isListOp || (op.method === 'GET' && !fields))
        const query = buildQuery(filter, fields, limit, needsDefaults, op.path)
        const data = await client.apiRequest(op.method, path, { query })
        const text = formatResponse(domain.tag, operation, data)

        return { content: [{ type: 'text' as const, text }] }
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

  const toolName = `${domain.tag}_action`
  const opNames = domain.actionOps.map(op => op.name) as [string, ...string[]]
  const opsLookup = new Map(domain.actionOps.map(op => [op.name, op]))

  const description = [
    `Perform actions on ${domain.tag} resources. Available operations:`,
    buildOpsDescription(domain.actionOps),
  ].join('\n')

  server.registerTool(
    toolName,
    {
      title: `${domain.tag} actions`,
      description,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      inputSchema: {
        operation: z.enum(opNames).describe('The action to perform'),
        id: z.string().optional().describe('Resource ID (required for most actions)'),
        body: z.record(z.string(), z.unknown()).optional().describe('Request body (for create/update operations)'),
        confirm_token: z
          .string()
          .optional()
          .describe('Confirmation token for dangerous operations (returned by a prior call without this field)'),
      },
    },
    async ({ operation, id, body, confirm_token }) => {
      try {
        const op = opsLookup.get(operation)
        if (!op) {
          return {
            content: [{ type: 'text' as const, text: `Unknown operation: ${operation}` }],
            isError: true,
          }
        }

        const client = getClient()

        // If a confirm_token is provided, consume it and execute
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
          const data = await client.apiRequest(confirmed.method, confirmed.path, {
            body: confirmed.body,
          })
          return {
            content: [{ type: 'text' as const, text: formatResponse(domain.tag, operation, data) }],
          }
        }

        const path = resolvePath(op.path, id)
        const riskLevel = getRiskLevel(op.method, domain.tag, operation)

        // For dangerous operations, require confirmation
        if (riskLevel === 'confirm') {
          const token = createConfirmation(op.method, path, body)
          const preview = [
            `## Confirmation Required`,
            '',
            `**Operation**: ${operation}`,
            `**Method**: ${op.method}`,
            `**Path**: ${path}`,
            body ? `**Body**: ${JSON.stringify(body)}` : '',
            '',
            `This operation is classified as **dangerous**. To proceed, call this tool again with:`,
            `\`confirm_token: "${token}"\``,
            '',
            '_Token expires in 5 minutes._',
          ]
            .filter(Boolean)
            .join('\n')

          return { content: [{ type: 'text' as const, text: preview }] }
        }

        // Direct execution
        const data = await client.apiRequest(op.method, path, { body })
        return {
          content: [{ type: 'text' as const, text: formatResponse(domain.tag, operation, data) }],
        }
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

/** Register all tools for a domain (query + optional action). */
export function registerDomainTools(server: McpServer, getClient: () => XoClient, domain: Domain): void {
  registerQueryTool(server, getClient, domain)
  // Action tools are disabled for now — uncomment when ready for write operations
  // registerActionTool(server, getClient, domain)
}
