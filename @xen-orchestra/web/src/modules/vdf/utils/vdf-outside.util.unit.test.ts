import type { VdfOutsideChange } from '@/modules/vdf/types.ts'
import { isOutsideNotable, outsideKind, VDF_OUTSIDE_RECENT_MS } from '@/modules/vdf/utils/vdf-outside.util.ts'
import { describe, expect, it } from 'vitest'

const change = (fields: Partial<VdfOutsideChange> = {}): VdfOutsideChange => ({
  seenAt: '2026-10-26T10:00:00.000Z',
  lastSeenAt: '2026-10-26T10:00:00.000Z',
  times: 1,
  docChanged: true,
  globalChanged: false,
  ownerChanged: false,
  previousOwner: null,
  owner: null,
  sameIdentity: false,
  ...fields,
})

describe('outsideKind', () => {
  it('tells a copy of this XO, a take over, a removed owner and a document change apart', () => {
    expect(outsideKind(change({ sameIdentity: true, globalChanged: true }))).toBe('same-identity')
    expect(outsideKind(change({ ownerChanged: true, docChanged: false, owner: { id: 'b', name: 'xo-b' } }))).toBe(
      'taken-over'
    )
    expect(outsideKind(change({ ownerChanged: true, previousOwner: { id: 'b', name: 'xo-b' } }))).toBe('owner')
    expect(outsideKind(change())).toBe('document')
  })
})

describe('isOutsideNotable', () => {
  const now = Date.parse('2026-10-26T10:00:00.000Z')

  it('while the pool holds it, or while it keeps coming back', () => {
    expect(isOutsideNotable(change({ current: true }), now + 10 * VDF_OUTSIDE_RECENT_MS)).toBe(true)
    expect(isOutsideNotable(change({ current: false }), now + 1000)).toBe(true)
    expect(isOutsideNotable(change({ current: false }), now + VDF_OUTSIDE_RECENT_MS + 1)).toBe(false)
    expect(isOutsideNotable(null, now)).toBe(false)
  })
})
