import type { VdfDocument } from '@/modules/vdf/types.ts'
import { mergeDocuments } from '@/modules/vdf/utils/vdf-merge.util.ts'
import { cloneDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { describe, expect, it } from 'vitest'

const BASE: VdfDocument = {
  groups: {
    web: { tags: ['vdf:role=web'] },
    db: { tags: ['vdf:role=db'] },
    admins: { ips: ['192.0.2.10'] },
  },
  policies: [
    {
      name: 'web',
      appliedTo: 'web',
      default: 'drop',
      ingress: [
        { id: 1, from: 'any', proto: 'tcp', ports: [443] },
        { id: 2, from: 'admins', proto: 'tcp', ports: [22] },
      ],
    },
    {
      name: 'db',
      appliedTo: 'db',
      default: 'drop',
      ingress: [{ id: 3, from: 'web', proto: 'tcp', ports: [5432] }],
    },
  ],
}

const edit = (mutate: (document: VdfDocument) => void) => {
  const document = cloneDocument(BASE)
  mutate(document)
  return document
}

describe('mergeDocuments', () => {
  it('applies changes made on different objects from both sides', () => {
    const mine = edit(document => {
      document.groups.cache = { tags: ['vdf:role=cache'] }
      document.policies[0].ingress[0].ports = [443, 8443]
    })
    const theirs = edit(document => {
      document.groups.admins.ips = ['192.0.2.10', '192.0.2.11']
      document.policies[1].default = 'pass'
    })

    const { document, conflicts } = mergeDocuments(BASE, mine, theirs)

    expect(conflicts).toEqual([])
    expect(document.groups.cache).toEqual({ tags: ['vdf:role=cache'] })
    expect(document.groups.admins.ips).toEqual(['192.0.2.10', '192.0.2.11'])
    expect(document.policies[0].ingress[0].ports).toEqual([443, 8443])
    expect(document.policies[1].default).toBe('pass')
  })

  it('lists objects changed differently on both sides, theirs unless resolved', () => {
    const mine = edit(document => {
      document.policies[1].ingress[0].ports = [5433]
      delete document.groups.admins
      document.policies[0].ingress.pop()
    })
    const theirs = edit(document => {
      document.policies[1].ingress[0].ports = [6432]
      document.groups.admins.ips = []
    })

    const { document, conflicts } = mergeDocuments(BASE, mine, theirs)

    expect(conflicts.map(conflict => conflict.id).sort()).toEqual(['group:admins', 'rule:db:3'])
    expect(conflicts.find(conflict => conflict.id === 'group:admins')?.mine).toBeUndefined()
    expect(document.policies[1].ingress[0].ports).toEqual([6432])
    expect(document.groups.admins).toEqual({ ips: [] })
    // removed in the draft only
    expect(document.policies[0].ingress.map(rule => rule.id)).toEqual([1])

    const resolved = mergeDocuments(BASE, mine, theirs, {
      resolutions: { 'rule:db:3': 'mine', 'group:admins': 'mine' },
    })

    expect(resolved.document.policies[1].ingress[0].ports).toEqual([5433])
    expect(resolved.document.groups.admins).toBeUndefined()
  })

  it('a policy removed upstream but edited in the draft is a conflict', () => {
    const mine = edit(document => {
      document.policies[1].ingress.push({ id: 4, from: 'admins', proto: 'tcp', ports: [5432] })
    })
    const theirs = edit(document => {
      document.policies.pop()
    })

    const { document, conflicts } = mergeDocuments(BASE, mine, theirs)

    expect(conflicts.map(conflict => conflict.id)).toEqual(['policy:db'])
    expect(document.policies.map(policy => policy.name)).toEqual(['web'])
    expect(
      mergeDocuments(BASE, mine, theirs, { resolutions: { 'policy:db': 'mine' } }).document.policies[1].ingress
    ).toHaveLength(2)
  })

  it('renumbers rules both sides added with the same id', () => {
    const mine = edit(document => {
      document.policies[0].ingress.push({ id: 4, from: 'any', proto: 'tcp', ports: [80] })
    })
    const theirs = edit(document => {
      document.policies[1].ingress.push({ id: 4, from: 'admins', proto: 'tcp', ports: [5432] })
    })

    const { document, conflicts, renumbered } = mergeDocuments(BASE, mine, theirs)

    expect(conflicts).toEqual([])
    expect(renumbered).toEqual([{ policy: 'web', from: 4, to: 5 }])
    expect(document.policies[0].ingress.map(rule => rule.id)).toEqual([1, 2, 5])
    expect(document.policies[1].ingress.map(rule => rule.id)).toEqual([3, 4])
  })

  it('keeps the side that reordered, and places new objects after their predecessor', () => {
    const mine = edit(document => {
      document.policies.reverse()
    })
    const theirs = edit(document => {
      document.policies.splice(1, 0, { name: 'app', appliedTo: 'web', default: 'pass', ingress: [] })
    })

    const { document } = mergeDocuments(BASE, mine, theirs)

    expect(document.policies.map(policy => policy.name)).toEqual(['db', 'web', 'app'])
  })

  it('without a base, every difference is a conflict', () => {
    const mine = edit(document => {
      document.groups.cache = { tags: ['x'] }
    })

    const { conflicts } = mergeDocuments(undefined, mine, BASE)

    expect(conflicts.map(conflict => conflict.id)).toEqual(['group:cache'])
  })

  it("in a pool, the global part is the published one and isn't merged", () => {
    const withGlobal = (document: VdfDocument, port: number) => ({
      ...document,
      groups: { 'global:prod': { tags: ['vdf:env=prod'] }, ...document.groups },
      policies: [
        {
          name: 'global:ssh',
          appliedTo: 'global:prod',
          default: 'pass' as const,
          ingress: [{ id: 0x800001, from: 'any', proto: 'tcp' as const, ports: [port] }],
        },
        ...document.policies,
      ],
    })
    const mine = withGlobal(
      edit(document => {
        document.groups.web.tags = ['vdf:role=www']
      }),
      22
    )

    const { document, conflicts } = mergeDocuments(withGlobal(BASE, 22), mine, withGlobal(BASE, 2222), {
      lockGlobal: true,
    })

    expect(conflicts).toEqual([])
    expect(document.policies[0].ingress[0].ports).toEqual([2222])
    expect(document.groups.web.tags).toEqual(['vdf:role=www'])
  })

  it('merges document settings such as the global scope', () => {
    const base = { ...BASE, scope: { all: true } }
    const mine = { ...BASE, scope: { pools: ['a'] } }
    const theirs = { ...BASE, scope: { pools: ['b'] } }

    expect(mergeDocuments(base, mine, theirs).conflicts.map(conflict => conflict.id)).toEqual(['setting:scope'])
    expect(mergeDocuments(base, mine, base).document.scope).toEqual({ pools: ['a'] })
  })
})
