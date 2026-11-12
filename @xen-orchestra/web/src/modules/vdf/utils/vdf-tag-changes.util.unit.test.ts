import type { VdfTagChange } from '@/modules/vdf/types.ts'
import { notInheritedTagsOf } from '@/modules/vdf/utils/vdf-tag-changes.util.ts'
import { describe, expect, it } from 'vitest'

const notInherited = (id: number, vmId: string, tags: string[]): VdfTagChange => ({
  id,
  kind: 'notInherited',
  seenAt: '2026-11-12T11:00:00Z',
  object: { id: vmId, type: 'VM', name: vmId },
  tags,
  createdBy: 'alice@example.org',
})

describe('notInheritedTagsOf', () => {
  const changes: VdfTagChange[] = [
    {
      id: 1,
      seenAt: '2026-11-12T10:00:00Z',
      object: { id: 'vm-1', type: 'VM', name: 'web-1' },
      tag: 'vdf:role=app',
      change: 'removed',
      outsideXo: true,
    },
    notInherited(2, 'vm-1', ['vdf:role=app', 'vdf:role=db']),
    notInherited(3, 'vm-2', ['vdf:role=app']),
  ]

  it('lists the tags the VM did not inherit and still lacks', () => {
    expect(notInheritedTagsOf(changes, { id: 'vm-1', tags: ['web', 'vdf:role=db'] })).toEqual([
      { ...changes[1], tags: ['vdf:role=app'] },
    ])
  })

  it('lists nothing once the VM has them, nor for changes outside XO', () => {
    expect(notInheritedTagsOf(changes, { id: 'vm-1', tags: ['vdf:role=app', 'vdf:role=db'] })).toEqual([])
    expect(notInheritedTagsOf(changes.slice(0, 1), { id: 'vm-1', tags: [] })).toEqual([])
  })
})
