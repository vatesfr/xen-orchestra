import { CONNECTION_STATUS } from '@/shared/constants.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { XoPif } from '@vates/types'

export function getPifStatus(pif: XoPif): Status {
  if (!pif.attached) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (!pif.carrier) {
    return CONNECTION_STATUS.DISCONNECTED_FROM_PHYSICAL_DEVICE
  }

  return CONNECTION_STATUS.CONNECTED
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
