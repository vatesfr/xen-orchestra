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
        byMonitored: false,
        tier: 100,
        sameTier: true,
        kind: 'default',
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

  it('a same-tier policy that only drops some, and passes by default, hides nothing', () => {
    const quiet = policy({
      default: 'pass',
      ingress: [{ id: 7, action: 'drop', from: 'any', proto: 'tcp', ports: [23] }],
    })

    expect(monitorShadows(doc(quiet, cache), [iface('a', 'web', 'cache')])).toEqual([])
  })

  it('a same-tier policy that only allows some: its rules hide what they match', () => {
    const shadows = monitorShadows(doc(policy({ default: 'pass' }), cache), [iface('a', 'web', 'cache')])

    expect(shadows).toMatchObject([{ by: 'web', sameTier: true, kind: 'rules' }])
  })

  it('same tier: an enforced pass rule sends the flow past the monitored default', () => {
    const passer = policy({
      default: 'pass',
      ingress: [{ id: 1, action: 'pass', from: 'any', proto: 'tcp', ports: [22] }],
    })

    expect(monitorShadows(doc(passer, cache), [iface('a', 'web', 'cache')])).toMatchObject([
      { by: 'web', sameTier: true, kind: 'rules' },
    ])
  })

  it('an earlier tier deciding everything hides the monitored tier', () => {
    const ops = policy({ name: 'ops', appliedTo: 'web', tier: 'platform', default: 'allow', ingress: [] })
    const shadows = monitorShadows(doc(ops, policy({}), cache), [iface('a', 'web', 'cache')])

    expect(shadows).toMatchObject([{ policy: 'cache', by: 'ops', tier: 75, sameTier: false, kind: 'default' }])
  })

  it('an earlier tier whose allow rules decide (default pass): what they match is hidden', () => {
    const early = policy({
      name: 'ssh',
      tier: 'securityops',
      default: 'pass',
      ingress: [
        { id: 1, from: 'admins', proto: 'tcp', ports: [22] },
        { id: 2, action: 'drop', from: 'any', proto: 'tcp', ports: [22] },
      ],
    })

    expect(monitorShadows(doc(early, cache), [iface('a', 'web', 'cache')])).toMatchObject([
      { by: 'ssh', tier: 25, sameTier: false, kind: 'rules' },
    ])
  })

  it('an earlier tier that only drops and passes by default hides nothing', () => {
    const ops = policy({
      name: 'ops',
      tier: 'platform',
      default: 'pass',
      ingress: [{ id: 1, action: 'drop', from: 'any', proto: 'tcp', ports: [23] }],
    })

    expect(monitorShadows(doc(ops, cache), [iface('a', 'web', 'cache')])).toEqual([])
  })

  it("a monitored earlier tier's default drop hides a later monitored policy (the what-if takes both as enforced)", () => {
    const early = policy({ name: 'early', tier: 'platform', mode: 'monitor', ingress: [] })

    expect(monitorShadows(doc(early, cache), [iface('a', 'web', 'cache')])).toMatchObject([
      { policy: 'cache', by: 'early', byMonitored: true, sameTier: false, kind: 'default' },
    ])
  })

  it('other monitored policies of the same tier, and later tiers, hide nothing', () => {
    const later = policy({ name: 'base', appliedTo: 'web', tier: 'baseline' })
    const other = policy({ name: 'other', mode: 'monitor' })

    expect(monitorShadows(doc(later, other, cache), [iface('a', 'web', 'cache')])).toEqual([])
  })

  it('keys tell a shadow by its policies and kind', () => {
    const [shadow] = monitorShadows(doc(policy({}), cache), [iface('a', 'web', 'cache')])

    expect(shadowKey(shadow)).toBe('cache|web|same|default')
  })
})
