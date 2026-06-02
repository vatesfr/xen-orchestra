import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseSwagger, type OpenApiSpec, type OpenApiOperation } from './swagger.mjs'

type Exposure = 'allow' | 'confirm' | 'deny'

/** Build a spec where every operation defaults to `x-mcp-exposure: 'allow'`. */
function spec(paths: OpenApiSpec['paths']): OpenApiSpec {
  return { info: { title: 'Test', version: '1.0.0' }, paths: applyDefaultExposure(paths) }
}

function applyDefaultExposure(paths: OpenApiSpec['paths']): OpenApiSpec['paths'] {
  const out: OpenApiSpec['paths'] = {}
  for (const [path, item] of Object.entries(paths)) {
    if (!item) continue
    const newItem: Record<string, OpenApiOperation | undefined> = {}
    for (const [method, operation] of Object.entries(item)) {
      if (!operation) continue
      newItem[method] =
        operation['x-mcp-exposure'] !== undefined ? operation : { ...operation, 'x-mcp-exposure': 'allow' }
    }
    out[path] = newItem
  }
  return out
}

/** Build a spec without any auto-defaulting, for exposure-focused tests. */
function rawSpec(paths: OpenApiSpec['paths']): OpenApiSpec {
  return { info: { title: 'Test', version: '1.0.0' }, paths }
}

function op(props: Partial<OpenApiOperation> & { exposure?: Exposure }): OpenApiOperation {
  const { exposure, ...rest } = props
  const result = { ...rest } as OpenApiOperation
  if (exposure !== undefined) result['x-mcp-exposure'] = exposure
  return result
}

describe('parseSwagger', () => {
  it('uses operationId as the operation name', () => {
    const domains = parseSwagger(
      spec({
        '/vms': { get: { tags: ['vms'], operationId: 'GetVms', summary: 'List VMs' } },
        '/vms/{id}': { get: { tags: ['vms'], operationId: 'GetVm', summary: 'Get a VM' } },
      })
    )
    const vms = domains.get('vms')!
    assert.deepStrictEqual(vms.queryOps.map(o => o.name).sort(), ['GetVm', 'GetVms'])
  })

  it('falls back to method_path when operationId is missing', () => {
    const domains = parseSwagger(spec({ '/custom/{id}': { get: { tags: ['custom'] } } }))
    const custom = domains.get('custom')!
    assert.strictEqual(custom.queryOps[0].name, 'get_custom_id')
  })

  it('groups sub-resources under their parent path segment', () => {
    const domains = parseSwagger(
      spec({
        '/alarms': { get: { tags: ['alarms'], operationId: 'GetAlarms' } },
        '/pools/{id}/alarms': { get: { tags: ['alarms', 'pools'], operationId: 'GetPoolAlarms' } },
        '/vms/{id}/alarms': { get: { tags: ['alarms', 'vms'], operationId: 'GetVmAlarms' } },
      })
    )
    assert.deepStrictEqual(
      domains.get('pools')!.queryOps.map(o => o.name),
      ['GetPoolAlarms']
    )
    assert.deepStrictEqual(
      domains.get('vms')!.queryOps.map(o => o.name),
      ['GetVmAlarms']
    )
    assert.deepStrictEqual(
      domains.get('alarms')!.queryOps.map(o => o.name),
      ['GetAlarms']
    )
  })

  it('extracts defaultFields from OpenAPI response examples', () => {
    const domains = parseSwagger(
      spec({
        '/hosts': {
          get: {
            tags: ['hosts'],
            operationId: 'GetHosts',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    examples: {
                      listForm: {
                        value: [{ id: 'h1', name_label: 'Host 1', productBrand: 'XCP-ng', href: '/rest/v0/hosts/h1' }],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    )
    const hosts = domains.get('hosts')!
    assert.strictEqual(hosts.queryOps[0].defaultFields, 'id,name_label,productBrand')
  })

  it('leaves defaultFields undefined when the spec has no usable example', () => {
    const domains = parseSwagger(spec({ '/foo': { get: { tags: ['foo'], operationId: 'GetFoo' } } }))
    assert.strictEqual(domains.get('foo')!.queryOps[0].defaultFields, undefined)
  })

  it('does not populate defaultFields on non-GET operations', () => {
    const domains = parseSwagger(
      spec({
        '/vms': {
          post: {
            tags: ['vms'],
            operationId: 'CreateVm',
            responses: {
              '201': { content: { 'application/json': { examples: { ex: { value: { id: 'vm1' } } } } } },
            },
          },
        },
      })
    )
    assert.strictEqual(domains.get('vms')!.actionOps[0].defaultFields, undefined)
  })

  it('denyList skips matching operationIds entirely', () => {
    const domains = parseSwagger(
      spec({
        '/vms/{id}': {
          delete: { tags: ['vms'], operationId: 'DeleteVm' },
          get: { tags: ['vms'], operationId: 'GetVm' },
        },
      }),
      { denyList: ['DeleteVm'] }
    )
    const vms = domains.get('vms')!
    assert.strictEqual(vms.queryOps.length, 1)
    assert.strictEqual(vms.actionOps.length, 0, 'DeleteVm must not land in actionOps')
  })

  it('splits GETs into queryOps and other verbs into actionOps', () => {
    const domains = parseSwagger(
      spec({
        '/vms': {
          get: { tags: ['vms'], operationId: 'GetVms' },
          post: { tags: ['vms'], operationId: 'CreateVm' },
        },
        '/vms/{id}': {
          put: { tags: ['vms'], operationId: 'UpdateVm' },
          delete: { tags: ['vms'], operationId: 'DeleteVm' },
        },
      })
    )
    const vms = domains.get('vms')!
    assert.deepStrictEqual(
      vms.queryOps.map(o => o.name),
      ['GetVms']
    )
    assert.deepStrictEqual(vms.actionOps.map(o => o.name).sort(), ['CreateVm', 'DeleteVm', 'UpdateVm'])
  })

  it('honors route-filter exclusions (stats, binary, format-param)', () => {
    const domains = parseSwagger(
      spec({
        '/pools/{id}/stats': { get: { tags: ['pools'], operationId: 'GetPoolStats' } },
        '/backup-archives/{id}.tgz': { get: { tags: ['backup-archives'], operationId: 'DownloadArchive' } },
        '/vdis/{id}/vdi.{format}': { put: { tags: ['vdis'], operationId: 'ImportVdi' } },
      })
    )
    assert.strictEqual(domains.size, 0, `unexpected domains: ${[...domains.keys()].join(', ')}`)
  })

  it('uses path fallback when tags are missing', () => {
    const domains = parseSwagger(spec({ '/custom-thing': { get: { operationId: 'GetCustomThing' } } }))
    assert.ok(domains.has('custom-thing'))
  })

  describe('x-mcp-exposure filtering', () => {
    it("exposes an operation tagged 'allow'", () => {
      const domains = parseSwagger(
        rawSpec({
          '/vms': { get: op({ operationId: 'GetVms', exposure: 'allow' }) },
        })
      )
      assert.deepStrictEqual(
        domains.get('vms')!.queryOps.map(o => o.name),
        ['GetVms']
      )
      assert.strictEqual(domains.get('vms')!.queryOps[0].requiresConfirm, false)
    })

    it("drops an operation tagged 'deny'", () => {
      const domains = parseSwagger(
        rawSpec({
          '/vms': { get: op({ operationId: 'GetVms', exposure: 'deny' }) },
        })
      )
      assert.strictEqual(domains.size, 0)
    })

    it('drops an operation without any x-mcp-exposure (default deny)', () => {
      const domains = parseSwagger(
        rawSpec({
          '/vms': { get: op({ operationId: 'GetVms' }) },
        })
      )
      assert.strictEqual(domains.size, 0)
    })

    it("drops an operation tagged 'confirm' when includeConfirm is false (default)", () => {
      const domains = parseSwagger(
        rawSpec({
          '/vms/{id}': { delete: op({ operationId: 'DeleteVm', exposure: 'confirm' }) },
        })
      )
      assert.strictEqual(domains.size, 0)
    })

    it("includes an operation tagged 'confirm' when includeConfirm is true, marking requiresConfirm", () => {
      const domains = parseSwagger(
        rawSpec({
          '/vms/{id}': { delete: op({ operationId: 'DeleteVm', exposure: 'confirm' }) },
        }),
        { includeConfirm: true }
      )
      const vm = domains.get('vms')!
      assert.strictEqual(vm.actionOps.length, 1)
      assert.strictEqual(vm.actionOps[0].name, 'DeleteVm')
      assert.strictEqual(vm.actionOps[0].requiresConfirm, true)
    })

    it("'allow' operations have requiresConfirm=false even when includeConfirm is true", () => {
      const domains = parseSwagger(
        rawSpec({
          '/vms': { post: op({ operationId: 'CreateVm', exposure: 'allow' }) },
        }),
        { includeConfirm: true }
      )
      assert.strictEqual(domains.get('vms')!.actionOps[0].requiresConfirm, false)
    })

    it('mixes allow/confirm/deny across operations under the same path correctly', () => {
      const domains = parseSwagger(
        rawSpec({
          '/vms/{id}': {
            get: op({ operationId: 'GetVm', exposure: 'allow' }),
            put: op({ operationId: 'UpdateVm', exposure: 'confirm' }),
            delete: op({ operationId: 'DeleteVm', exposure: 'deny' }),
            patch: op({ operationId: 'PatchVm' }),
          },
        }),
        { includeConfirm: true }
      )
      const vms = domains.get('vms')!
      assert.deepStrictEqual(
        vms.queryOps.map(o => o.name),
        ['GetVm']
      )
      assert.deepStrictEqual(
        vms.actionOps.map(o => o.name),
        ['UpdateVm']
      )
    })

    it('route-filter (stats/binaries) wins over any exposure tag (defense in depth)', () => {
      const domains = parseSwagger(
        rawSpec({
          '/pools/{id}/stats': { get: op({ operationId: 'GetPoolStats', exposure: 'allow' }) },
          '/backup-archives/{id}.tgz': { get: op({ operationId: 'DownloadArchive', exposure: 'allow' }) },
        })
      )
      assert.strictEqual(domains.size, 0, 'binaries/stats must stay excluded even when tagged allow')
    })

    it('denyList wins over exposure tag', () => {
      const domains = parseSwagger(
        rawSpec({
          '/vms': { get: op({ operationId: 'GetVms', exposure: 'allow' }) },
        }),
        { denyList: ['GetVms'] }
      )
      assert.strictEqual(domains.size, 0)
    })

    it('treats an unknown exposure value as deny', () => {
      const spec = rawSpec({
        '/vms': { get: { tags: ['vms'], operationId: 'GetVms' } as OpenApiOperation },
      })
      ;(spec.paths['/vms']!.get as OpenApiOperation)['x-mcp-exposure'] = 'somethingElse' as never
      const domains = parseSwagger(spec)
      assert.strictEqual(domains.size, 0)
    })
  })
})
