import { createLogger } from '@xen-orchestra/log'
import { OpenAPIV3 } from 'openapi-types'

import { PROXIED_METHODS, type KubernetesAclRule } from './kubernetes.routes.mjs'

const log = createLogger('xo:rest-api:kubernetes-openapi-helper')

const CAPI_PATH_PREFIX = '/api'
const CAPI_IGNORED_PATHS = new Set(['/ping'])
const CAPI_SCHEMA_PREFIX = 'Kubernetes'
const SCHEMA_REF_PREFIX = '#/components/schemas/'

// Only the fields describing CAPI's data are imported
const IMPORTED_OPERATION_FIELDS = ['parameters', 'requestBody', 'responses', 'summary'] as const

// Header parameters describing the HTTP protocol itself
const IGNORED_HEADER_PARAMETERS = new Set(['accept', 'content-type'])

const TAG = 'kubernetes'

export type CAPISpecFragment = {
  paths: OpenAPIV3.PathsObject
  schemas: Record<string, OpenAPIV3.SchemaObject>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Turns a CAPI path into the path XO REST API path
 */
export function CAPIPathToXoPath(path: string): string {
  const xoPath = path.startsWith(CAPI_PATH_PREFIX) ? path.slice(CAPI_PATH_PREFIX.length) : path

  return xoPath.length > 1 ? xoPath.replace(/\/+$/, '') : xoPath
}

/**
 * Must be used for both the schema names and the references pointing to them
 */
function prefixSchemaName(name: string): string {
  return CAPI_SCHEMA_PREFIX + name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Prefixes every reference to a CAPI schema
 */
export function prefixSchemaRefs(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(child => prefixSchemaRefs(child))
    return
  }

  if (!isRecord(node)) {
    return
  }

  const { $ref } = node
  if (typeof $ref === 'string' && $ref.startsWith(SCHEMA_REF_PREFIX)) {
    node.$ref = SCHEMA_REF_PREFIX + prefixSchemaName($ref.slice(SCHEMA_REF_PREFIX.length))
  }

  Object.values(node).forEach(child => prefixSchemaRefs(child))
}

/**
 * Converts the OpenAPI 3.1 nullable types to 3.0
 */
export function convertNullableTypes(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(child => convertNullableTypes(child))
    return
  }

  if (!isRecord(node)) {
    return
  }

  const { type } = node
  if (Array.isArray(type)) {
    const types = type.filter(_ => _ !== 'null')

    if (types.length !== type.length) {
      node.nullable = true
    }

    if (types.length === 1) {
      node.type = types[0]
    } else {
      // OpenAPI 3.0 cannot express a union of types, the schema is left untyped
      delete node.type

      if (types.length > 1) {
        log.warn('a union type cannot be converted to OpenAPI 3.0 and is left untyped', { type })
      }
    }
  }

  Object.values(node).forEach(child => convertNullableTypes(child))
}

/**
 *  The parameters describing the HTTP protocol are removed, and the key itself when it becomes empty
 */
function importParameters(parameters: unknown): unknown {
  if (!Array.isArray(parameters)) {
    return parameters
  }

  const importedParameters = parameters.filter(parameter => {
    if (!isRecord(parameter) || parameter.in !== 'header' || typeof parameter.name !== 'string') {
      return true
    }

    return !IGNORED_HEADER_PARAMETERS.has(parameter.name.toLowerCase())
  })

  return importedParameters.length > 0 ? importedParameters : undefined
}

// XO owns the description: it documents how the endpoint can be used, which CAPI does not
// know about
function describeOperation(rule: KubernetesAclRule | undefined): string {
  const description = ['Proxied to the kubernetes API.', '']

  if (rule === undefined) {
    description.push('Only administrators can use this endpoint.')
  } else {
    const { action, resource } = rule.privilege
    description.push('Required privilege:', `- resource: ${resource}, action: ${action}`)
  }

  return description.join('\n')
}

/**
 * Returns the ACL rules declared for an endpoint CAPI does not expose for logging
 */
export function findUnknownAclRules(paths: OpenAPIV3.PathsObject, aclRules: KubernetesAclRule[]): KubernetesAclRule[] {
  return aclRules.filter(rule => paths[rule.endpoint]?.[rule.method] === undefined)
}

/**
 * Extracts from CAPI's OpenAPI specification the paths and schemas to merge into XO's specification
 */
export function transformCAPISpec(spec: unknown, aclRules: KubernetesAclRule[] = []): CAPISpecFragment {
  const fragment: CAPISpecFragment = { paths: {}, schemas: {} }

  if (!isRecord(spec) || !isRecord(spec.paths)) {
    log.warn('CAPI specification is malformed and is ignored')
    return fragment
  }

  const { openapi } = spec
  if (typeof openapi !== 'string' || !openapi.startsWith('3.')) {
    log.warn('CAPI specification version is not supported and is ignored', { openapi })
    return fragment
  }

  // the specification is cloned as it is modified in place below and the caller may reuse it
  const source = structuredClone(spec)

  convertNullableTypes(source)
  prefixSchemaRefs(source)

  for (const [CAPIPath, pathItem] of Object.entries(source.paths as Record<string, unknown>)) {
    if (CAPI_IGNORED_PATHS.has(CAPIPath) || !isRecord(pathItem)) {
      continue
    }

    const xoPath = CAPIPathToXoPath(CAPIPath)

    const operations: Record<string, unknown> = {}
    for (const method of PROXIED_METHODS) {
      const operation = pathItem[method]
      if (!isRecord(operation)) {
        continue
      }

      const importedOperation: Record<string, unknown> = {}
      for (const field of IMPORTED_OPERATION_FIELDS) {
        if (operation[field] !== undefined) {
          importedOperation[field] = operation[field]
        }
      }

      importedOperation.parameters = importParameters(importedOperation.parameters)
      if (importedOperation.parameters === undefined) {
        delete importedOperation.parameters
      }

      importedOperation.tags = [TAG]
      importedOperation.description = describeOperation(
        aclRules.find(rule => rule.method === method && rule.endpoint === xoPath)
      )

      operations[method] = importedOperation
    }

    if (Object.keys(operations).length > 0) {
      fragment.paths[xoPath] = operations as OpenAPIV3.PathItemObject
    }
  }

  const components = source.components
  if (isRecord(components) && isRecord(components.schemas)) {
    for (const [name, schema] of Object.entries(components.schemas)) {
      fragment.schemas[prefixSchemaName(name)] = schema as OpenAPIV3.SchemaObject
    }
  }

  return fragment
}

/**
 * Merges a CAPI fragment into XO's specification
 */
export function mergeFragment(targetSpec: OpenAPIV3.Document, { paths, schemas }: CAPISpecFragment): void {
  Object.assign(targetSpec.paths, paths)

  const components = (targetSpec.components ??= {})
  const targetSchemas = (components.schemas ??= {})
  Object.assign(targetSchemas, schemas)
}
