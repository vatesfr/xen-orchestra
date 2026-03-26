/**
 * Swagger Fetcher
 *
 * Fetches and validates the OpenAPI spec from the XO REST API at startup.
 * Fatal error if the spec is unreachable — the server refuses to start.
 */

const FETCH_TIMEOUT_MS = 10_000

export interface OpenApiParameter {
  name: string
  in: string
  required?: boolean
  description?: string
  schema?: Record<string, unknown>
}

export interface OpenApiOperation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenApiParameter[]
  requestBody?: Record<string, unknown>
  responses?: Record<string, unknown>
}

export type OpenApiPathItem = {
  [method: string]: OpenApiOperation | OpenApiParameter[] | string | undefined
  parameters?: OpenApiParameter[]
}

export interface OpenApiSpec {
  openapi?: string
  info: { title: string; version: string }
  paths: Record<string, OpenApiPathItem>
  tags?: Array<{ name: string; description?: string }>
}

export async function fetchSwaggerSpec(baseUrl: string, authHeaders: Record<string, string>): Promise<OpenApiSpec> {
  const url = `${baseUrl}/rest/v0/docs/swagger.json`

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        ...authHeaders,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch (cause) {
    throw new Error(`Failed to fetch OpenAPI spec from ${url}. Is the XO server running?`, { cause })
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`)
  }

  let spec: OpenApiSpec
  try {
    spec = (await response.json()) as OpenApiSpec
  } catch (cause) {
    throw new Error('OpenAPI spec returned invalid JSON', { cause })
  }

  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('Invalid OpenAPI spec: missing "paths" object')
  }

  if (!spec.info || !spec.info.title) {
    throw new Error('Invalid OpenAPI spec: missing "info.title"')
  }

  return spec
}
