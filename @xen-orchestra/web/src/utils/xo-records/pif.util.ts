import type { Status } from '@core/components/status/VtsStatus.vue'
import type { XoPif } from '@vates/types'

export function getPifStatus(pif: XoPif): Status {
  if (!pif.attached) {
    return 'disconnected'
  }

  if (!pif.carrier) {
    return 'disconnected-from-physical-device'
  }

  return 'connected'
}

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
