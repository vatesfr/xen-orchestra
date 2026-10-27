import { VDF_GLOBAL_RULE_BASE, type VdfDocument } from '@/modules/vdf/types.ts'
import {
  allowFlowRoute,
  byOwnThenGlobal,
  composeWithGlobal,
  displayName,
  globalRuleId,
  isReservedTier,
  policyReach,
  reservesTiers,
  ruleNumber,
  vdfGlobalRoute,
  vdfPageRoute,
  withGlobalOf,
} from '@/modules/vdf/utils/vdf-global.util.ts'
import { describe, expect, it } from 'vitest'

const published: VdfDocument = {
  groups: { 'global:admins': { ips: ['192.0.2.30'] }, web: { tags: ['vdf:role=web'] } },
  policies: [
    { name: 'global:ssh', appliedTo: 'global:admins', default: 'pass', ingress: [] },
    { name: 'web', appliedTo: 'web', default: 'drop', ingress: [] },
  ],
}

describe('withGlobalOf', () => {
  it('keeps the published global part, whatever the draft holds', () => {
    const draft: VdfDocument = {
      groups: { 'global:admins': { ips: [] }, 'global:old': {}, app: { tags: ['vdf:role=app'] } },
      policies: [{ name: 'app', appliedTo: 'app', default: 'drop', ingress: [] }],
    }

    const document = withGlobalOf(draft, published)

    expect(Object.keys(document.groups)).toEqual(['global:admins', 'app'])
    expect(document.groups['global:admins']).toEqual({ ips: ['192.0.2.30'] })
    expect(document.policies.map(policy => policy.name)).toEqual(['global:ssh', 'app'])
  })
})

describe('names and routes', () => {
  it('strips the prefix and the rule id base', () => {
    expect(displayName('global:admins')).toBe('admins')
    expect(displayName('admins')).toBe('admins')
    expect(globalRuleId(VDF_GLOBAL_RULE_BASE + 2)).toBe(2)
  })

  it('names global objects without prefix on the XO-wide pages, in full in a pool', () => {
    expect(vdfGlobalRoute('policies', { policy: 'global:ssh', rule: VDF_GLOBAL_RULE_BASE + 2 })).toEqual({
      name: '/(site)/firewall/policies',
      query: { policy: 'ssh', rule: '2' },
    })
    expect(vdfPageRoute('pool-1', 'policies', { policy: 'global:ssh', rule: VDF_GLOBAL_RULE_BASE + 2 })).toEqual({
      name: '/pool/[id]/firewall/policies',
      params: { id: 'pool-1' },
      query: { policy: 'global:ssh', rule: String(VDF_GLOBAL_RULE_BASE + 2) },
    })
    expect(vdfPageRoute('pool-1', 'groups', { group: 'web' })).toEqual({
      name: '/pool/[id]/firewall/groups',
      params: { id: 'pool-1' },
      query: { group: 'web' },
    })
    expect(vdfPageRoute('global', 'groups', { group: 'admins' })).toEqual({
      name: '/(site)/firewall/groups',
      query: { group: 'admins' },
    })
  })
})

describe('tiers kept for global policies (vdf#21)', () => {
  it("in a pool in scope, or holding another XO's global configuration", () => {
    expect(reservesTiers(undefined)).toBe(false)
    expect(reservesTiers({ revision: 1, inScope: false })).toBe(false)
    expect(reservesTiers({ revision: 1, inScope: true })).toBe(true)
    expect(reservesTiers({ revision: 0, inScope: false, owner: 'xo-other' })).toBe(true)
  })

  it('up to securityops, numbered tiers included', () => {
    expect([0, 10, 25, 26, 50, 100].map(isReservedTier)).toEqual([true, true, true, false, false, false])
  })
})

describe('composeWithGlobal', () => {
  it("writes the global configuration first, under its pool names, then the pool's own part", () => {
    const own: VdfDocument = {
      groups: { db: { tags: ['vdf:role=db'] }, 'global:stale': {} },
      policies: [{ name: 'db', appliedTo: 'db', default: 'pass', ingress: [] }],
    }
    const global: VdfDocument = {
      groups: { app: { tags: ['vdf:role=app'] }, db: { tags: ['vdf:role=db'] } },
      policies: [
        {
          name: 'db-from-app',
          appliedTo: 'db',
          tier: 'application',
          default: 'drop',
          ingress: [{ id: 1, from: 'app', proto: 'tcp', ports: [5432] }],
          egress: [{ id: 2, to: 'any', proto: 'any' }],
        },
      ],
    }

    const document = composeWithGlobal(own, global)

    expect(Object.keys(document.groups)).toEqual(['global:app', 'global:db', 'db'])
    expect(document.policies.map(policy => [policy.name, policy.appliedTo])).toEqual([
      ['global:db-from-app', 'global:db'],
      ['db', 'db'],
    ])
    expect(document.policies[0].ingress[0]).toMatchObject({ id: VDF_GLOBAL_RULE_BASE + 1, from: 'global:app' })
    expect(document.policies[0].egress?.[0]).toMatchObject({ id: VDF_GLOBAL_RULE_BASE + 2, to: 'any' })
  })
})

describe('policyReach', () => {
  it('counts the VMs each policy applies to, per pool, without the pools where it has none', () => {
    const document: VdfDocument = {
      groups: { db: { tags: ['vdf:role=db'] }, web: { tags: ['vdf:role=web'] } },
      policies: [
        { name: 'db', appliedTo: 'db', default: 'drop', ingress: [] },
        { name: 'web', appliedTo: 'web', default: 'drop', ingress: [] },
      ],
    }
    const counts: Record<string, number> = { 'db/A': 2, 'db/B': 0, 'web/A': 0, 'web/B': 0 }

    expect(
      policyReach(
        document,
        [
          { id: 'A', name: 'Pool A' },
          { id: 'B', name: 'Pool B' },
        ],
        (group, poolId) => counts[`${group}/${poolId}`]
      )
    ).toEqual([
      { policy: 'db', pools: [{ id: 'A', name: 'Pool A', vms: 2 }] },
      { policy: 'web', pools: [] },
    ])
  })
})

// UX P1-3: a global object and the pool's own of the same name told apart
describe('ruleNumber', () => {
  it('numbers a global rule G10, a pool rule #10', () => {
    expect(ruleNumber(10)).toBe('#10')
    // in a pool's document: from the global base up
    expect(ruleNumber(VDF_GLOBAL_RULE_BASE + 10)).toBe('G10')
    // in the global configuration: all of them
    expect(ruleNumber(10, { global: true })).toBe('G10')
  })
})

describe('byOwnThenGlobal', () => {
  it("orders the pool's groups first, then the global ones, by name in each", () => {
    expect(['web', 'global:prod', 'app', 'global:app', 'prod', 'global:db', 'db'].sort(byOwnThenGlobal)).toEqual([
      'app',
      'db',
      'prod',
      'web',
      'global:app',
      'global:db',
      'global:prod',
    ])
  })
})

// UX P2-8: "Allow this flow…" from a row of the rule log or the drops
describe('allowFlowRoute', () => {
  it("opens the rule drawer in the pool's policy, from the source", () => {
    expect(allowFlowRoute('pool-1', { policy: 'db', peer: '10.0.0.7', proto: 'tcp', port: '5432' })).toEqual({
      name: '/pool/[id]/firewall/policies',
      params: { id: 'pool-1' },
      query: { policy: 'db', newRule: '1', from: '10.0.0.7', proto: 'tcp', port: '5432' },
    })
  })

  it('in the global firewall for a global policy; to the destination for outbound', () => {
    expect(
      allowFlowRoute('pool-1', { policy: 'global:web', egress: true, peer: 'global:dns', proto: 'udp', port: '' })
    ).toEqual({
      name: '/(site)/firewall/policies',
      query: { policy: 'web', newRule: '1', to: 'dns', proto: 'udp', port: undefined },
    })
  })
})
