import type { XoPif } from '@vates/types'

export function getPifsIpAddresses(pifs?: XoPif[]): string[] {
  if (!pifs) {
    return []
  }

  return pifs.reduce((acc, pif) => {
    if (pif.ip) {
      acc.push(pif.ip)
    }

    if (pif.ipv6) {
      acc.push(...pif.ipv6.filter(ip => ip))
    }

    return acc
  }, [] as string[])
}
