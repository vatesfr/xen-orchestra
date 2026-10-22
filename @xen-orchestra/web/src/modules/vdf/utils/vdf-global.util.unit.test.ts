import { VDF_GLOBAL_RULE_BASE, type VdfDocument } from '@/modules/vdf/types.ts'
import {
  displayName,
  globalRuleId,
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
