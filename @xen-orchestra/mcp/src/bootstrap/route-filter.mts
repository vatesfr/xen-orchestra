/**
 * Declarative allowlist for REST routes the MCP refuses to expose as tools.
 * `swagger-parser` consults this during parsing; keep exclusions here (not
 * inline) so the rationale stays auditable in one place.
 */

export interface RouteExclusion {
  pathPattern: RegExp
  reason: string
}

export const EXCLUDED_ROUTES: RouteExclusion[] = [
  {
    pathPattern: /\.(txt|tgz|tar|gz|zip|raw|iso)$/,
    reason: 'Binary/file downloads — these endpoints do not return JSON and are meant for direct REST clients.',
  },
  {
    pathPattern: /\/stats$/,
    reason:
      'Time-series payloads (hundreds to thousands of data points per metric across many metrics) exceed the LLM context window and cannot be meaningfully narrowed via query params since the REST API ignores `fields` on stats endpoints. Callers should query the REST API directly: GET /rest/v0/{resource}/{id}/stats.',
  },
]

export function isExcludedRoute(path: string): RouteExclusion | undefined {
  return EXCLUDED_ROUTES.find(rule => rule.pathPattern.test(path))
}
