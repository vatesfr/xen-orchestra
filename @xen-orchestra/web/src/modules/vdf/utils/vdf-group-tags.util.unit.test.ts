import { isGroupTag, isVdfTag } from '@/modules/vdf/utils/vdf-group-tags.util.ts'
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

describe('firewall tags', () => {
  it('start with vdf:, the quarantine tag included', () => {
    expect(isVdfTag('vdf:role=web')).toBe(true)
    expect(isVdfTag('vdf:quarantine')).toBe(true)
    expect(isVdfTag('xo:no-bak')).toBe(false)
    expect(isVdfTag('env=vdf:prod')).toBe(false)
  })
})
