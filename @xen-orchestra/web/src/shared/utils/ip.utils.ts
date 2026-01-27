import type { Branded } from '@vates/types'

export type IpAddress = Branded<'ip-address'>

export function isIpv6(ip: IpAddress): boolean {
  return ip.includes(':')
}

export function formatIpToHostName(ip: IpAddress): string {
  return isIpv6(ip) ? `[${ip}]` : ip
}
