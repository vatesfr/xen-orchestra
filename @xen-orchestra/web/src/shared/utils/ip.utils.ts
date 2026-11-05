import { type IpAddress, isIpv6 } from '@core/utils/ip-address.utils.ts'

export function formatIpToHostName(ip: IpAddress): string {
  return isIpv6(ip) ? `[${ip}]` : ip
}
