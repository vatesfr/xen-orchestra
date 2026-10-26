import type { VdfDocument, VdfPolicy } from '@/modules/vdf/types.ts'
import {
  changeDetails,
  hostWarnings,
  isEmptyChange,
  isMonitorOnlyChange,
  overriddenDefaults,
  publishWarnings,
} from '@/modules/vdf/utils/vdf-change.util.ts'
import { cloneDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { describe, expect, it } from 'vitest'

const BEFORE: VdfDocument = {
  groups: { web: { tags: ['vdf:role=web'] }, db: { tags: ['vdf:role=db'] } },
  policies: [
    {
      name: 'db',
      appliedTo: 'db',
      default: 'drop',
      ingress: [
        { id: 1, from: 'web', proto: 'tcp', ports: [5432] },
        { id: 2, from: 'any', proto: 'icmp' },
      ],
    },
  ],
}

describe('changeDetails', () => {
  it('lists rule changes per policy', () => {
    const after = cloneDocument(BEFORE)
    after.policies[0].ingress[0].ports = [5433]
    after.policies[0].ingress.splice(1, 1, { id: 3, from: 'web', proto: 'tcp', ports: [22] })
    after.groups.cache = { tags: ['vdf:role=cache'] }

    const details = changeDetails(BEFORE, after)

    expect(details.groups).toEqual([{ type: 'added', name: 'cache', group: { tags: ['vdf:role=cache'] } }])
    expect(details.policies).toHaveLength(1)
    expect(details.policies[0].settingsChanged).toBe(false)
    expect(details.policies[0].rules.map(change => [change.type, change.rule.id])).toEqual([
      ['modified', 1],
      ['added', 3],
      ['removed', 2],
    ])
    expect(isEmptyChange(changeDetails(BEFORE, cloneDocument(BEFORE)))).toBe(true)
  })

  it('a removed policy lists its rules as removed', () => {
    const details = changeDetails(BEFORE, { ...BEFORE, policies: [] })

    expect(details.policies[0].type).toBe('removed')
    expect(details.policies[0].rules.every(change => change.type === 'removed')).toBe(true)
  })
})

describe('publishWarnings', () => {
  it('warns about empty groups, drops without rules and connections a removed rule let in', () => {
    const after = cloneDocument(BEFORE)
    after.policies[0].ingress = []
    after.policies.push({ name: 'cache', appliedTo: 'cache', default: 'pass', ingress: [] })

    const warnings = publishWarnings(changeDetails(BEFORE, after), {
      memberCount: group => (group === 'cache' ? 0 : 2),
      openConnections: id => (id === 1 ? 3 : 0),
    })

    expect(warnings).toEqual([
      { type: 'drop-without-rules', policy: 'db', group: 'db' },
      { type: 'open-connections', policy: 'db', rule: 1, count: 3 },
      { type: 'empty-group', policy: 'cache', group: 'cache' },
    ])
  })

  it("doesn't warn about a policy in monitor mode without rules (Discover): it drops nothing", () => {
    const after = cloneDocument(BEFORE)
    after.policies[0].ingress = []
    after.policies[0].mode = 'monitor'

    expect(publishWarnings(changeDetails(BEFORE, after), { memberCount: () => 2 })).toEqual([])
  })
})

describe('hostWarnings', () => {
  it('warns about hosts without an agent, then those with a stopped one', () => {
    expect(hostWarnings({ missing: ['xcp2'], stale: ['xcp3', 'xcp4'] })).toEqual([
      { type: 'hosts-without-agent', hosts: ['xcp2'] },
      { type: 'hosts-stale-agent', hosts: ['xcp3', 'xcp4'] },
    ])
  })

  it('says nothing when every host has a working agent', () => {
    expect(hostWarnings({ missing: [], stale: [] })).toEqual([])
  })
})

describe('overriddenDefaults (vdf#27)', () => {
  const composed: VdfDocument = {
    groups: {
      'global:all': { tags: ['vdf:managed'] },
      web: { tags: ['vdf:role=web'] },
      db: { tags: ['vdf:role=db'] },
    },
    policies: [
      { name: 'global:baseline', appliedTo: 'global:all', default: 'drop', ingress: [] },
      { name: 'global:watch', appliedTo: 'global:all', default: 'drop', mode: 'monitor', ingress: [] },
      {
        name: 'global:out',
        tier: 'networkops',
        appliedTo: 'global:all',
        default: 'pass',
        egressDefault: 'drop',
        ingress: [],
      },
      { name: 'web', appliedTo: 'web', default: 'pass', ingress: [{ id: 1, from: 'any', proto: 'tcp', ports: [443] }] },
      { name: 'db', appliedTo: 'db', default: 'drop', ingress: [] },
      { name: 'net', tier: 'networkops', appliedTo: 'web', default: 'pass', egressDefault: 'allow', ingress: [] },
      { name: 'lonely', tier: 'platform', appliedTo: 'web', default: 'pass', ingress: [] },
    ],
  }
  // the groups of each VM's interfaces
  const sharedVms = (vms: string[][]) => (group: string, other: string) =>
    vms.filter(groups => groups.includes(group) && groups.includes(other)).length
  const vms = sharedVms([['global:all', 'web'], ['global:all', 'web'], ['global:all', 'db'], ['web']])

  it("names a pool policy whose default a global one's decides, in the same tier, with the VMs both apply to", () => {
    expect(overriddenDefaults(composed, vms)).toEqual([
      { policy: 'web', global: 'global:baseline', tier: 100, egress: false, own: 'pass', theirs: 'drop', vms: 2 },
      { policy: 'net', global: 'global:out', tier: 50, egress: true, own: 'allow', theirs: 'drop', vms: 2 },
    ])
  })

  it('says nothing without a VM both apply to, or a global policy in monitor mode', () => {
    expect(overriddenDefaults(composed, sharedVms([['web'], ['global:all', 'db']]))).toEqual([])
    expect(
      overriddenDefaults(
        { ...composed, policies: composed.policies.filter(policy => policy.name !== 'global:baseline') },
        vms
      ).map(item => item.global)
    ).toEqual(['global:out'])
  })
})

describe('isMonitorOnlyChange', () => {
  const web: VdfPolicy = {
    name: 'web',
    appliedTo: 'web',
    default: 'drop',
    ingress: [{ id: 1, from: 'any', proto: 'tcp' }],
  }
  const cache: VdfPolicy = { name: 'cache', appliedTo: 'cache', default: 'drop', mode: 'monitor', ingress: [] }
  const base: VdfDocument = { groups: { web: { tags: ['web'] } }, policies: [web] }

  it('a monitored policy and its own group added: monitor only', () => {
    const after = {
      ...base,
      version: 4,
      groups: { ...base.groups, cache: { tags: ['cache'] } },
      policies: [web, cache],
    }
    expect(isMonitorOnlyChange(base, after)).toBe(true)
  })

  it('a monitored policy switched to enforce: not monitor only', () => {
    const before = { ...base, policies: [web, cache], groups: { ...base.groups, cache: { tags: ['cache'] } } }
    const after = { ...before, policies: [web, { ...cache, mode: 'enforce' as const }] }
    expect(isMonitorOnlyChange(before, after)).toBe(false)
  })

  it('a group an enforced policy uses changed: not monitor only', () => {
    expect(isMonitorOnlyChange(base, { ...base, groups: { web: { tags: ['web', 'prod'] } } })).toBe(false)
  })

  it('no change at all is no monitor-only change', () => {
    expect(isMonitorOnlyChange(base, { ...base })).toBe(false)
  })
})

describe('changeDetails and the format version', () => {
  it("doesn't count the version as a settings change: it follows the document", () => {
    const before: VdfDocument = { version: 4, groups: {}, policies: [] }
    expect(changeDetails(before, { groups: {}, policies: [] }).settings).toEqual([])
  })
})
