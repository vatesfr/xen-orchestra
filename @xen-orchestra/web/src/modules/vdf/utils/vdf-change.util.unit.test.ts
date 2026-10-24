import type { VdfDocument } from '@/modules/vdf/types.ts'
import { changeDetails, isEmptyChange, publishWarnings } from '@/modules/vdf/utils/vdf-change.util.ts'
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
