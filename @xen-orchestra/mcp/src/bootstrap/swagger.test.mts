import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseSwagger, type OpenApiSpec } from './swagger.mjs'

function spec(paths: OpenApiSpec['paths']): OpenApiSpec {
  return { info: { title: 'Test', version: '1.0.0' }, paths }
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
    // Path-first: `/pools/{id}/alarms` lands in `pools`, not `alarms`.
    // This matches how an agent navigates ("alarms OF a given pool").
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
})
