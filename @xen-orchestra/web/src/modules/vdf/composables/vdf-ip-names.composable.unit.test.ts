import { ipMatches } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { describe, expect, it } from 'vitest'

describe('ipMatches', () => {
  it('matches an address exactly', () => {
    expect(ipMatches('192.168.1.30', '192.168.1.30')).toBe(true)
    expect(ipMatches('192.168.1.31', '192.168.1.30')).toBe(false)
    expect(ipMatches('fd00::1', 'fd00::1')).toBe(true)
  })

  it('matches an IPv4 network', () => {
    expect(ipMatches('10.10.0.42', '10.10.0.0/24')).toBe(true)
    expect(ipMatches('10.10.1.42', '10.10.0.0/24')).toBe(false)
    expect(ipMatches('1.2.3.4', '0.0.0.0/0')).toBe(true)
    expect(ipMatches('10.10.0.1', '10.10.0.1/32')).toBe(true)
  })

  it('ignores what it cannot compare', () => {
    expect(ipMatches('fd00::1', 'fd00::/64')).toBe(false)
    expect(ipMatches('10.0.0.1', 'nonsense/8')).toBe(false)
    expect(ipMatches('10.0.0.1', '10.0.0.0/40')).toBe(false)
  })
})
