import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'

export function getHostIpAddresses(managementIp: string, pifs: XenApiPif[] = []): string[] {
  const others = pifs.flatMap(pif => [pif.IP, ...pif.IPv6]).filter(ip => ip && ip !== managementIp)

  return managementIp ? [managementIp, ...others] : others
}
