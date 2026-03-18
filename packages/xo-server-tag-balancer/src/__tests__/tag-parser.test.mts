import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseLoadBalancerTags, parseAllVmTags } from '../tag-parser.mjs'
import type { XoVm } from '@vates/types'

describe('parseLoadBalancerTags', () => {
  it('returns defaults for empty tags', () => {
    const result = parseLoadBalancerTags([])
    assert.equal(result.ignore, false)
    assert.equal(result.affinityGroups.size, 0)
    assert.equal(result.antiAffinityGroups.size, 0)
  })

  it('ignores non-lb tags', () => {
    const result = parseLoadBalancerTags(['xo:no-bak', 'some-tag', 'xo:notify-on-snapshot'])
    assert.equal(result.ignore, false)
    assert.equal(result.affinityGroups.size, 0)
    assert.equal(result.antiAffinityGroups.size, 0)
  })

  it('parses ignore tag', () => {
    const result = parseLoadBalancerTags(['xo:load:balancer:ignore'])
    assert.equal(result.ignore, true)
  })

  it('parses affinity tag', () => {
    const result = parseLoadBalancerTags(['xo:load:balancer:affinity=web-servers'])
    assert.equal(result.affinityGroups.has('web-servers'), true)
    assert.equal(result.affinityGroups.size, 1)
  })

  it('parses anti-affinity tag', () => {
    const result = parseLoadBalancerTags(['xo:load:balancer:anti-affinity=db-cluster'])
    assert.equal(result.antiAffinityGroups.has('db-cluster'), true)
    assert.equal(result.antiAffinityGroups.size, 1)
  })

  it('parses multiple tags on same VM', () => {
    const result = parseLoadBalancerTags([
      'xo:load:balancer:affinity=web',
      'xo:load:balancer:anti-affinity=db',
      'xo:load:balancer:affinity=frontend',
    ])
    assert.equal(result.affinityGroups.size, 2)
    assert.equal(result.affinityGroups.has('web'), true)
    assert.equal(result.affinityGroups.has('frontend'), true)
    assert.equal(result.antiAffinityGroups.size, 1)
    assert.equal(result.antiAffinityGroups.has('db'), true)
  })

  it('ignores affinity tag with empty group', () => {
    const result = parseLoadBalancerTags(['xo:load:balancer:affinity='])
    assert.equal(result.affinityGroups.size, 0)
  })

  it('ignores anti-affinity tag with empty group', () => {
    const result = parseLoadBalancerTags(['xo:load:balancer:anti-affinity='])
    assert.equal(result.antiAffinityGroups.size, 0)
  })

  it('ignores unknown lb subtags', () => {
    const result = parseLoadBalancerTags(['xo:load:balancer:unknown'])
    assert.equal(result.ignore, false)
    assert.equal(result.affinityGroups.size, 0)
    assert.equal(result.antiAffinityGroups.size, 0)
  })
})

describe('parseAllVmTags', () => {
  it('builds map for multiple VMs', () => {
    const vms = [
      { id: 'vm-1' as XoVm['id'], tags: ['xo:load:balancer:affinity=web'] },
      { id: 'vm-2' as XoVm['id'], tags: ['xo:load:balancer:ignore'] },
      { id: 'vm-3' as XoVm['id'], tags: [] },
    ]

    const result = parseAllVmTags(vms)
    assert.equal(result.size, 3)

    const vm1Tags = result.get('vm-1' as XoVm['id'])
    assert.notEqual(vm1Tags, undefined)
    assert.equal(vm1Tags!.affinityGroups.has('web'), true)

    const vm2Tags = result.get('vm-2' as XoVm['id'])
    assert.notEqual(vm2Tags, undefined)
    assert.equal(vm2Tags!.ignore, true)

    const vm3Tags = result.get('vm-3' as XoVm['id'])
    assert.notEqual(vm3Tags, undefined)
    assert.equal(vm3Tags!.ignore, false)
    assert.equal(vm3Tags!.affinityGroups.size, 0)
  })
})
