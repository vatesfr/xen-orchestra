import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { OpenAPIV3 } from 'openapi-types'

import {
  CAPIPathToXoPath,
  convertNullableTypes,
  findUnknownAclRules,
  mergeFragment,
  prefixSchemaRefs,
  transformCAPISpec,
} from './kubernetes.openapi.helper.mjs'
import type { KubernetesAclRule } from './kubernetes.routes.mjs'

const READ_CLUSTERS: KubernetesAclRule = {
  method: 'get',
  endpoint: '/kubernetes/clusters',
  privilege: { resource: 'kubernetes-cluster', action: 'read' },
}

const CAPI_PATHS = ['/kubernetes/clusters', '/kubernetes/clusters/{id}/config', '/kubernetes/quotas']

const CAPI_SPEC_FIXTURE = {
  openapi: '3.1.0',
  info: { title: 'Cluster service', version: '0.1.0' },
  components: {
    schemas: {
      ClusterCreateParams: {
        description: 'ClusterCreateParams schema',
        properties: {
          controlPlaneReplicas: { format: 'int32', minimum: 1, type: 'integer' },
          name: { type: 'string' },
        },
        required: ['controlPlaneReplicas', 'name'],
        type: 'object',
      },
      ClusterInfo: {
        description: 'ClusterInfo schema',
        properties: {
          name: { type: 'string' },
          phase: { type: 'string' },
        },
        required: ['name', 'phase'],
        type: 'object',
      },
      ErrorItem: {
        properties: {
          more: { description: 'Additional information about the error', type: ['object', 'null'] },
          name: { type: 'string' },
        },
        required: ['name'],
        type: 'object',
      },
      HTTPError: {
        description: 'HTTPError schema',
        properties: {
          detail: { type: 'string' },
          errors: { items: { $ref: '#/components/schemas/ErrorItem' }, type: ['array', 'null'] },
          status: { example: 403, type: 'integer' },
        },
        type: 'object',
      },
      string: { description: 'string schema', type: 'string' },
    },
  },
  paths: {
    '/api/kubernetes/clusters/': {
      get: {
        description: '#### Controller: \n\n`capv-proxy/internal/components/webserver/handlers`\n\n---\n\n',
        operationId: 'GET_/api/kubernetes/clusters/',
        parameters: [{ in: 'header', name: 'Accept', schema: { type: 'string' } }],
        responses: {
          '200': {
            content: {
              'application/json': { schema: { items: { $ref: '#/components/schemas/ClusterInfo' }, type: 'array' } },
            },
            description: 'OK',
          },
          '400': {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HTTPError' } } },
            description: 'Bad Request _(validation or deserialization error)_',
          },
        },
        summary: 'get clusters',
        tags: ['Clusters'],
      },
      post: {
        operationId: 'POST_/api/kubernetes/clusters/',
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ClusterCreateParams' } } },
          required: true,
        },
        responses: {
          '200': {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ClusterInfo' } } },
            description: 'OK',
          },
        },
        summary: 'create cluster',
        tags: ['Clusters'],
      },
    },
    '/api/kubernetes/clusters/{id}/config': {
      get: {
        operationId: 'GET_/api/kubernetes/clusters/:id/config',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/string' } } },
            description: 'OK',
          },
        },
        summary: 'get cluster config',
        tags: ['Clusters'],
      },
    },
    // not mounted by XO: must be reported as drift
    '/api/kubernetes/quotas': {
      get: {
        responses: { '200': { description: 'OK' } },
        summary: 'get quotas',
        tags: ['Quotas'],
      },
    },
    // never exposed by XO: must neither be imported nor reported as drift
    '/ping': {
      get: {
        responses: { '200': { description: 'OK' } },
        summary: 'ping',
        tags: ['Health'],
      },
    },
  },
}

const transformFixture = (aclRules: KubernetesAclRule[] = []) => transformCAPISpec(CAPI_SPEC_FIXTURE, aclRules)

describe('CAPIPathToXoPath', () => {
  it('strips the CAPI prefix and the trailing slash', () => {
    assert.equal(CAPIPathToXoPath('/api/kubernetes/clusters/'), '/kubernetes/clusters')
  })

  it('keeps the path parameters and the sub paths', () => {
    assert.equal(CAPIPathToXoPath('/api/kubernetes/clusters/{id}/nodes'), '/kubernetes/clusters/{id}/nodes')
  })

  it('strips repeated trailing slashes', () => {
    assert.equal(CAPIPathToXoPath('/api/kubernetes/clusters///'), '/kubernetes/clusters')
  })

  it('leaves a path without the CAPI prefix untouched', () => {
    assert.equal(CAPIPathToXoPath('/ping'), '/ping')
  })

  it('keeps the root path', () => {
    assert.equal(CAPIPathToXoPath('/api/'), '/')
  })
})

describe('convertNullableTypes', () => {
  it('converts a nullable type', () => {
    const schema = { type: ['object', 'null'] }
    convertNullableTypes(schema)
    assert.deepEqual(schema, { type: 'object', nullable: true })
  })

  it('converts a nullable array', () => {
    const schema = { items: { type: 'string' }, type: ['array', 'null'] }
    convertNullableTypes(schema)
    assert.deepEqual(schema, { items: { type: 'string' }, type: 'array', nullable: true })
  })

  it('converts a type which can only be null', () => {
    const schema = { type: ['null'] }
    convertNullableTypes(schema)
    assert.deepEqual(schema, { nullable: true })
  })

  it('leaves untyped a union of types, which OpenAPI 3.0 cannot express', () => {
    const schema = { type: ['string', 'number'] }
    convertNullableTypes(schema)
    assert.deepEqual(schema, {})
  })

  it('leaves a single type untouched', () => {
    const schema = { type: 'string' }
    convertNullableTypes(schema)
    assert.deepEqual(schema, { type: 'string' })
  })

  it('converts nested types', () => {
    const schema = {
      properties: { errors: { items: { properties: { more: { type: ['object', 'null'] } } } } },
      type: 'object',
    }
    convertNullableTypes(schema)
    assert.deepEqual(schema.properties.errors.items.properties.more, { type: 'object', nullable: true })
  })
})

describe('prefixSchemaRefs', () => {
  it('prefixes a reference', () => {
    const node = { $ref: '#/components/schemas/ClusterInfo' }
    prefixSchemaRefs(node)
    assert.equal(node.$ref, '#/components/schemas/KubernetesClusterInfo')
  })

  it('prefixes nested references', () => {
    const node = { content: [{ schema: { items: { $ref: '#/components/schemas/ErrorItem' } } }] }
    prefixSchemaRefs(node)
    assert.equal(node.content[0].schema.items.$ref, '#/components/schemas/KubernetesErrorItem')
  })

  it('leaves the references which do not point to a schema untouched', () => {
    const node = { $ref: '#/components/parameters/id' }
    prefixSchemaRefs(node)
    assert.equal(node.$ref, '#/components/parameters/id')
  })
})

describe('transformCAPISpec', () => {
  it('extracts every CAPI path, as every CAPI endpoint is proxied', () => {
    const { paths } = transformFixture()
    assert.deepEqual(Object.keys(paths).sort(), CAPI_PATHS.slice().sort())
  })

  it('does not extract the paths which are never exposed by XO', () => {
    assert.equal(transformFixture().paths['/ping'], undefined)
  })

  it('only imports the fields describing CAPI data, and the ones owned by XO', () => {
    // this endpoint has no parameter left once the `Accept` header one is removed
    const operation = transformFixture().paths['/kubernetes/clusters']!.get!
    assert.deepEqual(Object.keys(operation).sort(), ['description', 'responses', 'summary', 'tags'])
    assert.deepEqual(operation.tags, ['kubernetes'])

    const parameterizedOperation = transformFixture().paths['/kubernetes/clusters/{id}/config']!.get!
    assert.deepEqual(Object.keys(parameterizedOperation).sort(), [
      'description',
      'parameters',
      'responses',
      'summary',
      'tags',
    ])
  })

  it('removes the parameters describing the HTTP protocol', () => {
    // the `Accept` header parameter is the only parameter of this endpoint
    assert.equal(transformFixture().paths['/kubernetes/clusters']!.get!.parameters, undefined)

    // the path parameters are kept
    assert.deepEqual(transformFixture().paths['/kubernetes/clusters/{id}/config']!.get!.parameters, [
      { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
    ])
  })

  it('documents that an endpoint without privilege can only be used by administrators', () => {
    const { description } = transformFixture().paths['/kubernetes/clusters']!.get!
    assert.match(description!, /Only administrators/)
  })

  it('documents the privilege required by an endpoint', () => {
    const { description } = transformFixture([READ_CLUSTERS]).paths['/kubernetes/clusters']!.get!
    assert.match(description!, /resource: kubernetes-cluster, action: read/)
  })

  it('prefixes the schemas', () => {
    assert.deepEqual(Object.keys(transformFixture().schemas).sort(), [
      'KubernetesClusterCreateParams',
      'KubernetesClusterInfo',
      'KubernetesErrorItem',
      'KubernetesHTTPError',
      'KubernetesString',
    ])
  })

  it('every reference of the extracted paths points to an extracted schema', () => {
    const { paths, schemas } = transformFixture()

    const refs: string[] = []
    const collectRefs = (node: unknown) => {
      if (Array.isArray(node)) {
        return node.forEach(collectRefs)
      }
      if (typeof node !== 'object' || node === null) {
        return
      }
      const { $ref } = node as { $ref?: unknown }
      if (typeof $ref === 'string') {
        refs.push($ref)
      }
      Object.values(node).forEach(collectRefs)
    }
    collectRefs(paths)

    assert.ok(refs.length > 0)
    for (const ref of refs) {
      assert.ok(
        schemas[ref.replace('#/components/schemas/', '')] !== undefined,
        `${ref} does not point to an extracted schema`
      )
    }
  })

  it('converts the nullable types of the extracted schemas', () => {
    const { schemas } = transformFixture()

    assert.deepEqual(schemas.KubernetesHTTPError!.properties!.errors, {
      items: { $ref: '#/components/schemas/KubernetesErrorItem' },
      type: 'array',
      nullable: true,
    })
    assert.deepEqual(schemas.KubernetesErrorItem!.properties!.more, {
      description: 'Additional information about the error',
      type: 'object',
      nullable: true,
    })
  })

  it('does not modify the given specification', () => {
    const spec = structuredClone(CAPI_SPEC_FIXTURE)
    transformCAPISpec(spec)
    assert.deepEqual(spec, CAPI_SPEC_FIXTURE)
  })

  it('ignores a malformed specification', () => {
    const empty = { paths: {}, schemas: {} }
    assert.deepEqual(transformCAPISpec(undefined), empty)
    assert.deepEqual(transformCAPISpec({}), empty)
    assert.deepEqual(transformCAPISpec({ openapi: '3.0.0' }), empty)
  })

  it('ignores an unsupported specification version', () => {
    assert.deepEqual(transformCAPISpec({ ...CAPI_SPEC_FIXTURE, openapi: '2.0' }), { paths: {}, schemas: {} })
  })
})

describe('mergeFragment', () => {
  const makeTargetSpec = (): OpenAPIV3.Document => ({
    openapi: '3.0.0',
    info: { title: 'xo-server', version: '1.0.0' },
    paths: {
      '/vms': { get: { responses: { '200': { description: 'Success' } } } },
    },
  })

  it('adds the CAPI paths, which XO does not declare', () => {
    const targetSpec = makeTargetSpec()
    mergeFragment(targetSpec, transformFixture())

    assert.deepEqual(Object.keys(targetSpec.paths).sort(), ['/vms', ...CAPI_PATHS].sort())
  })

  it('adds the responses and their schemas', () => {
    const targetSpec = makeTargetSpec()
    mergeFragment(targetSpec, transformFixture())

    const response = targetSpec.paths['/kubernetes/clusters']!.get!.responses['200'] as OpenAPIV3.ResponseObject
    assert.equal(response.description, 'OK')
    assert.deepEqual(response.content!['application/json'].schema, {
      items: { $ref: '#/components/schemas/KubernetesClusterInfo' },
      type: 'array',
    })
  })

  it('adds the request bodies', () => {
    const targetSpec = makeTargetSpec()
    mergeFragment(targetSpec, transformFixture())

    assert.deepEqual(targetSpec.paths['/kubernetes/clusters']!.post!.requestBody, {
      content: { 'application/json': { schema: { $ref: '#/components/schemas/KubernetesClusterCreateParams' } } },
      required: true,
    })
  })

  it('does not modify the paths of the other routes', () => {
    const targetSpec = makeTargetSpec()
    mergeFragment(targetSpec, transformFixture())

    assert.deepEqual(targetSpec.paths['/vms'], { get: { responses: { '200': { description: 'Success' } } } })
  })

  it('adds the schemas', () => {
    const targetSpec = makeTargetSpec()
    mergeFragment(targetSpec, transformFixture())

    assert.notEqual(targetSpec.components!.schemas!.KubernetesClusterInfo, undefined)
  })

  it('gives the same result when applied twice', () => {
    const targetSpec = makeTargetSpec()

    mergeFragment(targetSpec, transformFixture())
    const once = structuredClone(targetSpec)

    mergeFragment(targetSpec, transformFixture())
    assert.deepEqual(targetSpec, once)
  })
})

describe('findUnknownAclRules', () => {
  it('returns the rules declared for an endpoint CAPI does not expose', () => {
    const unknownRule: KubernetesAclRule = {
      method: 'get',
      endpoint: '/kubernetes/quotas/{id}',
      privilege: { resource: 'kubernetes-cluster', action: 'read' },
    }

    const { paths } = transformFixture()
    assert.deepEqual(findUnknownAclRules(paths, [READ_CLUSTERS, unknownRule]), [unknownRule])
  })

  it('takes the method into account', () => {
    const { paths } = transformFixture()
    assert.deepEqual(findUnknownAclRules(paths, [{ ...READ_CLUSTERS, method: 'patch' }]), [
      { ...READ_CLUSTERS, method: 'patch' },
    ])
  })
})
