import { isIpv6, type IpAddress } from '@/shared/utils/ip.utils.ts'
import { expect, test, it } from 'vitest'

test('is an IPv6 address', () => {
  expect(isIpv6('::1' as IpAddress)).toBe(true)
})

it('returns false if not an IPv6 address', () => {
  expect(isIpv6('192.168.1.1' as IpAddress)).toBe(false)
})
