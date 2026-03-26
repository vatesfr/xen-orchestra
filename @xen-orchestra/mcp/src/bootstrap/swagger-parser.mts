/**
 * Swagger Parser
 *
 * Parses an OpenAPI spec into Domain objects grouped by tag.
 * Merges related tags (e.g., vdis + srs → storage) and classifies
 * each route as either a query or action operation.
 */

import type { OpenApiSpec, OpenApiOperation, OpenApiParameter } from './swagger-fetcher.mjs'

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
}

export interface Domain {
  tag: string
  queryOps: Operation[]
  actionOps: Operation[]
}

/** Maps original swagger tags to merged domain names. */
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

/** Strip trailing 's' for singular form (vdis→vdi, pools→pool, vms→vm). */
function singularize(name: string): string {
  if (name.endsWith('ses')) return name.slice(0, -2) // statuses→status
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y' // entries→entry
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1)
  return name
}

/** Extract the collection name from a path: /vdis/{id}/foo → vdis */
function getCollection(path: string): string {
  const parts = path.replace(/^\//, '').split('/')
  return parts[0]
}

/**
 * Build a unique, readable operation name from method + path.
 *
 * Strategy: use all non-parameter path segments (excluding the collection)
 * to build the name. Prefix with action verb (list/get/create/delete/update).
 * For merged domains, append the original tag's singular form.
 *
 * Examples (non-merged):
 *   GET /pools                    → list
 *   GET /pools/{id}               → get
 *   GET /pools/{id}/dashboard     → dashboard
 *   POST /pools/{id}/actions/X    → X
 *   DELETE /pools/{id}            → delete
 *
 * Examples (merged, e.g. vdis→storage):
 *   GET /vdis                     → list_vdis
 *   GET /vdis/{id}                → get_vdi
 *
 * Examples (cross-collection paths, e.g. /backup/jobs/vm tagged as backup-jobs):
 *   GET /backup/jobs/vm           → list_vm
 *   GET /backup/jobs/vm/{id}      → get_vm
 *   GET /backup/jobs/metadata     → list_metadata
 */
function deriveOperationName(method: string, path: string, _originalTag: string, domainTag: string): string {
  const parts = path.replace(/^\//, '').split('/')
  const collection = parts[0]

  // Need a suffix when the path's collection differs from the domain it belongs to.
  // e.g., /vm-snapshots tagged as vms, or /vdis merged into storage.
  const needsSuffix = collection !== domainTag
  const collectionSingular = singularize(collection)
  const suffix = needsSuffix ? `_${collection}` : ''
  const singularSuffix = needsSuffix ? `_${collectionSingular}` : ''

  // Skip paths that serve file downloads: /collection/{id}.{format}
  if (parts.some(p => p.includes('.{format}'))) {
    return `export${singularSuffix}`
  }

  // POST /collection/{id}/actions/X → action name
  if (method === 'post' && parts.includes('actions')) {
    const actionIdx = parts.indexOf('actions')
    const actionName = parts.slice(actionIdx + 1).join('_')
    return `${actionName}${singularSuffix}`
  }

  // Sub-segments: everything after the collection that isn't a param
  const subSegments = parts.slice(1).filter(p => !p.startsWith('{'))
  const hasTrailingParam = parts.length > 1 && parts[parts.length - 1].startsWith('{')

  // DELETE
  if (method === 'delete') {
    if (subSegments.length > 0) {
      return `delete_${subSegments.join('_')}${singularSuffix}`
    }
    return `delete${singularSuffix}`
  }

  // PUT/PATCH
  if (method === 'put' || method === 'patch') {
    if (subSegments.length > 0) {
      return `update_${subSegments.join('_')}${singularSuffix}`
    }
    return `update${singularSuffix}`
  }

  // POST (non-action)
  if (method === 'post') {
    if (subSegments.length > 0) {
      return `${subSegments.join('_')}${singularSuffix}`
    }
    return `create${singularSuffix}`
  }

  // GET
  if (method === 'get') {
    // GET /collection → list
    if (parts.length === 1) {
      return `list${suffix}`
    }

    // GET /collection/{id} → get
    if (parts.length === 2 && hasTrailingParam) {
      return `get${singularSuffix}`
    }

    // Multi-segment: use sub-segments for the name
    if (subSegments.length > 0) {
      const subName = subSegments.join('_')
      if (hasTrailingParam) {
        return `get_${subName}${singularSuffix}`
      }
      return `${subName}${singularSuffix}`
    }

    return hasTrailingParam ? `get${singularSuffix}` : `list${suffix}`
  }

  return `${method}${suffix}`
}

/** Classify whether an operation is a query (read) or action (write). */
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

/** Deduplicate operation names within a list by appending _2, _3, etc. */
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

    // Skip file/binary endpoints that don't return JSON
    if (/\.(txt|tgz|tar|gz|zip|raw|iso)$/.test(path)) continue

    const pathLevelParams = pathItem.parameters as OpenApiParameter[] | undefined

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as OpenApiOperation | undefined
      if (!operation) continue

      // For sub-resource paths like /vms/{id}/alarms, prefer the parent tag (2nd tag)
      // over the sub-resource tag (1st tag) to keep them in the parent's domain.
      const tags = operation.tags ?? []
      const originalTag = (tags.length > 1 ? tags[1] : tags[0]) ?? getCollection(path)
      const domainTag = TAG_MERGES[originalTag] ?? originalTag
      const isMerged = domainTag !== originalTag

      if (!domains.has(domainTag)) {
        domains.set(domainTag, { tag: domainTag, queryOps: [], actionOps: [] })
      }

      const domain = domains.get(domainTag)!
      const opName = deriveOperationName(method, path, originalTag, domainTag)
      const description = operation.summary ?? operation.description ?? `${method.toUpperCase()} ${path}`

      const op: Operation = {
        name: opName,
        method: method.toUpperCase(),
        path,
        description,
        parameters: extractParameters(operation.parameters, pathLevelParams),
      }

      if (isQueryMethod(method)) {
        domain.queryOps.push(op)
      } else {
        domain.actionOps.push(op)
      }
    }
  }

  // Deduplicate operation names within each domain
  for (const domain of domains.values()) {
    domain.queryOps = deduplicateOps(domain.queryOps)
    domain.actionOps = deduplicateOps(domain.actionOps)
  }

  return domains
}
