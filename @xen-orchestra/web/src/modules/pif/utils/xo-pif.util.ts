import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'

export function getPifStatus(pif: FrontXoPif): Status {
  if (!pif.attached) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (!pif.carrier) {
    return CONNECTION_STATUS.DISCONNECTED_FROM_PHYSICAL_DEVICE
  }

  return CONNECTION_STATUS.CONNECTED
}

export function getPifsIpAddresses(pifs?: FrontXoPif[]): string[] {
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
