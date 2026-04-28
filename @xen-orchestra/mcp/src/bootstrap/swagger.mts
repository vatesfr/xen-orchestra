import { isExcludedRoute } from './route-filter.mjs'

const FETCH_TIMEOUT_MS = 10_000
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

interface OpenApiExample {
  value?: unknown
}

interface OpenApiResponse {
  content?: Record<
    string,
    {
      examples?: Record<string, OpenApiExample>
      schema?: Record<string, unknown>
    }
  >
}

export interface OpenApiOperation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  responses?: Record<string, OpenApiResponse>
}

interface OpenApiPathItem {
  [method: string]: OpenApiOperation | undefined
}

export interface OpenApiSpec {
  info: { title: string; version: string }
  paths: Record<string, OpenApiPathItem>
}

export interface Operation {
  /** Primary key used by tools — `operationId` from the spec (tsoa emits one per route). */
  name: string
  method: string
  path: string
  description: string
  /**
   * Comma-separated list of fields to request when the caller doesn't supply
   * their own `fields` query param. Extracted from the OpenAPI example the
   * server authors ship with the spec — whatever fields they chose to show in
   * their own docs. Undefined when the spec has no usable example.
   */
  defaultFields?: string
}

export interface Domain {
  tag: string
  queryOps: Operation[]
  actionOps: Operation[]
}

export interface ParseOptions {
  /** operationIds to skip entirely (never exposed as a tool enum value). */
  denyList?: Iterable<string>
}

export async function fetchSwaggerSpec(baseUrl: string, authHeaders: Record<string, string>): Promise<OpenApiSpec> {
  const url = `${baseUrl}/rest/v0/docs/swagger.json`

  let response: Response
  try {
    response = await fetch(url, {
      headers: { ...authHeaders, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch (cause) {
    throw new Error(`Failed to fetch OpenAPI spec from ${url}. Is the XO server running?`, { cause })
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`)
  }

  const spec = (await response.json().catch(cause => {
    throw new Error('OpenAPI spec returned invalid JSON', { cause })
  })) as OpenApiSpec

  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('Invalid OpenAPI spec: missing "paths" object')
  }

  return spec
}

/** Fallback when the spec does not carry operationIds. */
function deriveOperationId(method: string, path: string): string {
  const segments = path.replace(/^\//, '').replace(/[{}]/g, '').split('/').filter(Boolean)
  return [method.toLowerCase(), ...segments].join('_')
}

/**
 * Pull display fields from the first example response object in the spec.
 * Used as the default `fields` query when the caller doesn't pass their own —
 * this matches what the REST API authors chose to show in their docs, so the
 * MCP output stays readable without any hand-curated mapping.
 */
function extractDefaultFields(op: OpenApiOperation): string | undefined {
  for (const status of ['200', '201']) {
    const response = op.responses?.[status]
    if (!response?.content) continue
    for (const mediaType of Object.values(response.content)) {
      for (const example of Object.values(mediaType.examples ?? {})) {
        const value = example.value
        const candidate = Array.isArray(value) ? value[0] : value
        if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
          const keys = Object.keys(candidate).filter(k => k !== 'href')
          if (keys.length > 0) return keys.join(',')
        }
      }
    }
  }
  return undefined
}

/**
 * Group operations by the **first path segment** — sub-resources (e.g.
 * `/hosts/{id}/alarms`, `/pools/{id}/messages`) land under their parent
 * domain, which matches how an agent navigates ("alarms *of this host*").
 * Server-side tags are ignored here because tsoa emits the method-level tag
 * first (`tags[0] = 'alarms'` on `/hosts/{id}/alarms`), which would route the
 * endpoint away from its parent.
 */
export function parseSwagger(spec: OpenApiSpec, opts: ParseOptions = {}): Map<string, Domain> {
  const deny = new Set(opts.denyList ?? [])
  const domains = new Map<string, Domain>()

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue
    if (isExcludedRoute(path)) continue

    for (const method of HTTP_METHODS) {
      const op = pathItem[method]
      if (!op) continue

      const operationId = op.operationId ?? deriveOperationId(method, path)
      if (deny.has(operationId)) continue

      const tag = path.replace(/^\//, '').split('/')[0]

      if (!domains.has(tag)) domains.set(tag, { tag, queryOps: [], actionOps: [] })
      const domain = domains.get(tag)!

      const operation: Operation = {
        name: operationId,
        method: method.toUpperCase(),
        path,
        description: op.summary ?? op.description ?? `${method.toUpperCase()} ${path}`,
        defaultFields: method === 'get' ? extractDefaultFields(op) : undefined,
      }
      ;(method === 'get' ? domain.queryOps : domain.actionOps).push(operation)
    }
  }

  return domains
}
