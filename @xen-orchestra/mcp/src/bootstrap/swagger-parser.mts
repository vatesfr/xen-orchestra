import type { OpenApiSpec, OpenApiOperation, OpenApiParameter } from './swagger-fetcher.mjs'
import { isExcludedRoute } from './route-filter.mjs'

export interface ParameterInfo {
  name: string
  in: string
  required: boolean
  description: string
}

export interface Operation {
  name: string
  method: string
  path: string
  description: string
  parameters: ParameterInfo[]
  /** GET on a collection root (no path param, returns an array). */
  isCollectionList: boolean
  /** Trailing binary download segment (e.g. /vdi.{format}, /backup-log.ndjson). */
  isFileEndpoint: boolean
}

export interface Domain {
  tag: string
  queryOps: Operation[]
  actionOps: Operation[]
}

const TAG_MERGES: Record<string, string> = {
  'vm-templates': 'vms',
  'vm-snapshots': 'vms',
  'vm-controllers': 'vms',
  vdis: 'storage',
  'vdi-snapshots': 'storage',
  srs: 'storage',
  vbds: 'storage',
  pbds: 'storage',
  vifs: 'networks',
  pifs: 'networks',
  'backup-logs': 'backup',
  'restore-logs': 'backup',
  'backup-repositories': 'backup',
  'backup-archives': 'backup',
  schedules: 'backup',
  groups: 'admin',
  servers: 'admin',
  users: 'admin',
  alarms: 'infra',
  messages: 'infra',
  events: 'infra',
  tasks: 'infra',
  proxies: 'system',
  pgpus: 'system',
  pcis: 'system',
  sms: 'system',
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

function singularize(name: string): string {
  if (name.endsWith('ses')) return name.slice(0, -2)
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y'
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1)
  return name
}

function getCollection(path: string): string {
  return path.replace(/^\//, '').split('/')[0]
}

/**
 * Build an operation name from method + path. Verb prefix for CRUD, original
 * collection as suffix when the path's collection differs from its merged
 * domain (e.g. /vdis → `list_vdis` under `storage`).
 *
 *   GET /pools                → list
 *   GET /pools/{id}           → get
 *   GET /pools/{id}/dashboard → dashboard
 *   POST /pools/{id}/actions/X → X
 *   GET /vdis (merged→storage) → list_vdis
 */
function deriveOperationName(method: string, path: string, domainTag: string): string {
  const parts = path.replace(/^\//, '').split('/')
  const collection = parts[0]
  const needsSuffix = collection !== domainTag
  const suffix = needsSuffix ? `_${collection}` : ''
  const singularSuffix = needsSuffix ? `_${singularize(collection)}` : ''

  if (parts.some(p => p.includes('.{format}'))) return `export${singularSuffix}`

  if (method === 'post' && parts.includes('actions')) {
    const actionName = parts.slice(parts.indexOf('actions') + 1).join('_')
    return `${actionName}${singularSuffix}`
  }

  const subSegments = parts.slice(1).filter(p => !p.startsWith('{'))
  const hasTrailingParam = parts.length > 1 && parts[parts.length - 1].startsWith('{')

  if (method === 'delete') {
    return subSegments.length > 0 ? `delete_${subSegments.join('_')}${singularSuffix}` : `delete${singularSuffix}`
  }
  if (method === 'put' || method === 'patch') {
    return subSegments.length > 0 ? `update_${subSegments.join('_')}${singularSuffix}` : `update${singularSuffix}`
  }
  if (method === 'post') {
    return subSegments.length > 0 ? `${subSegments.join('_')}${singularSuffix}` : `create${singularSuffix}`
  }
  if (method === 'get') {
    if (parts.length === 1) return `list${suffix}`
    if (parts.length === 2 && hasTrailingParam) return `get${singularSuffix}`
    if (subSegments.length > 0) {
      const subName = subSegments.join('_')
      return hasTrailingParam ? `get_${subName}${singularSuffix}` : `${subName}${singularSuffix}`
    }
    return hasTrailingParam ? `get${singularSuffix}` : `list${suffix}`
  }

  return `${method}${suffix}`
}

function isQueryMethod(method: string): boolean {
  return method === 'get'
}

function extractParameters(
  opParams: OpenApiParameter[] | undefined,
  pathParams: OpenApiParameter[] | undefined
): ParameterInfo[] {
  const merged = [...(pathParams ?? []), ...(opParams ?? [])]
  const seen = new Set<string>()
  const result: ParameterInfo[] = []

  for (const p of merged) {
    if (seen.has(p.name)) continue
    seen.add(p.name)
    result.push({
      name: p.name,
      in: p.in,
      required: p.required ?? false,
      description: p.description ?? '',
    })
  }
  return result
}

function deduplicateOps(ops: Operation[]): Operation[] {
  const nameCount = new Map<string, number>()
  return ops.map(op => {
    const count = (nameCount.get(op.name) ?? 0) + 1
    nameCount.set(op.name, count)
    if (count > 1) {
      return { ...op, name: `${op.name}_${count}` }
    }
    return op
  })
}

export function parseSwagger(spec: OpenApiSpec): Map<string, Domain> {
  const domains = new Map<string, Domain>()

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue
    if (isExcludedRoute(path)) continue

    const pathLevelParams = pathItem.parameters as OpenApiParameter[] | undefined

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as OpenApiOperation | undefined
      if (!operation) continue

      // Sub-resources (e.g. /vms/{id}/alarms) carry both the sub-resource tag
      // and the parent tag; prefer the parent so they land in the parent domain.
      const tags = operation.tags ?? []
      const originalTag = (tags.length > 1 ? tags[1] : tags[0]) ?? getCollection(path)
      const domainTag = TAG_MERGES[originalTag] ?? originalTag

      if (!domains.has(domainTag)) {
        domains.set(domainTag, { tag: domainTag, queryOps: [], actionOps: [] })
      }

      const domain = domains.get(domainTag)!
      const opName = deriveOperationName(method, path, domainTag)
      const description = operation.summary ?? operation.description ?? `${method.toUpperCase()} ${path}`

      const pathSegments = path.replace(/^\//, '').split('/')
      const lastSegment = pathSegments[pathSegments.length - 1] ?? ''
      const op: Operation = {
        name: opName,
        method: method.toUpperCase(),
        path,
        description,
        parameters: extractParameters(operation.parameters, pathLevelParams),
        isCollectionList: method === 'get' && pathSegments.length === 1,
        isFileEndpoint: /\.\w+$/.test(lastSegment.replace(/\{[^}]+\}/g, '')),
      }

      if (isQueryMethod(method)) {
        domain.queryOps.push(op)
      } else {
        domain.actionOps.push(op)
      }
    }
  }

  for (const domain of domains.values()) {
    domain.queryOps = deduplicateOps(domain.queryOps)
    domain.actionOps = deduplicateOps(domain.actionOps)
  }

  return domains
}
