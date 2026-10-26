import type { VdfDocument, VdfPolicy } from '@/modules/vdf/types.ts'
import { monitorShadows, shadowKey } from '@/modules/vdf/utils/vdf-shadow.util.ts'
import { describe, expect, it } from 'vitest'

const policy = (fields: Partial<VdfPolicy>): VdfPolicy => ({
  name: 'web',
  appliedTo: 'web',
  tier: 'application',
  default: 'drop',
  ingress: [{ id: 5, from: 'any', proto: 'tcp', ports: [80, 443] }],
  ...fields,
})

const cache = policy({ name: 'cache', appliedTo: 'cache', mode: 'monitor', ingress: [] })

const doc = (...policies: VdfPolicy[]): VdfDocument => ({ groups: {}, policies })

const iface = (vm: string, ...groups: string[]) => ({ vm, vmName: `name-${vm}`, groups })

describe('monitorShadows (vdf#86)', () => {
  it('an enforced policy of the same tier on the same VMs hides the monitored one', () => {
    const shadows = monitorShadows(doc(policy({}), cache), [iface('a', 'web', 'cache'), iface('b', 'cache')])

    expect(shadows).toEqual([
      {
        policy: 'cache',
        by: 'web',
        tier: 100,
        sameTier: true,
        byDefault: 'drop',
        vms: [{ id: 'a', name: 'name-a' }],
      },
    ])
  })

  it('counts a VM once, whatever its interfaces', () => {
    const shadows = monitorShadows(doc(policy({}), cache), [iface('a', 'web', 'cache'), iface('a', 'web', 'cache')])

    expect(shadows[0].vms).toHaveLength(1)
  })

  it('only the interfaces both groups select', () => {
    expect(monitorShadows(doc(policy({}), cache), [iface('a', 'web'), iface('a', 'cache')])).toEqual([])
  })

  it('a same-tier policy that neither allows nor drops by default hides nothing', () => {
    const quiet = policy({
      default: 'pass',
      ingress: [{ id: 7, action: 'drop', from: 'any', proto: 'tcp', ports: [23] }],
    })

    expect(monitorShadows(doc(quiet, cache), [iface('a', 'web', 'cache')])).toEqual([])
  })

  it('a same-tier policy that only allows some: its rules hide what they match', () => {
    const shadows = monitorShadows(doc(policy({ default: 'pass' }), cache), [iface('a', 'web', 'cache')])

    expect(shadows).toMatchObject([{ by: 'web', sameTier: true, byDefault: 'pass' }])
  })

  it('an earlier tier deciding everything hides the monitored tier', () => {
    const ops = policy({ name: 'ops', appliedTo: 'web', tier: 'platform', default: 'allow', ingress: [] })
    const shadows = monitorShadows(doc(ops, policy({}), cache), [iface('a', 'web', 'cache')])

    expect(shadows).toMatchObject([{ policy: 'cache', by: 'ops', tier: 75, sameTier: false, byDefault: 'allow' }])
  })

  it('an earlier tier that passes by default lets the monitored tier see the rest', () => {
    const ops = policy({ name: 'ops', appliedTo: 'web', tier: 'platform', default: 'pass' })

    expect(monitorShadows(doc(ops, cache), [iface('a', 'web', 'cache')])).toEqual([])
  })

  it('monitored policies hide nothing, and a later tier never does', () => {
    const later = policy({ name: 'base', appliedTo: 'web', tier: 'baseline' })
    const other = policy({ name: 'other', mode: 'monitor' })

    expect(monitorShadows(doc(later, other, cache), [iface('a', 'web', 'cache')])).toEqual([])
  })

  it('keys tell a shadow by its policies and kind', () => {
    const [shadow] = monitorShadows(doc(policy({}), cache), [iface('a', 'web', 'cache')])

    expect(shadowKey(shadow)).toBe('cache|web|same|drop')
  })
})
