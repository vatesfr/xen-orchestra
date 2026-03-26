import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseSwagger } from './swagger-parser.mjs'
import type { OpenApiSpec } from './swagger-fetcher.mjs'

function makeSpec(paths: OpenApiSpec['paths']): OpenApiSpec {
  return {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    paths,
  }
}

describe('parseSwagger', () => {
  it('groups GET collection as query list operation', () => {
    const spec = makeSpec({
      '/pools': {
        get: { tags: ['pools'], summary: 'List pools' },
      },
    })
    const domains = parseSwagger(spec)
    const pools = domains.get('pools')
    assert.ok(pools)
    assert.strictEqual(pools.queryOps.length, 1)
    assert.strictEqual(pools.queryOps[0].name, 'list')
    assert.strictEqual(pools.queryOps[0].method, 'GET')
    assert.strictEqual(pools.actionOps.length, 0)
  })

  it('groups GET collection/{id} as query get operation', () => {
    const spec = makeSpec({
      '/vms/{id}': {
        get: { tags: ['vms'], summary: 'Get a VM' },
      },
    })
    const domains = parseSwagger(spec)
    const vms = domains.get('vms')
    assert.ok(vms)
    assert.strictEqual(vms.queryOps[0].name, 'get')
    assert.strictEqual(vms.queryOps[0].path, '/vms/{id}')
  })

  it('groups GET collection/{id}/sub as query sub-resource', () => {
    const spec = makeSpec({
      '/pools/{id}/dashboard': {
        get: { tags: ['pools'], summary: 'Pool dashboard' },
      },
    })
    const domains = parseSwagger(spec)
    const pools = domains.get('pools')
    assert.ok(pools)
    assert.strictEqual(pools.queryOps[0].name, 'dashboard')
  })

  it('classifies POST actions as action operations', () => {
    const spec = makeSpec({
      '/vms/{id}/actions/start': {
        post: { tags: ['vms'], summary: 'Start a VM' },
      },
    })
    const domains = parseSwagger(spec)
    const vms = domains.get('vms')
    assert.ok(vms)
    assert.strictEqual(vms.actionOps.length, 1)
    assert.strictEqual(vms.actionOps[0].name, 'start')
    assert.strictEqual(vms.actionOps[0].method, 'POST')
  })

  it('classifies DELETE as action operations', () => {
    const spec = makeSpec({
      '/vms/{id}': {
        delete: { tags: ['vms'], summary: 'Delete a VM' },
      },
    })
    const domains = parseSwagger(spec)
    const vms = domains.get('vms')
    assert.ok(vms)
    assert.strictEqual(vms.actionOps[0].name, 'delete')
  })

  it('classifies POST /collection as create action', () => {
    const spec = makeSpec({
      '/vms': {
        post: { tags: ['vms'], summary: 'Create a VM' },
      },
    })
    const domains = parseSwagger(spec)
    const vms = domains.get('vms')
    assert.ok(vms)
    assert.strictEqual(vms.actionOps[0].name, 'create')
  })

  it('merges related tags into a single domain', () => {
    const spec = makeSpec({
      '/vdis': {
        get: { tags: ['vdis'], summary: 'List VDIs' },
      },
      '/srs': {
        get: { tags: ['srs'], summary: 'List SRs' },
      },
      '/vbds': {
        get: { tags: ['vbds'], summary: 'List VBDs' },
      },
    })
    const domains = parseSwagger(spec)
    assert.ok(domains.has('storage'), 'Should have storage domain')
    assert.ok(!domains.has('vdis'), 'Should not have separate vdis domain')
    assert.ok(!domains.has('srs'), 'Should not have separate srs domain')
    const storage = domains.get('storage')!
    assert.strictEqual(storage.queryOps.length, 3)
  })

  it('prefixes operation names for merged domains to avoid collisions', () => {
    const spec = makeSpec({
      '/vdis': {
        get: { tags: ['vdis'], summary: 'List VDIs' },
      },
      '/srs': {
        get: { tags: ['srs'], summary: 'List SRs' },
      },
    })
    const domains = parseSwagger(spec)
    const storage = domains.get('storage')!
    const opNames = storage.queryOps.map(op => op.name).sort()
    assert.deepStrictEqual(opNames, ['list_srs', 'list_vdis'])
  })

  it('prefixes get operations with singular form for merged domains', () => {
    const spec = makeSpec({
      '/vdis/{id}': {
        get: { tags: ['vdis'], summary: 'Get a VDI' },
      },
    })
    const domains = parseSwagger(spec)
    const storage = domains.get('storage')!
    assert.strictEqual(storage.queryOps[0].name, 'get_vdi')
  })

  it('extracts parameters from operations', () => {
    const spec = makeSpec({
      '/vms': {
        get: {
          tags: ['vms'],
          summary: 'List VMs',
          parameters: [
            { name: 'filter', in: 'query', description: 'Filter VMs' },
            { name: 'limit', in: 'query', required: true, description: 'Max results' },
          ],
        },
      },
    })
    const domains = parseSwagger(spec)
    const vms = domains.get('vms')!
    assert.strictEqual(vms.queryOps[0].parameters.length, 2)
    assert.strictEqual(vms.queryOps[0].parameters[0].name, 'filter')
    assert.strictEqual(vms.queryOps[0].parameters[1].required, true)
  })

  it('handles paths with no tags by using collection name', () => {
    const spec = makeSpec({
      '/custom': {
        get: { summary: 'List custom things' },
      },
    })
    const domains = parseSwagger(spec)
    assert.ok(domains.has('custom'))
  })

  it('uses summary as description, falls back to method + path', () => {
    const spec = makeSpec({
      '/pools': {
        get: { tags: ['pools'], summary: 'List all pools' },
      },
      '/hosts': {
        get: { tags: ['hosts'] },
      },
    })
    const domains = parseSwagger(spec)
    assert.strictEqual(domains.get('pools')!.queryOps[0].description, 'List all pools')
    assert.strictEqual(domains.get('hosts')!.queryOps[0].description, 'GET /hosts')
  })

  it('handles empty paths gracefully', () => {
    const spec = makeSpec({})
    const domains = parseSwagger(spec)
    assert.strictEqual(domains.size, 0)
  })

  it('merges vm-templates into vms domain', () => {
    const spec = makeSpec({
      '/vms': {
        get: { tags: ['vms'], summary: 'List VMs' },
      },
      '/vm-templates': {
        get: { tags: ['vm-templates'], summary: 'List VM templates' },
      },
    })
    const domains = parseSwagger(spec)
    assert.ok(domains.has('vms'))
    assert.ok(!domains.has('vm-templates'))
    const vms = domains.get('vms')!
    assert.strictEqual(vms.queryOps.length, 2)
    const opNames = vms.queryOps.map(op => op.name).sort()
    assert.deepStrictEqual(opNames, ['list', 'list_vm-templates'].sort())
  })

  it('handles PUT/PATCH as update action', () => {
    const spec = makeSpec({
      '/vms/{id}': {
        put: { tags: ['vms'], summary: 'Update a VM' },
      },
    })
    const domains = parseSwagger(spec)
    const vms = domains.get('vms')!
    assert.strictEqual(vms.actionOps[0].name, 'update')
    assert.strictEqual(vms.actionOps[0].method, 'PUT')
  })

  it('deduplicates identical operation names with _2 suffix', () => {
    const spec = makeSpec({
      '/vms/{id}': {
        get: { tags: ['vms'], summary: 'Get a VM' },
        delete: { tags: ['vms'], summary: 'Delete a VM' },
      },
      '/vms/{id}.{format}': {
        get: { tags: ['vms'], summary: 'Export a VM' },
      },
    })
    const domains = parseSwagger(spec)
    const vms = domains.get('vms')!
    // get and export should not collide
    const names = vms.queryOps.map(op => op.name)
    assert.ok(!names.includes('get_2'), `Names should not have get_2, got: ${names}`)
  })

  it('handles cross-collection paths tagged differently from collection', () => {
    const spec = makeSpec({
      '/backup-jobs': {
        get: { tags: ['backup-jobs'], summary: 'List backup jobs' },
      },
      '/backup/jobs/vm': {
        get: { tags: ['backup-jobs'], summary: 'List VM backup jobs' },
      },
      '/backup/jobs/vm/{id}': {
        get: { tags: ['backup-jobs'], summary: 'Get a VM backup job' },
      },
    })
    const domains = parseSwagger(spec)
    const bj = domains.get('backup-jobs')!
    const names = bj.queryOps.map(op => op.name)
    // All three should have unique names
    assert.strictEqual(new Set(names).size, names.length, `Expected unique names, got: ${names}`)
    assert.ok(names.includes('list'), `Should have "list" for /backup-jobs`)
  })
})
