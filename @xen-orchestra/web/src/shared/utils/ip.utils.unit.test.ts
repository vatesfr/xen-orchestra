import { isIpv6, type IpAddress } from '@/shared/utils/ip.utils.ts'

describe('isIpv6', () => {
  it('returns true for an IPv6 address', () => {
    expect(isIpv6('::1' as IpAddress)).toBe(true)
  })

  it('returns false for an IPv4 address', () => {
    expect(isIpv6('192.168.1.1' as IpAddress)).toBe(false)
  })
})
