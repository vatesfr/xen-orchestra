import { isGroupTag } from '@/modules/vdf/utils/vdf-group-tags.util.ts'
import { describe, expect, it } from 'vitest'

describe('group tags', () => {
  it('start with vdf:', () => {
    expect(isGroupTag('vdf:role=web')).toBe(true)
    expect(isGroupTag('web')).toBe(false)
    expect(isGroupTag('role=web')).toBe(false)
    expect(isGroupTag('VDF:role=web')).toBe(false)
  })

  it('are not the quarantine tag', () => {
    expect(isGroupTag('vdf:quarantine')).toBe(false)
  })
})
