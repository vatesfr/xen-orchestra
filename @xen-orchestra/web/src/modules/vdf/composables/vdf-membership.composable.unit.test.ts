import { allowsInbound, tagsToLeaveGroup } from '@/modules/vdf/composables/vdf-membership.composable.ts'
import { describe, expect, it } from 'vitest'

const groups = {
  db: { tags: ['vdf:role=db', 'vdf:env=prod'] },
  'global:prod': { tags: ['vdf:env=prod'] },
  web: { tags: ['vdf:role=web'] },
  admins: { ips: ['192.168.1.30'] },
}

describe('tagsToLeaveGroup', () => {
  it('keeps the tags another group of the VM needs', () => {
    expect(tagsToLeaveGroup(['vdf:role=db', 'vdf:env=prod'], 'db', groups)).toEqual({
      tags: ['vdf:role=db'],
      alsoLeaves: [],
    })
  })

  it('removes every tag of the group no other group needs', () => {
    expect(tagsToLeaveGroup(['vdf:role=db', 'vdf:env=prod', 'other'], 'db', { db: groups.db })).toEqual({
      tags: ['vdf:role=db', 'vdf:env=prod'],
      alsoLeaves: [],
    })
  })

  it('names the groups the VM leaves too when every tag is shared', () => {
    expect(tagsToLeaveGroup(['vdf:role=db', 'vdf:env=prod'], 'global:prod', groups)).toEqual({
      tags: ['vdf:env=prod'],
      alsoLeaves: ['db'],
    })
  })

  it('ignores groups the VM is not in', () => {
    expect(tagsToLeaveGroup(['vdf:role=web', 'vdf:env=prod'], 'web', groups)).toEqual({
      tags: ['vdf:role=web'],
      alsoLeaves: [],
    })
  })

  it('removes nothing when the VM is not a member', () => {
    expect(tagsToLeaveGroup(['vdf:role=web'], 'db', groups)).toEqual({ tags: [], alsoLeaves: [] })
  })
})

describe('allowsInbound', () => {
  it('an allow rule or an allow default; not an outbound-only policy passing inbound on', () => {
    const base = { name: 'p', appliedTo: 'app', default: 'pass' as const, ingress: [] }
    expect(allowsInbound({ ...base, ingress: [{ id: 1, from: 'web', proto: 'tcp' as const, ports: [8080] }] })).toBe(
      true
    )
    expect(allowsInbound({ ...base, default: 'allow' })).toBe(true)
    expect(allowsInbound({ ...base, egress: [{ id: 2, to: 'db', proto: 'tcp' as const, ports: [5432] }] })).toBe(false)
    expect(
      allowsInbound({ ...base, ingress: [{ id: 3, action: 'drop' as const, from: 'any', proto: 'tcp' as const }] })
    ).toBe(false)
  })
})
